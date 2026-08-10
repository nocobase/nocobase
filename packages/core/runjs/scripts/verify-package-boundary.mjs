#!/usr/bin/env node

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const requiredRunJSEntries = [
  '@nocobase/runjs',
  '@nocobase/runjs/compiler',
  '@nocobase/runjs/js-template/client',
  '@nocobase/runjs/workspace/client-v2',
  '@nocobase/runjs/workspace/server',
];
const codeMirrorPackages = [
  '@codemirror/lang-html',
  '@codemirror/lang-javascript',
  '@codemirror/language',
  '@lezer/common',
];

async function main() {
  const options = parseOptions(process.argv.slice(2));
  const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
  const repositoryRoot = path.resolve(
    options.repositoryRoot || process.env.NOCOBASE_PACKAGE_BOUNDARY_ROOT || path.join(scriptDirectory, '../../../..'),
  );
  const runJSRoot = path.join(repositoryRoot, 'packages/core/runjs');
  const pluginRoot = path.join(repositoryRoot, 'packages/plugins/@nocobase/plugin-js-template');
  const runJSManifest = readJson(path.join(runJSRoot, 'package.json'));
  const pluginManifest = readJson(path.join(pluginRoot, 'package.json'));
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'nocobase-runjs-package-boundary-'));

  try {
    const packDirectory = path.join(temporaryRoot, 'packs');
    fs.mkdirSync(packDirectory, { recursive: true });

    const runJSPack = packPackage(runJSRoot, packDirectory, runJSManifest);
    const pluginPack = packPackage(pluginRoot, packDirectory, pluginManifest);
    const resolvedVersions = resolveCodeMirrorVersions(repositoryRoot);
    const consumerRoot = createConsumer(
      temporaryRoot,
      { runJS: runJSPack.tarballPath, plugin: pluginPack.tarballPath },
      resolvedVersions,
    );

    runCommand(
      npmExecutable(),
      ['install', '--ignore-scripts', '--legacy-peer-deps', '--no-audit', '--no-fund', '--package-lock=false'],
      { cwd: consumerRoot, label: 'install the packed consumer' },
    );

    const runtimeReport = await runConsumerRuntimeSmoke(consumerRoot);
    const typeResolutionModes = runConsumerTypeSmoke(consumerRoot);

    const report = {
      packages: {
        runjs: toPackageReport(runJSPack),
        plugin: toPackageReport(pluginPack),
      },
      requiredEntries: runtimeReport.requiredEntries,
      typescript: {
        importedEntries: requiredRunJSEntries,
        resolutionModes: typeResolutionModes,
        passed: true,
      },
      browserRoot: runtimeReport.browserRoot,
      installations: runtimeReport.installations,
      codeMirror: runtimeReport.codeMirror,
    };

    if (options.json) {
      process.stdout.write(JSON.stringify(report) + '\n');
    } else {
      process.stdout.write(
        [
          'verified package boundary',
          'RunJS pack files: ' + report.packages.runjs.fileCount,
          'JS Template pack files: ' + report.packages.plugin.fileCount,
          'consumer imports: ' + report.requiredEntries.length,
          'RunJS installations: ' + report.installations.runjs.length,
          'CodeMirror parser Lezer identities: ' + report.codeMirror.resolvedLezerRoots.length,
          'CodeMirror mixed parser: passed',
        ].join('\n') + '\n',
      );
    }
  } finally {
    if (process.env.NOCOBASE_PACKAGE_BOUNDARY_KEEP_TMP === '1') {
      process.stderr.write('kept package-boundary fixture at ' + temporaryRoot + '\n');
    } else {
      fs.rmSync(temporaryRoot, { force: true, recursive: true });
    }
  }
}

function parseOptions(args) {
  const options = { json: false, repositoryRoot: undefined };
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === '--json') {
      options.json = true;
      continue;
    }
    if (argument === '--repository-root') {
      const value = args[index + 1];
      if (!value) {
        throw new Error('--repository-root requires a path');
      }
      options.repositoryRoot = value;
      index += 1;
      continue;
    }
    throw new Error('Unknown option: ' + argument);
  }
  return options;
}

