#!/usr/bin/env node
/**
 * 校对：_nav.json 顶部导航对齐检查
 *
 * 比较 cn 和指定语言（或全部其他语言）的 docs/<lang>/_nav.json：
 * - 顶层条目数必须一致
 * - 每个条目（按位置匹配）的 link 必须一致
 * - 嵌套 items（如有）按相同规则递归比较
 * - text 不比较（翻译差异天然存在）
 * - 外链 http(s):// 整体忽略具体地址，只比较"有没有外链"——locale-specific 营销站
 *   （比如 nocobase.com/cn/ vs nocobase.com/）跨语言天然不同
 * - 末尾斜杠、/index 后缀、锚点统一归一化（同 check-meta-alignment）
 *
 * Usage:
 *   node check-nav-alignment.mjs [docs-root] [--lang=<code>]
 *
 *   docs-root  默认 docs/docs（相对当前工作目录）
 *   --lang     可选；不传则检查所有非 cn / 非 ar 语言
 *
 * 退出码：全部对齐 = 0；任一不齐 = 1。
 */
import fs from 'node:fs';
import path from 'node:path';

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

function isExternalLink(link) {
  return /^https?:\/\//i.test(link);
}

function normalizeLink(link) {
  const hashIdx = link.indexOf('#');
  let s = hashIdx === -1 ? link : link.slice(0, hashIdx);
  if (s.length > 1 && s.endsWith('/')) s = s.slice(0, -1);
  if (s.endsWith('/index')) s = s.slice(0, -'/index'.length);
  return s;
}

// 把 nav 节点规约成可比较结构：{link?, items?[]}
// 外链统一标记为 __EXTERNAL__（要求两边都得是外链，但具体 URL 可不同）
function summarize(nav) {
  if (!Array.isArray(nav)) return [];
  return nav.map((entry) => {
    const out = {};
    if (typeof entry.link === 'string') {
      out.link = isExternalLink(entry.link) ? '__EXTERNAL__' : normalizeLink(entry.link);
    }
    if (Array.isArray(entry.items)) {
      out.items = summarize(entry.items);
    }
    return out;
  });
}

function diff(a, b, pathLabel = '') {
  const issues = [];
  if (a.length !== b.length) {
    issues.push(`${pathLabel || '<root>'}: 条目数不一致 (cn=${a.length}, lang=${b.length})`);
    return issues;
  }
  for (let i = 0; i < a.length; i++) {
    const itemPath = `${pathLabel}[${i}]`;
    const ai = a[i];
    const bi = b[i];
    if (ai.link !== bi.link) {
      issues.push(`${itemPath}.link: cn=${ai.link ?? '∅'} lang=${bi.link ?? '∅'}`);
    }
    const aHas = Array.isArray(ai.items);
    const bHas = Array.isArray(bi.items);
    if (aHas !== bHas) {
      issues.push(`${itemPath}.items: cn=${aHas ? `array(${ai.items.length})` : '∅'} lang=${bHas ? `array(${bi.items.length})` : '∅'}`);
    } else if (aHas && bHas) {
      issues.push(...diff(ai.items, bi.items, `${itemPath}.items`));
    }
  }
  return issues;
}

function main() {
  const args = parseArgs(process.argv);
  const docsRoot = args.positional[0] || 'docs/docs';
  const cnFile = path.join(docsRoot, 'cn', '_nav.json');
  if (!fs.existsSync(cnFile)) {
    console.error(`找不到 ${cnFile}（请在 NocoBase 主仓库根目录运行，或传入 docs 根的绝对路径）`);
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

  let cnNav;
  try {
    cnNav = JSON.parse(fs.readFileSync(cnFile, 'utf-8'));
  } catch (err) {
    console.error(`解析 ${cnFile} 失败：${err.message}`);
    process.exit(1);
  }
  const cnSummary = summarize(cnNav);

  let bad = 0;
  for (const lang of langs) {
    const langFile = path.join(docsRoot, lang, '_nav.json');
    if (!fs.existsSync(langFile)) {
      console.log(`[${lang}] MISSING: ${langFile}`);
      bad++;
      continue;
    }
    try {
      const langNav = JSON.parse(fs.readFileSync(langFile, 'utf-8'));
      const langSummary = summarize(langNav);
      const issues = diff(cnSummary, langSummary);
      if (issues.length === 0) {
        console.log(`[${lang}] OK (${cnNav.length} top-level entries)`);
        continue;
      }
      bad++;
      console.log(`[${lang}] DIFF:`);
      for (const issue of issues) console.log(`  - ${issue}`);
    } catch (err) {
      console.log(`[${lang}] PARSE ERROR: ${err.message}`);
      bad++;
    }
  }
  process.exit(bad ? 1 : 0);
}

main();
