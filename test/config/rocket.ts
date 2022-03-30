import { DirectoryService } from '../../src/services/directory.service'
import { FileService } from '../../src/services/file.service'
import { Options } from '../../src/declarations'

const options: Options = {
  pagination: { default: 15, max: 50 },
  directory: 'uploads',
  host: 'http://localhost:3030'
}

export const fileService = new FileService(options)

export const directoryService = new DirectoryService(options)
