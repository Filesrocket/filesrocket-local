import { ServiceMethods, Paginated, FileEntity, ResultEntity, Query } from 'filesrocket'
import { createWriteStream, unlink, readdir, statSync } from 'fs'
import { Filename, Service } from 'filesrocket/lib/common'
import { promisify } from 'util'
import path from 'path'

import { DirectoryService } from './directory.service'
import { BaseService } from './base.service'
import { LocalOptions } from '../index'
import { paginate } from '../helpers'

const readdirAsync = promisify(readdir)
const unlinkAsync = promisify(unlink)

@Service({
  name: 'local',
  type: 'Files'
})
export class FileService extends BaseService implements Partial<ServiceMethods> {
  protected directoryService: DirectoryService;

  constructor (protected readonly options: LocalOptions) {
    super(options)
    this.directoryService = new DirectoryService(options)
  }

  @Filename()
  async create (data: FileEntity, query: Query = {}): Promise<ResultEntity> {
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

      writable.on('error', err => reject(err))

      data.stream.pipe(writable)
    })
  }

  async list (query: Query = {}): Promise<Paginated<ResultEntity>> {
    const { pagination, directory } = this.options
    const { size, page, path: root = '' } = query

    const dir: string = path.resolve(`${directory}/${root}`)
    const items: string[] = await readdirAsync(dir)

    const filtered: string[] = items.filter(item => {
      const stat = statSync(`${dir}/${item}`)
      return stat.isFile()
    })

    const length: number = pagination.max >= size ? size : pagination.default
    const paginatedItems: Paginated<unknown> = paginate(filtered, length, page)

    const mapped: Promise<ResultEntity>[] = paginatedItems.items.map((item) => {
      return this.get(`${dir}/${item}`)
    })
    const files: ResultEntity[] = await Promise.all(mapped)

    return Object.defineProperty(paginatedItems, 'items', {
      value: files
    }) as Paginated<ResultEntity>
  }

  async get (root: string): Promise<ResultEntity> {
    const fullpath: string = path.resolve(root)
    return this.builder(fullpath)
  }

  async remove (root: string): Promise<ResultEntity> {
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
