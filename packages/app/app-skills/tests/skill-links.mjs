// Resolves every relative Markdown link in the published Skills, anchors included.
//
// The Skills are synchronized side by side into an application's `.agents/skills/`, so a link that leaves one Skill
// (`../nocobase-db/SKILL.md`) is resolved against the source of the Skill with that name anywhere under `packages/`.
//
// Usage: node packages/app/app-skills/tests/skill-links.mjs [file or directory …]
import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
export const skillsRoot = path.resolve(here, '../skills');
const repositoryRoot = path.resolve(here, '../../../..');
const IGNORED = new Set(['node_modules', 'dist', 'storage', 'coverage']);

export async function markdownFiles(target) {
  const info = await stat(target);
  if (info.isFile()) return target.endsWith('.md') ? [target] : [];
  const files = [];
  for (const entry of await readdir(target, { withFileTypes: true })) {
    if (IGNORED.has(entry.name)) continue;
    const full = path.join(target, entry.name);
    if (entry.isDirectory()) files.push(...(await markdownFiles(full)));
    else if (entry.isFile() && entry.name.endsWith('.md')) files.push(full);
  }
  return files;
}

/** Removes fenced and inline code, where a bracket is not a link. */
function stripCode(source) {
  return source
    .replace(/^([ \t]*)(```|~~~)[^\n]*\n[\s\S]*?\n\1\2[^\n]*$/gmu, (block) =>
      block.replace(/[^\n]/gu, ' '),
    )
    .replace(/`[^`\n]*`/gu, (code) => ' '.repeat(code.length));
}

/** GitHub's heading anchors for a document. */
export function anchorsOf(source) {
  const anchors = new Set();
  const counts = new Map();
  const text = source.replace(
    /^([ \t]*)(```|~~~)[^\n]*\n[\s\S]*?\n\1\2[^\n]*$/gmu,
    '',
  );
  for (const match of text.matchAll(/^#{1,6}\s+(.+?)\s*#*\s*$/gmu)) {
    const slug = match[1]
      .replace(/<[^>]+>/gu, '')
      .replace(/\[([^\]]*)\]\([^)]*\)/gu, '$1')
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s_-]/gu, '')
      .trim()
      .replace(/\s/gu, '-');
    const count = counts.get(slug) ?? 0;
    counts.set(slug, count + 1);
    anchors.add(count ? `${slug}-${count}` : slug);
  }
  for (const match of source.matchAll(/<a\s+(?:id|name)=["']([^"']+)["']/gu))
    anchors.add(match[1]);
  return anchors;
}

let skillSources;
async function skillSource(name) {
  if (!skillSources) {
    skillSources = new Map();
    for (const group of await readdir(path.join(repositoryRoot, 'packages'), {
      withFileTypes: true,
    })) {
      if (!group.isDirectory()) continue;
      const groupDir = path.join(repositoryRoot, 'packages', group.name);
      for (const pkg of await readdir(groupDir, { withFileTypes: true })) {
        if (!pkg.isDirectory()) continue;
        const skills = path.join(groupDir, pkg.name, 'skills');
        const entries = await readdir(skills, { withFileTypes: true }).catch(
          () => [],
        );
        for (const entry of entries)
          if (entry.isDirectory())
            skillSources.set(entry.name, path.join(skills, entry.name));
      }
    }
  }
  return skillSources.get(name);
}

async function exists(file) {
  return stat(file).then(
    () => true,
    () => false,
  );
}

/** The file a link points to on disk, following a link into a sibling Skill to that Skill's source. */
async function resolveTarget(from, target) {
  const direct = path.resolve(path.dirname(from), target);
  if (await exists(direct)) return direct;
  // `<skills dir>/<skill name>/…` where the sibling Skill is published by another package.
  const skillsDirs = [path.dirname(skillsRoot), ...(await siblingSkillsDirs())];
  for (const dir of skillsDirs) {
    const relative = path.relative(path.join(dir, 'skills'), direct);
    if (relative.startsWith('..') || path.isAbsolute(relative)) continue;
    const [name, ...rest] = relative.split(path.sep);
    const source = await skillSource(name);
    if (source && (await exists(path.join(source, ...rest))))
      return path.join(source, ...rest);
  }
  return undefined;
}

async function siblingSkillsDirs() {
  await skillSource('');
  return [
    ...new Set(
      [...skillSources.values()].map((dir) => path.dirname(path.dirname(dir))),
    ),
  ];
}

const anchorCache = new Map();
async function anchorsOfFile(file) {
  if (!anchorCache.has(file))
    anchorCache.set(file, anchorsOf(await readFile(file, 'utf8')));
  return anchorCache.get(file);
}

export async function checkLinks(files) {
  const problems = [];
  for (const file of files) {
    const source = await readFile(file, 'utf8');
    const stripped = stripCode(source);
    for (const match of stripped.matchAll(/\]\(([^)\s]+)(?:\s+"[^"]*")?\)/gu)) {
      const raw = match[1].replace(/^<|>$/gu, '');
      if (/^[a-z][a-z0-9+.-]*:/iu.test(raw)) continue;
      const line = stripped.slice(0, match.index).split('\n').length;
      const where = `${path.relative(repositoryRoot, file)}:${line}`;
      const [target, anchor] = decodeURIComponent(raw).split('#');
      let resolved = file;
      if (target) {
        resolved = await resolveTarget(file, target);
        if (!resolved) {
          problems.push(`${where} links to missing ${raw}`);
          continue;
        }
      }
      if (anchor && resolved.endsWith('.md')) {
        const anchors = await anchorsOfFile(resolved);
        if (!anchors.has(anchor))
          problems.push(`${where} links to missing anchor ${raw}`);
      }
    }
  }
  return problems;
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const targets = process.argv.slice(2);
  const files = [];
  for (const target of targets.length ? targets : [skillsRoot])
    files.push(...(await markdownFiles(path.resolve(target))));
  const problems = await checkLinks(files);
  for (const problem of problems) console.error(problem);
  console.log(`${files.length} files, ${problems.length} broken links`);
  process.exitCode = problems.length ? 1 : 0;
}
