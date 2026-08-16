#!/usr/bin/env node

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import fs from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import spawn from 'cross-spawn';

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
  const clientV2Root = path.join(repositoryRoot, 'packages/core/client-v2');
  const runJSManifest = readJson(path.join(runJSRoot, 'package.json'));
  const pluginManifest = readJson(path.join(pluginRoot, 'package.json'));
  const clientV2Manifest = readJson(path.join(clientV2Root, 'package.json'));
  if (options.realClientV2 && process.platform === 'win32') {
    throw new Error('--real-client-v2 is not supported on Windows');
  }
  const verifyRealClientTopology = options.realClientV2;
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'nocobase-runjs-package-boundary-'));

  try {
    const packDirectory = path.join(temporaryRoot, 'packs');
    fs.mkdirSync(packDirectory, { recursive: true });

    const runJSPack = packPackage(runJSRoot, packDirectory, runJSManifest);
    const pluginPack = packPackage(pluginRoot, packDirectory, pluginManifest);
    assertNoNestedBundledDependencies(pluginPack);
    const clientV2Pack = verifyRealClientTopology
      ? packPackage(
          clientV2Root,
          packDirectory,
          clientV2Manifest,
          collectExportTargets(clientV2Manifest.exports?.['.']),
        )
      : undefined;
    const importableEntries = [
      ...collectImportableExportEntries(runJSManifest),
      ...collectImportableExportEntries(pluginManifest),
    ];
    const requiredEntries = importableEntries.map((entry) => entry.specifier);
    const resolvedVersions = resolveCodeMirrorVersions(repositoryRoot);
    if (verifyRealClientTopology) {
      resolvedVersions.jsdom = resolveInstalledPackageVersion(repositoryRoot, 'jsdom');
      for (const packageName of collectRequiredPackages(path.join(clientV2Root, 'lib/index.js'))) {
        if (packageName.startsWith('@nocobase/') || packageName === 'react' || packageName === 'react-dom') {
          continue;
        }
        resolvedVersions[packageName] ??=
          clientV2Manifest.dependencies?.[packageName] || resolveInstalledPackageVersion(repositoryRoot, packageName);
      }
    }
    const consumerRoot = createConsumer(
      temporaryRoot,
      {
        runJS: runJSPack.tarballPath,
        plugin: pluginPack.tarballPath,
        clientV2: clientV2Pack?.tarballPath,
      },
      resolvedVersions,
      {
        repositoryVersion: runJSManifest.version,
        verifyRealClientTopology,
      },
    );

    runCommand(
      npmExecutable(),
      ['install', '--ignore-scripts', '--legacy-peer-deps', '--no-audit', '--no-fund', '--package-lock=false'],
      { cwd: consumerRoot, label: 'install the packed consumer' },
    );

    const runtimeReport = await runConsumerRuntimeSmoke(consumerRoot, requiredEntries, verifyRealClientTopology);
    const typeResolutionModes = runConsumerTypeSmoke(consumerRoot, requiredEntries);

    const report = {
      packages: {
        runjs: toPackageReport(runJSPack),
        plugin: toPackageReport(pluginPack),
        ...(clientV2Pack ? { clientV2: toPackageReport(clientV2Pack) } : {}),
      },
      mode: verifyRealClientTopology ? 'real-client-v2' : 'quick-packed-consumer',
      importableEntries,
      requiredEntries: runtimeReport.requiredEntries,
      typescript: {
        importedEntries: requiredEntries,
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
          ...(report.packages.clientV2 ? ['client-v2 pack files: ' + report.packages.clientV2.fileCount] : []),
          'consumer mode: ' + report.mode,
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
  const options = { json: false, realClientV2: false, repositoryRoot: undefined };
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === '--json') {
      options.json = true;
      continue;
    }
    if (argument === '--real-client-v2') {
      options.realClientV2 = true;
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

function packPackage(packageRoot, packDirectory, manifest, exportTargets = collectExportTargets(manifest.exports)) {
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

function assertNoNestedBundledDependencies(pack) {
  const bundledDependencyRoot = 'dist/node_modules/';
  const nestedDependencyFiles = pack.files.filter(
    (file) =>
      file.startsWith(bundledDependencyRoot) && file.slice(bundledDependencyRoot.length).includes('/node_modules/'),
  );
  if (nestedDependencyFiles.length) {
    throw new Error(
      `${pack.manifest.name} pack contains install-topology-dependent nested dependencies: ${nestedDependencyFiles.join(
        ', ',
      )}`,
    );
  }
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

function collectImportableExportEntries(manifest) {
  if (!manifest.name || !manifest.exports) {
    throw new Error((manifest.name || 'Package') + ' must declare a name and exports');
  }

  const exportEntries =
    manifest.exports && typeof manifest.exports === 'object' && !Array.isArray(manifest.exports)
      ? Object.entries(manifest.exports).some(([subpath]) => subpath.startsWith('.'))
        ? Object.entries(manifest.exports)
        : [['.', manifest.exports]]
      : [['.', manifest.exports]];

  const importableEntries = [];
  for (const [subpath, exportValue] of exportEntries) {
    if (subpath.includes('*')) {
      throw new Error(manifest.name + ' package-boundary verifier cannot enumerate wildcard export ' + subpath);
    }

    const runtimeTargets = [
      ...new Set(
        ['import', 'require', 'default']
          .flatMap((condition) => collectExportConditionTargets(exportValue, condition))
          .filter(isJavaScriptExportTarget),
      ),
    ];
    const typeTargets = [
      ...new Set(collectExportConditionTargets(exportValue, 'types').filter(isDeclarationExportTarget)),
    ];

    if (!runtimeTargets.length && !typeTargets.length) {
      continue;
    }
    if (!runtimeTargets.length || !typeTargets.length) {
      throw new Error(
        manifest.name +
          ' export ' +
          subpath +
          ' must provide both JavaScript and types conditions for consumer verification',
      );
    }

    importableEntries.push({
      packageName: manifest.name,
      runtimeTargets: runtimeTargets.map(normalizeExportTarget),
      specifier: subpath === '.' ? manifest.name : manifest.name + subpath.slice(1),
      subpath,
      typeTargets: typeTargets.map(normalizeExportTarget),
    });
  }

  if (!importableEntries.length) {
    throw new Error(manifest.name + ' does not expose any JavaScript and types package entries');
  }
  return importableEntries;
}

function collectExportConditionTargets(value, expectedCondition) {
  if (!value || typeof value !== 'object') {
    return [];
  }

  const targets = [];
  for (const [condition, conditionValue] of Object.entries(value)) {
    if (condition === expectedCondition) {
      collectStringTargets(conditionValue, targets);
      continue;
    }
    if (!condition.startsWith('.')) {
      targets.push(...collectExportConditionTargets(conditionValue, expectedCondition));
    }
  }
  return targets;
}

function collectStringTargets(value, targets) {
  if (typeof value === 'string') {
    targets.push(value);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => collectStringTargets(item, targets));
    return;
  }
  if (value && typeof value === 'object') {
    Object.values(value).forEach((item) => collectStringTargets(item, targets));
  }
}

function isJavaScriptExportTarget(target) {
  return /\.(?:cjs|js|mjs)$/u.test(target);
}

function isDeclarationExportTarget(target) {
  return /\.d\.(?:cts|mts|ts)$/u.test(target);
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

function createConsumer(temporaryRoot, tarballs, resolvedVersions, options) {
  const consumerRoot = path.join(temporaryRoot, 'consumer');
  const stubRoot = path.join(temporaryRoot, 'stubs');
  fs.mkdirSync(consumerRoot, { recursive: true });
  const peerStubs = createPeerStubs(stubRoot, options);

  const dependencies = {
    '@nocobase/database': fileDependency(consumerRoot, path.join(stubRoot, 'database')),
    '@nocobase/flow-engine': fileDependency(consumerRoot, path.join(stubRoot, 'flow-engine')),
    '@nocobase/plugin-js-template': fileDependency(consumerRoot, tarballs.plugin),
    '@nocobase/runjs': fileDependency(consumerRoot, tarballs.runJS),
    react: '18.2.0',
    'react-dom': '18.2.0',
  };
  for (const [packageName, packageRoot] of Object.entries(peerStubs)) {
    dependencies[packageName] = fileDependency(consumerRoot, packageRoot);
  }
  for (const [packageName, version] of Object.entries(resolvedVersions)) {
    dependencies[packageName] ??= version;
  }
  dependencies['@nocobase/client-v2'] = fileDependency(
    consumerRoot,
    options.verifyRealClientTopology ? tarballs.clientV2 : path.join(stubRoot, 'client-v2'),
  );

  writeJson(path.join(consumerRoot, 'package.json'), {
    name: 'runjs-package-boundary-consumer',
    private: true,
    type: 'module',
    version: '1.0.0',
    dependencies,
  });
  return consumerRoot;
}

function createPeerStubs(stubRoot, options) {
  const peerStubs = {};
  const addStub = (directoryName, packageName, source = createGenericPeerStubSource()) => {
    const packageRoot = path.join(stubRoot, directoryName);
    createStubPackage(packageRoot, packageName, source, options.repositoryVersion);
    peerStubs[packageName] = packageRoot;
  };

  if (!options.verifyRealClientTopology) {
    addStub(
      'client-v2',
      '@nocobase/client-v2',
      [
        createGenericPeerStubSource(),
        'Object.assign(module.exports, {',
        '  CodeEditor: noop,',
        '  diagnoseRunJS: async () => ({ diagnostics: [] }),',
        '  registerRunJSRegistryHost: noop,',
        '  registerRunJSRuntimeHost: noop,',
        '  useApp: () => ({}),',
        '  useFullscreenOverlay: () => ({}),',
        '});',
      ].join('\n'),
    );
  }
  addStub(
    'database',
    '@nocobase/database',
    [
      createGenericPeerStubSource(),
      'class UniqueConstraintError extends Error {}',
      'const defineCollection = (options) => options;',
      'Object.assign(module.exports, { UniqueConstraintError, defineCollection });',
    ].join('\n'),
  );
  addStub(
    'flow-engine',
    '@nocobase/flow-engine',
    [
      createGenericPeerStubSource(),
      'class FlowContext {}',
      'Object.assign(module.exports, {',
      '  FlowContext,',
      '  normalizeRunJSValue: (value) => value,',
      '  subscribeRunJSRenderDiagnostics: () => noop,',
      '  tExpr: (key) => key,',
      '  useFlowContext: () => ({}),',
      '  useFlowEngine: () => undefined,',
      '});',
    ].join('\n'),
  );
  for (const [directoryName, packageName] of [
    ['ant-design-icons', '@ant-design/icons'],
    ['ant-design-pro-layout', '@ant-design/pro-layout'],
    ['emotion-css', '@emotion/css'],
    ['antd', 'antd'],
    ['acl', '@nocobase/acl'],
    ['actions', '@nocobase/actions'],
    ['client', '@nocobase/client'],
    ['emotion-css', '@emotion/css'],
    ['evaluators', '@nocobase/evaluators'],
    ['plugin-environment-variables', '@nocobase/plugin-environment-variables'],
    ['plugin-flow-engine', '@nocobase/plugin-flow-engine'],
    ['resourcer', '@nocobase/resourcer'],
    ['sdk', '@nocobase/sdk'],
    ['server', '@nocobase/server'],
    ['shared', '@nocobase/shared'],
    ['test', '@nocobase/test'],
    ['utils', '@nocobase/utils'],
    ['formily-antd-v5', '@formily/antd-v5'],
    ['formily-react', '@formily/react'],
    ['react-i18next', 'react-i18next'],
    ['react-router-dom', 'react-router-dom'],
  ]) {
    addStub(directoryName, packageName);
  }

  const utilsRoot = peerStubs['@nocobase/utils'];
  fs.writeFileSync(path.join(utilsRoot, 'client.cjs'), createGenericPeerStubSource() + '\n');
  const utilsManifest = readJson(path.join(utilsRoot, 'package.json'));
  utilsManifest.exports = {
    '.': {
      types: './index.d.ts',
      import: './index.cjs',
      require: './index.cjs',
    },
    './client': {
      types: './index.d.ts',
      import: './client.cjs',
      require: './client.cjs',
    },
  };
  writeJson(path.join(utilsRoot, 'package.json'), utilsManifest);

  const formilyAntdRoot = peerStubs['@formily/antd-v5'];
  const formilyAntdManifest = readJson(path.join(formilyAntdRoot, 'package.json'));
  formilyAntdManifest.version = '1.2.3';
  writeJson(path.join(formilyAntdRoot, 'package.json'), formilyAntdManifest);
  const formilyBuiltinsRoot = path.join(formilyAntdRoot, 'esm/__builtins__');
  fs.mkdirSync(formilyBuiltinsRoot, { recursive: true });
  fs.writeFileSync(path.join(formilyBuiltinsRoot, 'index.js'), "module.exports = require('../../index.cjs');\n");

  const evaluatorsRoot = peerStubs['@nocobase/evaluators'];
  fs.writeFileSync(path.join(evaluatorsRoot, 'client.cjs'), createGenericPeerStubSource() + '\n');
  const evaluatorsManifest = readJson(path.join(evaluatorsRoot, 'package.json'));
  evaluatorsManifest.exports = {
    '.': {
      types: './index.d.ts',
      import: './index.cjs',
      require: './index.cjs',
    },
    './client': {
      types: './index.d.ts',
      import: './client.cjs',
      require: './client.cjs',
    },
  };
  writeJson(path.join(evaluatorsRoot, 'package.json'), evaluatorsManifest);

  return peerStubs;
}

function createGenericPeerStubSource() {
  return [
    'const noop = () => undefined;',
    'const stubTarget = function NocoBasePeerStub() { return stub; };',
    'const stub = new Proxy(stubTarget, {',
    '  get(target, property) {',
    "    if (property === 'then') return undefined;",
    '    return Reflect.has(target, property) ? Reflect.get(target, property) : stub;',
    '  },',
    '  apply() { return stub; },',
    '  construct() { return stub; },',
    '});',
    'module.exports = stub;',
  ].join('\n');
}

function createStubPackage(packageRoot, name, source, version) {
  fs.mkdirSync(packageRoot, { recursive: true });
  writeJson(path.join(packageRoot, 'package.json'), {
    name,
    version,
    main: './index.cjs',
    types: './index.d.ts',
  });
  fs.writeFileSync(path.join(packageRoot, 'index.cjs'), source + '\n');
  fs.writeFileSync(path.join(packageRoot, 'index.d.ts'), 'export {};\n');
}

async function runConsumerRuntimeSmoke(consumerRoot, requiredEntries, verifyRealClientTopology) {
  const runtimeSmokePath = path.join(consumerRoot, 'runtime-smoke.mjs');
  fs.writeFileSync(runtimeSmokePath, createRuntimeSmokeSource(requiredEntries, verifyRealClientTopology));
  let runtimeModule;
  try {
    runtimeModule = await import(pathToFileURL(runtimeSmokePath).href);
  } catch (error) {
    throw new Error(
      'Packed consumer runtime import failed: ' +
        (error instanceof Error ? error.stack || error.message : String(error)),
      { cause: error },
    );
  }
  if (!runtimeModule.default) {
    throw new Error('The runtime consumer smoke did not return a report');
  }
  return runtimeModule.default;
}

function createRuntimeSmokeSource(requiredEntries, verifyRealClientTopology) {
  return [
    "import fs from 'node:fs';",
    "import { createRequire, isBuiltin } from 'node:module';",
    "import path from 'node:path';",
    "import { fileURLToPath } from 'node:url';",
    "import { html, htmlLanguage } from '@codemirror/lang-html';",
    "import { javascript, javascriptLanguage } from '@codemirror/lang-javascript';",
    "import { LanguageSupport } from '@codemirror/language';",
    "import { parseMixed } from '@lezer/common';",
    "import { build, stop } from 'esbuild';",
    '',
    'const consumerRoot = path.dirname(fileURLToPath(import.meta.url));',
    "const consumerRequire = createRequire(path.join(consumerRoot, 'package.json'));",
    'const verifyRealClientTopology = ' + JSON.stringify(verifyRealClientTopology) + ';',
    "const currentScriptUrl = new URL('./runtime-smoke.mjs', import.meta.url).href;",
    'if (verifyRealClientTopology) {',
    "  const { JSDOM } = await import('jsdom');",
    "  const dom = new JSDOM('<!doctype html><html><body></body></html>', { pretendToBeVisual: true, url: 'http://localhost/' });",
    "  const currentScript = dom.window.document.createElement('script');",
    '  currentScript.src = currentScriptUrl;',
    "  Object.defineProperty(dom.window.document, 'currentScript', { configurable: true, value: currentScript });",
    "  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: dom.window.navigator });",
    "  consumerRequire.extensions['.css'] ??= (module) => { module.exports = {}; };",
    '  globalThis.window = dom.window;',
    '  globalThis.self = dom.window;',
    '  globalThis.document = dom.window.document;',
    '  globalThis.localStorage = dom.window.localStorage;',
    '  globalThis.sessionStorage = dom.window.sessionStorage;',
    '  globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);',
    '  for (const globalName of Object.getOwnPropertyNames(dom.window)) {',
    '    if (globalName in globalThis) continue;',
    '    Object.defineProperty(globalThis, globalName, Object.getOwnPropertyDescriptor(dom.window, globalName));',
    '  }',
    '  dom.window.matchMedia ??= () => ({',
    '    addEventListener: () => undefined,',
    '    addListener: () => undefined,',
    '    dispatchEvent: () => false,',
    '    matches: false,',
    '    media: "",',
    '    onchange: null,',
    '    removeEventListener: () => undefined,',
    '    removeListener: () => undefined,',
    '  });',
    '  globalThis.matchMedia = dom.window.matchMedia.bind(dom.window);',
    '  globalThis.requestAnimationFrame = dom.window.requestAnimationFrame.bind(dom.window);',
    '  globalThis.cancelAnimationFrame = dom.window.cancelAnimationFrame.bind(dom.window);',
    "  for (const packageName of ['classnames', 'dayjs', 'json5', 'lodash', 'react', 'react-dom']) {",
    '    const cjsModule = consumerRequire(packageName);',
    "    if ((typeof cjsModule === 'function' || typeof cjsModule === 'object') && cjsModule && !('default' in cjsModule)) {",
    '      cjsModule.default = cjsModule;',
    '    }',
    '  }',
    '} else {',
    '  globalThis.self ??= globalThis;',
    '  globalThis.window ??= globalThis;',
    "  globalThis.navigator ??= { userAgent: 'node.js' };",
    "  const currentScript = { tagName: 'SCRIPT', src: currentScriptUrl };",
    '  globalThis.document ??= {',
    '    currentScript,',
    '    getElementsByTagName: () => [currentScript],',
    '  };',
    '}',
    'const requiredSpecifiers = ' + JSON.stringify(requiredEntries) + ';',
    'const requiredEntries = [];',
    'for (const specifier of requiredSpecifiers) {',
    '  const resolvedPath = consumerRequire.resolve(specifier);',
    "  const normalizedResolvedPath = path.relative(consumerRoot, resolvedPath).replaceAll(path.sep, '/');",
    "  const packageName = specifier.startsWith('@') ? specifier.split('/').slice(0, 2).join('/') : specifier.split('/')[0];",
    "  const expectedPrefix = 'node_modules/' + packageName + '/';",
    '  if (!normalizedResolvedPath.startsWith(expectedPrefix)) {',
    '    throw new Error(specifier + " resolved outside the packed consumer: " + normalizedResolvedPath);',
    '  }',
    '  const namespace = await import(specifier);',
    '  const exportCount = Object.keys(namespace).length;',
    '  if (!exportCount) throw new Error(specifier + " did not expose a runtime module");',
    '  requiredEntries.push({',
    '    specifier,',
    '    resolvedPath: normalizedResolvedPath,',
    '    exportCount,',
    '  });',
    '}',
    '',
    "const browserEntry = path.join(consumerRoot, 'browser-root.mjs');",
    'fs.writeFileSync(browserEntry,',
    '  "import * as runjs from \'@nocobase/runjs\';\\n" +',
    '  "import * as runjsClient from \'@nocobase/runjs/client\';\\n" +',
    '  "globalThis.__runjsBoundaryValue = { runjs, runjsClient };\\n",',
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
    'let bundle;',
    'try {',
    '  bundle = await build({',
    '    bundle: true,',
    '    entryPoints: [browserEntry],',
    "    format: 'esm',",
    '    logLevel: "silent",',
    '    metafile: true,',
    "    platform: 'browser',",
    '    plugins: [boundaryPlugin],',
    '    write: false,',
    '  });',
    '} finally {',
    '  stop();',
    '}',
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
    'const lezerResolvers = [{ packageName: "consumer", resolver: consumerRequire }];',
    'if (verifyRealClientTopology) {',
    "  lezerResolvers.push({ packageName: '@nocobase/client-v2', resolver: createRequire(consumerRequire.resolve('@nocobase/client-v2/package.json')) });",
    "  lezerResolvers.push({ packageName: '@nocobase/runjs', resolver: createRequire(consumerRequire.resolve('@nocobase/runjs/package.json')) });",
    '}',
    "for (const packageName of ['@codemirror/lang-html', '@codemirror/lang-javascript', '@codemirror/language']) {",
    '  lezerResolvers.push({ packageName, resolver: createRequire(consumerRequire.resolve(packageName)) });',
    '}',
    'const lezerResolverRealpaths = lezerResolvers.map(({ packageName, resolver }) => ({',
    '  packageName,',
    "  realpath: fs.realpathSync(path.dirname(findPackageJson(resolver.resolve('@lezer/common'), '@lezer/common'))),",
    '}));',
    'const resolvedLezerRoots = [...new Set(lezerResolverRealpaths.map(({ realpath }) => realpath))];',
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
    '  codeMirror: {',
    '    mixedParserPassed: true,',
    '    resolvedLezerRoots: resolvedLezerRoots.map((root) => path.relative(consumerRoot, root).replaceAll(path.sep, "/")),',
    '    resolverRealpaths: lezerResolverRealpaths.map(({ packageName, realpath }) => ({',
    '      packageName,',
    '      realpath: path.relative(consumerRoot, realpath).replaceAll(path.sep, "/"),',
    '    })),',
    '  },',
    '};',
    '',
  ].join('\n');
}

function runConsumerTypeSmoke(consumerRoot, requiredEntries) {
  fs.writeFileSync(
    path.join(consumerRoot, 'types-smoke.ts'),
    requiredEntries
      .map((specifier, index) => 'import * as entry' + index + ' from ' + JSON.stringify(specifier) + ';')
      .concat(
        'export const importedEntries = [' +
          requiredEntries.map((_specifier, index) => 'entry' + index).join(', ') +
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
  const versions = {};
  for (const packageName of codeMirrorPackages) {
    versions[packageName] = resolveInstalledPackageVersion(repositoryRoot, packageName);
  }
  return versions;
}

function collectRequiredPackages(entryPath) {
  const packages = new Set();
  const source = fs.readFileSync(entryPath, 'utf8');
  for (const match of source.matchAll(/\brequire\(["']([^"']+)["']\)/gu)) {
    const specifier = match[1];
    if (specifier.startsWith('.') || specifier.startsWith('/') || specifier.startsWith('node:')) {
      continue;
    }
    packages.add(specifier.startsWith('@') ? specifier.split('/').slice(0, 2).join('/') : specifier.split('/')[0]);
  }
  return [...packages].sort();
}

function resolveInstalledPackageVersion(repositoryRoot, packageName) {
  const repositoryRequire = createRequire(path.join(repositoryRoot, 'package.json'));
  const packageJsonPath = findPackageJson(repositoryRequire.resolve(packageName), packageName);
  const manifest = readJson(packageJsonPath);
  if (!manifest.version) {
    throw new Error(packageName + ' is missing its installed version');
  }
  return manifest.version;
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
  const result = spawn.sync(command, args, {
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
