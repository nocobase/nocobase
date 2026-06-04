/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createHash } from 'crypto';
import { readdir, readFile } from 'fs/promises';
import { extname, join } from 'path';
import { types as nodeUtilTypes } from 'util';
import type { Application } from '@nocobase/server';
import * as ts from 'typescript';
import { getPackageDir, PluginManager } from '@nocobase/server';
import {
  buildFlowSurfaceAutoSnapshot,
  deriveFlowSurfaceAutoCapabilityCandidates,
  getFlowSurfaceAutoSnapshotStorageDir,
  writeFlowSurfaceAutoSnapshot,
} from './snapshot';
import type { FlowSurfaceCapabilityWarning } from '../types';
import { collectFlowSurfaceExtractorAstEvents } from './ast';
import { resolveFlowSurfacePluginEntry } from './entry-resolver';
import {
  createFlowSurfaceMockClientPluginContext,
  createFlowSurfaceMockFieldBindingModelClass,
  createFlowSurfaceMockModelClass,
} from './runtime';
import { createFlowSurfaceExtractionRecorder } from './recorder';
import {
  createFlowSurfaceExtractorRuntimeWarning,
  FlowSurfaceExtractorGuardError,
  runWithFlowSurfaceExtractorGuards,
  type FlowSurfaceExtractorBridgeValue,
} from './guards';
import type { FlowSurfaceAutoSnapshot, FlowSurfaceExtractorCliResult, FlowSurfaceExtractionEvent } from './types';

export type FlowSurfaceExtractorCliTarget = {
  plugin: string;
  packageRoot?: string;
};

export type FlowSurfaceExtractorCliOptions = {
  dryRun?: boolean;
  failOnWarning?: boolean;
  outDir?: string;
  preferMode?: 'source' | 'dist';
  generatedAt?: string;
  extractorVersion?: string;
  extractPlugin?: FlowSurfaceExtractorCliExtractPlugin;
  resolveLoaders?: boolean;
};

export type FlowSurfaceExtractorCliSummary = {
  ok: boolean;
  dryRun: boolean;
  results: FlowSurfaceExtractorCliResult[];
  exitCode: 0 | 1;
};

export type FlowSurfaceExtractorCliExtractPlugin = (
  target: FlowSurfaceExtractorCliTarget,
  options: Pick<FlowSurfaceExtractorCliOptions, 'preferMode' | 'generatedAt' | 'extractorVersion' | 'resolveLoaders'>,
) => Promise<FlowSurfaceExtractorPluginExtraction>;

export type FlowSurfaceExtractorPluginExtraction = {
  snapshot: FlowSurfaceAutoSnapshot;
  eventCount: number;
  candidateCount: number;
  warningCount: number;
};

type FlowSurfaceExtractorCliCommandOptions = {
  plugin?: string;
  allEnabled?: boolean;
  dryRun?: boolean;
  failOnWarning?: boolean;
  json?: boolean;
  out?: string;
  preferMode?: string;
  resolveLoaders?: boolean;
};

type FlowSurfaceExtractorSourceFile = {
  sourceFile: string;
  source: string;
};

type FlowSurfaceCliError = {
  code: string;
  message: string;
};

const FLOW_SURFACE_EXTRACTOR_CLI_VERSION = 'flow-surfaces-extractor@1';

