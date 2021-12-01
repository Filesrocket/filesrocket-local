import { resolve, parse, sep } from "path";
import { DataResult } from "filesrocket";
import { promisify } from "util";
import { stat } from "fs";

import { LocalOptions } from "../declarations";

const statAsync = promisify(stat);

export class BaseService {
  constructor(protected readonly options: LocalOptions) {}

  async builder(path: string): Promise<DataResult> {
    const fullpath: string = resolve(path);
    const { directory: folder, host } = this.options;
    const { base: filename, ext, dir } = parse(fullpath);

    const regex = new RegExp(`${ folder }.+`, "g");
    const [directory] = dir.match(regex) || [folder];
    const chunks: string[] = directory.split(sep);

    const stat = await statAsync(fullpath);

    return {
      name: filename,
      ext,
      url: `${ host }/${ chunks.join("/") }/${ filename }`,
      size: stat.size,
      dir: chunks.join("/"),
      createdAt: stat.birthtime,
      updatedAt: stat.atime
    };
  }
}
