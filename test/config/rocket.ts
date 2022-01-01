import { LocalDirectoryService, LocalFileService } from "../../src/index";

const config = {
  pagination: { default: 15, max: 50 },
  directory: "uploads",
  host: "http://localhost:3030"
}

// File Service.
export const fileService = new LocalFileService(config);
// Directory Service.
export const directoryService = new LocalDirectoryService(config);
