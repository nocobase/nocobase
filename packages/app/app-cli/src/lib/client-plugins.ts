// Reads and edits an application's `client/plugins.ts`.
//
// The file is application source, so edits preserve everything the author wrote. TypeScript is used only to locate two
// things — the package import group and the argument array of `defineClientPlugins(...)` — and the edit itself is a
// splice into the original text. A full AST reprint would discard comments and formatting.
//
// TypeScript and Prettier are resolved from the application rather than from this package, so an app formats its own
// source with its own configuration and version. Both are optional: an app that has neither still gets a correct edit,
// only an unformatted one.
import { createRequire } from 'node:module';
import { existsSync, statSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import type ts from 'typescript';

const PLUGIN_PACKAGE_PATTERN =
  /^@[a-z0-9][a-z0-9-]*\/app-plugin-([a-z0-9][a-z0-9-]*)$/;
const CLIENT_SOURCE_DEFINITION: PluginSourceDefinition = {
  entryKind: 'call',
  entrySpecifierSuffix: '/client',
  entrySuffixes: ['/client/plugin', '/client'],
  fileLabel: 'client/plugins.ts',
  registerCallName: 'defineClientPlugins',
};

const EMPTY_FILE = `import {
  defineClientPlugins,
  type AppClientPlugins,
} from '@nocobase/app-client/plugins';

// Array order is contribution order. A plugin is enabled by appearing in this
// list; removing its entry and its import disables it.
const clientPlugins: AppClientPlugins = defineClientPlugins([]);

export default clientPlugins;
`;

export interface ClientPluginsFile {
  readonly exists: boolean;
  readonly filePath: string;
  readonly sourceText: string;
}

export interface PluginSourceEntry {
  readonly localName: string;
  readonly packageName: string;
}

export type ClientPluginEntry = PluginSourceEntry;

export interface PluginSourceEdit {
  readonly changed: boolean;
  readonly localName?: string;
  readonly sourceText: string;
}

export type ClientPluginsEdit = PluginSourceEdit;

export interface PluginSourceDefinition {
  readonly entryKind: 'call' | 'value';
  readonly entrySpecifierSuffix: string;
  readonly entrySuffixes: readonly string[];
  readonly fileLabel: string;
  readonly registerCallName: string;
}

export function clientPluginsPath(appRoot: string): string {
  return path.join(appRoot, 'client', 'plugins.ts');
}

/** `@nocobase/app-plugin-audit-log` -> `auditLog`. */
export function localNameFor(packageName: string): string {
  const match = PLUGIN_PACKAGE_PATTERN.exec(packageName);
  if (!match) {
    throw new Error(
      `Plugin package "${packageName}" must match @scope/app-plugin-<name>.`,
    );
  }
  return match[1].replace(/-([a-z0-9])/g, (_all, character: string) =>
    character.toUpperCase(),
  );
}

export function clientPluginEntrySpecifier(packageName: string): string {
  return `${packageName}/client`;
}

export async function readClientPlugins(
  appRoot: string,
): Promise<ClientPluginsFile> {
  const filePath = clientPluginsPath(appRoot);
  if (!existsSync(filePath) || !statSync(filePath).isFile()) {
    return { exists: false, filePath, sourceText: EMPTY_FILE };
  }
  return {
    exists: true,
    filePath,
    sourceText: await readFile(filePath, 'utf8'),
  };
}

export async function writeClientPlugins(
  appRoot: string,
  sourceText: string,
): Promise<string> {
  const filePath = clientPluginsPath(appRoot);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, sourceText);
  return filePath;
}

/**
 * Loads the TypeScript the application depends on. Editing app source with the app's own compiler avoids a second
 * TypeScript in the dependency tree purely so the CLI can parse a file the app already builds.
 */
async function loadTypeScript(
  appRoot: string,
  fileLabel: string,
): Promise<typeof ts> {
  const require = createRequire(path.join(appRoot, 'package.json'));
  let typescriptPath: string;
  try {
    typescriptPath = require.resolve('typescript');
  } catch (error) {
    if (
      !(error instanceof Error) ||
      !('code' in error) ||
      error.code !== 'MODULE_NOT_FOUND'
    ) {
      throw error;
    }
    throw new MissingTypeScriptError(
      `TypeScript is not installed in ${appRoot}, so ${fileLabel} cannot be edited automatically.`,
      { cause: error },
    );
  }
  const loaded: unknown = await import(pathToFileURL(typescriptPath).href);
  return interopDefault<typeof ts>(loaded, 'createSourceFile');
}

