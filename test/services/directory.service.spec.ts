import { directoryService as service } from '../config/service'

const NAMES: string[] = [
  'images',
  'documents',
  'videos',
  'audios'
]

describe('Creating directories', () => {
  test('Create many directories', async () => {
    const promises = NAMES.map(name => service.create({ name }))
    const results = await Promise.all(promises)
    expect(results).toHaveLength(NAMES.length)
  })

  test('Create single directory', async () => {
    const foldername: string = 'random'
    const data = await service.create({ name: foldername })
    expect(data.name).toBe(foldername)
  })
})

describe('Getting directories', () => {
  test('Get many directories', async () => {
    const data = await service.list()
    const items = Array.isArray(data) ? data : data.items
    expect(items.length).toBe(NAMES.length + 1)
  })

  test('Get 3 directories', async () => {
    const SIZE: number = 3

    const data = await service.list({ size: SIZE })
    const items = Array.isArray(data) ? data : data.items

    expect(items).toHaveLength(SIZE)
  })

  test('Get a directories wrong', async () => {
    const promise = service.list({ path: 'someone' })
    await expect(promise).rejects.toThrowError()
  })
})

describe('Deleting directories', () => {
  test('Delete single directory', async () => {
    const data = await service.list({ size: 1 })
    const items = Array.isArray(data) ? data : data.items
    const entity = items[0]

    const directory = await service.remove(entity.url)
    expect(entity).toMatchObject(directory)
  })

  test('Delete many directories', async () => {
    const data = await service.list()
    const items = Array.isArray(data) ? data : data.items

    const promises = items.map(item => service.remove(item.url))
    const entities = await Promise.all(promises)

    expect(entities).toHaveLength(items.length)
  })

  test('Delete directory does not exist', async () => {
    const URL: string = 'http://localhost:3030/uploads/anywhere'
    await expect(service.remove(URL)).rejects.toThrowError()
  })
})
