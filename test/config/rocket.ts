import { LocalService } from '../../src/index'

export const service = new LocalService({
  pagination: { default: 15, max: 50 },
  directory: 'uploads',
  host: 'http://localhost:3030'
})
