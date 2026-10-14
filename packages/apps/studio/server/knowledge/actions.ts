/**
 * The knowledge plugin's `kb.knowledge` actions as Studio's roles give them: a person's own, and for a run only those
 * agents may use (`../access/action-policy.ts`), within what the person who
 * woke it holds. Agents never edit.
 */
import { grantableToAgents } from '../access/action-policy.js';
import { businessResource } from '../access/catalog.js';
import {
  levelActionsOf,
  type BusinessKey,
} from '@nocobase/app-plugin-knowledge/shared/access';
import type { ActionSource } from '../agents/commands/permissions.js';
import type { KnowledgeLevels } from './access.js';

export const KNOWLEDGE_READ = 'kb.knowledge/read';
export const KNOWLEDGE_PROPOSE = 'kb.knowledge/propose';

/** The knowledge actions an identity holds, for the action gate. */
export function knowledgeActionsOf(
  levelsOf: (userId: string) => Promise<KnowledgeLevels>,
): ActionSource {
  return async (identity) => {
    const levels = await levelsOf(identity.userId);
    const held = new Set<string>();
    if (levels.read !== 'none') held.add(KNOWLEDGE_READ);
    if (levels.propose !== 'none') held.add(KNOWLEDGE_PROPOSE);
    if (identity.keyScope) {
      for (const key of held)
        if (
          !levelActionsOf(key as BusinessKey).some(({ name }) =>
            identity.keyScope!.allows(businessResource('kb.knowledge'), name),
          )
        )
          held.delete(key);
    }
    if (identity.kind === 'user') return held;
    return new Set([...held].filter(grantableToAgents));
  };
}
