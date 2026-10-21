import { idGeneratorToken } from '@nocobase/app-server';
import type { SeedContext } from '@nocobase/db';
import { GLOBAL_SKILL_TARGET } from '../../../shared/skills.js';
import { versionHash } from './bundle.js';
import { checkedSkill } from './skill.service.js';
import type {
  SkillRecord,
  SkillVersionRecord,
  AttachmentRecord,
} from './skill.store.js';

export interface SeedSkillOptions {
  /** A complete SKILL.md. This installation helper supports skills without supplementary files. */
  readonly content: string;
  /** Attach a newly created skill globally, only on a fresh installation. */
  readonly globalDefault?: boolean;
}

export interface SeedSkillResult {
  readonly id: string;
  readonly created: boolean;
}

/**
 * Creates a missing library skill in the seed's transaction, without resolving runtime services.
 * Existing slugs are returned untouched, including their files, history and attachments.
 * The caller runs this inside a transactional seed; it never opens an independent transaction.
 */
export async function seedSkill(
  context: SeedContext,
  options: SeedSkillOptions,
): Promise<SeedSkillResult> {
  const checked = checkedSkill(options.content);
  const skills = context.repository<SkillRecord>('agSkills');
  const existing = await skills.findOne({ filter: { slug: checked.name } });
  if (existing) return { id: existing.id, created: false };
  const ids = context.container.resolve(idGeneratorToken);
  const id = ids.generateString();
  const now = new Date().toISOString();
  await skills.createOne({
    values: {
      id,
      slug: checked.name,
      name: checked.name,
      description: checked.description,
      currentVersion: 1,
      createdById: null,
      createdAt: now,
      updatedAt: now,
    },
  });
  await context.repository<SkillVersionRecord>('agSkillVersions').createOne({
    values: {
      id: ids.generateString(),
      skillId: id,
      version: 1,
      name: checked.name,
      description: checked.description,
      content: checked.content,
      manifest: [],
      note: null,
      contentHash: versionHash(checked.content, []),
      createdById: null,
      createdAt: now,
    },
  });
  if (context.freshInstall === true && options.globalDefault)
    await context.repository<AttachmentRecord>('agSkillAttachments').createOne({
      values: {
        id: ids.generateString(),
        skillId: id,
        ...GLOBAL_SKILL_TARGET,
        createdAt: now,
      },
    });
  return { id, created: true };
}
