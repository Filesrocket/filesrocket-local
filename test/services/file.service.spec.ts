import { createReadStream } from 'fs'
import { resolve } from 'path'

import { service } from '../config/rocket'
jest.mock('@filesrocket/filesrocket')

const FILENAMES = [
  'one.png',
  'two.png',
  'three.png',
  'four.png',
  'five.png'
]

beforeEach(() => {
  jest.setTimeout(60 * 5 * 1000)
})

describe('Create files.', () => {
  test('Create many file', async () => {
    const results = await Promise.all(
      FILENAMES.map((name) => {
        const path: string = resolve(`test/fixtures/${name}`)
        return service.file.create({
          name,
          stream: createReadStream(path),
          fieldname: 'files',
          encoding: '',
          mimetype: ''
        })
      })
    )

    expect(results.length).toBe(FILENAMES.length)
  })
})

describe('Getting files', () => {
  test('Get all files', async () => {
    const data = await service.file.list()
    const items = Array.isArray(data) ? data : data.items
    expect(items).toHaveLength(FILENAMES.length)
  })

  test('Get 3 files', async () => {
    const SIZE: number = 3

    const data = await service.file.list({ size: SIZE })
    const items = Array.isArray(data) ? data : data.items

    expect(items).toHaveLength(SIZE)
  })
})

describe('Deleting files', () => {
  test('Delete one file', async () => {
    const data = await service.file.list({ size: 1 })
    const items = Array.isArray(data) ? data : data.items
    const file = items[0]

    const entity = await service.file.remove(file.url)
    expect(file).toMatchObject(entity)
  })

  test('Delete many files', async () => {
    const data = await service.file.list()
    const items = Array.isArray(data) ? data : data.items

    const entities = await Promise.all(
      items.map(item => service.file.remove(item.url))
    )

    expect(entities).toHaveLength(items.length)
  })
})
