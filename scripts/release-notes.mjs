// Renders GitHub Release notes for an aggregate release tag.
//
// A release commit carries every tag the release produced: the aggregate tag
// (`release-beta/2026-08-26.5`) and one `name@version` tag per package that
// `changeset publish` actually published. That is the whole manifest, recorded
// by the release itself — this script reads it back rather than reconstructing it.
//
// Everything is read out of the tagged commit with `git show`, never from the
// working tree, so notes for any past release can be rendered at any later time.
//
// Usage:
//   node scripts/release-notes.mjs <aggregate-tag>            print the notes
//   node scripts/release-notes.mjs <aggregate-tag> --packages print `name@version` per line
import { execFileSync } from 'node:child_process';

const AGGREGATE_PATTERN = /^release(-beta)?\/\d{4}-\d{2}-\d{2}\.\d+$/u;
// GitHub rejects bodies over 125,000 characters. Leave room below that limit;
// UTF-16 length also conservatively counts non-BMP characters twice.
export const RELEASE_BODY_LIMIT = 120_000;

export function fitReleaseNotes(header, sections) {
  const render = (bodies, notice = '') =>
    `${header}${notice}\n\n${bodies.join('\n\n')}\n`;
  const bodies = sections.map(({ full }) => full);
  const full = render(bodies);
  if (full.length <= RELEASE_BODY_LIMIT) return full;

  const notice =
    '\n\n_Some long package entries are linked to their full changelogs to fit GitHub’s release body limit._';
  // Replace whole sections, largest savings first, so Markdown stays intact and
  // the remaining entries keep their original order and complete content.
  const candidates = sections
    .map(({ full, compact }, index) => ({
      index,
      compact,
      savings: full.length - compact.length,
    }))
    .filter(({ savings }) => savings > 0)
    .sort((left, right) => right.savings - left.savings);
  let length = full.length + notice.length;
  for (const { index, compact, savings } of candidates) {
    bodies[index] = compact;
    length -= savings;
    if (length <= RELEASE_BODY_LIMIT) return render(bodies, notice);
  }
  throw new Error(
    `Release notes exceed ${RELEASE_BODY_LIMIT} characters even with compact changelog links`,
  );
}

