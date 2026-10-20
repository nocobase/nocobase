import type { DatabaseConnection, DatabaseManager } from '@nocobase/db';
import {
  resolveReviewerSelections,
  type ReviewerSelection,
} from '@nocobase/lifecycle';

export interface ReviewerServices {
  readonly reviewers: (
    selections: readonly ReviewerSelection[],
    applicantId: string,
  ) => Promise<readonly string[]>;
}
export function reviewerServices(
  database: DatabaseManager,
  handle: unknown,
): ReviewerServices {
  const connection =
    handle === undefined
      ? database.connection()
      : (handle as DatabaseConnection);
  return {
    reviewers: (selections, applicantId) =>
      resolveReviewerSelections(
        selections,
        { scope: 'demo', applicantId },
        {
          selectors: {
            department: async (referenceId, context) =>
              (
                await connection
                  .repository('lifecycleExampleMemberships')
                  .findMany({
                    filter: { scope: context.scope, departmentId: referenceId },
                  })
              ).map((row) =>
                typeof row.userId === 'string' ? row.userId : '',
              ),
            role: async (referenceId, context) =>
              (
                await connection
                  .repository('lifecycleExampleMemberships')
                  .findMany({
                    filter: { scope: context.scope, roleId: referenceId },
                  })
              ).map((row) =>
                typeof row.userId === 'string' ? row.userId : '',
              ),
            user: async (referenceId, context) =>
              (await connection
                .repository('lifecycleExamplePeople')
                .findOne({ filter: { id: referenceId, scope: context.scope } }))
                ? [referenceId]
                : [],
          },
          eligible: async (userId, context) =>
            userId !== context.applicantId &&
            Boolean(
              await connection.repository('lifecycleExamplePeople').findOne({
                filter: { id: userId, scope: context.scope, active: true },
              }),
            ),
        },
      ),
  };
}
