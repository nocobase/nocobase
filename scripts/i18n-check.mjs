import { readdir, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { tsImport } from 'tsx/esm/api';

const scriptPath = fileURLToPath(import.meta.url);
const defaultRepoRoot = path.resolve(path.dirname(scriptPath), '..');
const SOURCE_LOCALE = 'en-US';

export const SUPPORTED_LOCALES = [
  'en-US',
  'zh-CN',
  'zh-TW',
  'ja-JP',
  'es-ES',
  'pt-BR',
  'fr-FR',
  'de-DE',
  'vi-VN',
  'id-ID',
];

const help = `Check locale resources and lazy loader manifests.

Usage: pnpm i18n:check [options]

Options:
  --source <locale>   Locale to compare against (default: ${SOURCE_LOCALE})
  --strict            Exit non-zero when a resource or loader is incomplete
  -h, --help          Show this help

Plugins (including examples) and libraries must provide all ten supported
languages. Application templates keep their own language lists. Imported and
spread resources are evaluated, including interpolation, markup and plurals.`;

export function parseI18nCheckArgs(args) {
  const options = { help: false, source: SOURCE_LOCALE, strict: false };
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === '--help' || argument === '-h') options.help = true;
    else if (argument === '--strict') options.strict = true;
    else if (argument === '--source') {
      const value = args[++index];
      if (!value || value.startsWith('-'))
        throw new Error('--source requires a value.');
      options.source = value;
    } else throw new Error(`Unknown option: ${argument}`);
  }
  return options;
}

export function flattenValues(source, prefix = '', result = {}) {
  for (const [key, value] of Object.entries(source)) {
    const name = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object') flattenValues(value, name, result);
    else result[name] = value;
  }
  return result;
}

export function flattenKeys(source, prefix = '') {
  return Object.keys(flattenValues(source, prefix));
}

async function collectLocaleDirectories(directory, found = []) {
  for (const entry of await readdir(directory, { withFileTypes: true }).catch(
    () => [],
  )) {
    if (
      !entry.isDirectory() ||
      ['node_modules', 'dist', 'tests', 'skills'].includes(entry.name)
    )
      continue;
    const child = path.join(directory, entry.name);
    if (entry.name === 'locales') found.push(child);
    else await collectLocaleDirectories(child, found);
  }
  return found;
}

async function exists(file) {
  return access(file).then(
    () => true,
    () => false,
  );
}

async function resource(file) {
  return (await tsImport(pathToFileURL(file).href, import.meta.url)).default;
}

const pluralPattern = /_(zero|one|two|few|many|other)$/u;
const placeholders = (value) =>
  [...value.matchAll(/\{\{(.*?)\}\}/gu)].map((match) => match[1]).sort();
