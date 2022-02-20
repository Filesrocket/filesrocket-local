import { LocalService, LocalOptions } from '../../src/index'

const options: LocalOptions = {
  pagination: { default: 15, max: 50 },
  directory: 'uploads',
  host: 'http://localhost:3030'
}

export const service = new LocalService(options)