function git(args) {
  return execFileSync('git', args, {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
}

// `cwd` defaults to the process directory, which is what the release workflow wants. Tests override it to read a
// throwaway repository built in a specific layout.
function gitOrUndefined(args, { cwd } = {}) {
  try {
    return execFileSync('git', args, {
      cwd,
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'ignore'],
    });
  } catch {
    return undefined;
  }
}

export function parseAggregateTag(tag) {
  if (!AGGREGATE_PATTERN.test(tag)) {
    throw new Error(`Not an aggregate release tag: ${tag}`);
  }
  const [prefix, batch] = tag.split('/');
  return { batch, channel: prefix === 'release-beta' ? 'beta' : 'stable' };
}

// A package tag is `<name>@<version>`, and scoped names carry their own `@`.
// Splitting on the last `@` is what keeps `@nocobase/create-app@0.1.0-beta.4`
// from parsing as an empty name.
export function parsePackageTag(tag) {
  const at = tag.lastIndexOf('@');
  if (at <= 0) return undefined;
  const name = tag.slice(0, at);
  const version = tag.slice(at + 1);
  if (!name || !version || !/^\d/u.test(version)) return undefined;
  return { name, version };
}

export function readPackagesFromTags(tags) {
  return tags
    .map((tag) => parsePackageTag(tag))
    .filter(Boolean)
    .sort((left, right) =>
      left.name < right.name ? -1 : left.name > right.name ? 1 : 0,
    );
}

// Reads `## <version>` out of a CHANGELOG, stopping at the next `## ` heading.
// Changesets writes exactly one such heading per released version.
export function extractChangelogSection(changelog, version) {
  const lines = changelog.replaceAll('\r\n', '\n').split('\n');
  const heading = `## ${version}`;
  const start = lines.findIndex((line) => line.trimEnd() === heading);
  if (start === -1) return undefined;

  let end = lines.length;
  for (let index = start + 1; index < lines.length; index += 1) {
    if (/^##\s/u.test(lines[index])) {
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

// Lists the directory of every published package in the tagged tree, as a path relative to `packages/`.
//
// Both layouts have to work. `packages/` was flat until the repository regrouped it into
// `packages/<category>/<package>`, so a tag cut before that move points at a tree whose manifests sit one level deep,
// while a tag cut after it points at a tree two levels deep. Release notes are rendered from whichever commit the tag
// names, including tags from before the move, and a layout mismatch fails silently: `resolveDirectories` just returns
// an empty map and every package renders as "no changelog entry". Reading the tree itself rather than assuming a depth
// keeps both eras — and any later regrouping — working.
//
// `-r` walks the whole tree, so it also reports manifests nested inside a package: `app-host` ships five of them under
// `fixtures/app-dist/`. A nested manifest is never a published package, and keeping it would let it overwrite the entry
// for the package that contains it, because `resolveDirectories` keys by name and the last writer wins. Whether that
// happens at all comes down to which path git sorts last, which is far too subtle to rely on, so descendants are
// dropped here instead.
export function findPackageDirectories(commit, { cwd } = {}) {
  const listing = gitOrUndefined(
    ['ls-tree', '-r', '--name-only', `${commit}:packages`],
    { cwd },
  );
  if (listing === undefined) {
    throw new Error(
      `Cannot read packages/ from ${commit} — the tagged tree could not be listed`,
    );
  }

  const directories = listing
    .split('\n')
    .filter((entry) => entry.endsWith('/package.json'))
    .map((entry) => entry.slice(0, -'/package.json'.length))
    .sort();

  // Sorting puts a parent directly before everything nested under it, so one pass over the sorted list is enough.
  const roots = [];
  for (const directory of directories) {
    const parent = roots.at(-1);
    if (parent !== undefined && directory.startsWith(`${parent}/`)) continue;
    roots.push(directory);
  }
  return roots;
}

// Maps published package names back to their directory in the tagged tree, so
// the changelog can be read from the same commit the release was cut from.
export function resolveDirectories(commit, directories, { cwd } = {}) {
  const byName = new Map();
  for (const directory of directories) {
    const raw = gitOrUndefined(
      ['show', `${commit}:packages/${directory}/package.json`],
      { cwd },
    );
    if (!raw) continue;
    try {
      const { name } = JSON.parse(raw);
      if (name) byName.set(name, directory);
    } catch {
      // A package.json that does not parse cannot be matched to a tag; the
      // package simply renders without changelog details.
    }
  }
  return byName;
}

// Changesets can repeat a commit once per dependency change. Collapse each
// generated run into one summary, keeping every distinct commit and leaving
// the following dependency/version list attached to that summary.
export function deduplicateDependencyUpdates(section) {
  const output = [];
  const commits = new Set();
  let fence;
  const flush = () => {
    if (commits.size === 0) return;
    output.push(`- Updated dependencies ${[...commits].join(', ')}`);
    commits.clear();
  };

  for (const line of section.split('\n')) {
    const marker = /^ {0,3}(`{3,}|~{3,})(.*)$/u.exec(line);
    if (fence) {
      if (
        marker &&
        marker[1][0] === fence[0] &&
        marker[1].length >= fence.length &&
        marker[2].trim() === ''
      ) {
        fence = undefined;
      }
      output.push(line);
      continue;
    }
    if (marker) fence = marker[1];
    const update = /^- Updated dependencies (\[[\da-f]+\])$/u.exec(line);
    if (update) {
      commits.add(update[1]);
    } else {
      flush();
      output.push(line);
    }
  }
  flush();
  return output.join('\n');
}

export function renderReleaseNotes(tag) {
  const { batch, channel } = parseAggregateTag(tag);
  // The aggregate tag and the release branch share a name while a release is in
  // flight, so a bare ref is ambiguous — resolve through refs/tags/ explicitly.
  const commit = git(['rev-parse', `refs/tags/${tag}^{commit}`]).trim();
  const tagsAtCommit = git(['tag', '--points-at', commit])
    .split('\n')
    .filter(Boolean);
  const packages = readPackagesFromTags(tagsAtCommit);

  if (packages.length === 0) {
    throw new Error(
      `No package tags point at ${commit} — nothing was published for ${tag}`,
    );
  }

  const directories = resolveDirectories(
    commit,
    findPackageDirectories(commit),
  );
  // Resolving nothing while package tags exist means the tree was read but no manifest matched a published name — a
  // layout or tooling change the lookup no longer understands. Rendering would still "succeed", emitting a full set of
  // "no changelog entry" placeholders that reads like a release with no changes, so fail instead of publishing that.
  if (directories.size === 0) {
    throw new Error(
      `No package directories in ${commit} matched the ${packages.length} package tags for ${tag}`,
    );
  }
  const label = channel === 'beta' ? 'Beta release' : 'Stable release';
  const lines = [
    `${label} \`${batch}\` published ${packages.length} package${packages.length === 1 ? '' : 's'}.`,
    '',
    '| Package | Version |',
    '| --- | --- |',
    ...packages.map((pkg) => `| \`${pkg.name}\` | \`${pkg.version}\` |`),
  ];

  const sections = packages.map((pkg) => {
    const directory = directories.get(pkg.name);
    const changelog = directory
      ? gitOrUndefined(['show', `${commit}:packages/${directory}/CHANGELOG.md`])
      : undefined;
    const section = changelog
      ? extractChangelogSection(changelog, pkg.version)
      : undefined;
    const heading = `## \`${pkg.name}@${pkg.version}\``;
    const full = `${heading}\n\n${section ? deduplicateDependencyUpdates(section) : '_No changelog entry was recorded for this version._'}`;
    const changelogUrl = directory
      ? `https://github.com/nocobase/nocobase/blob/${commit}/packages/${directory}/CHANGELOG.md#${pkg.version.replaceAll('.', '')}`
      : undefined;
    return {
      full,
      compact: changelogUrl
        ? `${heading}\n\n[Full changelog for this version](${changelogUrl})`
        : full,
    };
  });

  return fitReleaseNotes(lines.join('\n'), sections);
}

export function formatPackageList(tag) {
  const commit = git(['rev-parse', `refs/tags/${tag}^{commit}`]).trim();
  const packages = readPackagesFromTags(
    git(['tag', '--points-at', commit]).split('\n').filter(Boolean),
  );
  return packages.map((pkg) => `${pkg.name}@${pkg.version}`).join('\n');
}

const isMain = process.argv[1]?.endsWith('release-notes.mjs');
if (isMain) {
  const [tag, ...flags] = process.argv.slice(2);
  try {
    if (!tag) throw new Error('Usage: release-notes.mjs <aggregate-tag>');
    const output = flags.includes('--packages')
      ? `${formatPackageList(tag)}\n`
      : renderReleaseNotes(tag);
    process.stdout.write(output);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
