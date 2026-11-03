import { createHash } from 'node:crypto';
import { defineMigration, type MigrationDefinition } from '@nocobase/db';

const identity = (...parts: (string | number)[]) =>
  createHash('sha256').update(JSON.stringify(parts)).digest('hex');

/** Copy existing values into independent workflow groups without rewriting historical facts. */
const migration: MigrationDefinition = defineMigration({
  name: '202610160003_lifecycle_example_workflow_parameters',
  async up(context) {
    // Repository decoding is required for portable JSON payloads and reviewer selection counts.
    const heads = context.repository('lifecycleExampleParameterHeads');
    const versions = context.repository('lifecycleExampleParameterVersions');
    const selections = context.repository(
      'lifecycleExampleParameterSelections',
    );
    for (const [workflow, groups] of [
      ['expenses', ['expenseThresholds']],
      ['tickets', ['ticketPolicy', 'notificationCopy']],
      ['reviewerDemo', ['financeReviewers']],
      ['reviewerLiveDemo', ['financeReviewers']],
    ] as const) {
      for (const group of groups) {
        const head = await heads.findOne({
          filter: { scope: 'demo', groupKey: group },
        });
        if (!head) continue;
        const target = `lifecycle.${workflow}.${group}`;
        if (await heads.exists({ filter: { scope: 'demo', groupKey: target } }))
          continue;
        for (let revision = 1; revision <= Number(head.revision); revision++) {
          const version = await versions.findOne({
            filter: { id: identity('demo', group, revision) },
          });
          if (!version)
            throw new Error(
              'A parameter version required for migration is missing.',
            );
          const versionId = identity('demo', target, revision);
          await versions.createOne({
            values: {
              id: versionId,
              payload: {
                ...(version.payload as Record<string, unknown>),
                group: target,
              },
              selectionCounts: version.selectionCounts,
            },
          });
          for (const [field, count] of Object.entries(
            version.selectionCounts as Record<string, number>,
          )) {
            for (let index = 0; index < count; index++) {
              const selection = await selections.findOne({
                filter: { id: identity('demo', group, revision, field, index) },
              });
              if (!selection)
                throw new Error(
                  'A reviewer selection required for migration is missing.',
                );
              await selections.createOne({
                values: {
                  id: identity('demo', target, revision, field, index),
                  versionId,
                  ruleKey: field,
                  group: selection.group,
                  type: selection.type,
                  referenceId: selection.referenceId,
                },
              });
            }
          }
        }
        await heads.createOne({
          values: {
            id: identity('demo', target),
            scope: 'demo',
            groupKey: target,
            status: 'current',
            revision: head.revision,
          },
        });
      }
    }
  },
  // Preserve both historical and newly edited values on rollback; older code ignores qualified groups.
  async down() {},
});
export default migration;
