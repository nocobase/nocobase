// Writes a v3 release's section of the root CHANGELOG.md and CHANGELOG.zh-CN.md from the descriptions of the pull
// requests it contains: the type checked in each PR template, the module named by the title's scope
// (`changelog-scopes.json`) and the English and Chinese changelog sentences, rendered like nocobase v2's and Studio's
// release notes. The release workflows run it while preparing the release commit, so the section is committed with the
// versions; v3-github-release.yml later reads the English section back out of the tagged commit for the GitHub Release.
// Everything that decides what the section says is an exported pure function, so tests need neither git nor gh.
//
// Which pull requests a release contains:
//   - beta (`nocobase-v3-beta/<batch>`, or legacy `release-beta/<batch>`): changes since the previous beta. Release
//     commits never reach v3-develop (their pull request is squashed), so the range starts at the merge base of the previous
//     beta tag and the release source rather than at the tag itself.
//   - stable (`release/<batch>`): those merged into the release source since the previous stable release in the same
//     way, which covers direct patches, plus every pull request the betas listed in CHANGELOG.md that no stable section
//     lists yet. A promotion reaches v3-main as one squashed commit, so the betas' sections, carried along with it, are
//     what records which pull requests it brings.
//
// Usage:
//   node scripts/changelog.mjs --tag <aggregate tag> --repo nocobase/nocobase [--root <dir>] [--head <ref>]
//     [--from <ref>] [--out-dir <dir>]
//
// `--root` (default `.`) is the checkout whose changelogs are written; `--head` (default HEAD) ends the range and
// `--from` overrides where it starts. The tag need not exist yet. With `--out-dir` it also writes
// `release-notes.en.md`, `release-notes.zh-CN.md` and `missing.json` there. Exits 0 once the changelogs are written,
// even when pull requests are missing from them; non-zero only on bad usage or a git/gh failure.
import { execFile, execFileSync } from 'node:child_process';
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { parseArgs } from 'node:util';

import { moduleOf, parsePullRequest } from './pr-body.mjs';

/** Section titles of the PR types that reach the changelog, in order. `Others` never does. */
export const TYPE_TITLES = {
  'New feature': { en: '🎉 New Features', zh: '🎉 新特性' },
  Improvement: { en: '🚀 Improvements', zh: '🚀 优化' },
  'Bug fix': { en: '🐛 Bug Fixes', zh: '🐛 修复' },
};

const EMPTY = { en: 'No user-facing changes.', zh: '没有面向用户的变更。' };

export const CHANGELOG_FILES = { en: 'CHANGELOG.md', zh: 'CHANGELOG.zh-CN.md' };

export const CHANGELOG_HEADERS = {
  en: `# Changelog

All notable changes to NocoBase 3 are documented in this file, one section per release: \`nocobase-v3-beta/<date>.<n>\` for a beta and \`release/<date>.<n>\` for a stable release. The versions each release published are on its GitHub Release, and every package's own changes are in its CHANGELOG.md.
`,
  zh: `# 更新日志

本文件记录 NocoBase 3 的所有重要变更，每次发布一节：\`nocobase-v3-beta/<日期>.<序号>\` 是预览版，\`release/<日期>.<序号>\` 是正式版。每次发布的包版本见对应的 GitHub Release，各个包自己的变更见包内的 CHANGELOG.md。
`,
};

const AGGREGATE =
  /^(nocobase-v3-beta|release(?:-beta)?)\/(\d{4}-\d{2}-\d{2})\.(\d+)$/u;

/**
 * Parses an aggregate release tag.
 * @param {string} tag
 * @returns {{ prefix: string, channel: 'beta' | 'stable', date: string, sequence: number } | null}
 */
export function parseTag(tag) {
  const match = AGGREGATE.exec(tag);
  if (!match) return null;
  return {
    prefix: match[1],
    channel: match[1] === 'release' ? 'stable' : 'beta',
    date: match[2],
    sequence: Number(match[3]),
  };
}

/**
 * The previous release of `tag` in its channel: the latest tag among `tags` in the same channel whose batch comes
 * before `tag`'s. `tag` itself need not be among them.
 * @param {string[]} tags
 * @param {string} tag
 * @returns {string | null}
 */
export function selectPreviousTag(tags, tag) {
  const current = parseTag(tag);
  if (!current) return null;
  const before = (a, b) =>
    a.date === b.date ? a.sequence < b.sequence : a.date < b.date;
  let best = null;
  let bestParsed = null;
  for (const candidate of tags) {
    const parsed = parseTag(candidate);
    if (!parsed || parsed.channel !== current.channel) continue;
    if (!before(parsed, current)) continue;
    if (!bestParsed || before(bestParsed, parsed)) {
      best = candidate;
      bestParsed = parsed;
    }
  }
  return best;
}

