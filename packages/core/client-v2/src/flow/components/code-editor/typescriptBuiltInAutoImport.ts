/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

type TypeScriptModule = typeof import('typescript');
type TypeScriptCodeAction = import('typescript').CodeAction;
type TypeScriptImportClause = import('typescript').ImportClause;
type TypeScriptImportDeclaration = import('typescript').ImportDeclaration;
type TypeScriptNamedImports = import('typescript').NamedImports;
type TypeScriptSourceFile = import('typescript').SourceFile;
type TypeScriptTextChange = import('typescript').TextChange;

export type RunJSBuiltInAutoImportChange = {
  from: number;
  insert: string;
  to: number;
};

const runJSBuiltInAutoImportSources: ReadonlyMap<string, string> = new Map([
  ['react', 'React'],
  ['react-dom/client', 'ReactDOM'],
  ['antd', 'antd'],
  ['@ant-design/icons', 'antdIcons'],
  ['dayjs', 'dayjs'],
  ['lodash', 'lodash'],
  ['mathjs', 'math'],
  ['@formulajs/formulajs', 'formula'],
  ['@nocobase/sdk/client', 'clientSdk'],
]);

export function getRunJSBuiltInAutoImportLibrary(source: string | undefined): string | undefined {
  if (!source) return undefined;
  return runJSBuiltInAutoImportSources.get(source);
}

function isRelativeAutoImportSource(source: string): boolean {
  const normalized = source.replace(/\\/gu, '/');
  return normalized === '.' || normalized === '..' || normalized.startsWith('./') || normalized.startsWith('../');
}

export function isRunJSTypeScriptAutoImportSourceAllowed(
  source: string | undefined,
  rewriteBuiltInAutoImports: boolean,
): boolean {
  if (!rewriteBuiltInAutoImports || !source) return true;
  return Boolean(getRunJSBuiltInAutoImportLibrary(source)) || isRelativeAutoImportSource(source);
}

function normalizeFileName(fileName: string): string {
  const normalized = String(fileName || '')
    .replace(/\\/gu, '/')
    .replace(/\/+/gu, '/');
  return normalized.startsWith('/') ? normalized : `/${normalized.replace(/^\/+/, '')}`;
}

function getScriptKind(ts: TypeScriptModule, fileName: string): import('typescript').ScriptKind {
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.tsx')) return ts.ScriptKind.TSX;
  if (lower.endsWith('.jsx')) return ts.ScriptKind.JSX;
  if (lower.endsWith('.js')) return ts.ScriptKind.JS;
  return ts.ScriptKind.TS;
}

function applyTextChanges(sourceText: string, textChanges: readonly TypeScriptTextChange[]): string {
  return [...textChanges]
    .sort((left, right) => right.span.start - left.span.start)
    .reduce((text, change) => {
      const start = change.span.start;
      const end = start + change.span.length;
      return `${text.slice(0, start)}${change.newText}${text.slice(end)}`;
    }, sourceText);
}

function moduleName(ts: TypeScriptModule, declaration: TypeScriptImportDeclaration): string | undefined {
  return ts.isStringLiteralLike(declaration.moduleSpecifier) ? declaration.moduleSpecifier.text : undefined;
}

function importsFrom(
  ts: TypeScriptModule,
  sourceFile: TypeScriptSourceFile,
  source: string,
): TypeScriptImportDeclaration[] {
  return sourceFile.statements.filter(
    (statement): statement is TypeScriptImportDeclaration =>
      ts.isImportDeclaration(statement) && moduleName(ts, statement) === source,
  );
}

function namedBindingContainsLocalName(namedImports: TypeScriptNamedImports, localName: string): boolean {
  return namedImports.elements.some((element) => element.name.text === localName);
}

function importContainsLocalName(
  ts: TypeScriptModule,
  declaration: TypeScriptImportDeclaration,
  localName: string,
): boolean {
  const importClause = declaration.importClause;
  if (!importClause) return false;
  if (importClause.name?.text === localName) return true;
  const bindings = importClause.namedBindings;
  if (!bindings) return false;
  if (ts.isNamespaceImport(bindings)) return bindings.name.text === localName;
  return namedBindingContainsLocalName(bindings, localName);
}

function namedImportText(sourceFile: TypeScriptSourceFile, namedImports: TypeScriptNamedImports, typeOnly: boolean) {
  return namedImports.elements
    .filter((element) => element.isTypeOnly === typeOnly)
    .map((element) => {
      const importedName = element.propertyName?.getText(sourceFile) || element.name.getText(sourceFile);
      const localName = element.name.getText(sourceFile);
      return importedName === localName ? importedName : `${importedName} as ${localName}`;
    });
}

function buildRuntimeReplacement(
  ts: TypeScriptModule,
  sourceFile: TypeScriptSourceFile,
  importClause: TypeScriptImportClause | undefined,
  source: string,
  libraryName: string,
): string | undefined {
  if (!importClause || importClause.isTypeOnly) return undefined;

  const runtimeAccess = `ctx.libs.${libraryName}`;
  const lines: string[] = [];
  if (importClause.name) {
    lines.push(`const ${importClause.name.text} = ${runtimeAccess};`);
  }

  const bindings = importClause.namedBindings;
  if (bindings && ts.isNamespaceImport(bindings)) {
    lines.push(`const ${bindings.name.text} = ${runtimeAccess};`);
  } else if (bindings && ts.isNamedImports(bindings)) {
    const runtimeBindings = bindings.elements
      .filter((element) => !element.isTypeOnly)
      .map((element) => {
        const importedName = element.propertyName?.getText(sourceFile) || element.name.getText(sourceFile);
        const localName = element.name.getText(sourceFile);
        if (importedName === 'default') return undefined;
        return importedName === localName ? importedName : `${importedName}: ${localName}`;
      })
      .filter((binding): binding is string => Boolean(binding));
    const defaultBindings = bindings.elements.filter(
      (element) =>
        !element.isTypeOnly &&
        (element.propertyName?.getText(sourceFile) || element.name.getText(sourceFile)) === 'default',
    );
    for (const binding of defaultBindings) {
      lines.push(`const ${binding.name.getText(sourceFile)} = ${runtimeAccess};`);
    }
    if (runtimeBindings.length) {
      lines.push(`const { ${runtimeBindings.join(', ')} } = ${runtimeAccess};`);
    }

    const typeBindings = namedImportText(sourceFile, bindings, true);
    if (typeBindings.length) {
      lines.unshift(`import type { ${typeBindings.join(', ')} } from ${JSON.stringify(source)};`);
    }
  }

  return lines.length ? lines.join('\n') : undefined;
}

