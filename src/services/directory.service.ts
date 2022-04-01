import { InternalServerError, NotFound } from 'filesrocket/lib/errors'
import { OutputEntity, Paginated, Query, Service } from 'filesrocket'
import { mkdir, readdir, statSync, Stats, rmdir } from 'fs'
import { promisify } from 'util'
import path from 'path'

import { BaseService } from './base.service'
import { Options } from '../declarations'
import { paginate } from '../helpers'

const readdirAsync = promisify(readdir)
const mkdirAsync = promisify(mkdir)
const rmdirAsync = promisify(rmdir)

export class DirectoryService extends BaseService implements Partial<Service<any>> {
  constructor (protected readonly options: Options) {
    super(options)
  }

  async create (data: any): Promise<OutputEntity> {
    const { directory } = this.options
    const root: string = path.resolve(`${directory}/${data.name}`)

    const isExist = await this.hasExist(root)

    if (isExist) return this.builder(root)

    const fullpath = await mkdirAsync(root, {
      recursive: true
    })

    if (!fullpath) {
      throw new InternalServerError(
        'An error occurred while performing this operation.'
      )
    }

    return this.get(root)
  }

  async list (query: Query = {}): Promise<Paginated<OutputEntity>> {
    const { directory, pagination } = this.options
    const { size, page, path: root = '' } = query

    const length: number = pagination.max >= size ? size : pagination.default
    const fullpath: string = path.resolve(`${directory}/${root}`)
    const items: string[] = await readdirAsync(fullpath)

    const filtered: string[] = items.filter((item) => {
      const data: Stats = statSync(`${fullpath}/${item}`)
      return data.isDirectory()
    })

    const itemsPaginated: Paginated<unknown> = paginate(filtered, length, page)

    const directories: OutputEntity[] = await Promise.all(
      itemsPaginated.items.map((item) => {
        const root: string = path.resolve(`${fullpath}/${item}`)
        return this.get(root)
      })
    )

    return Object.defineProperty(itemsPaginated, 'items', {
      value: directories
    }) as Paginated<OutputEntity>
  }

  private async get (root: string, query?: Query): Promise<OutputEntity> {
    const isExist = await this.hasExist(root)

    if (!isExist) {
      throw new NotFound('Directory not exist')
    }

    return this.builder(root)
  }

  async remove (root: string): Promise<OutputEntity> {
    const { directory } = this.options
    const regex = new RegExp(`${directory}.+`, 'g')

    const [dir] = root.match(regex) || ['']
    const fullpath = path.resolve(dir)

    const entity = await this.get(fullpath)

    await rmdirAsync(fullpath)

    return entity
  }
}
