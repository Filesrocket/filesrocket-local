import { ServiceMethods, Paginated, FileEntity, ResultEntity, Query } from "filesrocket";
import { createWriteStream, unlink, readdir, statSync } from "fs";
import { GenerateFilename, Service } from "filesrocket/lib/common";
import { promisify } from "util";
import { resolve } from "path";

const readdirAsync = promisify(readdir);
const unlinkAsync = promisify(unlink);

import { DirectoryService } from "./directory.service";
import { BaseService } from "./base.service";
import { LocalOptions } from "../index";
import { paginate } from "../helpers";

@Service({
  name: "local",
  type: "Files"
})
export class FileService extends BaseService implements Partial<ServiceMethods> {
  protected directoryService: DirectoryService;

  constructor(protected readonly options: LocalOptions) {
    super(options);
    this.directoryService = new DirectoryService(options);
  }

  @GenerateFilename()
  async create(data: FileEntity, query: Query = {}): Promise<ResultEntity> {
    return new Promise(async (success, failure) => {
      const { path = "" } = query;
      await this.directoryService.create({ name: path });

      // Fullpath.
      const { directory: folder } = this.options;
      const fullpath: string = resolve(folder, path, data.name);

      const writable = createWriteStream(fullpath);

      // Listening events.
      writable.on("finish", async () => {
        const data = await this.get(fullpath);
        success(data);
      });

      writable.on("error", err => failure(err));

      data.stream.pipe(writable);
    });
  }

  async list(query: Query = {}): Promise<Paginated<ResultEntity>> {
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

    const mapped: Promise<ResultEntity>[] = paginatedItems.items.map((item) => {
      return this.get(`${ dir }/${ item }`);
    });
    const files: ResultEntity[] = await Promise.all(mapped);

    return Object.defineProperty(paginatedItems, "items", {
      value: files
    }) as Paginated<ResultEntity>;
  }

  async get(path: string): Promise<ResultEntity> {
    const root: string = resolve(path);
    return this.builder(root);
  }

  async remove(path: string): Promise<ResultEntity> {
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