function buildRuntimeDeclaration(
  ts: TypeScriptModule,
  sourceFile: TypeScriptSourceFile,
  importClause: TypeScriptImportClause | undefined,
  libraryName: string,
  localName: string,
): string | undefined {
  if (!importClause) return undefined;
  const runtimeAccess = `ctx.libs.${libraryName}`;
  if (importClause.name?.text === localName) {
    return `const ${localName} = ${runtimeAccess};`;
  }

  const bindings = importClause.namedBindings;
  if (bindings && ts.isNamespaceImport(bindings) && bindings.name.text === localName) {
    return `const ${localName} = ${runtimeAccess};`;
  }
  if (!bindings || ts.isNamespaceImport(bindings)) return undefined;

  const binding = bindings.elements.find((element) => element.name.text === localName);
  if (!binding) return undefined;
  const importedName = binding.propertyName?.getText(sourceFile) || binding.name.getText(sourceFile);
  if (importedName === 'default') {
    return `const ${localName} = ${runtimeAccess};`;
  }
  return `const { ${importedName === localName ? importedName : `${importedName}: ${localName}`} } = ${runtimeAccess};`;
}

function findUpdatedImport(
  ts: TypeScriptModule,
  sourceFile: TypeScriptSourceFile,
  source: string,
  localName: string,
): TypeScriptImportDeclaration | undefined {
  const imports = importsFrom(ts, sourceFile, source);
  return imports.find((declaration) => importContainsLocalName(ts, declaration, localName)) || imports[0];
}

function findOriginalImport(
  ts: TypeScriptModule,
  sourceFile: TypeScriptSourceFile,
  source: string,
  textChanges: readonly TypeScriptTextChange[],
): TypeScriptImportDeclaration | undefined {
  const imports = importsFrom(ts, sourceFile, source);
  return (
    imports.find((declaration) =>
      textChanges.some(
        (change) => change.span.start >= declaration.getStart(sourceFile) && change.span.start <= declaration.end,
      ),
    ) || imports[0]
  );
}

export function rewriteRunJSBuiltInAutoImportCodeActions(options: {
  codeActions: readonly TypeScriptCodeAction[] | undefined;
  currentFileName: string;
  libraryName: string;
  localName: string;
  source: string;
  sourceText: string;
  ts: TypeScriptModule;
}): RunJSBuiltInAutoImportChange[] | undefined {
  const { codeActions, currentFileName, libraryName, localName, source, sourceText, ts } = options;
  if (!codeActions?.length) return undefined;

  const originalSourceFile = ts.createSourceFile(
    currentFileName,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    getScriptKind(ts, currentFileName),
  );

  for (const action of codeActions) {
    const fileChange = action.changes.find(
      (change) => normalizeFileName(change.fileName) === normalizeFileName(currentFileName),
    );
    if (!fileChange?.textChanges.length) continue;

    const updatedText = applyTextChanges(sourceText, fileChange.textChanges);
    const updatedSourceFile = ts.createSourceFile(
      currentFileName,
      updatedText,
      ts.ScriptTarget.Latest,
      true,
      getScriptKind(ts, currentFileName),
    );
    const updatedImport = findUpdatedImport(ts, updatedSourceFile, source, localName);
    if (!updatedImport) continue;
    const originalImports = importsFrom(ts, originalSourceFile, source);
    const hasTypeOnlyImport = originalImports.some((declaration) => {
      const importClause = declaration.importClause;
      return (
        importClause?.isTypeOnly ||
        (!!importClause?.namedBindings &&
          ts.isNamedImports(importClause.namedBindings) &&
          importClause.namedBindings.elements.some((element) => element.isTypeOnly))
      );
    });
    if (hasTypeOnlyImport) {
      const runtimeDeclaration = buildRuntimeDeclaration(
        ts,
        updatedSourceFile,
        updatedImport.importClause,
        libraryName,
        localName,
      );
      if (runtimeDeclaration) {
        return [{ from: 0, insert: `${runtimeDeclaration}\n`, to: 0 }];
      }
      continue;
    }
    const replacement = buildRuntimeReplacement(ts, updatedSourceFile, updatedImport.importClause, source, libraryName);
    if (!replacement) continue;

    const originalImport = findOriginalImport(ts, originalSourceFile, source, fileChange.textChanges);
    if (originalImport) {
      return [
        {
          from: originalImport.getStart(originalSourceFile),
          insert: replacement,
          to: originalImport.end,
        },
      ];
    }

    return [
      {
        from: Math.min(...fileChange.textChanges.map((change) => change.span.start)),
        insert: `${replacement}\n`,
        to: Math.min(...fileChange.textChanges.map((change) => change.span.start)),
      },
    ];
  }

  return undefined;
}
