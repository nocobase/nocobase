#!/usr/bin/env node
/**
 * 校对：首页 index.md 区块结构对齐检查
 *
 * 比较 cn 和指定语言（或全部其他语言）的 docs/<lang>/index.md frontmatter：
 * - hero.actions 数组长度必须一致
 * - features 数组长度必须一致
 * - 每个 feature.items 数组长度必须一致（按位置匹配）
 * - 所有 link 值必须一致（按位置匹配）
 * - 不比较 title / details / name / tagline / text 等翻译文案
 * - 外链 http(s):// 整体忽略具体地址（locale-specific 营销站跨语言天然不同），
 *   只比较"有没有外链"
 * - 末尾斜杠、/index 后缀、锚点统一归一化
 *
 * 依赖：使用当前工作目录下 node_modules 里的 js-yaml。NocoBase 主仓库执行过
 * `yarn install` 后默认已包含，无需额外安装。
 *
 * Usage:
 *   node check-home-alignment.mjs [docs-root] [--lang=<code>]
 *
 *   docs-root  默认 docs/docs（相对当前工作目录）
 *   --lang     可选；不传则检查所有非 cn / 非 ar 语言
 *
 * 退出码：全部对齐 = 0；任一不齐 = 1。
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const SKIP_LANGS = new Set(['ar']);

// 探测 docsRoot：兼容两种 cwd——repo root（'docs/docs'）和 docs/（'./docs'）。
// 找到带 cn/ 子目录的就用，都没有再退回到 'docs/docs' 让后续校验报清晰错。
function defaultDocsRoot() {
  for (const candidate of ['docs/docs', './docs']) {
    if (fs.existsSync(path.join(candidate, 'cn'))) return candidate;
  }
  return 'docs/docs';
}

// js-yaml 从 cwd 链路上的多个候选位置解析。脚本随仓库分发不带 deps，
// js-yaml 来自 yarn install 装下来的 docs/node_modules（rspress 间接 dep）。
// 兼容两种 cwd：repo root（找 docs/node_modules）和 docs/（找 ./node_modules）。
function loadJsYaml() {
  const candidates = [
    path.join(process.cwd(), '__pkg__'),                  // <cwd>/node_modules
    path.join(process.cwd(), 'docs', '__pkg__'),          // <cwd>/docs/node_modules
  ];
  let lastErr;
  for (const c of candidates) {
    try {
      return createRequire(c)('js-yaml');
    } catch (err) {
      lastErr = err;
    }
  }
  console.error('找不到 js-yaml。请在 NocoBase 主仓库根目录或 docs/ 目录下运行（确保已执行 yarn install）。');
  console.error(`原始错误：${lastErr?.message ?? '(unknown)'}`);
  process.exit(1);
}
const yaml = loadJsYaml();

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
  if (typeof link !== 'string') return link;
  if (isExternalLink(link)) return '__EXTERNAL__';
  const hashIdx = link.indexOf('#');
  let s = hashIdx === -1 ? link : link.slice(0, hashIdx);
  if (s.length > 1 && s.endsWith('/')) s = s.slice(0, -1);
  if (s.endsWith('/index')) s = s.slice(0, -'/index'.length);
  return s;
}

// 提取 frontmatter 并解析。失败返回 null。
function readFrontmatter(file) {
  const content = fs.readFileSync(file, 'utf-8');
  const m = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return null;
  return yaml.load(m[1]);
}

// 提炼可比较结构
function summarize(fm) {
  const out = { heroActions: [], features: [] };
  if (fm && fm.hero && Array.isArray(fm.hero.actions)) {
    out.heroActions = fm.hero.actions.map((a) => normalizeLink(a?.link));
  }
  if (fm && Array.isArray(fm.features)) {
    out.features = fm.features.map((f) => ({
      items: Array.isArray(f?.items) ? f.items.map((it) => normalizeLink(it?.link)) : [],
    }));
  }
  return out;
}

function diff(cn, lang) {
  const issues = [];

  if (cn.heroActions.length !== lang.heroActions.length) {
    issues.push(`hero.actions 数量不一致 (cn=${cn.heroActions.length}, lang=${lang.heroActions.length})`);
  } else {
    for (let i = 0; i < cn.heroActions.length; i++) {
      if (cn.heroActions[i] !== lang.heroActions[i]) {
        issues.push(`hero.actions[${i}].link: cn=${cn.heroActions[i] ?? '∅'} lang=${lang.heroActions[i] ?? '∅'}`);
      }
    }
  }

  if (cn.features.length !== lang.features.length) {
    issues.push(`features 数量不一致 (cn=${cn.features.length}, lang=${lang.features.length})`);
    return issues;
  }

  for (let i = 0; i < cn.features.length; i++) {
    const cnItems = cn.features[i].items;
    const langItems = lang.features[i].items;
    if (cnItems.length !== langItems.length) {
      issues.push(`features[${i}].items 数量不一致 (cn=${cnItems.length}, lang=${langItems.length})`);
      continue;
    }
    for (let j = 0; j < cnItems.length; j++) {
      if (cnItems[j] !== langItems[j]) {
        issues.push(`features[${i}].items[${j}].link: cn=${cnItems[j] ?? '∅'} lang=${langItems[j] ?? '∅'}`);
      }
    }
  }
  return issues;
}

function main() {
  const args = parseArgs(process.argv);
  const docsRoot = args.positional[0] || defaultDocsRoot();
  const cnFile = path.join(docsRoot, 'cn', 'index.md');
  if (!fs.existsSync(cnFile)) {
    console.error(`找不到 ${cnFile}（请在 NocoBase 主仓库根目录或 docs/ 目录下运行，或传 docs 根的绝对路径作为第一个位置参数）`);
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

  let cnFm;
  try {
    cnFm = readFrontmatter(cnFile);
    if (!cnFm) throw new Error('未发现 frontmatter');
  } catch (err) {
    console.error(`解析 ${cnFile} 失败：${err.message}`);
    process.exit(1);
  }
  const cnSummary = summarize(cnFm);

  let bad = 0;
  for (const lang of langs) {
    const langFile = path.join(docsRoot, lang, 'index.md');
    if (!fs.existsSync(langFile)) {
      console.log(`[${lang}] MISSING: ${langFile}`);
      bad++;
      continue;
    }
    try {
      const langFm = readFrontmatter(langFile);
      if (!langFm) {
        console.log(`[${lang}] PARSE ERROR: 未发现 frontmatter`);
        bad++;
        continue;
      }
      const langSummary = summarize(langFm);
      const issues = diff(cnSummary, langSummary);
      if (issues.length === 0) {
        console.log(`[${lang}] OK (${cnSummary.features.length} features, ${cnSummary.heroActions.length} hero actions)`);
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
