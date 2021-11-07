import {
  generateRandomFilename,
  ServiceMethods,
  Paginated,
  Payload,
  Result,
  Query
} from "filesrocket";
import { createWriteStream, stat, unlink } from "fs";
import { resolve, parse, sep } from "path";
import { NotFound } from "http-errors";
import { promisify } from "util";

const unlinkAsync = promisify(unlink);
const statAsync = promisify(stat);

import { DirectoryHelper } from "./helpers/directory.helper";
import { paginate } from "./helpers/general.helper";
import { LocalOptions } from "./index";

export class LocalRocketService implements Partial<ServiceMethods<Payload, Result>> {
  protected directoryHelper: DirectoryHelper;

  constructor(protected readonly options: LocalOptions) {
    this.directoryHelper = new DirectoryHelper();
    this.directoryHelper.create(options.directory);
  }

  /**
   * Responsable method of upload file.
   * @param data Payload
   * @param query Additonal params.
   */
  async create(data: Payload, query: Query): Promise<Result> {
    return new Promise(async (success, failure) => {
      // Generate random filename.
      const filename: string = generateRandomFilename(data.filename);
      
      // Create directory.
      const dir: string = await this.directoryHelper.create(
        `${ this.options.directory }/${ query.path || "" }`
      );
      
      // Fullpath.
      const fullpath: string = resolve(dir, filename);
      
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

/**
 * Gets a list of paginated files.
 * @param query Params
   */
  async list(query: Query): Promise<Paginated<Result>> {
    const { pagination, directory } = this.options;
    let { size, page, path = "" } = query;

    const dir: string = resolve(`${ directory }/${ path }`);
    const items: string[] = await this.directoryHelper.list({ path: dir });
    
    size = pagination.max >= size ? size : pagination.default;
    const paginatedItems: Paginated<unknown> = paginate(items, size, page);

    const files: Result[] = await Promise.all(
      paginatedItems.items.map((item) => this.get(`${ dir }/${ item }`))
    );

    return Object.defineProperty(paginatedItems, "items", {
      value: files
    }) as Paginated<Result>;
  }

  /**
   * Get a one file.
   * @param path File path.
   */
  async get(path: string): Promise<Result> {
    const isExist = await this.directoryHelper.hasExist(path);
    if (!isExist) throw new NotFound("The file does not exist.");

    const root: string = resolve(path);
    const { base: name, ext, dir } = parse(root);

    const regex = new RegExp(`${ this.options.directory }.+`, "g");
    const [directory]: string[] = dir.match(regex) || [this.options.directory];
    const chunkDir: string = directory.split(sep).join("/");

    const url: string = `${ this.options.host }/${ chunkDir }/${ name }`;

    const { size, birthtime: createdAt, atime: updatedAt } = await statAsync(root);
    return { name, ext, url, size, dir: chunkDir, createdAt, updatedAt };
  }

  /**
   * Remove a file.
   * @param path File path.
   * @param query Params.
   */
  async remove(path: string, _: Query) {
    const regex = new RegExp(`${ this.options.directory }.+`, "g");
    const [dir] = path.match(regex) || [""];
    const fullpath: string = resolve(dir);

    // Get file before remove.
    const file = await this.get(fullpath);

    // Remove file.
    await unlinkAsync(fullpath);

    // Remove directory if empty.
    this.directoryHelper.list({ path: file.dir })
      .then(items => {
        if (!items.length) this.directoryHelper.remove(file.dir);
      });
    return file;
  }
}