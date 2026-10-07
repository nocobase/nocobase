/**
 * What a runner receives of a skill: its directory in the open Agent Skills format. `SKILL.md` is delivered as written,
 * its front matter's `name` being the slug (which Codex and OpenCode require to match the directory). A version saved
 * before front matter named skills gets `name` and `description` written into it, other keys kept.
 */
import type { SkillBundle, SkillFile } from '@nocobase/agent-protocol';
import { createHash } from 'node:crypto';

import { parseSkillMarkdown } from '../../../shared/skills.js';

const FRONT_MATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/u;

/** `SKILL.md` as delivered: as written when its front matter is valid and names `slug`, else `skillMarkdown`. */
export function deliveredMarkdown(
  slug: string,
  description: string,
  content: string,
): string {
  const parsed = parseSkillMarkdown(content);
  return parsed.problems.length === 0 && parsed.frontMatter.name === slug
    ? content
    : skillMarkdown(slug, description, content);
}

/** `SKILL.md` with `name` and `description` set in its front matter. */
export function skillMarkdown(
  slug: string,
  description: string,
  content: string,
): string {
  const match = FRONT_MATTER.exec(content);
  const kept: string[] = [];
  if (match) {
    let dropping = false;
    for (const line of (match[1] ?? '').split(/\r?\n/u)) {
      if (/^(name|description)\s*:/u.test(line)) {
        dropping = true;
        continue;
      }
      // The continuation lines of a dropped multi-line value.
      if (dropping && /^\s+\S/u.test(line)) continue;
      dropping = false;
      kept.push(line);
    }
  }
  const body = match ? content.slice(match[0].length) : content;
  const header = [
    '---',
    `name: ${slug}`,
    `description: ${JSON.stringify(description.replace(/\s+/gu, ' ').trim())}`,
    ...kept.filter((line) => line.trim() !== ''),
    '---',
  ].join('\n');
  return `${header}\n\n${body.replace(/^\s+/u, '')}`;
}

/** A file of a version, as its manifest lists it (`agSkillVersions.manifest`); its bytes are the blob `blobHash`. */
export interface ManifestEntry {
  readonly path: string;
  readonly blobHash: string;
  readonly size: number;
  readonly executable: boolean;
  readonly text: boolean;
}

/**
 * A version's hash: what a runner caches its copy by. It covers `SKILL.md` as the runner receives it and every file's
 * path, content (by hash) and executable bit, so it changes whenever any of them does.
 */
export function versionHash(
  markdown: string,
  manifest: readonly ManifestEntry[],
): string {
  return createHash('sha256')
    .update(
      JSON.stringify([
        markdown,
        [...manifest]
          .sort((a, b) => a.path.localeCompare(b.path))
          .map((entry) => [entry.path, entry.blobHash, entry.executable]),
      ]),
    )
    .digest('hex');
}

/** The files a runner writes into the skill's directory, `SKILL.md` first; binary files in base64. */
export async function bundleFiles(
  markdown: string,
  manifest: readonly ManifestEntry[],
  read: (hash: string) => Promise<Uint8Array>,
): Promise<SkillFile[]> {
  const files: SkillFile[] = [{ path: 'SKILL.md', content: markdown }];
  for (const entry of [...manifest].sort((a, b) =>
    a.path.localeCompare(b.path),
  )) {
    const bytes = Buffer.from(await read(entry.blobHash));
    files.push({
      path: entry.path,
      ...(entry.text
        ? { content: bytes.toString('utf8') }
        : { content: bytes.toString('base64'), encoding: 'base64' as const }),
      ...(entry.executable ? { executable: true } : {}),
    });
  }
  return files;
}

export function toBundle(
  slug: string,
  version: number,
  hash: string,
  files: readonly SkillFile[],
): SkillBundle {
  return { slug, version: String(version), hash, files };
}
