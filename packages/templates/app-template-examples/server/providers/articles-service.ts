import {
  RepositoryError,
  type DatabaseManager,
  type FilterBuilder,
  type Row,
} from '@nocobase/db';

import type {
  CreateArticleInput,
  ListArticlesQuery,
  UpdateArticleInput,
} from '../routes/schemas.js';

export interface ArticleList {
  data: Row[];
  meta: { page: number; pageSize: number; total: number };
}

export class ArticlesService {
  constructor(private readonly database: DatabaseManager) {}

  async list(options: ListArticlesQuery): Promise<ArticleList> {
    const { page, pageSize, q, status } = options;
    const repository = this.database.repository('articles');
    const filter =
      q || status
        ? {
            filter: (f: FilterBuilder) =>
              f.and([
                ...(q ? [f.string('title').includes(q)] : []),
                ...(status ? [f.string('status').eq(status)] : []),
              ]),
          }
        : {};
    const [total, data] = await Promise.all([
      repository.count(filter),
      repository.findMany({
        ...filter,
        sort: (sort) => [
          sort.field('updatedAt').desc(),
          sort.field('id').desc(),
        ],
        limit: pageSize,
        offset: (page - 1) * pageSize,
      }),
    ]);
    return {
      data: data.map(serializeArticle),
      meta: { page, pageSize, total },
    };
  }

  async create(input: CreateArticleInput): Promise<Row> {
    const now = new Date();
    const created = await this.database.repository('articles').createOne({
      values: {
        ...input,
        publishedAt: input.status === 'published' ? now : null,
        createdAt: now,
        updatedAt: now,
      },
    });
    return serializeArticle(created.record);
  }

  /** The updated article, or `undefined` when no article has this id. */
  async update(
    id: number,
    input: UpdateArticleInput,
  ): Promise<Row | undefined> {
    const repository = this.database.repository('articles');
    const current = await repository.findOne({ filter: { id } });
    if (!current) return undefined;
    const now = new Date();
    const published = current.publishedAt ?? null;
    try {
      const result = await repository.updateOne({
        filter: { id },
        values: {
          ...input,
          updatedAt: now,
          publishedAt:
            input.status === 'published' ? (published ?? now) : published,
        },
      });
      return serializeArticle(result.record);
    } catch (error) {
      // The record may have been deleted after it was read.
      if (
        error instanceof RepositoryError &&
        error.code === 'RECORD_NOT_FOUND'
      ) {
        return undefined;
      }
      throw error;
    }
  }
}

function serializeArticle(row: Row): Row {
  const result = { ...row };
  // Ids are strings in the API even though the column is an integer.
  if (typeof result.id === 'number' || typeof result.id === 'bigint')
    result.id = String(result.id);
  for (const field of ['createdAt', 'updatedAt', 'publishedAt']) {
    if (!(field in result) || result[field] == null) continue;
    const value = result[field];
    if (
      !(value instanceof Date) &&
      typeof value !== 'string' &&
      typeof value !== 'number'
    ) {
      result[field] = null;
      continue;
    }
    // SQLite can return a millisecond timestamp as a numeric string; other drivers return Date/ISO strings.
    const date =
      value instanceof Date
        ? value
        : new Date(
            typeof value === 'number' || /^\d+(\.\d+)?$/.test(String(value))
              ? Number(value)
              : String(value),
          );
    result[field] = Number.isNaN(date.getTime()) ? null : date.toISOString();
  }
  return result;
}