export async function runFlowSurfaceExtractorCli(
  targets: FlowSurfaceExtractorCliTarget[],
  options: FlowSurfaceExtractorCliOptions = {},
): Promise<FlowSurfaceExtractorCliSummary> {
  const extractPlugin = options.extractPlugin || extractFlowSurfacePluginCapabilities;
  const results: FlowSurfaceExtractorCliResult[] = [];

  for (const target of targets) {
    let extraction: FlowSurfaceExtractorPluginExtraction;
    try {
      extraction = await extractPlugin(target, {
        preferMode: options.preferMode,
        generatedAt: options.generatedAt,
        extractorVersion: options.extractorVersion,
        resolveLoaders: options.resolveLoaders,
      });
    } catch (error) {
      results.push({
        ok: false,
        plugin: target.plugin,
        eventCount: 0,
        candidateCount: 0,
        warningCount: 0,
        errors: [toFlowSurfaceCliError(error)],
      });
      continue;
    }

    const errors: FlowSurfaceCliError[] = [];
    let snapshotPath: string | undefined;
    if (!options.dryRun) {
      try {
        snapshotPath = await writeFlowSurfaceAutoSnapshot({
          snapshot: extraction.snapshot,
          outDir: options.outDir || getFlowSurfaceAutoSnapshotStorageDir(),
        });
      } catch (error) {
        errors.push(toFlowSurfaceCliError(error));
      }
    }
    const warningFailure = getWarningFailure(options.failOnWarning, extraction.warningCount);
    if (warningFailure) {
      errors.push(warningFailure);
    }
    results.push({
      ok: errors.length === 0,
      plugin: extraction.snapshot.plugin || target.plugin,
      ...(snapshotPath ? { snapshotPath } : {}),
      eventCount: extraction.eventCount,
      candidateCount: extraction.candidateCount,
      warningCount: extraction.warningCount,
      ...(errors.length ? { errors } : {}),
    });
  }

  const ok = results.every((result) => result.ok);
  return {
    ok,
    dryRun: !!options.dryRun,
    results,
    exitCode: ok ? 0 : 1,
  };
}

export async function extractFlowSurfacePluginCapabilities(
  target: FlowSurfaceExtractorCliTarget,
  options: Pick<
    FlowSurfaceExtractorCliOptions,
    'preferMode' | 'generatedAt' | 'extractorVersion' | 'resolveLoaders'
  > = {},
): Promise<FlowSurfaceExtractorPluginExtraction> {
  const packageRoot = target.packageRoot || getPackageDir(target.plugin);
  const resolution = await resolveFlowSurfacePluginEntry({
    plugin: target.plugin,
    packageRoot,
    preferMode: options.preferMode,
  });
  const packageJsonSource = await readOptionalTextFile(resolution.packageJsonPath);
  const packageJson = parsePackageJson(packageJsonSource);
  const sourceEntries = await collectFlowSurfaceExtractorSourceFiles({
    packageRoot,
    selectedEntry: resolution.selectedEntry,
  });
  const warnings = [...resolution.warnings];
  if (!resolution.selectedEntry && sourceEntries.length) {
    warnings.push({
      code: 'extractor-runtime-error',
      message: 'Plugin client-v2 entry could not be resolved; extractor should fall back to package-wide AST scan.',
    });
  }
  const events: FlowSurfaceExtractionEvent[] = [];
  for (const sourceEntry of sourceEntries) {
    events.push(
      ...(await collectFlowSurfaceExtractorRuntimeEvents({
        source: sourceEntry.source,
        sourceFile: sourceEntry.sourceFile,
        packageName: resolution.plugin || target.plugin,
        resolveLoaders: options.resolveLoaders,
      })),
      ...collectFlowSurfaceExtractorAstEvents({
        source: sourceEntry.source,
        sourceFile: sourceEntry.sourceFile,
      }),
    );
  }
  const snapshot = buildFlowSurfaceAutoSnapshot({
    plugin: resolution.plugin || target.plugin,
    pluginVersion: getPackageVersion(packageJson),
    generatedAt: options.generatedAt,
    resolvedEntry: resolution.selectedEntry,
    sourceHash: hashExtractorSources([packageJsonSource || '', ...sourceEntries.map((entry) => entry.source)]),
    extractorVersion: options.extractorVersion || FLOW_SURFACE_EXTRACTOR_CLI_VERSION,
    events,
    warnings,
  });
  return {
    snapshot,
    eventCount: countNonWarningEvents(events),
    candidateCount: deriveFlowSurfaceAutoCapabilityCandidates(snapshot).length,
    warningCount: snapshot.warnings.length,
  };
}

