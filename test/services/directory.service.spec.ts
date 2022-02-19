import { Directory } from '../config/rocket'
jest.mock('@filesrocket/filesrocket')

const NAMES: string[] = [
  'images',
  'documents',
  'videos',
  'audios'
]

describe('Creating directories', () => {
  test('Create many directories', async () => {
    const promises = NAMES.map(name => Directory.create({ name }))
    const results = await Promise.all(promises)
    expect(results).toHaveLength(NAMES.length)
  })

  test('Create single directory', async () => {
    const foldername: string = 'random'
    const data = await Directory.create({ name: foldername })
    expect(data.name).toBe(foldername)
  })
})

describe('Getting directories', () => {
  test('Get many directories', async () => {
    const data = await Directory.list()
    expect(data.items.length).toBe(NAMES.length + 1)
  })

  test('Get 3 directories', async () => {
    const SIZE: number = 3
    const data = await Directory.list({ size: SIZE })
    expect(data.items).toHaveLength(SIZE)
  })

  test('Get a directories wrong', async () => {
    const promise = Directory.list({ path: 'someone' })
    await expect(promise).rejects.toThrowError()
  })
})

describe('Deleting directories', () => {
  test('Delete single directory', async () => {
    const data = await Directory.list({ size: 1 })
    const entity = data.items[0]

    const directory = await Directory.remove(entity.url)
    expect(entity).toMatchObject(directory)
  })

  test('Delete many directories', async () => {
    const data = await Directory.list()

    const promises = data.items.map(item => Directory.remove(item.url))
    const entities = await Promise.all(promises)

    expect(entities).toHaveLength(data.items.length)
  })

  test('Delete directory does not exist', async () => {
    const URL: string = 'http://localhost:3030/uploads/anywhere'
    await expect(Directory.remove(URL)).rejects.toThrowError()
  })
})