function packPackage(packageRoot, packDirectory, manifest) {
  const exportTargets = collectExportTargets(manifest.exports);
  if (!exportTargets.length) {
    throw new Error((manifest.name || packageRoot) + ' does not declare package exports');
  }
  assertTargetsExist(packageRoot, exportTargets, manifest.name || packageRoot, 'build output');

  const output = runCommand(
    npmExecutable(),
    ['pack', '--json', '--ignore-scripts', '--pack-destination', packDirectory],
    { cwd: packageRoot, label: 'pack ' + (manifest.name || packageRoot) },
  );
  const packResult = parseNpmPackOutput(output);
  const files = packResult.files.map((file) => normalizePackagePath(file.path));
  const packagedFiles = new Set(files);
  const missingTargets = exportTargets.filter((target) => !packagedFiles.has(normalizeExportTarget(target)));
  if (missingTargets.length) {
    throw new Error((manifest.name || packageRoot) + ' pack is missing exported files: ' + missingTargets.join(', '));
  }

  const tarballPath = path.join(packDirectory, packResult.filename);
  if (!fs.statSync(tarballPath).isFile() || fs.statSync(tarballPath).size === 0) {
    throw new Error((manifest.name || packageRoot) + ' did not produce a usable tarball');
  }

  return {
    exportTargets: exportTargets.map(normalizeExportTarget),
    files,
    manifest,
    tarballPath,
  };
}

function parseNpmPackOutput(output) {
  const firstBracket = output.indexOf('[');
  const lastBracket = output.lastIndexOf(']');
  if (firstBracket < 0 || lastBracket < firstBracket) {
    throw new Error('npm pack did not return JSON metadata');
  }
  const parsed = JSON.parse(output.slice(firstBracket, lastBracket + 1));
  if (!Array.isArray(parsed) || parsed.length !== 1 || !parsed[0]?.filename || !Array.isArray(parsed[0].files)) {
    throw new Error('npm pack returned unexpected metadata');
  }
  return parsed[0];
}

function collectExportTargets(exportsField) {
  const targets = new Set();
  const visit = (value) => {
    if (typeof value === 'string') {
      targets.add(value);
      return;
    }
    if (value && typeof value === 'object') {
      Object.values(value).forEach(visit);
    }
  };
  visit(exportsField);
  return [...targets];
}

function assertTargetsExist(packageRoot, targets, packageName, boundary) {
  const missingTargets = targets.filter(
    (target) => !fs.existsSync(path.join(packageRoot, normalizeExportTarget(target))),
  );
  if (missingTargets.length) {
    throw new Error(
      packageName +
        ' ' +
        boundary +
        ' is missing exported files: ' +
        missingTargets.join(', ') +
        '. Run the package build first.',
    );
  }
}

function createConsumer(temporaryRoot, tarballs, resolvedVersions) {
  const consumerRoot = path.join(temporaryRoot, 'consumer');
  const stubRoot = path.join(temporaryRoot, 'stubs');
  fs.mkdirSync(consumerRoot, { recursive: true });
  createPeerStubs(stubRoot);

  const dependencies = {
    '@nocobase/client-v2': fileDependency(consumerRoot, path.join(stubRoot, 'client-v2')),
    '@nocobase/database': fileDependency(consumerRoot, path.join(stubRoot, 'database')),
    '@nocobase/flow-engine': fileDependency(consumerRoot, path.join(stubRoot, 'flow-engine')),
    '@nocobase/plugin-js-template': fileDependency(consumerRoot, tarballs.plugin),
    '@nocobase/runjs': fileDependency(consumerRoot, tarballs.runJS),
    react: '18.2.0',
    'react-dom': '18.2.0',
  };
  for (const [packageName, version] of Object.entries(resolvedVersions)) {
    dependencies[packageName] = version;
  }

  writeJson(path.join(consumerRoot, 'package.json'), {
    name: 'runjs-package-boundary-consumer',
    private: true,
    type: 'module',
    version: '1.0.0',
    dependencies,
  });
  return consumerRoot;
}