export function formatFlowSurfaceExtractorCliSummary(
  summary: FlowSurfaceExtractorCliSummary,
  options = { json: false },
) {
  if (options.json) {
    return `${JSON.stringify(summary, null, 2)}\n`;
  }

  const lines = ['Flow surface capability extraction'];
  for (const result of summary.results) {
    const status = result.ok ? 'ok' : 'failed';
    const snapshot = result.snapshotPath ? ` snapshot=${result.snapshotPath}` : '';
    const errors = result.errors?.length ? ` errors=${result.errors.map(formatCliError).join('; ')}` : '';
    lines.push(
      `- ${result.plugin}: ${status} events=${result.eventCount} candidates=${result.candidateCount} warnings=${result.warningCount}${snapshot}${errors}`,
    );
  }
  lines.push(`status=${summary.ok ? 'ok' : 'failed'} dryRun=${summary.dryRun ? 'true' : 'false'}`);
  return `${lines.join('\n')}\n`;
}

export function registerFlowSurfaceExtractorCommand(app: Application) {
  const command = (app.findCommand('flow-surfaces') || app.command('flow-surfaces')) as ReturnType<
    Application['command']
  >;
  command
    .command('extract-capabilities')
    .option('--plugin <packageName>', 'extract one plugin package')
    .option('--all-enabled', 'extract every enabled plugin package')
    .option('--out <dir>', 'snapshot output directory')
    .option('--json', 'print a machine-readable summary')
    .option('--dry-run', 'do not write snapshot files')
    .option('--fail-on-warning', 'return a failing exit code when warnings are produced')
    .option('--prefer-mode <mode>', 'prefer source or dist client-v2 entries')
    .option('--resolve-loaders', 'experimentally execute no-import model loaders under extractor guards')
    .action(async (options: FlowSurfaceExtractorCliCommandOptions) => {
      const summary = await runFlowSurfaceExtractorCommand(app, options);
      process.stdout.write(formatFlowSurfaceExtractorCliSummary(summary, { json: !!options.json }));
      process.exitCode = summary.exitCode;
    });
}

export async function runFlowSurfaceExtractorCommand(
  app: Application,
  options: FlowSurfaceExtractorCliCommandOptions,
  runtimeOptions: Pick<FlowSurfaceExtractorCliOptions, 'extractPlugin' | 'generatedAt' | 'extractorVersion'> = {},
): Promise<FlowSurfaceExtractorCliSummary> {
  try {
    const preferMode = parsePreferMode(options.preferMode);
    const targets = await resolveFlowSurfaceExtractorCliTargets(app, options);
    return await runFlowSurfaceExtractorCli(targets, {
      dryRun: !!options.dryRun,
      extractPlugin: runtimeOptions.extractPlugin,
      failOnWarning: !!options.failOnWarning,
      generatedAt: runtimeOptions.generatedAt,
      extractorVersion: runtimeOptions.extractorVersion,
      outDir: options.out,
      preferMode,
      resolveLoaders: !!options.resolveLoaders,
    });
  } catch (error) {
    const result: FlowSurfaceExtractorCliResult = {
      ok: false,
      plugin: options.plugin || (options.allEnabled ? '--all-enabled' : 'unknown'),
      eventCount: 0,
      candidateCount: 0,
      warningCount: 0,
      errors: [toFlowSurfaceCliError(error)],
    };
    return {
      ok: false,
      dryRun: !!options.dryRun,
      results: [result],
      exitCode: 1,
    };
  }
}

async function resolveFlowSurfaceExtractorCliTargets(
  app: Application,
  options: FlowSurfaceExtractorCliCommandOptions,
): Promise<FlowSurfaceExtractorCliTarget[]> {
  if (options.allEnabled) {
    await ensureFlowSurfaceExtractorAppLoaded(app, { suppressStdout: !!options.json });
    const records = await app.pm.repository.find({
      fields: ['packageName'],
      filter: {
        enabled: true,
      },
    });
    return dedupeStrings(records.map(getPackageNameFromEnabledRecord).filter(isNonEmptyString)).map((plugin) => ({
      plugin,
    }));
  }

  if (!options.plugin) {
    throw new Error('Either --plugin or --all-enabled is required.');
  }

  const parsed = await PluginManager.parseName(options.plugin);
  return [
    {
      plugin: parsed.packageName,
    },
  ];
}