// Compare tag names and attributes as well as order; translated text between tags is intentionally ignored.
const markup = (value) => value.match(/<\/?[A-Za-z][^>]*>|`[^`]*`/gu) ?? [];
const multilineMarkers = (value) =>
  value.includes('\n')
    ? value
        .split('\n')
        .map((line) => /^(\s*(?:#{1,6} |[-*+] |\d+\. ))/u.exec(line)?.[1] ?? '')
    : [];
const syntaxTokens = (value) =>
  (
    value.match(
      /#[\p{L}\p{N}_-]+|@stage\d+|\[(?:high|medium|low|urgent)\]/gu,
    ) ?? []
  ).map((token) => (token.startsWith('#') ? '#label' : token));

const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);

export function compareResources(source, translated, locale) {
  const expected = flattenValues(source);
  const actual = flattenValues(translated);
  const missing = Object.keys(expected).filter((key) => !(key in actual));
  const extra = [];
  const invalid = [];
  const pluralBases = new Set(
    Object.keys(expected)
      .filter((key) => key.endsWith('_other'))
      .map((key) => key.slice(0, -6)),
  );
  for (const [key, value] of Object.entries(actual)) {
    const base = key.replace(pluralPattern, '');
    const sourceValue =
      expected[key] ??
      (pluralPattern.test(key) && pluralBases.has(base)
        ? expected[`${base}_other`]
        : undefined);
    if (sourceValue === undefined) {
      extra.push(key);
      continue;
    }
    if (
      typeof value !== 'string' ||
      (!value.trim() && String(sourceValue).trim())
    ) {
      invalid.push(`${key}: expected a non-empty string`);
      continue;
    }
    if (!same(placeholders(String(sourceValue)), placeholders(value)))
      invalid.push(`${key}: interpolation differs`);
    if (!same(markup(String(sourceValue)), markup(value)))
      invalid.push(`${key}: markup differs`);
    if (
      multilineMarkers(String(sourceValue)).some(Boolean) &&
      !same(multilineMarkers(String(sourceValue)), multilineMarkers(value))
    )
      invalid.push(`${key}: multiline formatting differs`);
    if (
      /\[(?:high|medium|low|urgent)\]|@stage\d+/u.test(String(sourceValue)) &&
      !same(syntaxTokens(String(sourceValue)), syntaxTokens(value))
    )
      invalid.push(`${key}: syntax tokens differ`);
  }
  for (const base of pluralBases) {
    for (const category of new Intl.PluralRules(locale).resolvedOptions()
      .pluralCategories) {
      const key = `${base}_${category}`;
      if (!(key in actual) && !missing.includes(key)) missing.push(key);
    }
  }
  return { missing, extra, invalid };
}

export async function i18nCheck({
  repoRoot = defaultRepoRoot,
  source = SOURCE_LOCALE,
  strict = false,
} = {}) {
  const reports = [];
  const directories = await collectLocaleDirectories(
    path.join(repoRoot, 'packages'),
  );
  let checked = 0;
  for (const directory of directories) {
    const files = await readdir(directory);
    if (!files.includes(`${source}.ts`)) continue;
    checked++;
    const relative = path.relative(repoRoot, directory);
    const required = /^packages\/(plugins|libs|examples)\//u.test(
      relative.split(path.sep).join('/'),
    );
    const languages = [
      ...new Set([
        ...(required ? SUPPORTED_LOCALES : []),
        ...files
          .filter((file) => /^[a-z]{2}-[A-Z]{2}\.ts$/u.test(file))
          .map((file) => file.slice(0, -3)),
      ]),
    ];
    const sourceResource = await resource(path.join(directory, `${source}.ts`));
    const manifestPath = path.join(directory, 'index.ts');
    // Shared catalogues need no manifest; the client/server catalogues that compose them do.
    const needsManifest = /\/(client|server)\/locales$/u.test(
      relative.split(path.sep).join('/'),
    );
    const hasManifest = await exists(manifestPath);
    const manifest = hasManifest ? await resource(manifestPath) : undefined;
    for (const locale of languages) {
      const report = {
        directory: relative,
        locale,
        missing: [],
        extra: [],
        invalid: [],
      };
      if (!files.includes(`${locale}.ts`)) {
        report.missing = flattenKeys(sourceResource);
        report.invalid.push('locale file is missing');
      } else {
        const translation = await resource(
          path.join(directory, `${locale}.ts`),
        );
        Object.assign(
          report,
          compareResources(sourceResource, translation, locale),
        );
        if (hasManifest) {
          if (typeof manifest[locale] !== 'function')
            report.invalid.push('lazy loader is missing');
          else {
            const module = await manifest[locale]();
            if (!same(module.default ?? module, translation))
              report.invalid.push('loader returns a different resource');
          }
        }
      }
      if (needsManifest && !hasManifest)
        report.invalid.push('locale manifest is missing');
      if (report.missing.length || report.extra.length || report.invalid.length)
        reports.push(report);
    }
  }
  return { reports, strict, checked };
}

async function main() {
  try {
    const options = parseI18nCheckArgs(process.argv.slice(2));
    if (options.help) {
      console.log(help);
      return;
    }
    const { reports, checked } = await i18nCheck(options);
    for (const report of reports) {
      console.log(`\n${report.directory} — ${report.locale}`);
      for (const key of report.missing) console.log(`  missing: ${key}`);
      for (const key of report.extra) console.log(`  unknown: ${key}`);
      for (const problem of report.invalid)
        console.log(`  invalid: ${problem}`);
    }
    console.log(
      `\nChecked ${checked} locale directories: ${reports.length} incomplete locale(s).`,
    );
    if (options.strict && reports.length) process.exitCode = 1;
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

if (process.argv[1] === scriptPath) await main();