function createPeerStubs(stubRoot) {
  createStubPackage(
    path.join(stubRoot, 'client-v2'),
    '@nocobase/client-v2',
    [
      'const noop = () => undefined;',
      'module.exports = {',
      '  CodeEditor: noop,',
      '  diagnoseRunJS: async () => ({ diagnostics: [] }),',
      '  registerRunJSRegistryHost: noop,',
      '  registerRunJSRuntimeHost: noop,',
      '  useApp: () => ({}),',
      '  useFullscreenOverlay: () => ({}),',
      '};',
    ].join('\n'),
  );
  createStubPackage(
    path.join(stubRoot, 'database'),
    '@nocobase/database',
    [
      'class UniqueConstraintError extends Error {}',
      'const defineCollection = (options) => options;',
      'module.exports = { UniqueConstraintError, defineCollection };',
    ].join('\n'),
  );
  createStubPackage(
    path.join(stubRoot, 'flow-engine'),
    '@nocobase/flow-engine',
    [
      'class FlowContext {}',
      'const noop = () => undefined;',
      'module.exports = {',
      '  FlowContext,',
      '  normalizeRunJSValue: (value) => value,',
      '  subscribeRunJSRenderDiagnostics: () => noop,',
      '  tExpr: (key) => key,',
      '  useFlowContext: () => ({}),',
      '  useFlowEngine: () => undefined,',
      '};',
    ].join('\n'),
  );
}

function createStubPackage(packageRoot, name, source) {
  fs.mkdirSync(packageRoot, { recursive: true });
  writeJson(path.join(packageRoot, 'package.json'), {
    name,
    version: '2.0.0',
    main: './index.cjs',
    types: './index.d.ts',
  });
  fs.writeFileSync(path.join(packageRoot, 'index.cjs'), source + '\n');
  fs.writeFileSync(path.join(packageRoot, 'index.d.ts'), 'export {};\n');
}

async function runConsumerRuntimeSmoke(consumerRoot) {
  const runtimeSmokePath = path.join(consumerRoot, 'runtime-smoke.mjs');
  fs.writeFileSync(runtimeSmokePath, createRuntimeSmokeSource(requiredRunJSEntries));
  const runtimeModule = await import(pathToFileURL(runtimeSmokePath).href);
  if (!runtimeModule.default) {
    throw new Error('The runtime consumer smoke did not return a report');
  }
  return runtimeModule.default;
}