async function ensureFlowSurfaceExtractorAppLoaded(app: Application, options: { suppressStdout?: boolean } = {}) {
  if (app.loaded) {
    return;
  }
  if (options.suppressStdout) {
    await runWithSuppressedStdout(() => app.load());
    return;
  }
  await app.load();
}

async function runWithSuppressedStdout<T>(task: () => Promise<T>) {
  const originalWrite = process.stdout.write;
  process.stdout.write = ((...args: Parameters<typeof process.stdout.write>) => {
    const maybeCallback = args.find((arg): arg is (error?: Error | null) => void => typeof arg === 'function');
    maybeCallback?.();
    return true;
  }) as typeof process.stdout.write;
  try {
    return await task();
  } finally {
    process.stdout.write = originalWrite;
  }
}

function parsePreferMode(value: string | undefined) {
  if (!value) {
    return undefined;
  }
  if (value === 'source' || value === 'dist') {
    return value;
  }
  throw new Error('--prefer-mode must be source or dist.');
}

function getWarningFailure(failOnWarning: boolean | undefined, warningCount: number): FlowSurfaceCliError | undefined {
  if (!failOnWarning || warningCount === 0) {
    return undefined;
  }
  return {
    code: 'extractor-warning',
    message: `Extractor produced ${warningCount} warning(s).`,
  };
}

function countNonWarningEvents(events: FlowSurfaceExtractionEvent[]) {
  return events.filter((event) => event.type !== 'warning').length;
}

async function collectFlowSurfaceExtractorSourceFiles(input: {
  packageRoot: string;
  selectedEntry?: string;
}): Promise<FlowSurfaceExtractorSourceFile[]> {
  if (input.selectedEntry) {
    return [
      {
        sourceFile: input.selectedEntry,
        source: await readFile(input.selectedEntry, 'utf8'),
      },
    ];
  }
  return await collectFlowSurfaceExtractorSourceFilesFromDirectory(join(input.packageRoot, 'src/client-v2'));
}

async function collectFlowSurfaceExtractorSourceFilesFromDirectory(
  dir: string,
): Promise<FlowSurfaceExtractorSourceFile[]> {
  let entries: Awaited<ReturnType<typeof readdir>>;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }

  const sourceFiles: FlowSurfaceExtractorSourceFile[] = [];
  for (const entry of entries) {
    const entryPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      sourceFiles.push(...(await collectFlowSurfaceExtractorSourceFilesFromDirectory(entryPath)));
      continue;
    }
    if (!entry.isFile() || !isFlowSurfaceExtractorSourceFile(entry.name)) {
      continue;
    }
    sourceFiles.push({
      sourceFile: entryPath,
      source: await readFile(entryPath, 'utf8'),
    });
  }
  return sourceFiles.sort((left, right) => left.sourceFile.localeCompare(right.sourceFile));
}

function isFlowSurfaceExtractorSourceFile(fileName: string) {
  if (fileName.endsWith('.d.ts')) {
    return false;
  }
  return ['.js', '.jsx', '.ts', '.tsx'].includes(extname(fileName));
}

type FlowSurfaceRuntimeModelUsage = {
  runtimeModelNames: Set<string>;
  declaredRuntimeModelNames: Set<string>;
};

type FlowSurfaceRuntimeModelLoader = {
  loader: (...args: unknown[]) => unknown;
  modelUse: string;
};

const FIELD_BINDING_MODEL_ROLES = new Map<string, FlowSurfaceFieldBindingRole>([
  ['DisplayItemModel', 'display'],
  ['DetailsItemModel', 'display'],
  ['EditableItemModel', 'editable'],
  ['FormItemModel', 'editable'],
  ['FilterableItemModel', 'filterable'],
  ['FilterFormItemModel', 'filterable'],
]);

