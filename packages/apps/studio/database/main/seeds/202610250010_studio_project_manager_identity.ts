import { defineSeed, type SeedDefinition } from '@nocobase/db';

// Fixed historical defaults: never import the runtime identity or settings parser.
const OLD_NAME = 'Project manager';
const OLD_DESCRIPTION =
  'Arranges every issue: hands each step to the agent that fits it, reads the replies and decides what comes next.';
const validName = (value: unknown): value is string =>
  typeof value === 'string' &&
  value.trim().length > 0 &&
  value.trim().length <= 200;
const validDescription = (value: unknown): value is string | null =>
  value === null || (typeof value === 'string' && value.length <= 10_000);
const descriptionOf = (value: string | null): string | null =>
  value === null || value.trim() === '' ? null : value;

const seed: SeedDefinition = defineSeed({
  name: '202610250010_studio_project_manager_identity',
  transaction: true,
  async run(context) {
    const settings = context.repository('studioSettings');
    const row = await settings.findOne({ filter: { key: 'projectManager' } });
    let raw: unknown = row?.value;
    if (row) {
      try {
        if (typeof raw === 'string') raw = JSON.parse(raw) as unknown;
      } catch {
        throw new Error(
          'Repair studioSettings.projectManager.value: expected a JSON object.',
        );
      }
      if (!raw || typeof raw !== 'object' || Array.isArray(raw))
        throw new Error(
          'Repair studioSettings.projectManager.value: expected a JSON object.',
        );
    }
    const current = (raw ?? {}) as Record<string, unknown>;
    const chinese = context.config
      .get<string>('i18n.defaultLocale')
      ?.toLowerCase()
      .startsWith('zh');
    const defaultName = chinese ? '项目经理' : OLD_NAME;
    const defaultDescription = chinese
      ? '安排每个事项：将各步骤交给合适的 agent，阅读回复并决定下一步。'
      : OLD_DESCRIPTION;
    let old: Record<string, unknown> | null = null;
    if (!validName(current.name) || !validDescription(current.description)) {
      const agents = context.repository('agAgents');
      // Probe metadata before SQL; only a missing Collection is a supported fresh-install case.
      try {
        old =
          (await agents.findOne({
            filter: { id: 'studio-project-manager' },
          })) ?? null;
      } catch (error) {
        if (!(
          error instanceof Error &&
          Reflect.get(error, 'code') === 'COLLECTION_NOT_FOUND'
        ))
          throw error;
      }
    }
    const name = validName(current.name)
      ? current.name
      : validName(old?.name) && old.name !== OLD_NAME
        ? old.name
        : defaultName;
    const description = validDescription(current.description)
      ? descriptionOf(current.description)
      : old &&
          validDescription(old.description) &&
          old.description !== OLD_DESCRIPTION
        ? descriptionOf(old.description)
        : defaultDescription;
    if (row && current.name === name && current.description === description)
      return;
    const value = { ...current, name, description };
    const now = new Date();
    if (row)
      await settings.updateOne({
        filter: { key: 'projectManager' },
        values: { value, updatedAt: now },
      });
    else
      await settings.createOne({
        values: {
          key: 'projectManager',
          value,
          createdAt: now,
          updatedAt: now,
        },
      });
  },
});

export default seed;
