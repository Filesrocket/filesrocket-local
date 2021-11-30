import {
  ServiceMethods,
  Paginated,
  DataFile,
  DataResult,
  Query
} from "filesrocket";
import { ParseFilename } from "filesrocket/lib/common";
import { createWriteStream, stat, unlink } from "fs";
import { resolve, parse, sep } from "path";
import { NotFound } from "http-errors";
import { promisify } from "util";

const unlinkAsync = promisify(unlink);
const statAsync = promisify(stat);

import { DirectoryHelper } from "../helpers/directory.helper";
import { paginate } from "../helpers/general.helper";
import { LocalOptions } from "../index";

export class FileService implements Partial<ServiceMethods> {
  protected directoryHelper: DirectoryHelper;

  constructor(protected readonly options: LocalOptions) {
    this.directoryHelper = new DirectoryHelper();
    this.directoryHelper.create(options.directory);
  }

  @ParseFilename()
  async create(data: DataFile, query: Query): Promise<DataResult> {
    return new Promise(async (success, failure) => {
      // Create directory.
      const dir: string = await this.directoryHelper.create(
        `${ this.options.directory }/${ query.path || "" }`
      );
      
      // Fullpath.
      const fullpath: string = resolve(dir, data.filename);
      
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
    const items: string[] = await this.directoryHelper.list({ path: dir });
    
    size = pagination.max >= size ? size : pagination.default;
    const paginatedItems: Paginated<unknown> = paginate(items, size, page);

    const files: DataResult[] = await Promise.all(
      paginatedItems.items.map((item) => this.get(`${ dir }/${ item }`))
    );

    return Object.defineProperty(paginatedItems, "items", {
      value: files
    }) as Paginated<DataResult>;
  }

  async get(path: string): Promise<DataResult> {
    const isExist = await this.directoryHelper.hasExist(path);
    if (!isExist) throw new NotFound("The file does not exist.");

    const root: string = resolve(path);
    const { base: filename, ext, dir } = parse(root);

    const regex = new RegExp(`${ this.options.directory }.+`, "g");
    const [directory]: string[] = dir.match(regex) || [this.options.directory];
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

  async remove(path: string, query: Query) {
    const regex = new RegExp(`${ this.options.directory }.+`, "g");
    const [dir] = path.match(regex) || [""];
    const fullpath: string = resolve(dir);

    // Get file before remove.
    const file = await this.get(fullpath);

    // Remove directory.
    if (!file.ext) {
      await this.directoryHelper.remove(fullpath, query);
      return file;
    }

    // Remove file.
    await unlinkAsync(fullpath);
    return file;
  }
}