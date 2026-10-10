import { defineSeed, type SeedDefinition } from '@nocobase/db';

// Upgrade the two built-in planning roles on both new and existing installations.
// Match their historical permission sets, not their revision: changing a model or name must not block this upgrade,
// but customized permissions must stay intact. Keep this history self-contained rather than importing live presets.
const ASSISTANT_ACTIONS = [
  'pm.projects/view',
  'pm.issues/view',
  'pm.issues/create',
  'pm.issues/edit',
  'pm.issues/comment',
  'kb.knowledge/read',
  'kb.knowledge/propose',
  'studio.reports/read',
];
const LEAD_ACTIONS = [
  ...ASSISTANT_ACTIONS,
  'pm.issues/close',
  'pm.issues/change-owner',
  'pm.attachments/upload',
];
const BUILT_INS = [
  { id: 'studio-project-assistant', previous: [ASSISTANT_ACTIONS] },
  {
    id: 'studio-project-lead',
    previous: [
      LEAD_ACTIONS,
      [...LEAD_ACTIONS, 'studio.git/open-pr', 'studio.previews/manage'],
    ],
  },
];

const seed: SeedDefinition = defineSeed({
  name: '202610100040_studio_project_creation',
  transaction: true,
  async run(context) {
    const agents = context.repository('agAgents');
    try {
      await agents.exists();
    } catch (error) {
      if (
        error instanceof Error &&
        Reflect.get(error, 'code') === 'COLLECTION_NOT_FOUND'
      )
        return;
      throw error;
    }
    const changes = context.repository('agAgentChanges');
    for (const { id, previous } of BUILT_INS) {
      const changeId = `${id}:project-creation`;
      // A replay must not restore a permission an administrator revoked after the upgrade.
      if (await changes.exists({ filter: { id: changeId } })) continue;
      const agent = (await agents.findOne({ filter: { id } })) as {
        readonly actions?: unknown;
        readonly revision: number;
        readonly archivedAt?: unknown;
      } | null;
      if (!agent || agent.archivedAt || !Array.isArray(agent.actions)) continue;
      const actions = agent.actions as unknown[];
      if (
        !previous.some(
          (defaults) =>
            defaults.length === actions.length &&
            defaults.every((action) => actions.includes(action)),
        )
      )
        continue;
      const revision = Number(agent.revision) + 1;
      const now = new Date().toISOString();
      await agents.updateOne({
        filter: { id },
        values: {
          actions: [...actions, 'pm.projects/create'],
          revision,
          updatedAt: now,
        },
      });
      await changes.createOne({
        values: {
          id: changeId,
          agentId: id,
          revision,
          action: 'updated',
          actorUserId: null,
          changes: [{ field: 'actions' }],
          createdAt: now,
        },
      });
    }
  },
});

export default seed;
