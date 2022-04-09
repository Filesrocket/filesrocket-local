import { OutputEntity } from 'filesrocket'
import { createReadStream } from 'fs'
import { resolve } from 'path'

import { fileService as service } from '../config/service'

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

        const payload = {
          name,
          stream: createReadStream(path),
          fieldname: 'files',
          encoding: '',
          mimetype: ''
        }

        return service.create(payload)
      })
    )

    expect(results.length).toBe(FILENAMES.length)
  })
})

describe('Getting files', () => {
  test('Get all files', async () => {
    const data = await service.list()
    const items = Array.isArray(data) ? data : data.items
    expect(items).toHaveLength(FILENAMES.length)
  })

  test('Get 3 files', async () => {
    const SIZE: number = 3

    const data = await service.list({ size: SIZE })
    const items = Array.isArray(data) ? data : data.items

    expect(items).toHaveLength(SIZE)
  })

  test('Get one file', async () => {
    const data = await service.list({})

    const element = data.items.at(0) as OutputEntity

    const entity = await service.get(element?.url || '')

    expect(entity.id).toBe(element.id)
    expect(entity).toEqual(element)
    expect(entity).toBeTruthy()
  })
})

describe('Deleting files', () => {
  test('Delete one file', async () => {
    const data = await service.list({ size: 1 })
    const items = Array.isArray(data) ? data : data.items
    const file = items[0]

    const entity = await service.remove(file.url)
    expect(file).toMatchObject(entity)
  })

  test('Delete many files', async () => {
    const data = await service.list()
    const items = Array.isArray(data) ? data : data.items

    const entities = await Promise.all(
      items.map(item => service.remove(item.url))
    )

    expect(entities).toHaveLength(items.length)
  })

  test('Delete a file that does not exist', async () => {
    const promise = service.remove('http://localhost:3030/uploads/randomfile.txt')
    await expect(promise).rejects.toThrowError('File does not exist')
  })
})
