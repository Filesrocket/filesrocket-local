import {
  LocalDirectoryService,
  LocalFileService,
  LocalOptions
} from '../../src/index'

const options: LocalOptions = {
  pagination: { default: 15, max: 50 },
  directory: 'uploads',
  host: 'http://localhost:3030'
}

// File Service.
export const File = new LocalFileService(options)
// Directory Service.
export const Directory = new LocalDirectoryService(options)
