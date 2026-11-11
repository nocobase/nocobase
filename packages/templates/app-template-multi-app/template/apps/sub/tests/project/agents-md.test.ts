import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const appRoot = path.resolve(
  fileURLToPath(new URL('.', import.meta.url)),
  '../..',
);

/**
 * Every agent loads `AGENTS.md` on every start, so its size is a cost paid on every task. It used to grow with each
 * change that documented itself there; the detail now lives in `.agents/rules/` and is read on demand through links.
 */
const AGENTS_MD_LIMIT_BYTES = 32 * 1024;

const rulesDirectory = path.join(appRoot, '.agents', 'rules');
const skillsDirectory = path.join(appRoot, '.agents', 'skills');

function listMarkdownFiles(directory: string): string[] {
  if (!existsSync(directory)) {
    return [];
  }
  return readdirSync(directory).flatMap((entry) => {
    const entryPath = path.join(directory, entry);
    if (statSync(entryPath).isDirectory()) {
      return listMarkdownFiles(entryPath);
    }
    return entry.endsWith('.md') ? [entryPath] : [];
  });
}

/** Relative link targets of a Markdown file, leaving out fenced code blocks and inline code spans. */
function readRelativeLinks(file: string): string[] {
  const prose = readFileSync(file, 'utf8')
    .replace(/^(```|~~~)[^\n]*\n[\s\S]*?^\1[^\n]*$/gmu, '')
    .replace(/`[^`\n]*`/gu, '');
  const targets: string[] = [];
  for (const match of prose.matchAll(/\]\(([^)\s]+)(?:\s+"[^"]*")?\)/gu)) {
    const target = match[1] ?? '';
    if (
      target === '' ||
      target.startsWith('#') ||
      /^[a-z][a-z0-9+.-]*:/iu.test(target)
    ) {
      continue;
    }
    targets.push(target.replace(/[#?].*$/u, ''));
  }
  return targets;
}

function isInside(parent: string, child: string): boolean {
  const relative = path.relative(parent, child);
  return (
    relative === '' ||
    (!relative.startsWith('..') && !path.isAbsolute(relative))
  );
}

const agentsMd = path.join(appRoot, 'AGENTS.md');
const documents = [agentsMd, ...listMarkdownFiles(rulesDirectory)];

describe('AGENTS.md', () => {
  it('stays within the size every agent can afford to load on start', () => {
    const size = statSync(agentsMd).size;
    expect(
      size,
      `AGENTS.md is ${size} bytes, over the ${AGENTS_MD_LIMIT_BYTES}-byte limit. Move the detail into .agents/rules/<topic>.md and link it from the index in AGENTS.md; keep only the rules that apply everywhere in AGENTS.md itself.`,
    ).toBeLessThanOrEqual(AGENTS_MD_LIMIT_BYTES);
  });

  it('links every file in .agents/rules/ from its index', () => {
    const linked = new Set(
      readRelativeLinks(agentsMd).map((target) =>
        path.resolve(appRoot, target),
      ),
    );
    const unlinked = listMarkdownFiles(rulesDirectory)
      .filter((file) => !linked.has(file))
      .map((file) => path.relative(appRoot, file));
    expect(
      unlinked,
      'Add each rules file to the index in AGENTS.md, saying when to read it, or an agent will never find it.',
    ).toEqual([]);
  });

  it('has no broken links in AGENTS.md or .agents/rules/', () => {
    // `.agents/skills/` is written by `pnpm nocobase skills sync` during install, so its links can only be checked once
    // it exists; every other target is a committed file of this application.
    const checkSkills = existsSync(skillsDirectory);
    const broken = documents.flatMap((file) =>
      readRelativeLinks(file)
        .map((target) => path.resolve(path.dirname(file), target))
        .filter(
          (resolved) => checkSkills || !isInside(skillsDirectory, resolved),
        )
        .filter((resolved) => !existsSync(resolved))
        .map(
          (resolved) =>
            `${path.relative(appRoot, file)} -> ${path.relative(appRoot, resolved)}`,
        ),
    );
    expect(broken).toEqual([]);
  });
});
