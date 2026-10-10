export interface PageMeta {
  page: number;
  pageSize: number;
  total: number;
}

export interface PageResponse<T> {
  data: T[];
  meta: PageMeta;
}

const DEFAULT_PAGE_SIZE = 20;

export function toPageResponse<T>(page: {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
}): PageResponse<T> {
  return {
    data: page.data,
    meta: { page: page.page, pageSize: page.pageSize, total: page.total },
  };
}

/** One page of a list the repository returns whole, such as the revisions of a workflow. */
export function paginate<T>(
  items: readonly T[],
  options: { page?: number; pageSize?: number },
): PageResponse<T> {
  const page = options.page ?? 1;
  const pageSize = options.pageSize ?? DEFAULT_PAGE_SIZE;
  const offset = (page - 1) * pageSize;
  return {
    data: items.slice(offset, offset + pageSize),
    meta: { page, pageSize, total: items.length },
  };
}

export function parseBoolean(value?: string): boolean | undefined {
  return value === 'true' ? true : value === 'false' ? false : undefined;
}

/** A validated `status` filter: `null` for unfinished runs, otherwise the status code. */
export function parseStatus(value?: string): number | null | undefined {
  if (value === undefined) return undefined;
  if (value === 'null') return null;
  return Number(value);
}
