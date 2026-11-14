// Renders a v3 release's changelog entry for the website: the Markdown files nocobase/website-v3 reads from
// `homepage/content/changelog/` to list the release on www.nocobase.com's changelog page, `<channel>-<version>.md` in
// English and `<channel>-<version>.zh-CN.md` / `.ja-JP.md` beside it, named like the root changelogs. Each file has the
// entry's YAML front matter, every value a JSON-quoted string so any value is valid YAML and `date` stays a string,
// followed by the release's section in that language.
//
// The sections come from the root CHANGELOG.md, CHANGELOG.zh-CN.md and CHANGELOG.ja-JP.md, read out of the tagged commit
// with `git show` exactly as release-notes.mjs reads the English one, so an entry for any past release can be rendered
// at any later time. A language without a section has no file (the site falls back to English), and a release with no
// English section, or one whose section only says it has no user-facing changes, has no files at all. The ` by @login`
// credits older sections still carry after each pull request link are dropped.
//
// `publishedAt` is when the entry was first written. Rewriting an entry keeps the `publishedAt` of its English file, so
// resending a release whose changelog did not change leaves every file byte for byte the same and there is nothing to
// commit.
//
// v3-github-release.yml runs it after the GitHub Release and commits the files to website-v3's main branch.
//
// Usage:
//   node scripts/website-changelog.mjs <aggregate-tag> [--root <dir>]                  print the English file
//   node scripts/website-changelog.mjs <aggregate-tag> [--root <dir>] --out-dir <dir>  write the files
//
// `--root` (default `.`) is the nocobase checkout the tag is read from. With `--out-dir`, it writes the entry's files,
// removes a translation file whose language no longer has a section, and prints the path of every file it wrote,
// left unchanged or removed, one per line, so the caller can stage exactly that set; stdout is empty when the release
// has no entry. Exits 0 when there is no entry; non-zero only on bad usage or when the tag cannot be read.
import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { parseArgs } from 'node:util';

import { CHANGELOG_FILES, EMPTY, parseTag, releaseUrl } from './changelog.mjs';
import { findReleaseSection } from './release-notes.mjs';

/** The locale of each changelog language, which names its entry file and keys the entry's `notes`. */
export const NOTE_LOCALES = { en: 'en', zh: 'zh-CN', ja: 'ja-JP' };

/** The front matter fields of a release entry, in the order they are written. */
const FIELDS = [
  'type',
  'tag',
  'channel',
  'version',
  'title',
  'date',
  'publishedAt',
  'url',
];

const REPO = 'nocobase/nocobase';

/**
 * The parts of an aggregate tag the entry is named and titled by.
 * @param {string} tag
 * @returns {{ channel: 'beta' | 'stable', version: string, date: string, title: string, id: string }}
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
    id: `${parsed.channel}-${version}`,
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
 * The entry file of each locale: `<id>.md` for English, `<id>.<locale>.md` for a translation.
 * @param {string} id
 * @returns {Record<string, string>}
 */
export function entryFileNames(id) {
  return Object.fromEntries(
    Object.values(NOTE_LOCALES).map((locale) => [
      locale,
      locale === 'en' ? `${id}.md` : `${id}.${locale}.md`,
    ]),
  );
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

/**
 * The content of the entry's file in one locale: the front matter, then that locale's notes.
 * @param {NonNullable<ReturnType<typeof buildReleaseEntry>>} entry
 * @param {string} locale
 */
export function serializeEntryFile(entry, locale) {
  // A JSON string is a valid YAML double-quoted scalar, so no value can break the front matter or change type.
  const matter = FIELDS.map(
    (field) => `${field}: ${JSON.stringify(entry[field])}`,
  );
  return `---\n${matter.join('\n')}\n---\n\n${entry.notes[locale].trimEnd()}\n`;
}

/**
 * The entry's files by name, one per locale that has notes, English first.
 * @param {NonNullable<ReturnType<typeof buildReleaseEntry>>} entry
 * @returns {Record<string, string>}
 */
export function renderEntryFiles(entry) {
  const names = entryFileNames(describeRelease(entry.tag).id);
  return Object.fromEntries(
    Object.entries(names)
      .filter(([locale]) => entry.notes[locale])
      .map(([locale, name]) => [name, serializeEntryFile(entry, locale)]),
  );
}

/**
 * The `publishedAt` in an existing entry file's front matter, or undefined when there is none to keep.
 * @param {string | undefined} content
 */
export function existingPublishedAt(content) {
  const matter =
    content && /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/u.exec(content);
  if (!matter) return undefined;
  const line = /^publishedAt:[ \t]*(.+?)[ \t]*$/mu.exec(matter[1]);
  if (!line) return undefined;
  let value = line[1];
  try {
    if (value.startsWith('"')) value = JSON.parse(value);
    else if (value.startsWith("'"))
      value = value.slice(1, -1).replaceAll("''", "'");
  } catch {
    return undefined;
  }
  return typeof value === 'string' && value ? value : undefined;
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
  const names = entryFileNames(describeRelease(tag).id);
  const changelogs = readChangelogs(tag, path.resolve(values.root));

  const outDir = values['out-dir'];
  const read = (name) => {
    const file = outDir && path.join(outDir, name);
    return file && existsSync(file) ? readFileSync(file, 'utf8') : undefined;
  };
  const entry = buildReleaseEntry({
    tag,
    changelogs,
    publishedAt: existingPublishedAt(read(names.en)) ?? now(),
  });
  if (!entry) {
    console.error(
      `${tag} has no English changelog section; there is no website entry for it.`,
    );
    return;
  }

  const files = renderEntryFiles(entry);
  if (!outDir) {
    process.stdout.write(files[names.en]);
    return;
  }
  mkdirSync(outDir, { recursive: true });
  const touched = [];
  for (const name of Object.values(names)) {
    const file = path.join(outDir, name);
    const content = files[name];
    const previous = read(name);
    if (content === undefined) {
      if (previous === undefined) continue;
      rmSync(file);
      console.error(`Removed ${file}: its language has no section.`);
    } else if (content === previous) {
      console.error(`${file} is already up to date.`);
    } else {
      writeFileSync(file, content);
      console.error(`Wrote ${file}.`);
    }
    touched.push(file);
  }
  process.stdout.write(`${touched.join('\n')}\n`);
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