async function collectFlowSurfaceExtractorRuntimeEvents(input: {
  source: string;
  sourceFile: string;
  packageName: string;
  resolveLoaders?: boolean;
}): Promise<FlowSurfaceExtractionEvent[]> {
  if (hasUnsupportedRuntimeModuleDependency(input.source, input.sourceFile)) {
    return [];
  }

  const recorder = createFlowSurfaceExtractionRecorder();
  const usage = collectFlowSurfaceRuntimeModelUsage(input.source, input.sourceFile);
  const bridges = createFlowSurfaceRuntimeModelBridges({
    recorder,
    packageName: input.packageName,
    resolveLoaders: !!input.resolveLoaders,
    source: input.sourceFile,
    usage,
  });

  try {
    await runWithFlowSurfaceExtractorGuards(transpileFlowSurfaceRuntimeSource(input.source, input.sourceFile), {
      bridges,
      globals: {
        exports: {},
        module: {
          exports: {},
        },
      },
    });
  } catch (error) {
    createFlowSurfaceExtractorRuntimeWarnings(error, input.source).forEach((warning) => {
      recorder.recordWarning(warning);
    });
  }

  return recorder.getEvents();
}

function createFlowSurfaceExtractorRuntimeWarnings(error: unknown, source: string): FlowSurfaceCapabilityWarning[] {
  const sourceWarnings = isRuntimeTypeErrorLike(error) ? createFlowSurfaceExtractorRuntimeSourceWarnings(source) : [];
  return sourceWarnings.length ? sourceWarnings : [createFlowSurfaceExtractorRuntimeWarning(error)];
}

function createFlowSurfaceExtractorRuntimeSourceWarnings(source: string): FlowSurfaceCapabilityWarning[] {
  const warnings: FlowSurfaceCapabilityWarning[] = [];
  if (/\blocalStorage\s*\.\s*getItem\b/.test(source)) {
    warnings.push({
      code: 'extractor-runtime-error',
      message: 'Flow surface extractor blocked access to localStorage.getItem.',
    });
  }
  if (/\bwindow\s*\.\s*location\b/.test(source)) {
    warnings.push({
      code: 'extractor-runtime-error',
      message: 'Flow surface extractor blocked access to window.location.',
    });
  }
  return warnings;
}

function isRuntimeTypeErrorLike(error: unknown) {
  return error instanceof TypeError || (isPlainRecord(error) && error.name === 'TypeError');
}