/**
 * The pull request numbers named by commit subjects, `(#N)` of a squash merge and `Merge pull request #N` of a merge
 * commit, in first-seen order without duplicates.
 * @param {string[]} subjects
 * @returns {number[]}
 */
export function extractPullRequestNumbers(subjects) {
  const numbers = new Set();
  for (const subject of subjects) {
    for (const match of subject.matchAll(
      /\(#(\d+)\)|^Merge pull request #(\d+)\b/gu,
    )) {
      numbers.add(Number(match[1] ?? match[2]));
    }
  }
  return [...numbers];
}

/**
 * Whether a PR was opened by a release workflow, whose head branch carries version bumps and changelogs only.
 * @param {{ headRefName?: string }} pullRequest
 * @returns {boolean}
 */
export function isReleasePullRequest(pullRequest) {
  return /^(?:release(?:-beta)?\/|chore\/promote-|chore\/sync-)/u.test(
    pullRequest.headRefName ?? '',
  );
}

/**
 * The link to a release's GitHub Release page.
 * @param {string} repo
 * @param {string} tag
 * @returns {string}
 */
export function releaseUrl(repo, tag) {
  return `https://github.com/${repo}/releases/tag/${encodeURIComponent(tag)}`;
}

/**
 * The release sections of a changelog with the pull requests each one links, in file order.
 * @param {string} content
 * @returns {{ tag: string, pullRequests: number[] }[]}
 */
export function parseChangelogSections(content) {
  const sections = [];
  let current = null;
  for (const line of content.replace(/\r\n?/gu, '\n').split('\n')) {
    const heading = /^## \[([^\]]+)\]/u.exec(line);
    if (heading) {
      current = { tag: heading[1], pullRequests: [] };
      sections.push(current);
      continue;
    }
    if (/^## /u.test(line)) {
      current = null;
      continue;
    }
    if (!current) continue;
    for (const match of line.matchAll(
      /\[#(\d+)\]\(https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/pull\/\d+\)/gu,
    )) {
      const number = Number(match[1]);
      if (!current.pullRequests.includes(number))
        current.pullRequests.push(number);
    }
  }
  return sections;
}

/**
 * The pull requests the beta sections of a changelog list that no stable section lists yet, in file order.
 * @param {string | null} content
 * @returns {number[]}
 */
export function pendingBetaPullRequests(content) {
  if (!content) return [];
  const sections = parseChangelogSections(content);
  const released = new Set(
    sections
      .filter((section) => parseTag(section.tag)?.channel === 'stable')
      .flatMap((section) => section.pullRequests),
  );
  const pending = new Set();
  for (const section of sections) {
    if (parseTag(section.tag)?.channel !== 'beta') continue;
    for (const number of section.pullRequests) {
      if (!released.has(number)) pending.add(number);
    }
  }
  return [...pending];
}

/**
 * @typedef {{ number: number, title: string, body?: string | null, url: string, author?: { login?: string } | null,
 *   headRefName?: string }} PullRequest
 * @typedef {{ number: number, url: string, author: string, type: string, module: { en: string, zh: string },
 *   changelog: { en: string, zh: string } }} Entry
 * @typedef {{ number: number, title: string, url: string, reason: string }} Missing
 */

/**
 * Sorts pull requests into changelog entries and the ones whose description could not be used. Release PRs and
 * `Others` PRs are skipped.
 * @param {PullRequest[]} pullRequests
 * @param {Record<string, { en: string, zh: string }>} [scopeMap]
 * @returns {{ entries: Entry[], missing: Missing[] }}
 */
export function collectEntries(pullRequests, scopeMap) {
  const entries = [];
  const missing = [];
  for (const pullRequest of [...pullRequests].sort(
    (a, b) => a.number - b.number,
  )) {
    if (isReleasePullRequest(pullRequest)) continue;
    const { number, title, url } = pullRequest;
    const parsed = parsePullRequest(
      { title, body: pullRequest.body ?? '' },
      scopeMap ? { scopes: scopeMap } : {},
    );
    if (!parsed.type || parsed.errors.length) {
      missing.push({
        number,
        title,
        url,
        reason: parsed.errors.join(' ') || 'No type is checked.',
      });
      continue;
    }
    if (parsed.type === 'Others') continue;
    entries.push({
      number,
      url,
      author: pullRequest.author?.login ?? 'ghost',
      type: parsed.type,
      module: moduleOf(parsed.scope, scopeMap),
      changelog: parsed.changelog,
    });
  }
  return { entries, missing };
}

/**
 * Renders a release's changelog in one language, without its heading: a section per type, a bullet per module (its
 * entries nested when there are several), as nocobase v2's changelog does.
 * @param {{ entries: Entry[] }} collected
 * @param {'en' | 'zh'} language
 * @returns {string}
 */
export function renderNotes({ entries }, language) {
  const blocks = [];
  for (const [type, titles] of Object.entries(TYPE_TITLES)) {
    const modules = new Map();
    for (const entry of entries.filter(
      (candidate) => candidate.type === type,
    )) {
      const name = entry.module[language];
      if (!modules.has(name)) modules.set(name, []);
      modules
        .get(name)
        .push(
          `${entry.changelog[language]} ([#${entry.number}](${entry.url})) by @${entry.author}`,
        );
    }
    if (!modules.size) continue;
    const lines = [];
    for (const [name, items] of modules) {
      if (items.length === 1) lines.push(`- **[${name}]** ${items[0]}`);
      else lines.push(`- **[${name}]**`, ...items.map((item) => `  - ${item}`));
    }
    blocks.push(`### ${titles[language]}\n\n${lines.join('\n')}`);
  }
  return `${blocks.length ? blocks.join('\n\n') : EMPTY[language]}\n`;
}

/**
 * Prepends a release section to a changelog's content, creating the file's header when there is no content yet. New
 * sections go before the first `## ` heading, so whatever header the file already has stays on top.
 * @param {string | null} content the current file, or `null` when it does not exist
 * @param {{ tag: string, repo: string, notes: string, language: 'en' | 'zh' }} release
 * @returns {string | null} the new content, or `null` when the tag is already present
 */
export function prependChangelog(content, { tag, repo, notes, language }) {
  const existing = content ?? CHANGELOG_HEADERS[language];
  if (parseChangelogSections(existing).some((section) => section.tag === tag))
    return null;
  const section = `## [${tag}](${releaseUrl(repo, tag)})\n\n${notes.trimEnd()}\n\n`;
  const first = /^## /mu.exec(existing);
  if (first)
    return `${existing.slice(0, first.index)}${section}${existing.slice(first.index)}`;
  return `${existing.trimEnd()}\n\n${section.trimEnd()}\n`;
}

/**
 * Reads a release's section back out of a changelog, without its heading.
 * @param {string} content
 * @param {string} tag
 * @returns {string | undefined}
 */
export function extractReleaseSection(content, tag) {
  const lines = content.replace(/\r\n?/gu, '\n').split('\n');
  const start = lines.findIndex((line) => line.startsWith(`## [${tag}]`));
  if (start === -1) return undefined;
  let end = lines.length;
  for (let index = start + 1; index < lines.length; index += 1) {
    if (/^## /u.test(lines[index])) {
      end = index;
      break;
    }
  }
  return (
    lines
      .slice(start + 1, end)
      .join('\n')
      .trim() || undefined
  );
}

// --- Command line ---------------------------------------------------------------------------------------------------

const execFileAsync = promisify(execFile);

function git(args, cwd) {
  return execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

async function viewPullRequest(number, repo) {
  const args = [
    'pr',
    'view',
    String(number),
    '--repo',
    repo,
    '--json',
    'number,title,body,author,url,headRefName',
  ];
  for (let attempt = 1; ; attempt += 1) {
    try {
      const { stdout } = await execFileAsync('gh', args, {
        encoding: 'utf8',
        maxBuffer: 16 * 1024 * 1024,
      });
      return JSON.parse(stdout);
    } catch (error) {
      if (attempt >= 3)
        throw new Error(
          `gh pr view ${number} failed: ${error.stderr || error.message}`.trim(),
          { cause: error },
        );
    }
  }
}

/** Reads the pull requests a few at a time, keeping their order. */
async function viewPullRequests(numbers, repo) {
  const results = new Array(numbers.length);
  let next = 0;
  const worker = async () => {
    while (next < numbers.length) {
      const index = next;
      next += 1;
      results[index] = await viewPullRequest(numbers[index], repo);
    }
  };
  await Promise.all(Array.from({ length: 6 }, worker));
  return results;
}

class UsageError extends Error {}

function options(argv) {
  const { values } = parseArgs({
    args: argv,
    options: {
      tag: { type: 'string' },
      repo: { type: 'string' },
      root: { type: 'string', default: '.' },
      head: { type: 'string', default: 'HEAD' },
      from: { type: 'string' },
      'out-dir': { type: 'string' },
    },
  });
  for (const name of ['tag', 'repo']) {
    if (!values[name]) throw new UsageError(`--${name} is required.`);
  }
  if (!parseTag(values.tag))
    throw new UsageError(
      '--tag must be nocobase-v3-beta/<date>.<n>, release-beta/<date>.<n> or release/<date>.<n>.',
    );
  if (!/^[\w.-]+\/[\w.-]+$/u.test(values.repo))
    throw new UsageError('--repo must be owner/name.');
  return values;
}

function summary({ tag, from, collected, carried }) {
  const lines = [
    `### Changelog for \`${tag}\``,
    '',
    `${collected.entries.length} entries${from ? ` since \`${from}\`` : ''}${carried ? `, ${carried} pull requests carried from the betas` : ''}.`,
  ];
  if (collected.missing.length) {
    lines.push(
      '',
      'These pull requests are missing because their description does not follow the PR template:',
      '',
    );
    for (const { number, title, url } of collected.missing)
      lines.push(`- [#${number}](${url}) ${title}`);
  }
  return `${lines.join('\n')}\n`;
}

async function main(argv) {
  const values = options(argv);
  const { tag, repo } = values;
  const root = path.resolve(values.root);
  const channel = parseTag(tag).channel;
  const head = git(
    ['rev-parse', '--verify', `${values.head}^{commit}`],
    root,
  ).trim();

  let from = values.from ?? null;
  if (!from) {
    const tags = git(
      ['tag', '--list', 'release/*', 'release-beta/*', 'nocobase-v3-beta/*'],
      root,
    )
      .split('\n')
      .filter(Boolean);
    const previous = selectPreviousTag(tags, tag);
    if (previous) {
      from = git(['merge-base', `refs/tags/${previous}`, head], root).trim();
      console.log(`Previous ${channel} release: ${previous} (from ${from}).`);
    } else if (channel === 'beta') {
      throw new Error(`No beta release before ${tag}; pass --from.`);
    } else {
      console.log(
        'No earlier stable release: only the pull requests the betas listed are included.',
      );
    }
  }

  const subjects = from
    ? git(['log', `${from}..${head}`, '--format=%s'], root)
        .split('\n')
        .filter(Boolean)
    : [];
  const numbers = extractPullRequestNumbers(subjects);
  console.log(`${subjects.length} commits, ${numbers.length} pull requests.`);

  const files = Object.fromEntries(
    Object.entries(CHANGELOG_FILES).map(([language, name]) => [
      language,
      path.join(root, name),
    ]),
  );
  let carried = 0;
  if (channel === 'stable') {
    const content = existsSync(files.en)
      ? readFileSync(files.en, 'utf8')
      : null;
    for (const number of pendingBetaPullRequests(content)) {
      if (numbers.includes(number)) continue;
      numbers.push(number);
      carried += 1;
    }
    console.log(`${carried} pull requests carried from the beta sections.`);
  }

  const pullRequests = await viewPullRequests(numbers, repo);
  const collected = collectEntries(pullRequests);
  const notes = {
    en: renderNotes(collected, 'en'),
    zh: renderNotes(collected, 'zh'),
  };

  for (const language of /** @type {const} */ (['en', 'zh'])) {
    const file = files[language];
    const content = existsSync(file) ? readFileSync(file, 'utf8') : null;
    const next = prependChangelog(content, {
      tag,
      repo,
      notes: notes[language],
      language,
    });
    if (next === null) console.log(`${file} already has ${tag}; left alone.`);
    else writeFileSync(file, next);
  }

  if (values['out-dir']) {
    const outDir = path.resolve(values['out-dir']);
    mkdirSync(outDir, { recursive: true });
    writeFileSync(path.join(outDir, 'release-notes.en.md'), notes.en);
    writeFileSync(path.join(outDir, 'release-notes.zh-CN.md'), notes.zh);
    writeFileSync(
      path.join(outDir, 'missing.json'),
      `${JSON.stringify(collected.missing, null, 2)}\n`,
    );
  }

  for (const { number, title, url, reason } of collected.missing) {
    console.log(
      `::warning::PR #${number} is missing from the changelog (${title}, ${url}): ${reason}`.replace(
        /\n/gu,
        ' ',
      ),
    );
  }
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(
      process.env.GITHUB_STEP_SUMMARY,
      summary({ tag, from, collected, carried }),
    );
  }
  const skipped = pullRequests.filter(isReleasePullRequest).length;
  console.log(
    `${collected.entries.length} entries, ${collected.missing.length} missing, ${skipped} release PRs skipped.`,
  );
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main(process.argv.slice(2)).catch((error) => {
    if (
      error instanceof UsageError ||
      String(error.code).startsWith('ERR_PARSE_ARGS')
    ) {
      console.error(
        `${error.message}\nUsage: node scripts/changelog.mjs --tag <aggregate tag> --repo <owner/name> [--root <dir>] [--head <ref>] [--from <ref>] [--out-dir <dir>]`,
      );
      process.exitCode = 2;
    } else {
      console.error(
        `::error::${(error.stderr || error.message).toString().trim().replace(/\n/gu, ' ')}`,
      );
      process.exitCode = 1;
    }
  });
}
