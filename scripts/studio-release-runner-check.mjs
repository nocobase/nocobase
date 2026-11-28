// Studio's public release packs `nocobase-runner` from the workspace sources of the vendor/nocobase3 commit it builds,
// under the version in packages/app/agent-runner/package.json. Runners update only to a higher version, so two Studio
// releases that ship different runner code under one version leave the older code on every machine that installed it.
// This check runs in prepare, before any image is built: when the runner's runtime closure (the runner and every
// workspace package it depends on at runtime) changed since a baseline that already shipped the same version, the
// release stops until @nocobase/agent-runner is released with a new version and Studio's pointer moves to it.
//
// Baselines, each compared when it exists:
// - framework: the newest commit in the target's history that set agent-runner's version to the target's version
//   (the v3-release commit that published it);
// - studio: the vendor/nocobase3 commit of the previous Studio release tag, when its runner has the same version.
//
// Runtime content of a closure package: its src/ files other than tests, the other entries of its `files` (bin/,
// node-guard.js...) except built output and Markdown, the runtime fields of its package.json, and the catalog versions
// its dependencies resolve to in pnpm-workspace.yaml. Unconsumed changesets naming a closure package are listed as a
// diagnosis only; the decision rests on the diff, so a change without a changeset is still caught.
//
// With source_ref (a dry run validating a pull request's Studio commit), the framework pointer is often a commit not yet
// released, so the check reports its result as a warning instead of failing, like the other publication checks that
// source_ref skips. A dry run without source_ref fails exactly like a release.
import { execFileSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const RUNNER_PACKAGE = '@nocobase/agent-runner';
export const RUNNER_MANIFEST = 'packages/app/agent-runner/package.json';
const RUNTIME_FIELDS = [
  'type',
  'main',
  'module',
  'exports',
  'imports',
  'bin',
  'files',
  'dependencies',
  'optionalDependencies',
  'peerDependencies',
  'publishConfig',
];
const DEPENDENCY_FIELDS = [
  'dependencies',
  'optionalDependencies',
  'peerDependencies',
];
const BUILT_OUTPUT = new Set(['dist', 'lib', 'es']);
const MAX_FILES = 10;
const semver =
  /^v?(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/;

/** Reads a framework repository's objects; nothing is checked out. */
export function createGit(dir) {
  const run = (args, input) =>
    execFileSync('git', ['-C', dir, ...args], {
      encoding: 'utf8',
      input,
      maxBuffer: 256 * 1024 * 1024,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
  return {
    shallow() {
      return run(['rev-parse', '--is-shallow-repository']).trim() === 'true';
    },
    hasCommit(commit) {
      try {
        run(['cat-file', '-e', `${commit}^{commit}`]);
        return true;
      } catch {
        return false;
      }
    },
    show(commit, file) {
      try {
        return run(['show', `${commit}:${file}`]);
      } catch {
        return null;
      }
    },
    files(commit, prefix) {
      return run(['ls-tree', '-r', '--name-only', commit, '--', prefix])
        .split('\n')
        .filter(Boolean);
    },
    changed(base, target, paths) {
      return run([
        'diff',
        '--name-only',
        '--no-renames',
        base,
        target,
        '--',
        ...paths,
      ])
        .split('\n')
        .filter(Boolean);
    },
    // Newest commits whose diff changes how often `text` occurs in `file`.
    pickaxe(commit, text, file) {
      return run(['log', '--format=%H', `-S${text}`, commit, '--', file])
        .split('\n')
        .filter(Boolean);
    },
    parent(commit) {
      try {
        return (
          run(['rev-parse', '--verify', '--quiet', `${commit}^1`]).trim() ||
          null
        );
      } catch {
        return null;
      }
    },
  };
}

const json = (text) => {
  try {
    return text == null ? null : JSON.parse(text);
  } catch {
    return null;
  }
};
const versionAt = (git, commit) =>
  json(git.show(commit, RUNNER_MANIFEST))?.version ?? null;

/** Workspace packages at a commit, by name: packages/<group>/<name>/package.json. */
export function workspacePackages(git, commit) {
  const packages = new Map();
  for (const file of git.files(commit, 'packages')) {
    if (!/^packages\/[^/]+\/[^/]+\/package\.json$/.test(file)) continue;
    const manifest = json(git.show(commit, file));
    if (manifest?.name)
      packages.set(manifest.name, { dir: path.posix.dirname(file), manifest });
  }
  return packages;
}

/** The runner and every workspace package its runtime dependencies reach, resolved from the manifests. */
export function runtimeClosure(packages, root = RUNNER_PACKAGE) {
  if (!packages.has(root))
    throw new Error(`${root} is not a workspace package.`);
  const closure = [];
  const queue = [root];
  while (queue.length) {
    const name = queue.shift();
    if (closure.includes(name)) continue;
    closure.push(name);
    const { manifest } = packages.get(name);
    for (const field of ['dependencies', 'optionalDependencies']) {
      for (const dependency of Object.keys(manifest[field] || {}))
        if (packages.has(dependency)) queue.push(dependency);
    }
  }
  return closure;
}

/** Whether a file of a package (relative to its directory) ships or runs: sources other than tests, and `files`. */
export function isRuntimeFile(relative, manifest) {
  if (/\.md$/i.test(relative)) return false;
  if (relative.startsWith('src/'))
    return !(
      /(^|\/)(__tests__|__mocks__|__fixtures__|tests?|fixtures)\//.test(
        relative,
      ) || /\.(test|spec)\.[cm]?[jt]sx?$/.test(relative)
    );
  return (manifest.files || []).some((entry) => {
    const clean = entry.replace(/^\.\//, '').replace(/\/+$/, '');
    if (!clean || BUILT_OUTPUT.has(clean) || /[*?[]/.test(clean)) return false;
    return relative === clean || relative.startsWith(`${clean}/`);
  });
}

/** The top-level `catalog:` and named `catalogs:` of pnpm-workspace.yaml, without a YAML dependency. */
export function parseCatalogs(text) {
  const catalogs = new Map();
  let section = null;
  let named = null;
  const unquote = (value) => value.trim().replace(/^(['"])(.*)\1$/, '$2');
  for (const raw of (text || '').split('\n')) {
    const line = raw.replace(/\s+#.*$/, '');
    if (!line.trim() || line.trim().startsWith('#')) continue;
    const indent = line.length - line.trimStart().length;
    if (indent === 0) {
      section = line.startsWith('catalog:')
        ? 'default'
        : line.startsWith('catalogs:')
          ? 'named'
          : null;
      named = null;
      continue;
    }
    if (section === 'named' && indent === 2 && line.trim().endsWith(':')) {
      named = unquote(line.trim().slice(0, -1));
      continue;
    }
    const catalog =
      section === 'default' && indent === 2
        ? 'default'
        : section === 'named' && indent === 4
          ? named
          : null;
    if (!catalog) continue;
    const match = /^\s*((?:'[^']+'|"[^"]+"|[^:\s]+)):\s*(.+)$/.exec(line);
    if (!match) continue;
    if (!catalogs.has(catalog)) catalogs.set(catalog, new Map());
    catalogs.get(catalog).set(unquote(match[1]), unquote(match[2]));
  }
  return catalogs;
}

/** The runtime differences of the closure between two framework commits. */
export function runtimeChanges(git, base, target, closure, packages) {
  const changes = [];
  const baseCatalogs = parseCatalogs(git.show(base, 'pnpm-workspace.yaml'));
  const targetCatalogs = parseCatalogs(git.show(target, 'pnpm-workspace.yaml'));
  const catalog = [];
  for (const name of closure) {
    const { dir, manifest } = packages.get(name);
    const files = git
      .changed(base, target, [dir])
      .map((file) => file.slice(dir.length + 1))
      .filter(
        (file) => file !== 'package.json' && isRuntimeFile(file, manifest),
      );
    const before = json(git.show(base, `${dir}/package.json`));
    const fields = RUNTIME_FIELDS.filter(
      (field) =>
        JSON.stringify(before?.[field] ?? null) !==
        JSON.stringify(manifest[field] ?? null),
    );
    if (fields.length) files.unshift(`package.json (${fields.join(', ')})`);
    if (!before) files.unshift('(package added)');
    if (files.length) changes.push({ name, dir, files });
    for (const field of DEPENDENCY_FIELDS) {
      for (const [dependency, spec] of Object.entries(manifest[field] || {})) {
        if (typeof spec !== 'string' || !spec.startsWith('catalog:')) continue;
        const id = spec.slice('catalog:'.length) || 'default';
        const from = baseCatalogs.get(id)?.get(dependency) ?? null;
        const to = targetCatalogs.get(id)?.get(dependency) ?? null;
        if (from === to) continue;
        const entry = catalog.find(
          (item) => item.dependency === dependency && item.catalog === id,
        );
        if (entry) entry.users.push(name);
        else catalog.push({ dependency, catalog: id, from, to, users: [name] });
      }
    }
  }
  return { packages: changes, catalog };
}

/** Pending changesets (top-level .changeset/*.md; consumed ones move to .changeset/pre/) naming a closure package. */
export function pendingChangesets(git, commit, closure) {
  const result = [];
  for (const file of git.files(commit, '.changeset')) {
    if (!/^\.changeset\/[^/]+\.md$/.test(file) || /\/README\.md$/i.test(file))
      continue;
    const front = /^---\r?\n([\s\S]*?)\r?\n---/.exec(
      git.show(commit, file) || '',
    );
    if (!front) continue;
    const names = [...front[1].matchAll(/^\s*['"]?([^'":\s]+)['"]?\s*:/gm)].map(
      (match) => match[1],
    );
    const hits = names.filter((name) => closure.includes(name));
    if (hits.length) result.push({ file, packages: hits });
  }
  return result;
}

/** The newest commit in `target`'s history that set agent-runner's version to `version`. */
export function versionBaseline(git, target, version) {
  for (const commit of git.pickaxe(
    target,
    `"version": "${version}"`,
    RUNNER_MANIFEST,
  )) {
    if (versionAt(git, commit) !== version) continue;
    const parent = git.parent(commit);
    if (!parent || versionAt(git, parent) !== version) return commit;
  }
  return null;
}

const parseVersion = (value) => {
  const match = semver.exec(value);
  if (!match) return null;
  return {
    core: match.slice(1, 4).map(Number),
    pre: match[4] ? match[4].split('.') : [],
  };
};
export function compareVersions(a, b) {
  const x = parseVersion(a);
  const y = parseVersion(b);
  for (let i = 0; i < 3; i++)
    if (x.core[i] !== y.core[i]) return x.core[i] - y.core[i];
  if (!x.pre.length || !y.pre.length) return y.pre.length - x.pre.length;
  for (let i = 0; i < Math.max(x.pre.length, y.pre.length); i++) {
    if (x.pre[i] === undefined) return -1;
    if (y.pre[i] === undefined) return 1;
    const [m, n] = [x.pre[i], y.pre[i]];
    if (m === n) continue;
    // Numeric identifiers compare as numbers and sort before alphanumeric ones.
    const [a, b] = [/^\d+$/.test(m), /^\d+$/.test(n)];
    if (a && b) return Number(m) - Number(n);
    if (a !== b) return a ? -1 : 1;
    return m < n ? -1 : 1;
  }
  return 0;
}

/** The Studio release tag just below `version` among `refs` (refs/tags/v<semver> or plain tag names). */
export function previousReleaseTag(version, refs) {
  let best = null;
  for (const ref of refs) {
    const tag = ref.trim().replace(/^refs\/tags\//, '');
    if (!tag.startsWith('v') || !parseVersion(tag)) continue;
    if (compareVersions(tag.slice(1), version) >= 0) continue;
    if (!best || compareVersions(tag.slice(1), best.slice(1)) > 0) best = tag;
  }
  return best;
}

/**
 * Checks that the runner shipped by the framework commit `target` either has a new version or the same runtime
 * content as every baseline that shipped its version. `previous` is the previous Studio release ({ tag, commit }).
 */
export function checkRunner(git, { target, previous = null }) {
  // A shallow history hides the release commit that set the version, and the check would compare with the wrong one.
  if (git.shallow())
    throw new Error(
      'The framework repository is shallow; fetch its full history.',
    );
  if (!git.hasCommit(target))
    throw new Error(`The framework commit ${target} is not available.`);
  const version = versionAt(git, target);
  if (!version)
    throw new Error(`${RUNNER_MANIFEST} has no version at ${target}.`);
  const packages = workspacePackages(git, target);
  const closure = runtimeClosure(packages);
  const baselines = [];
  const notes = [];
  const framework = versionBaseline(git, target, version);
  if (framework)
    baselines.push({
      kind: 'framework',
      name: 'its framework release',
      label: `framework commit ${framework} that set ${version}`,
      commit: framework,
    });
  else
    notes.push(
      `No framework commit setting ${RUNNER_PACKAGE} to ${version} was found in the history of ${target}.`,
    );
  if (previous?.commit) {
    if (!git.hasCommit(previous.commit))
      throw new Error(
        `The framework commit ${previous.commit} of Studio ${previous.tag} is not available.`,
      );
    const previousVersion = versionAt(git, previous.commit);
    if (previousVersion === version)
      baselines.push({
        kind: 'studio',
        name: `Studio ${previous.tag}`,
        label: `Studio ${previous.tag} (framework ${previous.commit})`,
        commit: previous.commit,
      });
    else
      notes.push(
        `Studio ${previous.tag} shipped ${RUNNER_PACKAGE} ${previousVersion ?? '(unknown)'}, not ${version}.`,
      );
  } else notes.push('No previous Studio release to compare with.');
  for (const baseline of baselines) {
    Object.assign(
      baseline,
      runtimeChanges(git, baseline.commit, target, closure, packages),
    );
    baseline.changed =
      baseline.packages.length > 0 || baseline.catalog.length > 0;
  }
  return {
    version,
    target,
    closure,
    baselines,
    notes,
    changesets: pendingChangesets(git, target, closure),
    ok: baselines.every((baseline) => !baseline.changed),
  };
}

/** Plain-text report for the step log and the job summary. */
export function formatReport(result, { warnOnly = false } = {}) {
  const lines = [];
  const { version } = result;
  if (result.ok) {
    lines.push(
      result.baselines.length
        ? `${RUNNER_PACKAGE} ${version}: its runtime code and dependencies match ${result.baselines.map((baseline) => baseline.label).join(' and ')}.`
        : `${RUNNER_PACKAGE} ${version}: no baseline shipped this version, so it is new.`,
    );
  } else {
    lines.push(
      `${RUNNER_PACKAGE} ${version} would ship runtime code or dependencies that differ from a release that already shipped ${version}, and runners only update to a higher version.`,
    );
  }
  lines.push(`Runtime closure: ${result.closure.join(', ')}`);
  for (const baseline of result.baselines) {
    if (!baseline.changed) {
      lines.push(`- Unchanged since ${baseline.label}.`);
      continue;
    }
    lines.push(`- Changed since ${baseline.label}:`);
    for (const change of baseline.packages) {
      const shown = change.files.slice(0, MAX_FILES).join(', ');
      const more =
        change.files.length > MAX_FILES
          ? ` and ${change.files.length - MAX_FILES} more`
          : '';
      lines.push(`  - ${change.name} (${change.dir}): ${shown}${more}`);
    }
    for (const entry of baseline.catalog)
      lines.push(
        `  - catalog${entry.catalog === 'default' ? '' : `:${entry.catalog}`} ${entry.dependency}: ${entry.from ?? '(none)'} -> ${entry.to ?? '(none)'} (used by ${entry.users.join(', ')})`,
      );
  }
  for (const note of result.notes) lines.push(`- ${note}`);
  if (result.changesets.length) {
    lines.push('Unreleased changesets naming the closure:');
    for (const changeset of result.changesets)
      lines.push(`  - ${changeset.file}: ${changeset.packages.join(', ')}`);
  }
  if (!result.ok)
    lines.push(
      warnOnly
        ? 'source_ref validates a pull request build, so this only warns; a release of this commit would stop here.'
        : `Fix: release a new ${RUNNER_PACKAGE} with V3 Release (v3-release.yml), move Studio's vendor/nocobase3 to a commit of v3 (or v3-main) that contains that release, then release Studio again.`,
    );
  return lines.join('\n');
}

export function summaryResult(result, { warnOnly = false } = {}) {
  if (result.ok)
    return result.baselines.length
      ? `unchanged since ${result.baselines.map((baseline) => baseline.name).join(' and ')}`
      : 'new version';
  return warnOnly
    ? 'changed without a new version (warning only: source_ref)'
    : 'changed without a new version';
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  const command = process.argv[2];
  if (command === 'previous-tag') {
    // Reads tag refs on stdin and prints the release tag below the version given as the argument.
    const { readFileSync } = await import('node:fs');
    process.stdout.write(
      `${previousReleaseTag(process.argv[3], readFileSync(0, 'utf8').split('\n')) ?? ''}\n`,
    );
  } else if (command === 'check') {
    const warnOnly = Boolean(process.env.SOURCE_REF);
    const output = (key, value) =>
      process.env.GITHUB_OUTPUT &&
      appendFileSync(process.env.GITHUB_OUTPUT, `${key}=${value}\n`);
    const result = checkRunner(createGit(process.env.FRAMEWORK_DIR), {
      target: process.env.TARGET_OSS_SHA,
      previous: process.env.PREVIOUS_TAG
        ? {
            tag: process.env.PREVIOUS_TAG,
            commit: process.env.PREVIOUS_OSS_SHA,
          }
        : null,
    });
    const report = formatReport(result, { warnOnly });
    console.log(report);
    output('runner_version', result.version);
    output('runner_result', summaryResult(result, { warnOnly }));
    if (!result.ok) {
      if (process.env.GITHUB_STEP_SUMMARY)
        appendFileSync(
          process.env.GITHUB_STEP_SUMMARY,
          `### nocobase-runner ${result.version}\n\n\`\`\`\n${report}\n\`\`\`\n\n`,
        );
      const first = report.split('\n')[0];
      if (warnOnly) console.log(`::warning::${first}`);
      else {
        console.log(
          `::error::${first} See the step log for the changed files and the fix.`,
        );
        process.exitCode = 1;
      }
    }
  } else {
    console.error(
      'Usage: studio-release-runner-check.mjs check | previous-tag <version>',
    );
    process.exitCode = 2;
  }
}
