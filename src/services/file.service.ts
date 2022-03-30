import {
  ServiceMethods,
  OutputEntity,
  Paginated,
  InputFile,
  Query
} from 'filesrocket'
import { createWriteStream, unlink, readdir, statSync } from 'fs'
import { promisify } from 'util'
import path from 'path'

import { DirectoryService } from './directory.service'
import { BaseService } from './base.service'
import { paginate } from '../helpers'
import { Options } from '../index'

const readdirAsync = promisify(readdir)
const unlinkAsync = promisify(unlink)

export class FileService extends BaseService implements Partial<ServiceMethods> {
  protected directoryService: DirectoryService;

  constructor (protected readonly options: Options) {
    super(options)
    this.directoryService = new DirectoryService(options)
  }

  async create (data: InputFile, query: Query = {}): Promise<OutputEntity> {
    const { path: root = '' } = query
    await this.directoryService.create({ name: root })

    // Fullpath.
    const { directory: folder } = this.options
    const fullpath: string = path.resolve(folder, root, data.name)

    return new Promise((resolve, reject) => {
      const writable = createWriteStream(fullpath)

      // Listening events.
      writable.on('finish', async () => {
        const data = await this.get(fullpath)
        resolve(data)
      })

      writable.on('error', (err) => reject(err))

      data.stream.pipe(writable)
    })
  }

  async list (query: Query = {}): Promise<Paginated<OutputEntity>> {
    const { pagination, directory } = this.options
    const { size, page, path: root = '' } = query

    const dir: string = path.resolve(`${directory}/${root}`)
    const items: string[] = await readdirAsync(dir)

    const filtered: string[] = items.filter((item) => {
      const stat = statSync(`${dir}/${item}`)
      return stat.isFile()
    })

    const length: number = pagination.max >= size ? size : pagination.default
    const paginatedItems: Paginated<unknown> = paginate(filtered, length, page)

    const mapped: Promise<OutputEntity>[] = paginatedItems.items.map((item) => {
      return this.get(`${dir}/${item}`)
    })
    const files: OutputEntity[] = await Promise.all(mapped)

    return Object.defineProperty(paginatedItems, 'items', {
      value: files
    }) as Paginated<OutputEntity>
  }

  private async get (root: string): Promise<OutputEntity> {
    const fullpath: string = path.resolve(root)
    return this.builder(fullpath)
  }

  async remove (root: string): Promise<OutputEntity> {
    const { directory } = this.options
    const regex = new RegExp(`${directory}.+`, 'g')

    const [dir] = root.match(regex) || ['']
    const fullpath: string = path.resolve(dir)

    // Get file before remove.
    const file = await this.get(fullpath)

    await unlinkAsync(fullpath)
    return file
  }
}
