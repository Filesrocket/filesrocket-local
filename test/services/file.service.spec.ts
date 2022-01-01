import { createReadStream } from "fs";
import { resolve } from "path";
jest.mock("filesrocket");

import { fileService as service } from "../config/rocket";

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
        return service.create({
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

describe("Getting files", () => {
  test("Get all files", async () => {
    const data = await service.list();
    expect(data.items).toHaveLength(FILENAMES.length);
  });

  test("Get 3 files", async () => {
    const SIZE: number = 3;
    const data = await service.list({ size: SIZE });
    expect(data.items).toHaveLength(SIZE);
  });
});

describe("Deleting files", () => {
  test("Delete one file", async () => {
    const data = await service.list({ size: 1 });
    const file = data.items[0];

    const entity = await service.remove(file.id);
    expect(file).toMatchObject(entity);
  });

  test("Delete many files", async () => {
    const data = await service.list();

    const entities = await Promise.all(
      data.items.map(item => service.remove(item.id))
    );

    expect(entities).toHaveLength(data.items.length);
  });
});
