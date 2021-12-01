import { DataDir, DataResult, Paginated, Query, ServiceMethods } from "filesrocket";
import { InternalServerError, NotFound } from "filesrocket/lib/errors";
import { access, mkdir, readdir, statSync, Stats, rmdir } from "fs";
import { promisify } from "util";
import { resolve } from "path";

import { LocalOptions } from "../declarations";
import { BaseService } from "./base.service";
import { paginate } from "../helpers";

const readdirAsync = promisify(readdir);
const mkdirAsync = promisify(mkdir);
const rmdirAsync = promisify(rmdir);

export class DirectoryService extends BaseService implements Partial<ServiceMethods<DataDir>> {
  constructor(options: LocalOptions) {
    super(options);
    this.create({ path: "" });
  }

  async create(data: DataDir): Promise<DataResult> {
    const { directory } = this.options;

    const path: string = resolve(`${ directory }/${ data.path }`);
    const isExist: boolean = await this.hasExist(path);
    if (isExist) return this.builder(path);

    const fullpath: string | undefined = await mkdirAsync(path, { recursive: true });
    if (!fullpath) {
      throw new InternalServerError("An error occurred while performing this operation.");
    }

    return this.builder(fullpath);
  }

  async list(query: Query = {}): Promise<Paginated<DataResult>> {
    const { directory, pagination } = this.options;
    const { size, page, path = "" } = query;

    const length: number = pagination.max >= size ? size : pagination.default;
    const fullpath: string = resolve(`${ directory }/${ path }`);
    const items: string[] = await readdirAsync(fullpath);

    const filtered: string[] = items.filter(item => {
      const data: Stats = statSync(`${ fullpath }/${ item }`);
      return data.isDirectory();
    });

    let itemsPaginated: Paginated<unknown> = paginate(filtered, length, page);

    const directories: DataResult[] = await Promise.all(
      itemsPaginated.items.map((item) => this.get(`${ path }/${ item }`))
    );

    return Object.defineProperty(itemsPaginated, "items", {
      value: directories
    }) as Paginated<DataResult>;
  }

  async get(path: string, _?: Query): Promise<DataResult> {
    const { directory } = this.options;
    const fullpath: string = resolve(`${ directory }/${ path }`);

    const isExist: boolean = await this.hasExist(fullpath);
    if (!isExist) throw new NotFound("The directory not exist.");

    return this.builder(fullpath);
  }

  async remove(path: string, query: Query = {}): Promise<DataResult> {
    const directory: DataResult = await this.get(path);
    
    const { directory: folder } = this.options;
    const fullpath: string = resolve(`${ folder }/${ path }`);
    await rmdirAsync(fullpath, { recursive: Boolean(query.bulk) });

    return directory;
  }

  private async hasExist(path: string): Promise<boolean> {
    return new Promise((success) => {
      const root: string = resolve(path);
      access(root, (err) => err ? success(false) : success(true));
    });
  }
}
