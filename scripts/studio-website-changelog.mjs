// Renders a NocoBase Studio release's changelog entry for the website: the Markdown files nocobase/website-v3 reads from
// `homepage/content/changelog/` to list the release on www.nocobase.com's changelog page, in the same timeline as the
// NocoBase 3 releases (scripts/website-changelog.mjs). The entry is `studio-<version>.md` in English with
// `studio-<version>.zh-CN.md` / `.ja-JP.md` beside it, each the entry's YAML front matter (every value a JSON-quoted
// string) followed by the release's notes in that language.
//
// The notes are the `release-notes.website.<locale>.md` files Studio's own scripts/release/release-notes.mjs writes
// into its `--out-dir`: every change of the release across Studio CE, Studio and Studio EE, without pull request links
// (nocobase/studio is private) or authors, each paid-only module marked `{{edition:professional}}` or
// `{{edition:enterprise}}`, which the website renders as an edition badge. Studio writes them only for a release with
// changes, so a release without the English file has no entry; a language without its file has no file (the site falls
// back to English). The entry has no `url`, because the GitHub release is private too.
//
// The channel follows the version: a prerelease (`1.0.0-beta.90`) is `beta`, any other version `stable`. `date` is
// `--date`, else the existing entry's, else today in UTC; `publishedAt` is the existing entry's, else `--published-at`,
// else now. Rewriting an entry therefore keeps both, so resending a release whose notes did not change leaves every
// file byte for byte the same and there is nothing to commit; `--date` and `--published-at` are for a backfill.
//
// v3-studio-release.yml runs it after the release notes are written and commits the files to website-v3's main branch.
//
// Usage:
//   node scripts/studio-website-changelog.mjs --version <version> --notes-dir <dir> [--out-dir <dir>]
//     [--date YYYY-MM-DD] [--published-at YYYY-MM-DDTHH:MM:SSZ]
//
// Without `--out-dir` it prints the English file. With it, it writes the entry's files, removes a translation file whose
// language no longer has notes, and prints the path of every file it wrote, left unchanged or removed, one per line, so
// the caller can stage exactly that set; stdout is empty when the release has no entry. Exits 0 when there is no entry;
// non-zero only on bad usage.
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

/** The locales of an entry, English first; each names its notes file and its entry file. */
export const LOCALES = ['en', 'zh-CN', 'ja-JP'];

/** The front matter fields of a Studio release entry, in the order they are written. */
const FIELDS = [
  'type',
  'product',
  'tag',
  'channel',
  'version',
  'title',
  'date',
  'publishedAt',
];

const VERSION = /^\d+\.\d+\.\d+(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/u;
const DATE = /^\d{4}-\d{2}-\d{2}$/u;
const TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/u;

/**
 * The parts of a Studio version the entry is named and titled by.
 * @param {string} version without the leading `v`, like a Docker tag
 * @returns {{ id: string, tag: string, channel: 'beta' | 'stable', title: string }}
 */
export function describeRelease(version) {
  const match = VERSION.exec(version ?? '');
  if (!match) throw new Error(`Not a Studio version: ${version}`);
  return {
    id: `studio-${version}`,
    tag: `v${version}`,
    channel: match[1] ? 'beta' : 'stable',
    title: `NocoBase Studio · v${version}`,
  };
}

/**
 * The entry file of each locale: `<id>.md` for English, `<id>.<locale>.md` for a translation.
 * @param {string} id
 * @returns {Record<string, string>}
 */
export function entryFileNames(id) {
  return Object.fromEntries(
    LOCALES.map((locale) => [
      locale,
      locale === 'en' ? `${id}.md` : `${id}.${locale}.md`,
    ]),
  );
}

/**
 * The website notes Studio wrote for each locale, trimmed; a locale whose file is missing or blank is left out.
 * @param {string} notesDir
 * @returns {Record<string, string>}
 */
export function readNotes(notesDir) {
  const notes = {};
  for (const locale of LOCALES) {
    const file = path.join(notesDir, `release-notes.website.${locale}.md`);
    const text = existsSync(file) ? readFileSync(file, 'utf8').trim() : '';
    if (text) notes[locale] = text;
  }
  return notes;
}

/**
 * The website's entry for a Studio release, or undefined when it has no English notes.
 * @param {{ version: string, notes: Record<string, string>, date: string, publishedAt: string }} release
 */
export function buildReleaseEntry({ version, notes, date, publishedAt }) {
  if (!notes.en) return undefined;
  if (!DATE.test(date)) throw new Error(`Not a YYYY-MM-DD date: ${date}`);
  if (!TIMESTAMP.test(publishedAt))
    throw new Error(`Not a YYYY-MM-DDTHH:MM:SSZ time: ${publishedAt}`);
  const { id, tag, channel, title } = describeRelease(version);
  return {
    id,
    type: 'release',
    product: 'studio',
    tag,
    channel,
    version,
    title,
    date,
    publishedAt,
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
  const names = entryFileNames(entry.id);
  return Object.fromEntries(
    LOCALES.filter((locale) => entry.notes[locale]).map((locale) => [
      names[locale],
      serializeEntryFile(entry, locale),
    ]),
  );
}

/**
 * A string field of an existing entry file's front matter, or undefined when there is none to keep.
 * @param {string | undefined} content
 * @param {string} field
 */
export function existingField(content, field) {
  const matter =
    content && /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/u.exec(content);
  if (!matter) return undefined;
  const line = new RegExp(`^${field}:[ \\t]*(.+?)[ \\t]*$`, 'mu').exec(
    matter[1],
  );
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

/** The current time in the entry's format, `2026-11-23T08:31:00Z`. */
export function now() {
  return new Date().toISOString().replace(/\.\d{3}Z$/u, 'Z');
}

function main(argv) {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      version: { type: 'string' },
      'notes-dir': { type: 'string' },
      'out-dir': { type: 'string' },
      date: { type: 'string' },
      'published-at': { type: 'string' },
    },
  });
  if (positionals.length || !values.version || !values['notes-dir'])
    throw new Error(
      'Usage: studio-website-changelog.mjs --version <version> --notes-dir <dir> [--out-dir <dir>] [--date YYYY-MM-DD] [--published-at YYYY-MM-DDTHH:MM:SSZ]',
    );
  const { version } = values;
  const names = entryFileNames(describeRelease(version).id);
  const outDir = values['out-dir'];
  const read = (name) => {
    const file = outDir && path.join(outDir, name);
    return file && existsSync(file) ? readFileSync(file, 'utf8') : undefined;
  };
  const existing = read(names.en);
  const time = now();
  const entry = buildReleaseEntry({
    version,
    notes: readNotes(values['notes-dir']),
    date: values.date ?? existingField(existing, 'date') ?? time.slice(0, 10),
    publishedAt:
      existingField(existing, 'publishedAt') ?? values['published-at'] ?? time,
  });
  if (!entry) {
    console.error(
      `Studio v${version} has no English website notes; there is no website entry for it.`,
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
      console.error(`Removed ${file}: its language has no notes.`);
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

const isMain = process.argv[1]?.endsWith('studio-website-changelog.mjs');
if (isMain) {
  try {
    main(process.argv.slice(2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
