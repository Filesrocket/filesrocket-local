import { DirectoryEntity, ResultEntity, Paginated, Query, Service as RocketService } from "filesrocket";
import { BadRequest, InternalServerError, NotFound } from "filesrocket/lib/errors";
import { access, mkdir, readdir, statSync, Stats, rmdir } from "fs";
import { Service } from "filesrocket/lib/common";
import { promisify } from "util";
import { resolve } from "path";

import { LocalOptions } from "../declarations";
import { BaseService } from "./base.service";
import { paginate } from "../helpers";

const readdirAsync = promisify(readdir);
const mkdirAsync = promisify(mkdir);
const rmdirAsync = promisify(rmdir);

@Service({
  name: "local",
  type: "Directories"
})
export class DirectoryService extends BaseService implements Partial<RocketService<DirectoryEntity>> {
  constructor(options: LocalOptions) {
    super(options);
  }

  async create(data: DirectoryEntity): Promise<ResultEntity> {
    if (typeof data.name !== "string") {
      throw new BadRequest("The name property is a String");
    }

    const { directory } = this.options;
    const root: string = resolve(`${ directory }/${ data.name }`);

    const isExist: boolean = await this.hasExist(root);
    if (isExist) return this.builder(root);

    const fullpath: string | undefined = await mkdirAsync(root, { recursive: true });
    if (!fullpath) {
      throw new InternalServerError("An error occurred while performing this operation.");
    }

    return this.get(root);
  }

  async list(query: Query = {}): Promise<Paginated<ResultEntity>> {
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

    const directories: ResultEntity[] = await Promise.all(
      itemsPaginated.items.map((item) => {
        const root: string = resolve(`${ fullpath }/${ item }`);
        return this.get(root);
      })
    );

    return Object.defineProperty(itemsPaginated, "items", {
      value: directories
    }) as Paginated<ResultEntity>;
  }

  async get(path: string, _?: Query): Promise<ResultEntity> {
    const isExist: boolean = await this.hasExist(path);
    if (!isExist) throw new NotFound("The directory not exist.");
    return this.builder(path);
  }

  async remove(path: string, query: Query = {}): Promise<ResultEntity> {
    const { directory } = this.options;
    const regex = new RegExp(`${ directory }.+`, "g");

    const [dir] = path.match(regex) || [""];
    const fullpath: string = resolve(dir);

    const entity: ResultEntity = await this.get(fullpath);
    await rmdirAsync(fullpath, { recursive: Boolean(query.bulk) });
    return entity;
  }

  private async hasExist(path: string): Promise<boolean> {
    return new Promise((success) => {
      const root: string = resolve(path);
      access(root, (err) => err ? success(false) : success(true));
    });
  }
}
