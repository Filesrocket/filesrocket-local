import { createReadStream } from "fs";
import { resolve } from "path";
jest.mock("filesrocket");

import { LocalFileService } from "../../src/index";

const localService = new LocalFileService({
  pagination: { default: 15, max: 50 },
  directory: "uploads",
  host: "http://localhost:3030"
});

export const FILENAMES = [
  "one.png",
  "two.png",
  "three.png",
  "four.png",
  "five.png"
];

beforeEach(() => {
  jest.setTimeout(60 * 5 * 1000);
});

describe("Create files.", () => {
  test("Create many file", async () => {
    const results = await Promise.all(
      FILENAMES.map((name) => {
        const path: string = resolve(`test/fixtures/${name}`);
        return localService.create({
          name,
          stream: createReadStream(path),
          fieldname: "files",
          encoding: "",
          mimetype: ""
        });
      })
    );

    expect(results.length).toBe(FILENAMES.length);
  });
});
