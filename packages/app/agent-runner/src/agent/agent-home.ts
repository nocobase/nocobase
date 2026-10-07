// The home directory an agent's tool runs with.
//
// By default (`agentHome: isolated`) each workspace has its own, `<workDir>/.nocobase-runner/home`, so the agent's `~`
// is inside its working directory and the runner's own directory (`~/.nocobase-runner`, with its keys) is not under it.
// The tools still need their own login and settings, which live in the real home, so the isolated home holds symbolic
// links to exactly those, and to the configuration git and the package managers read:
//
// - Claude Code: `~/.claude` and `~/.claude.json` (settings, sessions, and the login on Linux); on macOS the login is
//   in the login keychain, found through `~/Library/Keychains` and `~/Library/Preferences`.
// - Codex: `~/.codex` (`auth.json`, `config.toml`, sessions).
// - OpenCode: `~/.local/share/opencode` (`auth.json`), `~/.config/opencode`, `~/.local/state/opencode`.
// - Pi: `~/.pi`.
// - Everyone: git's and the package managers' configuration and caches (`.gitconfig`, `.npmrc`, `.npm`, `.cache`,
//   the pnpm store) and `.ssh`.
//
// The links are not a boundary: the tool follows them as it needs to. The runner's policy resolves links, so an
// explicit path through one is refused like any other path outside the working directory. A tool whose login does not
// survive the isolated home runs with `agentHome: real` (`nocobase-runner start --agent-home real`), which gives it the
// real home; then only the policy keeps the agent away from `~/.nocobase-runner`.
import { existsSync, lstatSync } from 'node:fs';
import { mkdir, symlink } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import type { AgentTool } from '../protocol/index.ts';

export const COMMON_HOME_LINKS: readonly string[] = [
  '.gitconfig',
  '.config/git',
  '.gitignore_global',
  '.ssh',
  '.gnupg',
  '.npmrc',
  '.npm',
  '.yarnrc',
  '.yarnrc.yml',
  '.cache',
  '.local/share/pnpm',
  'Library/pnpm',
  'Library/Caches',
];

export const TOOL_HOME_LINKS: Readonly<Record<AgentTool, readonly string[]>> = {
  claude: [
    '.claude',
    '.claude.json',
    'Library/Keychains',
    'Library/Preferences',
  ],
  codex: ['.codex'],
  opencode: [
    '.local/share/opencode',
    '.config/opencode',
    '.local/state/opencode',
  ],
  pi: ['.pi'],
};

/** Creates `<agentHome>` with links to what `tool` needs from `realHome`. Returns the home. */
export async function prepareAgentHome(
  agentHome: string,
  tool: AgentTool,
  realHome: string = os.homedir(),
): Promise<string> {
  await mkdir(agentHome, { recursive: true, mode: 0o700 });
  for (const entry of [...COMMON_HOME_LINKS, ...TOOL_HOME_LINKS[tool]]) {
    const source = path.join(realHome, entry);
    const target = path.join(agentHome, entry);
    if (!existsSync(source)) continue;
    try {
      lstatSync(target);
      continue;
    } catch {
      // Not there yet.
    }
    await mkdir(path.dirname(target), { recursive: true, mode: 0o700 });
    await symlink(source, target);
  }
  return agentHome;
}