function createRuntimeSmokeSource(requiredEntries) {
  return [
    "import fs from 'node:fs';",
    "import { createRequire, isBuiltin } from 'node:module';",
    "import path from 'node:path';",
    "import { fileURLToPath } from 'node:url';",
    "import { html, htmlLanguage } from '@codemirror/lang-html';",
    "import { javascript, javascriptLanguage } from '@codemirror/lang-javascript';",
    "import { LanguageSupport } from '@codemirror/language';",
    "import { parseMixed } from '@lezer/common';",
    "import { build } from 'esbuild';",
    '',
    'const consumerRoot = path.dirname(fileURLToPath(import.meta.url));',
    "const consumerRequire = createRequire(path.join(consumerRoot, 'package.json'));",
    'const requiredSpecifiers = ' + JSON.stringify(requiredEntries) + ';',
    'const requiredEntries = [];',
    'for (const specifier of requiredSpecifiers) {',
    '  const resolvedPath = consumerRequire.resolve(specifier);',
    '  const namespace = await import(specifier);',
    '  const exportCount = Object.keys(namespace).length;',
    '  if (!exportCount) throw new Error(specifier + " did not expose a runtime module");',
    '  requiredEntries.push({',
    '    specifier,',
    "    resolvedPath: path.relative(consumerRoot, resolvedPath).replaceAll(path.sep, '/'),",
    '    exportCount,',
    '  });',
    '}',
    '',
    "const browserEntry = path.join(consumerRoot, 'browser-root.mjs');",
    'fs.writeFileSync(browserEntry,',
    '  "import * as runjs from \'@nocobase/runjs\';\\n" +',
    '  "globalThis.__runjsBoundaryValue = runjs;\\n",',
    ');',
    'const blockedModules = [];',
    'const boundaryPlugin = {',
    "  name: 'runjs-browser-root-boundary',",
    '  setup(buildContext) {',
    '    buildContext.onResolve({ filter: /.*/ }, (args) => {',
    '      if (isBuiltin(args.path) || /^@nocobase\\/runjs\\/workspace\\/(?:client|client-v2|server)(?:\\/|$)/u.test(args.path) || /^@nocobase\\/plugin-js-template(?:\\/|$)/u.test(args.path)) {',
    '        blockedModules.push(args.path);',
    '        return { errors: [{ text: "RunJS browser root reached prohibited module " + args.path }] };',
    '      }',
    '      return undefined;',
    '    });',
    '  },',
    '};',
    'const bundle = await build({',
    '  bundle: true,',
    '  entryPoints: [browserEntry],',
    "  format: 'esm',",
    '  logLevel: "silent",',
    '  metafile: true,',
    "  platform: 'browser',",
    '  plugins: [boundaryPlugin],',
    '  write: false,',
    '});',
    'const bundleInputs = Object.keys(bundle.metafile.inputs);',
    'const prohibitedInputs = bundleInputs.filter((input) =>',
    '  /(?:^|[\\/])@nocobase[\\/]runjs[\\/]lib[\\/](?:server\\.js|workspace[\\/](?:client|client-v2|server)(?:[\\/]|$))/u.test(input) ||',
    '  /(?:^|[\\/])@nocobase[\\/]plugin-js-template(?:[\\/]|$)/u.test(input) ||',
    '  /(?:^|[\\/])node_modules[\\/](?:browserify-fs|crypto-browserify|path-browserify)(?:[\\/]|$)/u.test(input),',
    ');',
    'if (blockedModules.length || prohibitedInputs.length) {',
    '  throw new Error("RunJS browser root crossed its package boundary: " + [...blockedModules, ...prohibitedInputs].join(", "));',
    '}',
    '',
    'const baseJavascript = javascript({ jsx: false, typescript: false });',
    'const htmlSupport = html();',
    'const mixedLanguage = javascriptLanguage.configure({',
    '  wrap: parseMixed((node) =>',
    "    node.type.name === 'TemplateString'",
    '      ? { parser: htmlLanguage.parser, overlay: [{ from: node.from + 1, to: node.to - 1 }] }',
    '      : null,',
    '  ),',
    '});',
    'const languageSupport = new LanguageSupport(mixedLanguage, [baseJavascript.support, htmlSupport.support]);',
    'const templateDelimiter = String.fromCharCode(96);',
    "const mixedSource = 'const view = ' + templateDelimiter + '<section>ok</section>' + templateDelimiter + ';';",
    'const mixedTree = languageSupport.language.parser.parse(mixedSource);',
    'if (mixedTree.length !== mixedSource.length) throw new Error("CodeMirror mixed parser did not consume the source");',
    '',
    "const runJSInstallations = collectInstallations(path.join(consumerRoot, 'node_modules'), '@nocobase', 'runjs');",
    "const lezerInstallations = collectInstallations(path.join(consumerRoot, 'node_modules'), '@lezer', 'common');",
    'if (runJSInstallations.length !== 1) {',
    '  throw new Error("Expected one @nocobase/runjs installation, received " + JSON.stringify(runJSInstallations));',
    '}',
    "const pluginRequire = createRequire(consumerRequire.resolve('@nocobase/plugin-js-template/package.json'));",
    "const rootRunJS = fs.realpathSync(path.dirname(consumerRequire.resolve('@nocobase/runjs/package.json')));",
    "const pluginRunJS = fs.realpathSync(path.dirname(pluginRequire.resolve('@nocobase/runjs/package.json')));",
    'if (rootRunJS !== pluginRunJS) throw new Error("The plugin resolved a second @nocobase/runjs instance");',
    '',
    'const lezerResolvers = [consumerRequire];',
    "for (const packageName of ['@codemirror/lang-html', '@codemirror/lang-javascript', '@codemirror/language']) {",
    '  lezerResolvers.push(createRequire(consumerRequire.resolve(packageName)));',
    '}',
    'const resolvedLezerRoots = [...new Set(lezerResolvers.map((resolver) =>',
    "  fs.realpathSync(path.dirname(findPackageJson(resolver.resolve('@lezer/common'), '@lezer/common'))),",
    '))];',
    'if (resolvedLezerRoots.length !== 1) {',
    '  throw new Error("CodeMirror resolved incompatible @lezer/common instances: " + resolvedLezerRoots.join(", "));',
    '}',
    '',
    'function findPackageJson(entryPath, expectedName) {',
    '  let directory = path.dirname(entryPath);',
    '  while (directory !== path.dirname(directory)) {',
    "    const packageJsonPath = path.join(directory, 'package.json');",
    '    if (fs.existsSync(packageJsonPath)) {',
    '      const manifest = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));',
    '      if (manifest.name === expectedName) return packageJsonPath;',
    '    }',
    '    directory = path.dirname(directory);',
    '  }',
    '  throw new Error("Could not locate package.json for " + expectedName);',
    '}',
    '',
    'function collectInstallations(initialNodeModules, scope, packageName) {',
    '  const queue = [initialNodeModules];',
    '  const visitedNodeModules = new Set();',
    '  const installations = new Map();',
    '  while (queue.length) {',
    '    const nodeModules = queue.shift();',
    '    if (!fs.existsSync(nodeModules)) continue;',
    '    const realNodeModules = fs.realpathSync(nodeModules);',
    '    if (visitedNodeModules.has(realNodeModules)) continue;',
    '    visitedNodeModules.add(realNodeModules);',
    '    const scopedDirectory = path.join(nodeModules, scope);',
    '    if (fs.existsSync(scopedDirectory)) {',
    "      const targetManifest = path.join(scopedDirectory, packageName, 'package.json');",
    '      if (fs.existsSync(targetManifest)) {',
    '        const packageRoot = fs.realpathSync(path.dirname(targetManifest));',
    '        const manifest = JSON.parse(fs.readFileSync(targetManifest, "utf8"));',
    '        installations.set(packageRoot, manifest.version);',
    '      }',
    '    }',
    '    for (const entry of fs.readdirSync(nodeModules, { withFileTypes: true })) {',
    '      if (!entry.isDirectory()) continue;',
    '      if (entry.name.startsWith("@")) {',
    '        const scopeDirectory = path.join(nodeModules, entry.name);',
    '        for (const scopedEntry of fs.readdirSync(scopeDirectory, { withFileTypes: true })) {',
    '          if (scopedEntry.isDirectory()) queue.push(path.join(scopeDirectory, scopedEntry.name, "node_modules"));',
    '        }',
    '      } else {',
    '        queue.push(path.join(nodeModules, entry.name, "node_modules"));',
    '      }',
    '    }',
    '  }',
    '  return [...installations].map(([packageRoot, version]) => ({',
    "    path: path.relative(consumerRoot, packageRoot).replaceAll(path.sep, '/'),",
    '    version,',
    '  }));',
    '}',
    '',
    'export default {',
    '  requiredEntries,',
    '  browserRoot: { blockedModules, inputs: bundleInputs, prohibitedInputs },',
    '  installations: { runjs: runJSInstallations, lezerCommon: lezerInstallations },',
    '  codeMirror: { mixedParserPassed: true, resolvedLezerRoots: resolvedLezerRoots.map((root) => path.relative(consumerRoot, root).replaceAll(path.sep, "/")) },',
    '};',
    '',
  ].join('\n');
}

