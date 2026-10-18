import { randomUUID } from 'node:crypto';
import type { DatabaseManager } from '@nocobase/db';
import { ApiError } from '@nocobase/app-server/router';

export interface WorkflowCategory {
  readonly id: string;
  readonly title: string;
  readonly sortOrder: number;
  readonly color?: string;
}

/** Application-owned workflow identities are metadata; no lifecycle definition is changed. */
export class WorkflowCatalogService {
  constructor(private readonly database: DatabaseManager) {}

  async categories(): Promise<WorkflowCategory[]> {
    const rows = await this.database
      .repository('lifecycleExampleWorkflowCategories')
      .findMany({
        sort: (sort) => [sort.field('sortOrder').asc(), sort.field('id').asc()],
      });
    return rows.map((row) => ({
      id: row.id as string,
      title: row.title as string,
      sortOrder: Number(row.sortOrder),
      color: (row.color as string | undefined) ?? 'gray',
    }));
  }

  async reorder(ids: readonly string[]): Promise<void> {
    await this.database.connection().transaction(async (connection) => {
      const repository = connection.repository(
        'lifecycleExampleWorkflowCategories',
      );
      const rows = await repository.findMany({});
      const known = new Set(rows.map((row) => row.id));
      if (
        ids.length !== known.size ||
        new Set(ids).size !== ids.length ||
        ids.some((id) => !known.has(id))
      )
        throw new ApiError({
          status: 'ABORTED',
          reason: 'WORKFLOW_CATEGORIES_CHANGED',
          domain: 'examples',
          message: 'The category list changed. Refresh it before reordering.',
        });
      for (const [sortOrder, id] of ids.entries())
        await repository.updateOne({ filter: { id }, values: { sortOrder } });
    });
  }

  async assignments(): Promise<Map<string, string | null>> {
    const rows = await this.database
      .repository('lifecycleExampleWorkflowCatalog')
      .findMany({});
    return new Map(
      rows.map((row) => [
        row.id as string,
        row.categoryId == null ? null : (row.categoryId as string),
      ]),
    );
  }

  async saveCategory(
    input: Omit<WorkflowCategory, 'id'>,
    id?: string,
  ): Promise<WorkflowCategory> {
    input = { ...input, color: input.color ?? 'gray' };
    const repository = this.database.repository(
      'lifecycleExampleWorkflowCategories',
    );
    if (id) {
      await this.requireCategory(id);
      await repository.updateOne({ filter: { id }, values: input });
    } else {
      id = randomUUID();
      await repository.createOne({ values: { id, ...input } });
    }
    return { id, ...input };
  }

  async deleteCategory(id: string): Promise<void> {
    await this.requireCategory(id);
    // The foreign key clears classifications atomically, including concurrent assignments.
    await this.database
      .repository('lifecycleExampleWorkflowCategories')
      .deleteOne({ filter: { id } });
  }

  async assign(id: string, categoryId: string | null): Promise<void> {
    if (categoryId) await this.requireCategory(categoryId);
    await this.database
      .repository('lifecycleExampleWorkflowCatalog')
      .upsertOne({
        filter: { id },
        create: { id, categoryId },
        update: { categoryId },
      });
  }

  private async requireCategory(id: string): Promise<void> {
    if (
      !(await this.database
        .repository('lifecycleExampleWorkflowCategories')
        .findOne({ filter: { id } }))
    )
      throw new ApiError({
        status: 'NOT_FOUND',
        reason: 'WORKFLOW_CATEGORY_NOT_FOUND',
        domain: 'examples',
        message: 'The workflow category does not exist.',
      });
  }
}
