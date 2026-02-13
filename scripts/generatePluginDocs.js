#!/usr/bin/env node
/*
 * Generate plugin docs for all locales based on package.json metadata in
 * packages/plugins/@nocobase and packages/pro-plugins/@nocobase.
 *
 * Output: <lang>/plugins/@nocobase/<plugin>/index.md
 *
 * Rules:
 * - CN: displayName.zh-CN, description.zh-CN (fallback to EN)
 * - All others (ar, cs, de, en, es, fr, he, hi, id, it, ja, ko, nl, pl, pt, ru, sv, th, tr, uk, vi): displayName, description (EN)
 * - supportedVersions: ["2.x"] (default)
 * - isFree:        true for community plugins; false for pro-plugins
 * - defaultInstalled: false by default (do not guess)
 * - Do not overwrite existing files
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const COMMUNITY_DIR = path.join(ROOT, 'packages', 'plugins', '@nocobase');
const PRO_DIR = path.join(ROOT, 'packages', 'pro-plugins', '@nocobase');

const DOCS_ROOT = path.join(ROOT, 'docs', 'docs');
const LOCALES = [
  'ar',
  'cn',
  'cs',
  'de',
  'en',
  'es',
  'fr',
  'he',
  'hi',
  'id',
  'it',
  'ja',
  'ko',
  'nl',
  'pl',
  'pt',
  'ru',
  'sv',
  'th',
  'tr',
  'uk',
  'vi',
];

// Load preset deprecated list (optional)
const PRESET_PKG = path.join(ROOT, 'packages', 'presets', 'nocobase', 'package.json');
const PRESET_JSON = readJsonSafe(PRESET_PKG) || {};
const PRESET_DEPRECATED = new Set(Array.isArray(PRESET_JSON.deprecated) ? PRESET_JSON.deprecated : []);

function readJsonSafe(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (e) {
    return null;
  }
}

function yamlEscape(str) {
  if (typeof str !== 'string') return '';
  // Escape backslashes and double quotes for safe YAML double-quoted scalars
  return str.replace(/\\/g, '\\\\').replace(/\"/g, '\\"').replace(/"/g, '\\"');
}

function listPluginDirs(baseDir) {
  if (!fs.existsSync(baseDir)) return [];
  return fs
    .readdirSync(baseDir)
    .map((name) => path.join(baseDir, name))
    .filter((full) => fs.existsSync(path.join(full, 'package.json')));
}

function toFrontmatter({
  displayName,
  packageName,
  description,
  isFree,
  builtIn,
  defaultEnabled,
  deprecated,
  supportedVersions,
  points,
  editionLevel,
}) {
  if (isFree) {
    editionLevel = 0;
  }
  const lines = [
    '---',
    `displayName: "${yamlEscape(displayName)}"`,
    `packageName: '${packageName}'`,
    ...(Array.isArray(supportedVersions) && supportedVersions.length
      ? ['supportedVersions:', ...supportedVersions.map((v) => `  - ${v}`)]
      : []),
    'description: |',
    ...String(description || '')
      .split('\n')
      .map((line) => `  ${line}`),
    `isFree: ${isFree ? 'true' : 'false'}`,
    `builtIn: ${builtIn ? 'true' : 'false'}`,
    `defaultEnabled: ${defaultEnabled ? 'true' : 'false'}`,
    ...(deprecated ? ['deprecated: true'] : []),
    ...(points !== undefined && points !== null ? [`points: ${points}`] : []),
    ...(editionLevel !== undefined && editionLevel !== null ? [`editionLevel: ${editionLevel}`] : []),
    '---',
    '',
    `# ${displayName}`,
    '',
    ...(deprecated
      ? [
          // visible deprecation note
          packageName && packageName.startsWith('@nocobase/')
            ? displayName && /[\u4e00-\u9fa5]/.test(displayName)
              ? '> 注意：本插件已废弃（deprecated）。'
              : '> Note: This plugin is deprecated.'
            : '> Note: This plugin is deprecated.',
          '',
        ]
      : []),
  ];
  return lines.join('\n');
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function generateForPlugin(dir, { isPro }) {
  const pkgJson = readJsonSafe(path.join(dir, 'package.json'));
  if (!pkgJson) return;
  const packageName = pkgJson.name || path.basename(dir);
  // Only handle @nocobase scoped plugins
  if (!packageName || !packageName.startsWith('@nocobase/')) return;
  // Skip if no displayName defined in package.json, and delete existing docs if present
  if (!pkgJson['displayName']) {
    const pluginNameToDelete = packageName.split('/')[1];
    const targetBaseDel = path.join('@nocobase', pluginNameToDelete);
    for (const lang of LOCALES) {
      const fileDel = path.join(DOCS_ROOT, lang, 'plugins', targetBaseDel, 'index.md');
      if (fs.existsSync(fileDel)) {
        try {
          fs.unlinkSync(fileDel);
          // eslint-disable-next-line no-console
          console.log('Deleted', fileDel);
        } catch (e) {
          // eslint-disable-next-line no-console
          console.warn('Failed to delete', fileDel, e.message);
        }
      }
    }
    // eslint-disable-next-line no-console
    console.log('Skip (no displayName):', packageName);
    return;
  }

  const pluginName = packageName.split('/')[1];
  const displayNameEN = pkgJson['displayName'];
  const displayNameCN = pkgJson['displayName.zh-CN'] || displayNameEN;
  const descriptionEN = pkgJson['description'] || '';
  const descriptionCN = pkgJson['description.zh-CN'] || descriptionEN;
  const isFree = !isPro;
  const builtIn = !isPro || !!pkgJson?.nocobase?.builtIn; // community built-in OR explicit flag
  const defaultEnabled = !!pkgJson?.nocobase?.defaultEnabled;
  const deprecated = !!(pkgJson?.nocobase?.deprecated || pkgJson?.deprecated || PRESET_DEPRECATED.has(packageName));
  const supportedVersions = Array.isArray(pkgJson?.nocobase?.supportedVersions)
    ? pkgJson.nocobase.supportedVersions.filter(Boolean)
    : undefined;
  const points = pkgJson?.nocobase?.points;
  const editionLevel = pkgJson?.nocobase?.editionLevel;

  const targetBase = path.join('@nocobase', pluginName);

  for (const lang of LOCALES) {
    const outDir = path.join(DOCS_ROOT, lang, 'plugins', targetBase);
    ensureDir(outDir);
    const outFile = path.join(outDir, 'index.md');

    const useCN = lang === 'cn';
    const content = toFrontmatter({
      displayName: useCN ? displayNameCN : displayNameEN,
      packageName,
      description: useCN ? descriptionCN : descriptionEN,
      isFree,
      builtIn,
      defaultEnabled,
      deprecated,
      supportedVersions,
      points,
      editionLevel,
    });
    fs.writeFileSync(outFile, content, 'utf8');
    // eslint-disable-next-line no-console
    console.log('Written', outFile);
  }
}

function main() {
  const community = listPluginDirs(COMMUNITY_DIR);
  const pro = listPluginDirs(PRO_DIR);

  community.forEach((dir) => generateForPlugin(dir, { isPro: false }));
  pro.forEach((dir) => generateForPlugin(dir, { isPro: true }));
}

if (require.main === module) {
  main();
}