/**
 * Raised when the application has no TypeScript to parse `client/plugins.ts` with. It is a distinct type because
 * callers treat it as a reason to degrade to printed instructions rather than as a failure: everything else about a
 * registration works without a compiler, and losing the install over a formatting tool would be a poor trade.
 */
export class MissingTypeScriptError extends Error {
  public constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'MissingTypeScriptError';
  }
}

/** The exact lines a person or agent has to write when the automatic edit is unavailable. */
export interface ManualClientPluginEdit {
  readonly entry: string;
  readonly filePath: string;
  readonly importStatement: string;
  readonly localName: string;
}

/**
 * Describes the edit without parsing anything, so the instructions survive the absence of the compiler that would
 * normally apply them.
 */
export function describeClientPluginEdit(
  appRoot: string,
  packageName: string,
): ManualClientPluginEdit {
  const localName = localNameFor(packageName);
  return {
    entry: `${localName}(),`,
    filePath: clientPluginsPath(appRoot),
    importStatement: `import ${localName} from '${clientPluginEntrySpecifier(packageName)}';`,
    localName,
  };
}

/**
 * Both TypeScript and Prettier are CommonJS. Node hoists named exports from some CJS modules and not others, so the
 * usable object is either the namespace itself or its `default`. Probing for a known member picks the right one
 * without depending on which form a given version produces.
 */
function interopDefault<T>(loaded: unknown, member: string): T {
  const namespace = loaded as Record<string, unknown>;
  if (typeof namespace[member] === 'function') {
    return namespace as T;
  }
  const fallback = namespace.default as Record<string, unknown> | undefined;
  if (fallback && typeof fallback[member] === 'function') {
    return fallback as T;
  }
  throw new Error(`Loaded module does not provide ${member}().`);
}

function parse(typescript: typeof ts, sourceText: string): ts.SourceFile {
  return typescript.createSourceFile(
    'plugins.ts',
    sourceText,
    typescript.ScriptTarget.Latest,
    true,
    typescript.ScriptKind.TS,
  );
}

/**
 * Locates the `defineClientPlugins([...])` argument array. Everything the codegen needs is derived from this one node.
 */
function findRegistrationArray(
  typescript: typeof ts,
  sourceFile: ts.SourceFile,
  definition: PluginSourceDefinition,
): ts.ArrayLiteralExpression {
  let found: ts.ArrayLiteralExpression | undefined;
  const visit = (node: ts.Node): void => {
    if (found) {
      return;
    }
    if (
      typescript.isCallExpression(node) &&
      typescript.isIdentifier(node.expression) &&
      node.expression.text === definition.registerCallName &&
      node.arguments.length === 1 &&
      typescript.isArrayLiteralExpression(node.arguments[0])
    ) {
      found = node.arguments[0];
      return;
    }
    typescript.forEachChild(node, visit);
  };
  typescript.forEachChild(sourceFile, visit);

  if (!found) {
    throw new Error(
      `${definition.fileLabel} must call ${definition.registerCallName}() with an array literal.`,
    );
  }
  return found;
}

/** Package names already registered, in registration order. */
function elementLocalName(
  typescript: typeof ts,
  element: ts.Expression,
  definition: PluginSourceDefinition,
): string | undefined {
  const candidate =
    definition.entryKind === 'call' && typescript.isCallExpression(element)
      ? element.expression
      : element;
  return typescript.isIdentifier(candidate) ? candidate.text : undefined;
}

function packageNameFromSpecifier(
  specifier: string,
  definition: PluginSourceDefinition,
): string | undefined {
  const suffix = definition.entrySuffixes.find((entry) =>
    specifier.endsWith(entry),
  );
  return suffix ? specifier.slice(0, -suffix.length) : undefined;
}

