import { Paginated } from '@filesrocket/filesrocket'

export function paginate<T> (
  entities: T[],
  size: number | string,
  page: number | string = 1
): Paginated<T> {
  size = Number(size)
  page = Number(page)

  const skip: number = Math.floor((page - 1) * size)
  const limit: number = Math.floor(size * page)
  const items: any[] = entities.slice(skip, limit)

  const nextPage = ((skip + size) < entities.length) ? page + 1 : undefined
  const prevPage = page > 1 ? page - 1 : undefined

  return {
    items,
    size: items.length,
    page,
    total: entities.length,
    nextPageToken: nextPage,
    prevPageToken: prevPage
  }
}
