import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function normalizeEarlyCliLocale(value) {
  const normalized = String(value ?? '')
    .trim()
    .replace(/\..*$/, '')
    .replace(/_/g, '-')
    .toLowerCase();

  if (normalized === 'zh' || normalized.startsWith('zh-')) {
    return 'zh-CN';
  }

  if (normalized === 'en' || normalized.startsWith('en-')) {
    return 'en-US';
  }

  return undefined;
}

function readConfiguredEarlyCliLocale() {
  try {
    const cliHomeRoot = String(process.env.NB_CLI_ROOT ?? '').trim() || os.homedir();
    const configPath = path.join(cliHomeRoot, '.nocobase', 'config.json');
    const content = fs.readFileSync(configPath, 'utf8');
    const parsed = JSON.parse(content);
    return normalizeEarlyCliLocale(parsed?.settings?.locale);
  } catch {
    return undefined;
  }
}

export function detectEarlyCliLocale() {
  const candidates = [
    process.env.NB_LOCALE,
    readConfiguredEarlyCliLocale(),
    process.env.LC_ALL,
    process.env.LC_MESSAGES,
    process.env.LANG,
    Intl.DateTimeFormat().resolvedOptions().locale,
  ];

  for (const candidate of candidates) {
    const locale = normalizeEarlyCliLocale(candidate);
    if (locale) {
      return locale;
    }
  }

  return 'en-US';
}

function getEarlyLocalePathValue(input, key) {
  let current = input;
  for (const part of key.split('.')) {
    if (!current || typeof current !== 'object' || !Object.prototype.hasOwnProperty.call(current, part)) {
      return undefined;
    }
    current = current[part];
  }
  return typeof current === 'string' ? current : undefined;
}

function readEarlyLocaleMessages(locale) {
  const moduleDir = path.dirname(fileURLToPath(import.meta.url));
  const packageRoot = path.resolve(moduleDir, '..');
  const localePaths = [
    path.join(packageRoot, 'src', 'locale', `${locale}.json`),
    path.join(packageRoot, 'dist', 'locale', `${locale}.json`),
  ];

  for (const localePath of localePaths) {
    try {
      return JSON.parse(fs.readFileSync(localePath, 'utf8'));
    } catch {
      // Try the next runtime layout.
    }
  }

  return undefined;
}

export function translateEarlyCli(key, fallback, locale = detectEarlyCliLocale()) {
  const messages = readEarlyLocaleMessages(locale);
  return getEarlyLocalePathValue(messages, key) ?? fallback;
}
