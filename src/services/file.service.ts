import { ServiceMethods, Paginated,  DataFile, DataResult, Query, DataDir } from "filesrocket";
import { createWriteStream, stat, unlink, readdir, statSync } from "fs";
import { ParseFilename } from "filesrocket/lib/common";
import { resolve, parse, sep } from "path";
import { promisify } from "util";

const readdirAsync = promisify(readdir);
const unlinkAsync = promisify(unlink);
const statAsync = promisify(stat);

import { DirectoryService } from "./directory.service";
import { LocalOptions } from "../index";
import { paginate } from "../helpers";

export class FileService implements Partial<ServiceMethods> {
  protected directoryService: ServiceMethods<DataDir>;

  constructor(protected readonly options: LocalOptions) {
    this.directoryService = new DirectoryService(options);
  }

  @ParseFilename()
  async create(data: DataFile, query: Query = {}): Promise<DataResult> {
    return new Promise(async (success, failure) => {
      const { path = "" } = query;
      await this.directoryService.create({ path });

      // Fullpath.
      const { directory: folder } = this.options;
      const fullpath: string = resolve(folder, path, data.filename);

      // Generate writable.
      const writable = createWriteStream(fullpath);

      // Listening events.
      writable.on("finish", async () => {
        const data = await this.get(fullpath);
        success(data);
      });

      writable.on("error", err => failure(err));

      // Write binary.
      data.file.pipe(writable);
    });
  }

  async list(query: Query): Promise<Paginated<DataResult>> {
    const { pagination, directory } = this.options;
    let { size, page, path = "" } = query;

    const dir: string = resolve(`${ directory }/${ path }`);
    const items: string[] = await readdirAsync(dir);

    const filtered: string[] = items.filter(item => {
      const stat = statSync(`${dir}/${item}`);
      return stat.isFile();
    });
    
    const length: number = pagination.max >= size ? size : pagination.default;
    const paginatedItems: Paginated<unknown> = paginate(filtered, length, page);

    const mapped: Promise<DataResult>[] = paginatedItems.items.map((item) => {
      return this.get(`${ dir }/${ item }`);
    });
    const files: DataResult[] = await Promise.all(mapped);

    return Object.defineProperty(paginatedItems, "items", {
      value: files
    }) as Paginated<DataResult>;
  }

  async get(path: string): Promise<DataResult> {
    const root: string = resolve(path);
    const { directory: folder } = this.options;
    const { base: filename, ext, dir } = parse(root);

    const regex = new RegExp(`${ folder }.+`, "g");
    const [directory]: string[] = dir.match(regex) || [folder];

    const chunks: string[] = directory.split(sep);
    const stat = await statAsync(root);

    return {
      name: filename,
      ext,
      url: `${ this.options.host }/${ chunks.join("/") }/${ filename }`,
      size: stat.size,
      dir: chunks.slice(1, chunks.length).join("/"),
      createdAt: stat.birthtime,
      updatedAt: stat.atime
    };
  }

  async remove(path: string): Promise<DataResult> {
    const { directory } = this.options;
    const regex = new RegExp(`${ directory }.+`, "g");

    const [dir] = path.match(regex) || [""];
    const fullpath: string = resolve(dir);

    // Get file before remove.
    const file = await this.get(fullpath);

    // Remove file.
    await unlinkAsync(fullpath);
    return file;
  }
}
