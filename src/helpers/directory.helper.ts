import { InternalServerError, NotFound } from "http-errors";
import { Query, ServiceMethods } from "filesrocket";
import { access, mkdir, readdir, rm } from "fs";
import { promisify } from "util";
import { resolve } from "path";

const readdirAsync = promisify(readdir);
const mkdirAsync = promisify(mkdir);
const rmAsync = promisify(rm);

export class DirectoryHelper implements Partial<ServiceMethods<string, string>> {
  /**
   * Responsible method of the folder creation.
   * @param path Directory path.
   */
  async create(path: string): Promise<string> {
    const root: string = resolve(path);
    const isExist: boolean = await this.hasExist(root);
    if (isExist) return root;

    const fullpath: string | undefined = await mkdirAsync(root, { recursive: true });
    if (!fullpath) throw new InternalServerError();
    return fullpath;
  }

  /**
   * Read a directory.
   * @param query Params.
   */
  async list(query: Query): Promise<string[]> {
    const { path = "" } = query;
    const isExist: boolean = await this.hasExist(path);
    if (!isExist) throw new NotFound("The directory does not exist.");

    const root: string = resolve(path);
    return readdirAsync(root);
  }

  async remove(path: string, query: Query): Promise<string> {
    const isExist = await this.hasExist(path);
    if (!isExist) throw new NotFound("The directory does not exist.");

    const root: string = resolve(path);
    await rmAsync(root, { recursive: Boolean(query.bulk) });
    return root;
  }

  /**
   * Check the existence of the directory.
   * @param path Directory path.
   */
  async hasExist(path: string): Promise<boolean> {
    return new Promise((success) => {
      access(resolve(path), (err) => {
        err ? success(false) : success(true);
      });
    });
  }
}