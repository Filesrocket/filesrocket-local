import {
  DirectoryEntity,
  DirectoryManager,
  FileManager,
  ServiceMethods
} from '@filesrocket/filesrocket/lib'

import { LocalOptions } from './index'
import { FileService } from './services/file.service'
import { DirectoryService } from './services/directory.service'

export class LocalService implements FileManager, DirectoryManager {
  readonly file: ServiceMethods;
  readonly directory: ServiceMethods<DirectoryEntity>;

  constructor (options: LocalOptions) {
    this.file = new FileService(options)
    this.directory = new DirectoryService(options)
  }
}
