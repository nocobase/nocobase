/**
 * The `nb-studio-cli` Skill (how to find and call `nb-studio`'s commands, and what only the web page does), given to online
 * runs: mounted at `/skills/nb-studio-cli` in their shell. Studio owns it at `ai/skills/nb-studio-cli/SKILL.md`, which the build
 * copies to `dist/ai/skills`; the packaged `nb-studio` ships it to runners too (`nocobase.cli.skills` in `package.json`,
 * packed by `pnpm nocobase cli build`).
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';

import type { Agents } from '@nocobase/app-plugin-agents/server/tokens';

const DESCRIPTION = /^description:\s*(.*)$/mu;

/** `server/agents/` and `dist/server/agents/` are both two levels below the application root. */
export const CLI_SKILL_FILE: string = path.resolve(
  import.meta.dirname,
  '..',
  '..',
  'ai',
  'skills',
  'nb-studio-cli',
  'SKILL.md',
);

/** The skill's `SKILL.md`, or null when the file is missing. */
export function readCliSkill(): string | null {
  try {
    return readFileSync(CLI_SKILL_FILE, 'utf8');
  } catch {
    return null;
  }
}

/** Gives online runs the `nb-studio-cli` Skill; the release takes it back. */
export function registerCliSkill(
  agents: Pick<Agents, 'online'>,
  markdown: string | null = readCliSkill(),
): () => void {
  if (!markdown) return () => undefined;
  return agents.online.skills.register({
    slug: 'nb-studio-cli',
    name: 'nb-studio-cli',
    hash: 'built-in',
    description: (
      DESCRIPTION.exec(markdown)?.[1] ?? 'Using the nb-studio CLI.'
    ).trim(),
    markdown,
    files: [],
  });
}
