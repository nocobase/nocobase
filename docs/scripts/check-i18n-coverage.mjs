#!/usr/bin/env node
/**
 * 校对：本 PR 的 cn 文档改动是否同步到了其他语言
 *
 * 跟前面 5 个「结构对齐」脚本互补：那些看「文件存不存在 / _meta 链接是否对得上」，
 * 这个看「同一个 PR 内，cn 内容改了，其他语言有没有跟」。
 *
 * 单向：只检查 cn → 其他 9 个语言（en / ja / es / pt / de / fr / ru / id / vi）。
 * 单独修 en / ja 等语言（修正翻译错别字、本地化措辞）属于合法操作，不报错。
 * ar 不在维护范围内，跳过。
 *
 * 输入：本 PR 改动的文件列表（stdin 或 --files=<path>）。每行一个路径，相对仓库根。
 *      只关心 docs/docs/<lang>/**\/*.{md,mdx}，其他全部忽略。
 *
 * 逻辑：
 * - 收集 PR 内所有改动到 changedByLang[lang] = Set<rel>
 * - cn 改了某个 .md/.mdx，每个 target 语言的同名相对路径必须也在 PR 改动里
 * - 没改 → 标 STALE
 *
 * Usage（典型）：
 *   gh pr view <pr> --json files --jq '.files[].path' | node check-i18n-coverage.mjs
 *   node check-i18n-coverage.mjs --files=changed.txt
 *
 * 退出码：发现 STALE = 1；干净 / 没有 cn 改动 = 0；输入异常 = 2。
 */
import fs from 'node:fs';
import path from 'node:path';

// 暂不参与对齐校对的语言；显式 --lang=<code> 不适用于这个脚本（输入是 PR 改动而非全语言扫描）
const SKIP_LANGS = new Set(['ar']);
// cn 之外要求同步的语言（需要跟 SKIP_LANGS 互斥）
const TARGET_LANGS = ['en', 'ja', 'es', 'pt', 'de', 'fr', 'ru', 'id', 'vi'];
const DOC_EXTS = new Set(['.md', '.mdx']);

function parseArgs(argv) {
  const args = { positional: [] };
  for (const a of argv.slice(2)) {
    const m = a.match(/^--([^=]+)=(.*)$/);
    if (m) args[m[1]] = m[2];
    else args.positional.push(a);
  }
  return args;
}

async function readChangedFiles(args) {
  if (args.files) {
    return fs.readFileSync(args.files, 'utf-8').split(/\r?\n/).filter(Boolean);
  }
  if (process.stdin.isTTY) {
    console.error('没有从 stdin 收到改动文件列表，也没传 --files=<path>');
    console.error('用法示例：gh pr view <pr> --json files --jq \'.files[].path\' | node check-i18n-coverage.mjs');
    process.exit(2);
  }
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf-8').split(/\r?\n/).filter(Boolean);
}

// 解析 docs/docs/<lang>/<rel> → { lang, rel }；其他路径返回 null
function parseDocPath(p) {
  // 兼容 Windows 反斜杠
  const normalized = p.replace(/\\/g, '/');
  const m = normalized.match(/^docs\/docs\/([^/]+)\/(.+)$/);
  if (!m) return null;
  const [, lang, rel] = m;
  const ext = path.posix.extname(rel);
  if (!DOC_EXTS.has(ext)) return null;
  return { lang, rel };
}

async function main() {
  const args = parseArgs(process.argv);
  const files = await readChangedFiles(args);

  // 按语言归集 PR 内的改动
  const changedByLang = {};
  for (const f of files) {
    const parsed = parseDocPath(f);
    if (!parsed) continue;
    if (SKIP_LANGS.has(parsed.lang)) continue;
    if (!changedByLang[parsed.lang]) changedByLang[parsed.lang] = new Set();
    changedByLang[parsed.lang].add(parsed.rel);
  }

  const cnChanges = changedByLang.cn || new Set();
  if (cnChanges.size === 0) {
    console.log('No cn doc changes in this PR; nothing to check');
    process.exit(0);
  }

  console.log(`cn changes: ${cnChanges.size} file(s)`);
  let bad = 0;
  for (const lang of TARGET_LANGS) {
    const langChanges = changedByLang[lang] || new Set();
    const missing = [...cnChanges].filter((rel) => !langChanges.has(rel)).sort();
    if (missing.length === 0) {
      console.log(`[${lang}] OK`);
      continue;
    }
    bad++;
    console.log(`[${lang}] STALE: ${missing.length} cn change(s) without ${lang} sync`);
    for (const rel of missing) console.log(`  - ${rel}`);
  }
  process.exit(bad ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(2);
});
