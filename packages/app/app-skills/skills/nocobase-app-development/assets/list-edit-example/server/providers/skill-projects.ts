import { randomUUID } from 'node:crypto';
import {
  type DatabaseConnection,
  type FilterBuilder,
  RepositoryError,
} from '@nocobase/db';
import { ApiError } from '@nocobase/app-server/router';

export class SkillProjectsService {
  constructor(private readonly connection: DatabaseConnection) {}
  async list(
    query: { q?: string; sort?: 'name'; order?: 'asc' | 'desc' } = {},
  ) {
    const repository = this.connection.repository('skillProjects');
    const filter = query.q
      ? {
          filter: (f: FilterBuilder) => f.string('name').includes(query.q!),
        }
      : {};
    const [data, total] = await Promise.all([
      repository.findMany({
        ...filter,
        limit: 100,
        sort: (sort) =>
          query.sort === 'name'
            ? [
                query.order === 'desc'
                  ? sort.field('name').desc()
                  : sort.field('name').asc(),
                sort.field('id').asc(),
              ]
            : [sort.field('id').asc()],
      }),
      repository.count(filter),
    ]);
    return { data, meta: { total } };
  }
  /** Counts for the page's metric; independent of the list's search. */
  async summary() {
    return {
      total: await this.connection.repository('skillProjects').count(),
    };
  }
  async remove(id: string) {
    try {
      await this.connection
        .repository('skillProjects')
        .deleteOne({ filter: { id } });
    } catch (error) {
      if (error instanceof RepositoryError && error.code === 'RECORD_NOT_FOUND')
        throw missingProject();
      throw error;
    }
    return { id };
  }
  async get(id: string) {
    const record = await this.connection
      .repository('skillProjects')
      .findOne({ filter: { id } });
    if (!record) throw missingProject();
    return record;
  }
  async save(input: { name: string }, id?: string) {
    const repository = this.connection.repository('skillProjects');
    try {
      const saved = id
        ? await repository.updateOne({ filter: { id }, values: input })
        : await repository.createOne({
            values: { id: randomUUID(), ...input },
          });
      return saved.record;
    } catch (error) {
      if (error instanceof RepositoryError && error.code === 'RECORD_NOT_FOUND')
        throw missingProject();
      throw error;
    }
  }
}
function missingProject(): ApiError {
  return new ApiError({
    status: 'NOT_FOUND',
    reason: 'PROJECT_NOT_FOUND',
    domain: 'examples',
    message: 'This project no longer exists.',
  });
}
