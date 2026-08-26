#!/usr/bin/env node
/**
 * 校对：弃用文档引用检查
 *
 * 根据规则表扫描文档中的弃用命令、链接、配置项或其他迁移残留。
 * 这是一套通用机制；新增规则时，只需要修改 `deprecated-doc-rules.mjs`。
 *
 * Usage:
 *   node check-deprecated-doc-refs.mjs [docs-root] [--lang=<code>]
 */
import fs from 'node:fs';
import path from 'node:path';
import { DEPRECATED_DOC_RULES } from './deprecated-doc-rules.mjs';

const DOC_EXTS = new Set(['.md', '.mdx', '.json']);
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

function defaultDocsRoot() {
  for (const candidate of ['docs/docs', './docs']) {
    if (fs.existsSync(path.join(candidate, 'cn'))) return candidate;
  }
  return 'docs/docs';
}

function* walkFiles(dir) {
  if (!fs.existsSync(dir)) return;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === 'node_modules' || ent.name.startsWith('.')) continue;
      yield* walkFiles(full);
      continue;
    }
    if (DOC_EXTS.has(path.extname(ent.name))) {
      yield full;
    }
  }
}

function main() {
  const args = parseArgs(process.argv);
  const docsRoot = args.positional[0] || defaultDocsRoot();
  const langs = args.lang
    ? [args.lang]
    : fs
        .readdirSync(docsRoot, { withFileTypes: true })
        .filter(
          (e) =>
            e.isDirectory() &&
            !SKIP_LANGS.has(e.name) &&
            !e.name.startsWith('.'),
        )
        .map((e) => e.name);

  let bad = 0;

  for (const lang of langs) {
    const langRoot = path.join(docsRoot, lang);
    if (!fs.existsSync(langRoot)) continue;

    const problems = [];
    for (const file of walkFiles(langRoot)) {
      const text = fs.readFileSync(file, 'utf8');
      const rel = path.relative(docsRoot, file).split(path.sep).join('/');
      for (const rule of DEPRECATED_DOC_RULES) {
        const matches = [...text.matchAll(rule.pattern)];
        for (const match of matches) {
          const before = text.slice(0, match.index);
          const line = before.split('\n').length;
          problems.push(`${rel}:${line}: ${rule.id} (${rule.description})`);
        }
      }
    }

    if (problems.length === 0) {
      console.log(`[${lang}] OK`);
      continue;
    }

    bad++;
    console.log(`[${lang}] DIFF: ${problems.length} deprecated reference(s)`);
    for (const problem of problems) {
      console.log(`  - ${problem}`);
    }
  }

  process.exit(bad ? 1 : 0);
}

main();
