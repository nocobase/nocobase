// Resolve stable -> development sync conflicts: OSS v3-main -> v3-develop,
// or main -> develop in the independent Pro repository.
//
// 只处理规则确定的两类：
//   package.json  版本号取较大者，其余字段走 git 正常三方合并
//   CHANGELOG.md  两边条目都保留（union）
//
// 其余任何冲突都不碰，交给人处理。
//
// 版本号取较大者的原因：develop 落后于 main 时（main 连发几个 hotfix），
// 保留 develop 自己的版本号会导致 beta 永远追不上 latest：
//   develop 1.3.1-beta.0，main 1.3.2 -> 下一轮 1.3.1-beta.1，仍然更小
// 取 main 的 1.3.2 之后，下一轮得到 1.3.3-beta.0，顺序恢复正确。
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import semver from 'semver';

function git(...args) {
  return execFileSync('git', args, { encoding: 'utf8' });
}

/** 从 index 里读冲突三方之一。stage: 1=base 2=ours 3=theirs */
function readStage(stage, file) {
  try {
    return execFileSync('git', ['show', `:${stage}:${file}`], {
      encoding: 'utf8',
    });
  } catch {
    return null;
  }
}

const conflicts = git('diff', '--name-only', '--diff-filter=U')
  .split('\n')
  .map((l) => l.trim())
  .filter(Boolean);

if (conflicts.length === 0) {
  console.log('没有冲突需要处理。');
  process.exit(0);
}

const unresolvable = [];
const resolved = [];

for (const file of conflicts) {
  const base = path.basename(file);

  if (base === 'package.json') {
    const ours = readStage(2, file);
    const theirs = readStage(3, file);
    const baseText = readStage(1, file);

    // 任一方缺失（新增/删除类冲突）交给人
    if (!ours || !theirs) {
      unresolvable.push(`${file}（一侧缺失，可能是新增或删除）`);
      continue;
    }

    let ourPkg, theirPkg;
    try {
      ourPkg = JSON.parse(ours);
      theirPkg = JSON.parse(theirs);
    } catch {
      unresolvable.push(`${file}（JSON 解析失败）`);
      continue;
    }

    const winner =
      semver.valid(ourPkg.version) && semver.valid(theirPkg.version)
        ? semver.gte(ourPkg.version, theirPkg.version)
          ? ourPkg.version
          : theirPkg.version
        : null;

    if (!winner) {
      unresolvable.push(`${file}（版本号不是合法 semver）`);
      continue;
    }

    // 把三方的 version 统一成胜出值，再让 git 合并其余字段。
    // 这样加依赖、改 exports 之类的改动照常三方合并，只有版本号由我们裁决。
    const tmp = fs.mkdtempSync(path.join(process.cwd(), '.sync-'));
    const normalize = (text, name) => {
      const obj = JSON.parse(text);
      obj.version = winner;
      const p = path.join(tmp, name);
      fs.writeFileSync(p, `${JSON.stringify(obj, null, 2)}\n`);
      return p;
    };

    try {
      const oursPath = normalize(ours, 'ours.json');
      const basePath = normalize(baseText ?? ours, 'base.json');
      const theirsPath = normalize(theirs, 'theirs.json');

      let merged;
      try {
        execFileSync(
          'git',
          ['merge-file', '-p', oursPath, basePath, theirsPath],
          {
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'ignore'],
          },
        );
        merged = fs.readFileSync(oursPath, 'utf8');
      } catch (e) {
        // merge-file 冲突时退出码非 0，但会把带标记的内容写到 stdout
        merged = e.stdout ?? '';
      }

      if (merged.includes('<<<<<<<')) {
        unresolvable.push(`${file}（版本号之外还有字段冲突）`);
        continue;
      }

      // 校验产物是合法 JSON 且版本号正确
      const check = JSON.parse(merged);
      if (check.version !== winner) {
        unresolvable.push(`${file}（合并后版本号异常）`);
        continue;
      }

      fs.writeFileSync(file, merged);
      git('add', '--', file);
      resolved.push(
        `${file}: ${ourPkg.version} vs ${theirPkg.version} -> ${winner}` +
          (winner === theirPkg.version && winner !== ourPkg.version
            ? '（接受 main 的）'
            : ''),
      );
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
    continue;
  }

  if (base === 'CHANGELOG.md') {
    // 两边的条目都要留下：main 的 hotfix 记录和 develop 的 beta 记录
    // 都是真实发生过的发布。
    const ours = readStage(2, file);
    const theirs = readStage(3, file);
    if (!ours || !theirs) {
      unresolvable.push(`${file}（一侧缺失）`);
      continue;
    }
    const tmp = fs.mkdtempSync(path.join(process.cwd(), '.sync-'));
    try {
      const w = (t, n) => {
        const p = path.join(tmp, n);
        fs.writeFileSync(p, t);
        return p;
      };
      const oursPath = w(ours, 'ours.md');
      const basePath = w(readStage(1, file) ?? '', 'base.md');
      const theirsPath = w(theirs, 'theirs.md');
      let merged;
      try {
        execFileSync(
          'git',
          ['merge-file', '--union', '-p', oursPath, basePath, theirsPath],
          {
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'ignore'],
          },
        );
        merged = fs.readFileSync(oursPath, 'utf8');
      } catch (e) {
        merged = e.stdout ?? '';
      }
      fs.writeFileSync(file, merged);
      git('add', '--', file);
      resolved.push(`${file}: 两边条目合并`);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
    continue;
  }

  unresolvable.push(file);
}

if (resolved.length) {
  console.log('已自动解决：');
  for (const r of resolved) console.log(`  ${r}`);
}

if (unresolvable.length) {
  console.log('\n需要人工处理：');
  for (const u of unresolvable) console.log(`  ${u}`);
  process.exit(1);
}

console.log('\n全部冲突已自动解决。');