export function listPluginSourceEntries(
  typescript: typeof ts,
  sourceText: string,
  definition: PluginSourceDefinition,
): PluginSourceEntry[] {
  const sourceFile = parse(typescript, sourceText);
  const importsByLocalName = new Map<string, string>();
  for (const statement of sourceFile.statements) {
    if (
      !typescript.isImportDeclaration(statement) ||
      !typescript.isStringLiteral(statement.moduleSpecifier)
    ) {
      continue;
    }
    const localName = statement.importClause?.name?.text;
    if (localName) {
      importsByLocalName.set(localName, statement.moduleSpecifier.text);
    }
  }

  const entries: PluginSourceEntry[] = [];
  for (const element of findRegistrationArray(
    typescript,
    sourceFile,
    definition,
  ).elements) {
    const localName = elementLocalName(typescript, element, definition);
    if (!localName) {
      continue;
    }
    const specifier = importsByLocalName.get(localName);
    if (!specifier) {
      continue;
    }
    const packageName = packageNameFromSpecifier(specifier, definition);
    if (!packageName) {
      continue;
    }
    entries.push({
      localName,
      packageName,
    });
  }
  return entries;
}

function insertionOffsetForImport(
  typescript: typeof ts,
  sourceFile: ts.SourceFile,
): number {
  const imports = sourceFile.statements.filter(typescript.isImportDeclaration);
  const packageImports = imports.filter((statement) => {
    return (
      typescript.isStringLiteral(statement.moduleSpecifier) &&
      !statement.moduleSpecifier.text.startsWith('.')
    );
  });
  if (packageImports.length > 0) {
    return packageImports[packageImports.length - 1].getEnd();
  }
  if (imports.length > 0) {
    return imports[0].getFullStart();
  }
  return sourceFile.statements[0]?.getStart(sourceFile) ?? 0;
}

export function addPluginSourceEntry(
  typescript: typeof ts,
  sourceText: string,
  packageName: string,
  definition: PluginSourceDefinition,
): PluginSourceEdit {
  const localName = localNameFor(packageName);
  const existing = listPluginSourceEntries(typescript, sourceText, definition);
  if (existing.some((entry) => entry.packageName === packageName)) {
    return { changed: false, sourceText };
  }

  const sourceFile = parse(typescript, sourceText);
  const conflicting = sourceFile.statements.some(
    (statement) =>
      typescript.isImportDeclaration(statement) &&
      statement.importClause?.name?.text === localName,
  );
  if (conflicting) {
    throw new Error(
      `${definition.fileLabel} already binds "${localName}" to something else; add ${packageName} by hand.`,
    );
  }

  const array = findRegistrationArray(typescript, sourceFile, definition);
  const importText = `\nimport ${localName} from '${packageName}${definition.entrySpecifierSuffix}';`;
  const importOffset = insertionOffsetForImport(typescript, sourceFile);

  // Append rather than sort: appending is predictable and preserves the contribution order arranged by the author.
  const last = array.elements[array.elements.length - 1];
  const entryOffset = last ? last.getEnd() : array.getStart(sourceFile) + 1;
  const expression =
    definition.entryKind === 'call' ? `${localName}()` : localName;
  const entryText = last ? `,\n  ${expression}` : `\n  ${expression},\n`;

  const withEntry =
    sourceText.slice(0, entryOffset) +
    entryText +
    sourceText.slice(entryOffset);
  const updated =
    withEntry.slice(0, importOffset) +
    importText +
    withEntry.slice(importOffset);

  return { changed: true, localName, sourceText: updated };
}

export function removePluginSourceEntry(
  typescript: typeof ts,
  sourceText: string,
  packageName: string,
  definition: PluginSourceDefinition,
): PluginSourceEdit {
  const existing = listPluginSourceEntries(typescript, sourceText, definition);
  const target = existing.find((entry) => entry.packageName === packageName);
  if (!target) {
    return { changed: false, sourceText };
  }

  const sourceFile = parse(typescript, sourceText);
  const array = findRegistrationArray(typescript, sourceFile, definition);
  const index = array.elements.findIndex((element) => {
    return (
      elementLocalName(typescript, element, definition) === target.localName
    );
  });
  const element = array.elements[index];

  // Take the trailing comma with the element, or the leading one for the last entry, so the array never ends up with a
  // doubled or dangling comma. The sole remaining entry is its own case: taking only the element would leave the comma
  // it carried behind as `[,]`, which is an array hole rather than an empty array, so the whole span between the
  // brackets goes.
  let start = element.getFullStart();
  let end = element.getEnd();
  if (array.elements.length === 1) {
    start = array.getStart(sourceFile) + 1;
    end = array.getEnd() - 1;
  } else if (index < array.elements.length - 1) {
    end = array.elements[index + 1].getFullStart();
  } else if (index > 0) {
    start = array.elements[index - 1].getEnd();
  }

  const importStatement = sourceFile.statements.find(
    (statement) =>
      typescript.isImportDeclaration(statement) &&
      statement.importClause?.name?.text === target.localName,
  );

  let updated = sourceText.slice(0, start) + sourceText.slice(end);
  if (importStatement) {
    const importStart = importStatement.getFullStart();
    const importEnd = importStatement.getEnd();
    const offset = start < importStart ? start - end : 0;
    updated =
      updated.slice(0, importStart + offset) +
      updated.slice(importEnd + offset);
  }

  return { changed: true, sourceText: updated };
}

