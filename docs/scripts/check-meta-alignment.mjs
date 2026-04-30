#!/usr/bin/env node
/**
 * 校对：_meta.json 结构对齐检查
 *
 * 比较 cn 和指定语言（或全部其他语言）的 _meta.json：所有 link / name 集合是否一致。
 * 不比较 label 文本（label 翻译本来就不一样）。
 * 不比较 link 的锚点 `#xxx` 部分——锚点跟着翻译后的标题走，跨语言天然不同。
 * 末尾斜杠归一化：`/foo/` 与 `/foo` 视为同一个 link。
 * `/foo/index` 等价于 `/foo`（rspress 目录视为 index 页）。
 * 外链 `http(s)://...` 直接忽略——跨语言常常是 locale-specific（营销站、外部教程等）。
 *
 * Usage:
 *   node check-meta-alignment.mjs [docs-root] [--lang=<code>]
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
  // 去掉锚点（锚点跟翻译后的标题走，跨语言天然不同）
  const hashIdx = link.indexOf('#');
  let s = hashIdx === -1 ? link : link.slice(0, hashIdx);
  // 统一去掉末尾斜杠：/foo 和 /foo/ 在 rspress 里等价
  if (s.length > 1 && s.endsWith('/')) s = s.slice(0, -1);
  // /foo/index 与 /foo 也等价（rspress 把目录视为 index）
  if (s.endsWith('/index')) s = s.slice(0, -'/index'.length);
  return s;
}

function collectKeys(node, out) {
  if (Array.isArray(node)) {
    for (const item of node) collectKeys(item, out);
    return;
  }
  if (node && typeof node === 'object') {
    if (typeof node.link === 'string') {
      // 外链跨语言天然不同（locale-specific 的营销站、社交媒体、外部教程等），直接忽略
      if (!isExternalLink(node.link)) out.add(normalizeLink(node.link));
    } else if (typeof node.name === 'string') {
      out.add(node.name);
    }
    if (Array.isArray(node.items)) collectKeys(node.items, out);
  }
}

function readMetaKeys(file) {
  const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
  const keys = new Set();
  collectKeys(data, keys);
  return keys;
}

function listMetaFiles(root) {
  // 用 path.posix.join 拼相对路径，确保 Windows 上输出和 Set key 都是正斜杠，
  // 跟 cn/lang 拼回绝对路径用 path.join 时也不会出问题。
  const out = [];
  function walk(dir, rel) {
    if (!fs.existsSync(dir)) return;
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, ent.name);
      const r = path.posix.join(rel, ent.name);
      if (ent.isDirectory()) {
        if (ent.name === 'node_modules' || ent.name.startsWith('.')) continue;
        walk(full, r);
      } else if (ent.name === '_meta.json') out.push(r);
    }
  }
  walk(root, '');
  return out;
}

function main() {
  const args = parseArgs(process.argv);
  const docsRoot = args.positional[0] || 'docs/docs';
  const cnRoot = path.join(docsRoot, 'cn');
  const cnMetas = listMetaFiles(cnRoot);

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

    let langBad = 0;
    for (const meta of cnMetas) {
      const cnFile = path.join(cnRoot, meta);
      const langFile = path.join(langRoot, meta);
      if (!fs.existsSync(langFile)) {
        console.log(`[${lang}] MISSING: ${meta}`);
        langBad++;
        continue;
      }
      try {
        const cnKeys = readMetaKeys(cnFile);
        const langKeys = readMetaKeys(langFile);
        const onlyCn = [...cnKeys].filter((k) => !langKeys.has(k));
        const onlyLang = [...langKeys].filter((k) => !cnKeys.has(k));
        if (onlyCn.length === 0 && onlyLang.length === 0) continue;
        langBad++;
        console.log(`[${lang}] DIFF: ${meta}`);
        for (const k of onlyCn) console.log(`  - cn-only:   ${k}`);
        for (const k of onlyLang) console.log(`  + lang-only: ${k}`);
      } catch (err) {
        console.log(`[${lang}] PARSE ERROR: ${meta} — ${err.message}`);
        langBad++;
      }
    }
    if (langBad === 0) console.log(`[${lang}] OK (${cnMetas.length} _meta.json files)`);
    else bad++;
  }
  process.exit(bad ? 1 : 0);
}

main();
