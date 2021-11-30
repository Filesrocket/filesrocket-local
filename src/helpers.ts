import { Paginated } from "filesrocket";

export function paginate<T>(
  entities: T[],
  size: number | string,
  page: number | string = 1
): Paginated<T> {
  size = Number(size);
  page = Number(page);

  const skip: number = Math.floor((page - 1) * size);
  const limit: number = Math.floor(size * page);
  const items: any[] = entities.slice(skip, limit);

  const nextPage: number | null = ((skip + size) < entities.length) ? page + 1 : null;
  const prevPage: number | null = page > 1 ? page - 1 : null;

  return {
    items,
    size,
    total: entities.length,
    pageToken: page,
    nextPageToken: nextPage,
    prevPageToken: prevPage
  }
}