function collectFlowSurfaceRuntimeModelUsage(source: string, sourceFile: string): FlowSurfaceRuntimeModelUsage {
  const runtimeModelNames = new Set<string>();
  const declaredRuntimeModelNames = new Set<string>();
  const sourceFileNode = ts.createSourceFile(sourceFile, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

  function visit(node: ts.Node) {
    if (ts.isIdentifier(node) && isRuntimeModelName(node.text)) {
      runtimeModelNames.add(node.text);
    }
    if (ts.isClassDeclaration(node) && node.name && isRuntimeModelName(node.name.text) && !hasDeclareModifier(node)) {
      declaredRuntimeModelNames.add(node.name.text);
    }
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      isRuntimeModelName(node.name.text) &&
      !hasDeclareModifier(node.parent.parent)
    ) {
      declaredRuntimeModelNames.add(node.name.text);
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFileNode);
  return {
    runtimeModelNames,
    declaredRuntimeModelNames,
  };
}

function hasUnsupportedRuntimeModuleDependency(source: string, sourceFile: string) {
  const sourceFileNode = ts.createSourceFile(sourceFile, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  return sourceFileNode.statements.some((statement) => {
    if (ts.isImportDeclaration(statement)) {
      return !statement.importClause?.isTypeOnly;
    }
    if (ts.isImportEqualsDeclaration(statement)) {
      return !statement.isTypeOnly;
    }
    if (ts.isExportDeclaration(statement)) {
      return !!statement.moduleSpecifier;
    }
    return false;
  });
}

function createFlowSurfaceRuntimeModelBridges(input: {
  recorder: ReturnType<typeof createFlowSurfaceExtractionRecorder>;
  packageName: string;
  resolveLoaders: boolean;
  source: string;
  usage: FlowSurfaceRuntimeModelUsage;
}) {
  const pluginContext = createFlowSurfaceMockClientPluginContext({
    packageName: input.packageName,
    recorder: input.recorder,
    source: input.source,
  });
  const loaders: FlowSurfaceRuntimeModelLoader[] = [];
  const registerModelLoaders = (registeredLoaders: Record<string, unknown>) => {
    input.recorder.recordModelLoaders(registeredLoaders, input.source, 'high', 'runtime');
    if (input.resolveLoaders) {
      loaders.push(...getModelLoaderFunctions(registeredLoaders));
    }
  };
  const flowEngine = {
    registerModels: pluginContext.flowEngine.registerModels,
    registerModelLoaders,
    registerActions: pluginContext.flowEngine.registerActions,
    registerFlow: pluginContext.flowEngine.registerFlow,
    flowSettings: {
      registerComponents: pluginContext.flowEngine.flowSettings.registerComponents,
    },
  };
  const app = {
    flowEngine,
    addComponents: pluginContext.app.addComponents.bind(pluginContext.app),
    addFieldInterfaces: pluginContext.app.addFieldInterfaces.bind(pluginContext.app),
    addFieldInterfaceGroups: pluginContext.app.addFieldInterfaceGroups.bind(pluginContext.app),
    addFieldInterfaceComponentOption: pluginContext.app.addFieldInterfaceComponentOption.bind(pluginContext.app),
    addFieldInterfaceOperator: pluginContext.app.addFieldInterfaceOperator.bind(pluginContext.app),
    registerFieldFilterOperator: pluginContext.app.registerFieldFilterOperator.bind(pluginContext.app),
    registerFieldFilterOperatorGroup: pluginContext.app.registerFieldFilterOperatorGroup.bind(pluginContext.app),
    addFieldFilterOperatorsToGroup: pluginContext.app.addFieldFilterOperatorsToGroup.bind(pluginContext.app),
    registerFieldValidationConfigure: pluginContext.app.registerFieldValidationConfigure.bind(pluginContext.app),
    registerFieldValidationConfigureGroup: pluginContext.app.registerFieldValidationConfigureGroup.bind(
      pluginContext.app,
    ),
    addFieldValidationConfiguresToGroup: pluginContext.app.addFieldValidationConfiguresToGroup.bind(pluginContext.app),
    getPublicPath: pluginContext.app.getPublicPath.bind(pluginContext.app),
    use: pluginContext.app.use.bind(pluginContext.app),
  };
  const bridges: Record<string, FlowSurfaceExtractorBridgeValue> = {
    flowEngine,
    app,
    plugin: {
      app,
      flowEngine,
    },
    EditableItemModel: createFlowSurfaceMockFieldBindingModelClass({
      role: 'editable',
      recorder: input.recorder,
      source: input.source,
    }),
    DisplayItemModel: createFlowSurfaceMockFieldBindingModelClass({
      role: 'display',
      recorder: input.recorder,
      source: input.source,
    }),
    FilterableItemModel: createFlowSurfaceMockFieldBindingModelClass({
      role: 'filterable',
      recorder: input.recorder,
      source: input.source,
    }),
    __flowSurfaceRuntimeExecuteLoaders: () => {
      executeFlowSurfaceRuntimeModelLoaders({
        loaders,
        recorder: input.recorder,
      });
    },
  };

  input.usage.runtimeModelNames.forEach((modelUse) => {
    const role = FIELD_BINDING_MODEL_ROLES.get(modelUse);
    const bridge = role
      ? createFlowSurfaceMockFieldBindingModelClass({
          role,
          recorder: input.recorder,
          source: input.source,
        })
      : createFlowSurfaceMockModelClass({
          modelUse,
          recorder: input.recorder,
          source: input.source,
        });
    const bridgeMethods = {
      bindModelToInterface: bridge.bindModelToInterface,
      define: 'define' in bridge ? bridge.define : () => undefined,
      registerFlow: 'registerFlow' in bridge ? bridge.registerFlow : () => undefined,
    };
    bridges[getModelStaticBridgeIdentifier(modelUse)] = bridgeMethods;
    if (!input.usage.declaredRuntimeModelNames.has(modelUse)) {
      bridges[modelUse] = bridgeMethods;
    }
  });

  return bridges;
}

function executeFlowSurfaceRuntimeModelLoaders(input: {
  loaders: FlowSurfaceRuntimeModelLoader[];
  recorder: ReturnType<typeof createFlowSurfaceExtractionRecorder>;
}) {
  input.loaders.forEach(({ loader, modelUse }) => {
    try {
      const result = loader();
      if (isRuntimePromiseLike(result)) {
        throw new FlowSurfaceExtractorGuardError(`modelLoader:${modelUse}`);
      }
    } catch (error) {
      input.recorder.recordWarning(createFlowSurfaceExtractorRuntimeWarning(error));
    }
  });
}

function transpileFlowSurfaceRuntimeSource(source: string, sourceFile: string) {
  return [
    instrumentFlowSurfaceRuntimeModelClasses(source, sourceFile),
    '',
    '__flowSurfaceRuntimeExecuteLoaders();',
  ].join('\n');
}

function instrumentFlowSurfaceRuntimeModelClasses(source: string, sourceFile: string) {
  const sourceFileNode = ts.createSourceFile(sourceFile, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const transformer: ts.TransformerFactory<ts.SourceFile> = (context) => {
    const visitStatement = (statement: ts.Statement): ts.VisitResult<ts.Statement> => {
      if (ts.isClassDeclaration(statement) && statement.name && isRuntimeModelName(statement.name.text)) {
        const updated = ts.visitEachChild(statement, visitNode, context);
        return [updated, buildModelClassInstrumentation(statement.name.text)];
      }
      if (ts.isVariableStatement(statement)) {
        const instrumentations = statement.declarationList.declarations
          .map((declaration) => {
            if (
              ts.isIdentifier(declaration.name) &&
              isRuntimeModelName(declaration.name.text) &&
              declaration.initializer &&
              ts.isClassExpression(declaration.initializer)
            ) {
              return buildModelClassInstrumentation(declaration.name.text);
            }
            return undefined;
          })
          .filter((item): item is ts.ExpressionStatement => !!item);
        if (instrumentations.length) {
          const updated = ts.visitEachChild(statement, visitNode, context);
          return [updated, ...instrumentations];
        }
      }
      return ts.visitEachChild(statement, visitNode, context);
    };
    const visitNode = (node: ts.Node): ts.Node => ts.visitEachChild(node, visitNode, context);
    return (node) => ts.visitEachChild(node, visitStatement, context);
  };
  const transformed = ts.transform(sourceFileNode, [transformer]);
  const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
  const printed = printer.printFile(transformed.transformed[0]);
  transformed.dispose();
  return ts.transpileModule(printed, {
    compilerOptions: {
      esModuleInterop: true,
      jsx: ts.JsxEmit.React,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
    fileName: sourceFile,
  }).outputText;
}

function buildModelClassInstrumentation(modelUse: string) {
  const model = ts.factory.createIdentifier(modelUse);
  const bridge = ts.factory.createIdentifier(getModelStaticBridgeIdentifier(modelUse));
  return ts.factory.createExpressionStatement(
    ts.factory.createCallExpression(
      ts.factory.createPropertyAccessExpression(ts.factory.createIdentifier('Object'), 'assign'),
      undefined,
      [model, bridge],
    ),
  );
}

function getModelStaticBridgeIdentifier(modelUse: string) {
  return `__flowSurfaceExtractorModel_${modelUse}`;
}

function isRuntimeModelName(value: string) {
  return /^[A-Z]\w*Model$/.test(value);
}

function hasDeclareModifier(node: ts.Node) {
  return !!ts.getModifiers(node)?.some((modifier) => modifier.kind === ts.SyntaxKind.DeclareKeyword);
}

function getModelLoaderFunctions(loaders: Record<string, unknown>) {
  return getRuntimeOwnDataDescriptors(loaders).flatMap(([modelUse, descriptor]) => {
    if (!('value' in descriptor)) {
      return [];
    }
    const loader = getModelLoaderFunction(descriptor.value);
    return loader
      ? [
          {
            loader,
            modelUse,
          },
        ]
      : [];
  });
}

function getModelLoaderFunction(value: unknown): ((...args: unknown[]) => unknown) | undefined {
  if (typeof value === 'function') {
    return value;
  }
  if (!isRuntimePlainRecord(value)) {
    return undefined;
  }
  const loader = Object.getOwnPropertyDescriptor(value, 'loader');
  return loader && 'value' in loader && typeof loader.value === 'function' ? loader.value : undefined;
}

function getRuntimeOwnDataDescriptors(value: unknown): Array<[string, PropertyDescriptor]> {
  if (!isRuntimePlainRecord(value) || nodeUtilTypes.isProxy(value)) {
    return [];
  }
  try {
    return Object.entries(Object.getOwnPropertyDescriptors(value));
  } catch {
    return [];
  }
}

function isRuntimePlainRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value) && !nodeUtilTypes.isProxy(value);
}

function isRuntimePromiseLike(value: unknown): value is PromiseLike<unknown> {
  if (!value || (typeof value !== 'object' && typeof value !== 'function')) {
    return false;
  }
  if (nodeUtilTypes.isProxy(value)) {
    return true;
  }
  try {
    const descriptor = Object.getOwnPropertyDescriptor(value, 'then');
    return !!descriptor && 'value' in descriptor && typeof descriptor.value === 'function';
  } catch {
    return true;
  }
}

function hashExtractorSources(parts: string[]) {
  const hash = createHash('sha256');
  parts.forEach((part) => {
    hash.update(part);
    hash.update('\0');
  });
  return hash.digest('hex');
}

async function readOptionalTextFile(filePath: string) {
  try {
    return await readFile(filePath, 'utf8');
  } catch {
    return undefined;
  }
}

function parsePackageJson(source: string | undefined) {
  if (!source) {
    return undefined;
  }
  try {
    const parsed: unknown = JSON.parse(source);
    return isPlainRecord(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

function getPackageVersion(packageJson: Record<string, unknown> | undefined) {
  return typeof packageJson?.version === 'string' ? packageJson.version : undefined;
}

function getPackageNameFromEnabledRecord(record: unknown) {
  if (!isPlainRecord(record)) {
    return undefined;
  }
  if (typeof record.packageName === 'string') {
    return normalizePluginPackageName(record.packageName);
  }
  const getValue = record.get;
  if (typeof getValue === 'function') {
    const packageName = getValue.call(record, 'packageName');
    return normalizePluginPackageName(packageName);
  }
  return undefined;
}

function normalizePluginPackageName(value: unknown) {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed || undefined;
}

function toFlowSurfaceCliError(error: unknown): FlowSurfaceCliError {
  if (isPlainRecord(error)) {
    const code = typeof error.code === 'string' ? error.code : 'extractor-runtime-error';
    const message = typeof error.message === 'string' ? error.message : 'Flow surface extractor failed.';
    return {
      code,
      message,
    };
  }
  return {
    code: 'extractor-runtime-error',
    message: 'Flow surface extractor failed.',
  };
}

function formatCliError(error: FlowSurfaceCliError) {
  return `${error.code}: ${error.message.replace(/\s+/g, ' ').trim()}`;
}

function dedupeStrings(values: string[]) {
  return Array.from(new Set(values));
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}
