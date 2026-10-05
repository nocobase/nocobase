// 校验 .changeset/*.md 的格式。这一层是阻塞性的：文件本身写错了，机器能
// 确定判断，没有让它流到发版时才炸的理由。
//
// 只检查已经存在的文件是否合法，不判断「该不该有 changeset」——那是
// require-changesets.mjs 的职责。
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const changesetDir = path.join(root, '.changeset');
const VALID_BUMPS = new Set(['patch', 'minor', 'major']);

// packages/ 是两层的：packages/<分类>/<包>，分类目录本身没有 package.json。
// 只读一层会得到空集合，于是每个 changeset 里的包名都会被判成「未知的包名」。
function readWorkspacePackages() {
  const packagesDir = path.join(root, 'packages');
  const names = new Map();
  if (!fs.existsSync(packagesDir)) return names;
  for (const category of fs.readdirSync(packagesDir, { withFileTypes: true })) {
    if (!category.isDirectory()) continue;
    const categoryDir = path.join(packagesDir, category.name);
    for (const entry of fs.readdirSync(categoryDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const manifest = path.join(categoryDir, entry.name, 'package.json');
      if (!fs.existsSync(manifest)) continue;
      const { name, version } = JSON.parse(fs.readFileSync(manifest, 'utf8'));
      names.set(name, version);
    }
  }
  return names;
}

const known = readWorkspacePackages();
const errors = [];

// In prerelease mode changesets computes `semver.inc(version, type)` and appends `-<tag>.<n>`. For a version that is
// already a numbered prerelease of an X.0.0 release, `semver.inc('1.0.0-beta.33', 'major')` is `1.0.0`, so a `major`
// changeset only yields `1.0.0-beta.34`, the same as a patch, and the break never shows in the version.
// `2.0.0-beta`, with no number, is the placeholder that starts the next line: it is never published, and changesets
// turns it into `2.0.0-beta.0`. Outside prerelease mode a major bump always moves the major, so the rule is off.
function readPreMode() {
  const preFile = path.join(changesetDir, 'pre.json');
  if (!fs.existsSync(preFile)) return undefined;
  return JSON.parse(fs.readFileSync(preFile, 'utf8')).mode;
}

const inPreMode = readPreMode() === 'pre';

function swallowedMajor(version) {
  const parsed =
    /^(\d+)\.(\d+)\.(\d+)-([0-9A-Za-z-]+)((?:\.[0-9A-Za-z-]+)+)(?:\+.*)?$/u.exec(
      version ?? '',
    );
  if (!parsed || parsed[2] !== '0' || parsed[3] !== '0') return undefined;
  return { major: Number(parsed[1]), tag: parsed[4] };
}

if (!fs.existsSync(changesetDir)) {
  console.log('没有 .changeset 目录，跳过。');
  process.exit(0);
}

// 也要扫 .changeset/pre/。prerelease 模式下 `changeset version` 每次都会把整个 pre/ 目录重新读一遍来计算累积 bump，所以里面的包名同样必须在 workspace 里存在。删包时漏改这里，本地和 CI 都不会报错，一直到发版那一刻才炸成 `Found changeset ... which is not in the workspace`。
function collectChangesetFiles() {
  const files = [];
  for (const dir of [changesetDir, path.join(changesetDir, 'pre')]) {
    if (!fs.existsSync(dir)) continue;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isFile()) continue;
      if (!entry.name.endsWith('.md') || entry.name === 'README.md') continue;
      files.push(path.join(dir, entry.name));
    }
  }
  return files;
}

const files = collectChangesetFiles();

for (const full of files) {
  const file = path.relative(changesetDir, full);
  const raw = fs.readFileSync(full, 'utf8');

  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) {
    errors.push(`${file}: 缺少 YAML frontmatter`);
    continue;
  }

  const body = raw.slice(match[0].length).trim();
  if (!body) {
    errors.push(`${file}: 缺少变更说明正文`);
  }

  // changesets 只解析第一个 frontmatter 块。正文里再出现一个包声明块时，
  // 那半截会被当作说明文字塞进前一个包的 CHANGELOG，而它声明的包根本不会
  // 被发布——不报错，只是静默失效，所以在这里挡住。
  const strayBlock = body.match(
    /^---\r?\n\s*(?:"[^"]+"|'[^']+'|[^:\n]+)\s*:\s*(?:patch|minor|major)\b/m,
  );
  if (strayBlock) {
    errors.push(
      `${file}: 正文里出现了第二个 frontmatter 块。changesets 只解析第一个，多出来的声明会被当成说明文字而不会发布；请把所有包合并进同一个块`,
    );
  }

  const lines = match[1].split(/\r?\n/).filter((l) => l.trim());
  if (!lines.length) {
    errors.push(`${file}: frontmatter 为空，至少要声明一个包`);
    continue;
  }

  for (const line of lines) {
    const entry = line.match(
      /^\s*(?:"([^"]+)"|'([^']+)'|([^:]+?))\s*:\s*(.+?)\s*$/,
    );
    if (!entry) {
      errors.push(`${file}: 无法解析的声明 -> ${line.trim()}`);
      continue;
    }
    const name = (entry[1] ?? entry[2] ?? entry[3]).trim();
    const bump = entry[4].replace(/^["']|["']$/g, '').trim();

    if (!known.has(name)) {
      errors.push(`${file}: 未知的包名 "${name}"`);
    }
    const swallowed =
      inPreMode && bump === 'major' && path.dirname(full) === changesetDir
        ? swallowedMajor(known.get(name))
        : undefined;
    if (swallowed) {
      const next = `${swallowed.major + 1}.0.0-${swallowed.tag}`;
      errors.push(
        `${file}: "${name}" is at ${known.get(name)}, and in prerelease mode a major bump of an X.0.0 prerelease only increments the prerelease number, so the breaking change would not show in the version. ` +
          `Set its package.json version to ${next} and add a "## ${next}" heading to its CHANGELOG.md; changesets then releases it as ${next}.0. ` +
          `Also give every package that lists it in dependencies or peerDependencies a patch entry, because their workspace ranges still accept ${next}.0 and changesets will not release them on its own.`,
      );
    }
    if (!VALID_BUMPS.has(bump)) {
      errors.push(
        `${file}: 非法的 bump 类型 "${bump}"（只允许 patch / minor / major）`,
      );
    }
  }
}

if (errors.length) {
  console.error('changeset 校验失败：\n');
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

console.log(`changeset 校验通过（${files.length} 个文件）。`);
