// Renders a v3 release's changelog entry for the website: the JSON file nocobase/website-v3 reads from
// `homepage/content/changelog/<channel>-<version>.json` to list the release on www.nocobase.com's changelog page.
//
// The notes are the release's sections of the root CHANGELOG.md, CHANGELOG.zh-CN.md and CHANGELOG.ja-JP.md, read out
// of the tagged commit with `git show` exactly as release-notes.mjs reads the English one, so an entry for any past
// release can be rendered at any later time. A language without a section is left out (the site falls back to English),
// and a release with no English section, or one whose section only says it has no user-facing changes, has no entry.
// The ` by @login` credits older sections still carry after each pull request link are dropped.
//
// `publishedAt` is when the entry was first written. Rewriting an existing file keeps its `publishedAt`, so resending a
// release whose changelog did not change leaves the file byte for byte the same and there is nothing to commit.
//
// v3-github-release.yml runs it after the GitHub Release and commits the file to website-v3's main branch.
//
// Usage:
//   node scripts/website-changelog.mjs <aggregate-tag> [--root <dir>]                  print the entry
//   node scripts/website-changelog.mjs <aggregate-tag> [--root <dir>] --out-dir <dir>  write it, print its path
//
// `--root` (default `.`) is the nocobase checkout the tag is read from. With `--out-dir`, the path of the written file
// is the only line on stdout, and stdout is empty when the release has no entry. Exits 0 when there is no entry;
// non-zero only on bad usage or when the tag cannot be read.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { parseArgs } from 'node:util';

import { CHANGELOG_FILES, EMPTY, parseTag, releaseUrl } from './changelog.mjs';
import { findReleaseSection } from './release-notes.mjs';

/** The key of each changelog language in the entry's `notes`. */
export const NOTE_LOCALES = { en: 'en', zh: 'zh-CN', ja: 'ja-JP' };

const REPO = 'nocobase/nocobase';

/**
 * The parts of an aggregate tag the entry is named and titled by.
 * @param {string} tag
 * @returns {{ channel: 'beta' | 'stable', version: string, date: string, title: string, fileName: string }}
 */
export function describeRelease(tag) {
  const parsed = parseTag(tag);
  if (!parsed) throw new Error(`Not an aggregate release tag: ${tag}`);
  const version = `${parsed.date}.${parsed.sequence}`;
  return {
    channel: parsed.channel,
    version,
    date: parsed.date,
    title:
      parsed.channel === 'beta'
        ? `NocoBase v3 Beta · ${version}`
        : `NocoBase v3 · ${version}`,
    fileName: `${parsed.channel}-${version}.json`,
  };
}

// One author credit: `@login`, `@org/app`, or the linked form `[@login](https://github.com/login)`.
const AUTHOR = String.raw`(?:@[\w.-]+(?:\/[\w.-]+)?|\[@[^\]\s]+\]\(https?:\/\/[^)\s]+\))`;
// ` by <author>[, <author>…]` at the end of a line, right after the pull request link's closing parenthesis.
const CREDITS = new RegExp(
  String.raw`\)[ \t]+by[ \t]+${AUTHOR}(?:[ \t]*(?:,|、|&|and)[ \t]*${AUTHOR})*[ \t]*$`,
  'gmu',
);

/**
 * Drops the pull request authors credited after each entry's link. Sections written before #11523 end their entries
 * with ` by @login`; the website lists changes, not who made them, so a backfilled old release reads like a new one.
 * @param {string} markdown
 * @returns {string}
 */
export function stripAuthorCredits(markdown) {
  return markdown.replace(CREDITS, ')');
}

/**
 * The notes of each language that has a section for the tag. A section that only says the release has no user-facing
 * changes counts as none.
 * @param {Partial<Record<keyof typeof CHANGELOG_FILES, string | undefined>>} changelogs the files' contents by language
 * @param {string} tag
 * @returns {Record<string, string>}
 */