function runConsumerTypeSmoke(consumerRoot) {
  fs.writeFileSync(
    path.join(consumerRoot, 'types-smoke.ts'),
    requiredRunJSEntries
      .map((specifier, index) => 'import * as entry' + index + ' from ' + JSON.stringify(specifier) + ';')
      .concat(
        'export const importedEntries = [' +
          requiredRunJSEntries.map((_specifier, index) => 'entry' + index).join(', ') +
          '] as const;',
        '',
      )
      .join('\n'),
  );
  const resolutionModes = [
    { name: 'NodeNext', module: 'NodeNext', moduleResolution: 'NodeNext' },
    { name: 'Node', module: 'CommonJS', moduleResolution: 'Node' },
  ];
  for (const mode of resolutionModes) {
    const configName = 'tsconfig.' + mode.name.toLowerCase() + '.json';
    writeJson(path.join(consumerRoot, configName), {
      compilerOptions: {
        lib: ['ES2022', 'DOM'],
        module: mode.module,
        moduleResolution: mode.moduleResolution,
        noEmit: true,
        skipLibCheck: true,
        strict: true,
        target: 'ES2022',
      },
      files: ['./types-smoke.ts'],
    });
    runCommand(localExecutable(consumerRoot, 'tsc'), ['--project', configName], {
      cwd: consumerRoot,
      label: 'type-check the packed consumer with ' + mode.name + ' resolution',
    });
  }
  return resolutionModes.map((mode) => mode.name);
}

