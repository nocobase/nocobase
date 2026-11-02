import { randomUUID } from 'node:crypto';
import { type DatabaseConnection, RepositoryError } from '@nocobase/db';
import { ApiError } from '@nocobase/app-server/router';

export class SkillProjectsService {
  constructor(private readonly connection: DatabaseConnection) {}
  async list() {
    const repository = this.connection.repository('skillProjects');
    const [data, total] = await Promise.all([
      repository.findMany({
        limit: 100,
        sort: (sort) => [sort.field('id').asc()],
      }),
      repository.count(),
    ]);
    return { data, meta: { total } };
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