export function collectNotes(changelogs, tag) {
  const notes = {};
  for (const language of Object.keys(CHANGELOG_FILES)) {
    const section = findReleaseSection(changelogs[language], tag);
    if (!section || section === EMPTY[language].trim()) continue;
    notes[NOTE_LOCALES[language]] = stripAuthorCredits(section);
  }
  return notes;
}

/**
 * The website's entry for a release, or undefined when it has no English notes.
 * @param {{ tag: string, changelogs: Partial<Record<keyof typeof CHANGELOG_FILES, string | undefined>>, publishedAt: string }} release
 */
export function buildReleaseEntry({ tag, changelogs, publishedAt }) {
  const { channel, version, date, title } = describeRelease(tag);
  const notes = collectNotes(changelogs, tag);
  if (!notes.en) return undefined;
  return {
    type: 'release',
    tag,
    channel,
    version,
    title,
    date,
    publishedAt,
    url: releaseUrl(REPO, tag),
    notes,
  };
}

/** The entry's file content: two-space JSON with a final newline. */
export function serializeEntry(entry) {
  return `${JSON.stringify(entry, null, 2)}\n`;
}

/**
 * The `publishedAt` of an existing entry file's content, or undefined when there is none to keep.
 * @param {string | undefined} content
 */
export function existingPublishedAt(content) {
  if (!content) return undefined;
  try {
    const { publishedAt } = JSON.parse(content);
    return typeof publishedAt === 'string' && publishedAt
      ? publishedAt
      : undefined;
  } catch {
    return undefined;
  }
}

/** The current time in the contract's format, `2026-11-12T08:31:00Z`. */
export function now() {
  return new Date().toISOString().replace(/\.\d{3}Z$/u, 'Z');
}

/**
 * The three root changelogs at the tagged commit, each undefined when the commit has no such file.
 * @param {string} tag
 * @param {string} cwd
 */
export function readChangelogs(tag, cwd) {
  // The aggregate tag and the release branch share a name while a release is in flight, so resolve through refs/tags/.
  const commit = execFileSync(
    'git',
    ['rev-parse', '--verify', `refs/tags/${tag}^{commit}`],
    { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
  ).trim();
  const changelogs = {};
  for (const [language, file] of Object.entries(CHANGELOG_FILES)) {
    try {
      changelogs[language] = execFileSync(
        'git',
        ['show', `${commit}:${file}`],
        {
          cwd,
          encoding: 'utf8',
          maxBuffer: 64 * 1024 * 1024,
          stdio: ['ignore', 'pipe', 'ignore'],
        },
      );
    } catch {
      changelogs[language] = undefined;
    }
  }
  return changelogs;
}

function main(argv) {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      root: { type: 'string', default: '.' },
      'out-dir': { type: 'string' },
    },
  });
  const [tag] = positionals;
  if (!tag || positionals.length > 1)
    throw new Error(
      'Usage: website-changelog.mjs <aggregate-tag> [--root <dir>] [--out-dir <dir>]',
    );
  const { fileName } = describeRelease(tag);
  const changelogs = readChangelogs(tag, path.resolve(values.root));

  const outDir = values['out-dir'];
  const file = outDir ? path.join(outDir, fileName) : undefined;
  const previous =
    file && existsSync(file) ? readFileSync(file, 'utf8') : undefined;
  const entry = buildReleaseEntry({
    tag,
    changelogs,
    publishedAt: existingPublishedAt(previous) ?? now(),
  });
  if (!entry) {
    console.error(
      `${tag} has no English changelog section; there is no website entry for it.`,
    );
    return;
  }

  const content = serializeEntry(entry);
  if (!file) {
    process.stdout.write(content);
    return;
  }
  if (content === previous) {
    console.error(`${file} is already up to date.`);
  } else {
    mkdirSync(outDir, { recursive: true });
    writeFileSync(file, content);
    console.error(`Wrote ${file}.`);
  }
  process.stdout.write(`${file}\n`);
}

const isMain = process.argv[1]?.endsWith('website-changelog.mjs');
if (isMain) {
  try {
    main(process.argv.slice(2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
