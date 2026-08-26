#!/usr/bin/env node
/**
 * 校对：文件树对齐检查
 *
 * 用 cn 作为基准，检查指定语言（或全部其他语言）是否有相同的文件集。
 *
 * Usage:
 *   node check-tree-alignment.mjs [docs-root] [--lang=<code>]
 *
 *   docs-root  默认 docs/docs（相对当前工作目录）
 *   --lang     可选；不传则检查所有非 cn 语言
 *
 * 输出：每个不一致语言列出 missing / extra 文件。
 * 退出码：所有语言对齐 = 0；任一语言不对齐 = 1。
 */
import fs from 'node:fs';
import path from 'node:path';

const DOC_EXTS = new Set(['.md', '.mdx', '.json', '.tsx']);
// 暂不参与对齐校对的语言；显式 --lang=<code> 仍可强制检查。
const SKIP_LANGS = new Set(['ar']);

function parseArgs(argv) {
  const args = { positional: [] };
  for (const a of argv.slice(2)) {
    const m = a.match(/^--([^=]+)=(.*)$/);
    if (m) args[m[1]] = m[2];
    else args.positional.push(a);
  }
  return args;
}

// 探测 docsRoot：兼容两种 cwd——repo root（'docs/docs'）和 docs/（'./docs'）。
// 找到带 cn/ 子目录的就用，都没有再退回到 'docs/docs' 让后续校验报清晰错。
function defaultDocsRoot() {
  for (const candidate of ['docs/docs', './docs']) {
    if (fs.existsSync(path.join(candidate, 'cn'))) return candidate;
  }
  return 'docs/docs';
}

function listDocFiles(root) {
  const out = new Set();
  function walk(dir, rel) {
    if (!fs.existsSync(dir)) return;
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, ent.name);
      const r = path.posix.join(rel, ent.name);
      if (ent.isDirectory()) {
        // 跳过构建中间产物和隐藏目录
        if (ent.name === 'node_modules' || ent.name.startsWith('.')) continue;
        walk(full, r);
      } else if (DOC_EXTS.has(path.extname(ent.name))) out.add(r);
    }
  }
  walk(root, '');
  return out;
}

function main() {
  const args = parseArgs(process.argv);
  const docsRoot = args.positional[0] || defaultDocsRoot();
  const cnRoot = path.join(docsRoot, 'cn');
  if (!fs.existsSync(cnRoot)) {
    console.error(`找不到 ${cnRoot}（请在 NocoBase 主仓库根目录或 docs/ 目录下运行，或传 docs 根的绝对路径作为第一个位置参数）`);
    process.exit(1);
  }

  const cnFiles = listDocFiles(cnRoot);
  const langs = args.lang
    ? [args.lang]
    : fs
        .readdirSync(docsRoot, { withFileTypes: true })
        .filter(
          (e) =>
            e.isDirectory() &&
            e.name !== 'cn' &&
            !SKIP_LANGS.has(e.name) &&
            !e.name.startsWith('.'),
        )
        .map((e) => e.name);

  let bad = 0;
  for (const lang of langs) {
    const langRoot = path.join(docsRoot, lang);
    if (!fs.existsSync(langRoot)) {
      console.log(`[${lang}] 目录不存在，跳过`);
      continue;
    }
    const langFiles = listDocFiles(langRoot);
    const missing = [...cnFiles].filter((f) => !langFiles.has(f)).sort();
    const extra = [...langFiles].filter((f) => !cnFiles.has(f)).sort();
    if (missing.length === 0 && extra.length === 0) {
      console.log(`[${lang}] OK (${langFiles.size} files)`);
      continue;
    }
    bad++;
    console.log(`[${lang}] DIFF: ${missing.length} missing, ${extra.length} extra`);
    for (const f of missing) console.log(`  - missing: ${f}`);
    for (const f of extra) console.log(`  + extra:   ${f}`);
  }
  process.exit(bad ? 1 : 0);
}

main();