function resolveCodeMirrorVersions(repositoryRoot) {
  const repositoryRequire = createRequire(path.join(repositoryRoot, 'package.json'));
  const versions = {};
  for (const packageName of codeMirrorPackages) {
    const packageJsonPath = findPackageJson(repositoryRequire.resolve(packageName), packageName);
    const manifest = readJson(packageJsonPath);
    if (!manifest.version) {
      throw new Error(packageName + ' is missing its installed version');
    }
    versions[packageName] = manifest.version;
  }

  const clientV2Manifest = readJson(path.join(repositoryRoot, 'packages/core/client-v2/package.json'));
  for (const packageName of codeMirrorPackages) {
    if (!clientV2Manifest.dependencies?.[packageName]) {
      throw new Error('@nocobase/client-v2 must declare ' + packageName + ' for the final-install smoke');
    }
  }
  return versions;
}

function findPackageJson(entryPath, expectedName) {
  let directory = path.dirname(entryPath);
  while (directory !== path.dirname(directory)) {
    const packageJsonPath = path.join(directory, 'package.json');
    if (fs.existsSync(packageJsonPath) && readJson(packageJsonPath).name === expectedName) {
      return packageJsonPath;
    }
    directory = path.dirname(directory);
  }
  throw new Error('Could not locate package.json for ' + expectedName);
}

function toPackageReport(pack) {
  return {
    name: pack.manifest.name,
    version: pack.manifest.version,
    tarball: path.basename(pack.tarballPath),
    fileCount: pack.files.length,
    files: pack.files,
    exportTargets: pack.exportTargets,
  };
}

function runCommand(command, args, options) {
  const result = spawnSync(command, args, {
    cwd: options.cwd,
    encoding: 'utf8',
    env: process.env,
    maxBuffer: 20 * 1024 * 1024,
  });
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(
      options.label + ' failed with exit code ' + result.status + '\n' + (result.stdout || '') + (result.stderr || ''),
    );
  }
  return result.stdout || '';
}

function fileDependency(fromDirectory, target) {
  const relativePath = path.relative(fromDirectory, target).replaceAll(path.sep, '/');
  return 'file:' + (relativePath.startsWith('.') ? relativePath : './' + relativePath);
}

function normalizeExportTarget(target) {
  return normalizePackagePath(target.replace(/^\.\//u, ''));
}

function normalizePackagePath(value) {
  return value.replaceAll('\\', '/');
}

function npmExecutable() {
  return process.platform === 'win32' ? 'npm.cmd' : 'npm';
}

function localExecutable(root, name) {
  return path.join(root, 'node_modules', '.bin', process.platform === 'win32' ? name + '.cmd' : name);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + '\n');
}

main().catch((error) => {
  process.stderr.write((error instanceof Error ? error.stack || error.message : String(error)) + '\n');
  process.exitCode = 1;
});