/**
 * Formats with the application's own Prettier and configuration. An app without Prettier keeps the unformatted splice,
 * which is still valid TypeScript, rather than failing the registration over formatting.
 */
export async function formatPluginsFile(
  appRoot: string,
  sourceText: string,
  filePath: string,
): Promise<string> {
  const localPrettierManifest = path.join(
    appRoot,
    'node_modules',
    'prettier',
    'package.json',
  );
  if (!existsSync(localPrettierManifest)) {
    return sourceText;
  }

  const require = createRequire(path.join(appRoot, 'package.json'));
  let prettier: typeof import('prettier');
  try {
    prettier = interopDefault<typeof import('prettier')>(
      await import(require.resolve('prettier')),
      'format',
    );
  } catch {
    return sourceText;
  }
  const config = await prettier.resolveConfig(filePath);
  return prettier.format(sourceText, {
    ...config,
    filepath: filePath,
    parser: 'typescript',
  });
}

export function listClientPlugins(
  typescript: typeof ts,
  sourceText: string,
): ClientPluginEntry[] {
  return listPluginSourceEntries(
    typescript,
    sourceText,
    CLIENT_SOURCE_DEFINITION,
  );
}

export function addClientPlugin(
  typescript: typeof ts,
  sourceText: string,
  packageName: string,
): ClientPluginsEdit {
  return addPluginSourceEntry(
    typescript,
    sourceText,
    packageName,
    CLIENT_SOURCE_DEFINITION,
  );
}

export function removeClientPlugin(
  typescript: typeof ts,
  sourceText: string,
  packageName: string,
): ClientPluginsEdit {
  return removePluginSourceEntry(
    typescript,
    sourceText,
    packageName,
    CLIENT_SOURCE_DEFINITION,
  );
}

export async function formatClientPlugins(
  appRoot: string,
  sourceText: string,
  filePath: string,
): Promise<string> {
  return formatPluginsFile(appRoot, sourceText, filePath);
}

export interface PluginSourceEditor {
  readonly add: (sourceText: string, packageName: string) => ClientPluginsEdit;
  readonly list: (sourceText: string) => ClientPluginEntry[];
  readonly remove: (
    sourceText: string,
    packageName: string,
  ) => ClientPluginsEdit;
}

export type ClientPluginsEditor = PluginSourceEditor;

/**
 * Binds the editing functions to the application's TypeScript, so a caller performing several edits loads the compiler
 * once and does not thread it through every call.
 */
export async function createClientPluginsEditor(
  appRoot: string,
): Promise<ClientPluginsEditor> {
  const typescript = await loadTypeScript(
    appRoot,
    CLIENT_SOURCE_DEFINITION.fileLabel,
  );
  return {
    add: (sourceText, packageName) =>
      addClientPlugin(typescript, sourceText, packageName),
    list: (sourceText) => listClientPlugins(typescript, sourceText),
    remove: (sourceText, packageName) =>
      removeClientPlugin(typescript, sourceText, packageName),
  };
}

export async function createPluginSourceEditor(
  appRoot: string,
  definition: PluginSourceDefinition,
): Promise<PluginSourceEditor> {
  const typescript = await loadTypeScript(appRoot, definition.fileLabel);
  return {
    add: (sourceText, packageName) =>
      addPluginSourceEntry(typescript, sourceText, packageName, definition),
    list: (sourceText) =>
      listPluginSourceEntries(typescript, sourceText, definition),
    remove: (sourceText, packageName) =>
      removePluginSourceEntry(typescript, sourceText, packageName, definition),
  };
}
