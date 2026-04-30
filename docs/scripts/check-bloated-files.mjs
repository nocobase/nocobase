#!/usr/bin/env node
/**
 * 检测：翻译膨胀文件
 *
 * 某些 AI 翻译工具会给 markdown 表格塞几十万空格做"视觉对齐"，把单行炸到 100KB-1MB，
 * rspress 编译会卡死。这个脚本用双信号识别这种文件：
 *
 *   1. 单行长度 > MAX_LINE_LEN 且比 CN 同名文件多 LINE_SLACK 字符 → BLOATED
 *   2. 文件大小 > CN 同名文件 SIZE_FACTOR 倍                       → OVERSIZED
 *
 * Usage:
 *   node check-bloated-files.mjs [docs-root] [--lang=<code>]
 *
 * 输出：每个有问题的文件一行。
 * 退出码：发现任何膨胀 = 1；干净 = 0。
 */
import fs from 'node:fs';
import path from 'node:path';

const MAX_LINE_LEN = 1500;
const LINE_SLACK = 500;
const SIZE_FACTOR = 5;
const MIN_SIZE_TO_CHECK = 8000;
const MIN_CN_SIZE = 500;
// 暂不参与膨胀检测的语言；显式 --lang=<code> 仍可强制检查。
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

function listMdFiles(root) {
  const out = [];
  function walk(dir, rel) {
    if (!fs.existsSync(dir)) return;
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, ent.name);
      const r = path.posix.join(rel, ent.name);
      if (ent.isDirectory()) walk(full, r);
      else if (ent.name.endsWith('.md') || ent.name.endsWith('.mdx')) out.push(r);
    }
  }
  walk(root, '');
  return out;
}

function maxLineLength(file) {
  // 读字节数较小的文件用同步读全文；大文件可能本身就是膨胀的，整读也无所谓。
  const content = fs.readFileSync(file, 'utf-8');
  let max = 0;
  let cur = 0;
  for (let i = 0; i < content.length; i++) {
    if (content.charCodeAt(i) === 10 /* \n */) {
      if (cur > max) max = cur;
      cur = 0;
    } else cur++;
  }
  if (cur > max) max = cur;
  return max;
}

function main() {
  const args = parseArgs(process.argv);
  const docsRoot = args.positional[0] || defaultDocsRoot();
  const cnRoot = path.join(docsRoot, 'cn');
  if (!fs.existsSync(cnRoot)) {
    console.error(`找不到 ${cnRoot}（请在 NocoBase 主仓库根目录或 docs/ 目录下运行，或传 docs 根的绝对路径作为第一个位置参数）`);
    process.exit(1);
  }

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
    if (!fs.existsSync(langRoot)) continue;
    const files = listMdFiles(langRoot);
    for (const rel of files) {
      const langFile = path.join(langRoot, rel);
      const cnFile = path.join(cnRoot, rel);
      if (!fs.existsSync(cnFile)) continue;

      const size = fs.statSync(langFile).size;
      const cnSize = fs.statSync(cnFile).size;
      const maxLen = maxLineLength(langFile);
      const cnMaxLen = maxLineLength(cnFile);

      const bloated =
        maxLen > MAX_LINE_LEN && maxLen > cnMaxLen + LINE_SLACK;
      const oversized =
        size > MIN_SIZE_TO_CHECK &&
        cnSize > MIN_CN_SIZE &&
        size > cnSize * SIZE_FACTOR;

      if (bloated || oversized) {
        bad++;
        const tags = [];
        if (bloated) tags.push('BLOATED');
        if (oversized) tags.push('OVERSIZED');
        console.log(
          `[${tags.join('+')}] ${lang}/${rel} (size ${size} vs cn ${cnSize}, max line ${maxLen} vs cn ${cnMaxLen})`,
        );
      }
    }
  }
  if (bad === 0) console.log('clean');
  process.exit(bad ? 1 : 0);
}

main();
