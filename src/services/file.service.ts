import { ServiceMethods, Paginated,  DataFile, DataResult, Query, DataDir } from "filesrocket";
import { createWriteStream, unlink, readdir, statSync } from "fs";
import { ParseFilename } from "filesrocket/lib/common";
import { promisify } from "util";
import { resolve } from "path";

const readdirAsync = promisify(readdir);
const unlinkAsync = promisify(unlink);

import { DirectoryService } from "./directory.service";
import { LocalOptions } from "../index";
import { paginate } from "../helpers";
import { BaseService } from "./base.service";

export class FileService extends BaseService implements Partial<ServiceMethods> {
  protected directoryService: ServiceMethods<DataDir>;

  constructor(protected readonly options: LocalOptions) {
    super(options);
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

      const writable = createWriteStream(fullpath);

      // Listening events.
      writable.on("finish", async () => {
        const data = await this.get(fullpath);
        success(data);
      });

      writable.on("error", err => failure(err));

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
    return this.builder(root);
  }

  async remove(path: string): Promise<DataResult> {
    const { directory } = this.options;
    const regex = new RegExp(`${ directory }.+`, "g");

    const [dir] = path.match(regex) || [""];
    const fullpath: string = resolve(dir);

    // Get file before remove.
    const file = await this.get(fullpath);

    await unlinkAsync(fullpath);
    return file;
  }
}
