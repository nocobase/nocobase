// @vitest-environment node
import path from 'node:path';
import {
  createTestDatabase,
  inspectCollection,
} from '@nocobase/app-testing/server';
import { expect, it } from 'vitest';

it('creates the quotation review tasks with their claim columns and rolls back', async () => {
  const testDatabase = await createTestDatabase();
  const { database } = testDatabase;
  try {
    const migrator = database.createMigrator({
      connection: 'main',
      directory: path.resolve(
        import.meta.dirname,
        '../../database/main/migrations',
      ),
      packageName: 'quotation-review-test',
    });
    await migrator.upTo('202609300002_create_quotation_review_tasks');
    const connection = database.connection('main');
    expect(
      (await inspectCollection(connection, 'quotationReviewTasks'))?.fields,
    ).toMatchObject({
      runId: { nullable: false },
      quotationId: { nullable: false },
      totalCents: { nullable: false },
      createdAt: { nullable: false },
      submittedAt: { nullable: true },
      reviewerId: { nullable: true },
    });
    expect(
      await connection.collectionMetadata.get('quotationReviewTasks'),
    ).toBeDefined();

    const tasks = database.repository('quotationReviewTasks');
    await tasks.createOne({
      values: {
        runId: 'run-1',
        quotationId: 'Q-100',
        totalCents: 50000,
        route: 'standard',
        status: 'pending',
        createdAt: new Date(),
      },
    });
    await tasks.updateOne({
      filter: { runId: 'run-1' },
      values: { status: 'submitting', reviewerId: 'reviewer-1' },
    });
    expect(await tasks.findOne({ filter: { runId: 'run-1' } })).toMatchObject({
      status: 'submitting',
      reviewerId: 'reviewer-1',
    });
    await expect(
      tasks.createOne({
        values: {
          runId: 'run-1',
          quotationId: 'Q-200',
          totalCents: 100000,
          route: 'manual-follow-up',
          status: 'pending',
          createdAt: new Date(),
        },
      }),
    ).rejects.toThrow();

    await migrator.upTo('202610020001_quotation_review_resume_request');
    expect(
      (await inspectCollection(connection, 'quotationReviewTasks'))?.fields,
    ).toMatchObject({
      resumeRequestId: { nullable: true },
    });
    await database.repository('quotationReviewTasks').updateOne({
      filter: { runId: 'run-1' },
      values: { resumeRequestId: '12345' },
    });
    expect(
      await database.repository('quotationReviewTasks').findOne({
        filter: { runId: 'run-1' },
      }),
    ).toMatchObject({ resumeRequestId: '12345', reviewerId: 'reviewer-1' });
    await migrator.rollback();
    expect(
      (await inspectCollection(connection, 'quotationReviewTasks'))?.fields,
    ).not.toHaveProperty('resumeRequestId');
    expect(
      await database.repository('quotationReviewTasks').findOne({
        filter: { runId: 'run-1' },
      }),
    ).toMatchObject({ reviewerId: 'reviewer-1' });
    await migrator.rollback();
    expect(
      await inspectCollection(connection, 'quotationReviewTasks'),
    ).toBeUndefined();
    expect(
      await connection.collectionMetadata.get('quotationReviewTasks'),
    ).toBeUndefined();
  } finally {
    await testDatabase.destroy();
  }
});
