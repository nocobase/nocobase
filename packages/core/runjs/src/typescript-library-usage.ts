/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type {
  CollectRunJSTypeLibraryUsageInput,
  RunJSTypeLibraryRequest,
  RunJSTypeLibraryUsageDefinition,
} from './typescript-library';

type TypeScriptModule = typeof import('typescript');
type Node = import('typescript').Node;
type SourceFile = import('typescript').SourceFile;
type Expression = import('typescript').Expression;
type EntityName = import('typescript').EntityName;
type BindingName = import('typescript').BindingName;
type ObjectBindingPattern = import('typescript').ObjectBindingPattern;
type ImportDeclaration = import('typescript').ImportDeclaration;
type ImportTypeNode = import('typescript').ImportTypeNode;

type LibraryName = string;

type UsageTarget =
  | { kind: 'libs' }
  | { kind: 'library'; libraryName: LibraryName }
  | { kind: 'symbol'; libraryName: LibraryName; symbol: string }
  | { kind: 'full'; libraryName: LibraryName };

type ScopeBinding = { found: boolean; target: UsageTarget | null };

const sourceFilePattern = /(?:^|\.)(?:[cm]?[jt]sx?|d\.[cm]?ts)$/u;
const topLevelLibraries: Readonly<Record<string, LibraryName>> = {
  React: 'React',
  ReactDOM: 'ReactDOM',
  antd: 'antd',
  dayjs: 'dayjs',
};
const ctxLibraries: Readonly<Record<string, LibraryName>> = {
  React: 'React',
  ReactDOM: 'ReactDOM',
  antd: 'antd',
  antdIcons: 'antdIcons',
  dayjs: 'dayjs',
  lodash: 'lodash',
  math: 'math',
  formula: 'formula',
  clientSdk: 'clientSdk',
};

const builtInUsageDefinitions: readonly RunJSTypeLibraryUsageDefinition[] = Object.entries(ctxLibraries).map(
  ([libraryName]) => ({
    libraryName,
    packId: libraryPackId(libraryName),
    topLevelNames: Object.entries(topLevelLibraries)
      .filter(([, target]) => target === libraryName)
      .map(([name]) => name),
  }),
);

class Scope {
  private readonly bindings = new Map<string, UsageTarget | null>();

  constructor(private readonly parent?: Scope) {}

  declare(name: string): void {
    if (!this.bindings.has(name)) {
      this.bindings.set(name, null);
    }
  }

  set(name: string, target: UsageTarget | null): void {
    this.bindings.set(name, target);
  }

  lookup(name: string): ScopeBinding {
    if (this.bindings.has(name)) {
      return { found: true, target: this.bindings.get(name) || null };
    }
    return this.parent?.lookup(name) || { found: false, target: null };
  }
}

class UsageAnalyzer {
  private readonly requests = new Map<string, RunJSTypeLibraryRequest>();
  private readonly ctxLibraries = new Map<string, RunJSTypeLibraryUsageDefinition>();
  private readonly moduleLibraries = new Map<string, RunJSTypeLibraryUsageDefinition>();
  private readonly topLevelLibraries = new Map<string, RunJSTypeLibraryUsageDefinition>();

  constructor(
    private readonly ts: TypeScriptModule,
    definitions: readonly RunJSTypeLibraryUsageDefinition[],
  ) {
    for (const definition of definitions) {
      this.ctxLibraries.set(definition.libraryName, definition);
      for (const name of definition.topLevelNames || []) this.topLevelLibraries.set(name, definition);
      for (const name of definition.moduleNames || []) this.moduleLibraries.set(name, definition);
    }
  }

  analyze(sourceFile: SourceFile): void {
    const scope = new Scope();
    this.predeclareStatements(sourceFile.statements, scope);
    this.predeclareHoistedVarBindings(sourceFile, scope);
    this.seedConstAliases(sourceFile.statements, scope);
    sourceFile.statements.forEach((statement) => this.visit(statement, scope));
  }

  result(): RunJSTypeLibraryRequest[] {
    const fullLibraries = new Set(
      [...this.requests.values()].filter((request) => request.kind === 'full').map((request) => request.libraryName),
    );
    return [...this.requests.values()]
      .filter((request) => request.kind === 'full' || !fullLibraries.has(request.libraryName))
      .sort(compareRequests);
  }

  private visit(node: Node, scope: Scope): void {
    const ts = this.ts;
    if (ts.isBlock(node) || ts.isModuleBlock(node)) {
      const blockScope = new Scope(scope);
      this.predeclareStatements(node.statements, blockScope);
      this.seedConstAliases(node.statements, blockScope);
      node.statements.forEach((statement) => this.visit(statement, blockScope));
      return;
    }
    if (isFunctionLike(ts, node)) {
      const functionScope = new Scope(scope);
      if ('name' in node && node.name && ts.isIdentifier(node.name)) {
        functionScope.declare(node.name.text);
      }
      node.parameters.forEach((parameter) => this.declareBindingName(parameter.name, functionScope));
      if (node.body) this.predeclareHoistedVarBindings(node.body, functionScope);
      node.parameters.forEach((parameter) => {
        if (parameter.initializer) this.visitExpression(parameter.initializer, functionScope);
      });
      if (node.body) this.visit(node.body, functionScope);
      return;
    }
    if (ts.isCatchClause(node)) {
      const catchScope = new Scope(scope);
      if (node.variableDeclaration) {
        this.declareBindingName(node.variableDeclaration.name, catchScope);
      }
      this.visit(node.block, catchScope);
      return;
    }
    if (ts.isVariableDeclaration(node)) {
      this.visitVariableDeclaration(node, scope);
      return;
    }
    if (ts.isImportDeclaration(node)) {
      this.visitImportDeclaration(node, scope);
      return;
    }
    if (ts.isImportTypeNode(node)) {
      this.visitImportTypeNode(node);
      return;
    }
    if (ts.isSpreadAssignment(node) || ts.isSpreadElement(node)) {
      const target = this.resolveExpression(node.expression, scope);
      if (target?.kind === 'libs') this.emitAllLibraries();
      else if (target) this.emitTarget(target);
      else this.visitExpression(node.expression, scope);
      return;
    }
    if (ts.isTypeReferenceNode(node)) {
      const target = this.resolveEntityName(node.typeName, scope);
      if (target) this.emitTarget(target);
      ts.forEachChild(node, (child) => {
        if (!ts.isQualifiedName(child) && !ts.isIdentifier(child)) this.visit(child, scope);
      });
      return;
    }
    if (ts.isTypeQueryNode(node)) {
      const target = this.resolveEntityName(node.exprName, scope);
      if (target) this.emitTarget(target);
      ts.forEachChild(node, (child) => {
        if (!ts.isQualifiedName(child) && !ts.isIdentifier(child)) this.visit(child, scope);
      });
      return;
    }
    if (isJsxNode(ts, node)) {
      this.emitLibrary('React');
    }
    if (ts.isExpression(node)) {
      this.visitExpression(node, scope);
      return;
    }
    ts.forEachChild(node, (child) => this.visit(child, scope));
  }

  private visitVariableDeclaration(node: import('typescript').VariableDeclaration, scope: Scope): void {
    const ts = this.ts;
    this.declareBindingName(node.name, scope);
    if (!node.initializer) return;

    const declarationList = ts.isVariableDeclarationList(node.parent) ? node.parent : undefined;
    const isConst = Boolean(declarationList && declarationList.flags & ts.NodeFlags.Const);
    const target = this.resolveExpression(node.initializer, scope);

    if (isConst && target) {
      if (ts.isIdentifier(node.name)) {
        scope.set(node.name.text, target);
        if (target.kind === 'symbol' || target.kind === 'full') this.emitTarget(target);
        return;
      }
      if (ts.isObjectBindingPattern(node.name)) {
        this.bindObjectPattern(node.name, target, scope);
        return;
      }
    }

    this.visitExpression(node.initializer, scope);
    this.clearBindingName(node.name, scope);
  }

  private bindObjectPattern(pattern: ObjectBindingPattern, target: UsageTarget, scope: Scope): void {
    const ts = this.ts;
    for (const element of pattern.elements) {
      if (element.dotDotDotToken) {
        if (target.kind === 'libs') {
          this.emitAllLibraries();
        } else {
          this.emitTarget(toFullTarget(target));
        }
        this.clearBindingName(element.name, scope);
        continue;
      }

      const propertyName = element.propertyName || (ts.isIdentifier(element.name) ? element.name : undefined);
      const name = getStaticPropertyName(ts, propertyName);
      if (!name) {
        if (target.kind === 'libs') this.emitAllLibraries();
        else this.emitTarget(toFullTarget(target));
        this.clearBindingName(element.name, scope);
        if (element.initializer) this.visitExpression(element.initializer, scope);
        continue;
      }

      const child = this.resolveTargetProperty(target, name, false);
      if (!child) {
        this.clearBindingName(element.name, scope);
        continue;
      }
      if (ts.isIdentifier(element.name)) {
        scope.set(element.name.text, child);
        if (child.kind !== 'library' || !isGranularLibrary(child.libraryName)) {
          this.emitTarget(child);
        }
      } else if (ts.isObjectBindingPattern(element.name)) {
        this.bindObjectPattern(element.name, child, scope);
      } else {
        this.emitTarget(toFullTarget(child));
        this.clearBindingName(element.name, scope);
      }
      if (element.initializer) this.visitExpression(element.initializer, scope);
    }
  }

  private visitImportDeclaration(node: ImportDeclaration, scope: Scope): void {
    const ts = this.ts;
    const moduleName = ts.isStringLiteral(node.moduleSpecifier) ? node.moduleSpecifier.text : '';
    const clause = node.importClause;
    if (!moduleName || !clause) return;

    if (clause.name) {
      scope.declare(clause.name.text);
      const target = this.moduleTarget(moduleName);
      if (target) {
        scope.set(clause.name.text, target);
        this.emitTarget(target);
      }
    }

    const bindings = clause.namedBindings;
    if (!bindings) return;
    if (ts.isNamespaceImport(bindings)) {
      scope.declare(bindings.name.text);
      const target = this.moduleTarget(moduleName);
      if (target) {
        scope.set(bindings.name.text, target);
        this.emitTarget(target);
      }
      return;
    }

    for (const specifier of bindings.elements) {
      scope.declare(specifier.name.text);
      const importedName = (specifier.propertyName || specifier.name).text;
      const target = this.moduleTarget(moduleName, importedName);
      if (!target) continue;
      scope.set(specifier.name.text, target);
      this.emitTarget(target);
    }
  }

  private visitImportTypeNode(node: ImportTypeNode): void {
    const ts = this.ts;
    if (!ts.isLiteralTypeNode(node.argument) || !ts.isStringLiteral(node.argument.literal)) return;
    const qualifier = node.qualifier ? leftmostEntityName(node.qualifier) : undefined;
    const target = this.moduleTarget(node.argument.literal.text, qualifier);
    if (target) this.emitTarget(target);
  }

  private visitExpression(node: Expression, scope: Scope): void {
    const ts = this.ts;
    const expression = unwrapExpression(ts, node);

    if (ts.isPropertyAccessExpression(expression)) {
      if (!expression.name.text) {
        const cursorTarget = this.resolveExpression(expression.expression, scope);
        if (cursorTarget && cursorTarget.kind === 'library' && !isGranularLibrary(cursorTarget.libraryName)) {
          this.emitTarget(cursorTarget);
        }
        return;
      }
      const target = this.resolveExpression(expression, scope);
      if (target) {
        this.emitTarget(target);
      } else {
        this.visitExpression(expression.expression, scope);
      }
      return;
    }

    if (ts.isElementAccessExpression(expression)) {
      const target = this.resolveExpression(expression, scope);
      if (target) {
        this.emitTarget(target);
      } else {
        this.visitExpression(expression.expression, scope);
      }
      if (expression.argumentExpression) this.visitExpression(expression.argumentExpression, scope);
      return;
    }

    if (ts.isCallExpression(expression) || ts.isNewExpression(expression)) {
      const target = this.resolveExpression(expression.expression, scope);
      if (target) this.emitTarget(target);
      else this.visitExpression(expression.expression, scope);
      expression.arguments?.forEach((argument) => this.visitExpression(argument, scope));
      return;
    }

    if (ts.isIdentifier(expression)) {
      const binding = scope.lookup(expression.text);
      if (binding.found && binding.target) this.emitTarget(binding.target);
      return;
    }

    if (ts.isArrowFunction(expression) || ts.isFunctionExpression(expression)) {
      this.visit(expression, scope);
      return;
    }

    if (isJsxNode(ts, expression)) {
      this.emitLibrary('React');
    }
    ts.forEachChild(expression, (child) => this.visit(child, scope));
  }

  private resolveExpression(node: Expression, scope: Scope): UsageTarget | null {
    const ts = this.ts;
    const expression = unwrapExpression(ts, node);
    if (ts.isIdentifier(expression)) {
      return scope.lookup(expression.text).target;
    }
    if (ts.isPropertyAccessExpression(expression)) {
      if (ts.isIdentifier(expression.expression) && expression.expression.text === 'ctx') {
        if (scope.lookup('ctx').found) return null;
        if (expression.name.text === 'libs') return { kind: 'libs' };
        const definition = this.topLevelLibraries.get(expression.name.text);
        return definition ? { kind: 'library', libraryName: definition.libraryName } : null;
      }
      const base = this.resolveExpression(expression.expression, scope);
      if (!base || !expression.name.text) return base;
      return this.resolveTargetProperty(base, expression.name.text, false);
    }
    if (ts.isElementAccessExpression(expression)) {
      if (ts.isIdentifier(expression.expression) && expression.expression.text === 'ctx') {
        if (scope.lookup('ctx').found) return null;
        const property = getStaticExpressionName(ts, expression.argumentExpression);
        if (property === 'libs') return { kind: 'libs' };
        const definition = property ? this.topLevelLibraries.get(property) : undefined;
        return definition ? { kind: 'library', libraryName: definition.libraryName } : null;
      }
      const base = this.resolveExpression(expression.expression, scope);
      if (!base) return null;
      const property = getStaticExpressionName(ts, expression.argumentExpression);
      return property ? this.resolveTargetProperty(base, property, false) : this.resolveTargetProperty(base, '', true);
    }
    return null;
  }

  private resolveEntityName(name: EntityName, scope: Scope): UsageTarget | null {
    const ts = this.ts;
    if (ts.isIdentifier(name)) {
      const binding = scope.lookup(name.text);
      if (binding.found) return binding.target;
      const definition = this.topLevelLibraries.get(name.text);
      return definition ? { kind: 'library', libraryName: definition.libraryName } : null;
    }
    if (ts.isIdentifier(name.left) && name.left.text === 'ctx') {
      if (scope.lookup('ctx').found) return null;
      if (name.right.text === 'libs') return { kind: 'libs' };
      const definition = this.topLevelLibraries.get(name.right.text);
      return definition ? { kind: 'library', libraryName: definition.libraryName } : null;
    }
    const base = this.resolveEntityName(name.left, scope);
    return base ? this.resolveTargetProperty(base, name.right.text, false) : null;
  }

  private resolveTargetProperty(target: UsageTarget, property: string, dynamic: boolean): UsageTarget | null {
    if (target.kind === 'libs') {
      if (dynamic) return null;
      const definition = this.ctxLibraries.get(property);
      return definition ? { kind: 'library', libraryName: definition.libraryName } : null;
    }
    if (target.kind === 'full' || target.kind === 'symbol') return target;
    if (!isGranularLibrary(target.libraryName)) return target;
    if (dynamic) return { kind: 'full', libraryName: target.libraryName };
    return property ? { kind: 'symbol', libraryName: target.libraryName, symbol: property } : null;
  }

  private emitTarget(target: UsageTarget): void {
    if (target.kind === 'libs') return;
    if (target.kind === 'library') {
      if (isGranularLibrary(target.libraryName)) this.emitFull(target.libraryName);
      else this.emitLibrary(target.libraryName);
      return;
    }
    if (target.kind === 'full') {
      this.emitFull(target.libraryName);
      return;
    }
    this.emitSymbol(target.libraryName, target.symbol);
  }

  private emitLibrary(libraryName: LibraryName): void {
    const packId = this.ctxLibraries.get(libraryName)?.packId || libraryPackId(libraryName);
    this.requests.set(packId, { kind: 'library', libraryName, packId });
  }

  private emitFull(libraryName: LibraryName): void {
    if (!isGranularLibrary(libraryName)) {
      this.emitLibrary(libraryName);
      return;
    }
    const packId = libraryName === 'antd' ? 'antd/full' : 'antd-icons/full';
    this.requests.set(packId, { kind: 'full', libraryName, packId });
  }

  private emitSymbol(libraryName: LibraryName, symbol: string): void {
    if (!isGranularLibrary(libraryName)) {
      this.emitLibrary(libraryName);
      return;
    }
    if (!symbol) return;
    if (libraryName === 'antd') {
      const packId = `antd/${symbol}`;
      this.requests.set(packId, { kind: 'symbol', libraryName, packId, symbol });
      return;
    }
    const group = iconGroup(symbol);
    const packId = `antd-icons/${group}`;
    this.requests.set(`${packId}:${symbol}`, { kind: 'symbol', group, libraryName, packId, symbol });
  }

  private emitAllLibraries(): void {
    [...this.ctxLibraries.values()].forEach(({ libraryName }) => {
      if (isGranularLibrary(libraryName)) this.emitFull(libraryName);
      else this.emitLibrary(libraryName);
    });
  }

  private moduleTarget(moduleName: string, symbol?: string): UsageTarget | null {
    const builtInTarget = moduleTarget(moduleName, symbol);
    if (builtInTarget) return builtInTarget;
    const definition = this.moduleLibraries.get(moduleName);
    return definition ? { kind: 'library', libraryName: definition.libraryName } : null;
  }

  private predeclareStatements(
    statements: import('typescript').NodeArray<import('typescript').Statement>,
    scope: Scope,
  ) {
    const ts = this.ts;
    for (const statement of statements) {
      if (ts.isVariableStatement(statement)) {
        statement.declarationList.declarations.forEach((declaration) =>
          this.declareBindingName(declaration.name, scope),
        );
      } else if (
        (ts.isFunctionDeclaration(statement) || ts.isClassDeclaration(statement) || ts.isEnumDeclaration(statement)) &&
        statement.name
      ) {
        scope.declare(statement.name.text);
      } else if (
        (ts.isTypeAliasDeclaration(statement) ||
          ts.isInterfaceDeclaration(statement) ||
          ts.isModuleDeclaration(statement)) &&
        ts.isIdentifier(statement.name)
      ) {
        scope.declare(statement.name.text);
      } else if (ts.isImportDeclaration(statement) && statement.importClause) {
        const clause = statement.importClause;
        if (clause.name) scope.declare(clause.name.text);
        if (clause.namedBindings) {
          if (ts.isNamespaceImport(clause.namedBindings)) scope.declare(clause.namedBindings.name.text);
          else clause.namedBindings.elements.forEach((element) => scope.declare(element.name.text));
        }
      }
    }
  }

  private predeclareHoistedVarBindings(root: Node, scope: Scope): void {
    const ts = this.ts;
    const visit = (node: Node): void => {
      if (node !== root && isFunctionLike(ts, node)) return;
      if (ts.isVariableDeclarationList(node) && !(node.flags & (ts.NodeFlags.Let | ts.NodeFlags.Const))) {
        node.declarations.forEach((declaration) => this.declareBindingName(declaration.name, scope));
      }
      ts.forEachChild(node, visit);
    };
    visit(root);
  }

  private seedConstAliases(
    statements: import('typescript').NodeArray<import('typescript').Statement>,
    scope: Scope,
  ): void {
    const ts = this.ts;
    const declarations = statements.flatMap((statement) => {
      if (!ts.isVariableStatement(statement) || !(statement.declarationList.flags & ts.NodeFlags.Const)) return [];
      return statement.declarationList.declarations.filter(
        (
          declaration,
        ): declaration is import('typescript').VariableDeclaration & { name: import('typescript').Identifier } =>
          ts.isIdentifier(declaration.name) && Boolean(declaration.initializer),
      );
    });
    for (let pass = 0; pass < declarations.length; pass += 1) {
      let changed = false;
      for (const declaration of declarations) {
        const target = this.resolveExpression(declaration.initializer as Expression, scope);
        if (!target) continue;
        const current = scope.lookup(declaration.name.text).target;
        if (!sameTarget(current, target)) {
          scope.set(declaration.name.text, target);
          changed = true;
        }
      }
      if (!changed) break;
    }
  }

  private declareBindingName(name: BindingName, scope: Scope): void {
    const ts = this.ts;
    if (ts.isIdentifier(name)) {
      scope.declare(name.text);
      return;
    }
    name.elements.forEach((element) => {
      if (!ts.isOmittedExpression(element)) this.declareBindingName(element.name, scope);
    });
  }

  private clearBindingName(name: BindingName, scope: Scope): void {
    const ts = this.ts;
    if (ts.isIdentifier(name)) {
      scope.set(name.text, null);
      return;
    }
    name.elements.forEach((element) => {
      if (!ts.isOmittedExpression(element)) this.clearBindingName(element.name, scope);
    });
  }
}

export function collectRunJSTypeLibraryUsage(
  ts: TypeScriptModule,
  input: CollectRunJSTypeLibraryUsageInput,
): RunJSTypeLibraryRequest[] {
  const files = collectSourceFiles(input);
  const customDefinitions = input.libraries || [];
  const definitions = new Map<string, RunJSTypeLibraryUsageDefinition>();
  for (const definition of [...builtInUsageDefinitions, ...customDefinitions]) {
    const existing = definitions.get(definition.libraryName);
    definitions.set(definition.libraryName, {
      ...existing,
      ...definition,
      moduleNames: [...new Set([...(existing?.moduleNames || []), ...(definition.moduleNames || [])])],
      topLevelNames: [...new Set([...(existing?.topLevelNames || []), ...(definition.topLevelNames || [])])],
    });
  }
  const analyzer = new UsageAnalyzer(ts, [...definitions.values()]);
  for (const [path, content] of files) {
    analyzer.analyze(ts.createSourceFile(path, content, ts.ScriptTarget.Latest, true, getScriptKind(ts, path)));
  }
  return analyzer.result();
}

function collectSourceFiles(input: CollectRunJSTypeLibraryUsageInput): Array<[string, string]> {
  const files = new Map<string, string>();
  for (const file of input.files || []) {
    const path = normalizeUsagePath(file.path);
    if (file.operation === 'delete') {
      files.delete(path);
    } else if (typeof file.content === 'string' && sourceFilePattern.test(path.toLowerCase())) {
      files.set(path, file.content);
    }
  }
  if (input.currentFile) {
    const path = normalizeUsagePath(input.currentFile.path);
    if (sourceFilePattern.test(path.toLowerCase())) files.set(path, input.currentFile.content);
  }
  return [...files.entries()].sort(([left], [right]) => left.localeCompare(right));
}

function normalizeUsagePath(path: string): string {
  return String(path || '')
    .replace(/\\/gu, '/')
    .replace(/^\/+|\/+$/gu, '')
    .replace(/\/+/gu, '/');
}

function getScriptKind(ts: TypeScriptModule, path: string): import('typescript').ScriptKind {
  const lower = path.toLowerCase();
  if (lower.endsWith('.tsx')) return ts.ScriptKind.TSX;
  if (lower.endsWith('.jsx')) return ts.ScriptKind.JSX;
  if (lower.endsWith('.js') || lower.endsWith('.mjs') || lower.endsWith('.cjs')) return ts.ScriptKind.JS;
  return ts.ScriptKind.TS;
}

function unwrapExpression(ts: TypeScriptModule, node: Expression): Expression {
  let expression = node;
  while (
    ts.isParenthesizedExpression(expression) ||
    ts.isAsExpression(expression) ||
    ts.isTypeAssertionExpression(expression) ||
    ts.isNonNullExpression(expression) ||
    ts.isSatisfiesExpression(expression)
  ) {
    expression = expression.expression;
  }
  return expression;
}

function getStaticExpressionName(ts: TypeScriptModule, node?: Expression): string | null {
  if (!node) return null;
  const expression = unwrapExpression(ts, node);
  if (ts.isStringLiteral(expression) || ts.isNoSubstitutionTemplateLiteral(expression)) {
    return expression.isUnterminated ? null : expression.text;
  }
  return null;
}

function getStaticPropertyName(ts: TypeScriptModule, node?: import('typescript').PropertyName): string | null {
  if (!node) return null;
  if (ts.isIdentifier(node) || ts.isStringLiteral(node)) return node.text;
  if (ts.isComputedPropertyName(node)) return getStaticExpressionName(ts, node.expression);
  return null;
}

function isGranularLibrary(libraryName: LibraryName): libraryName is 'antd' | 'antdIcons' {
  return libraryName === 'antd' || libraryName === 'antdIcons';
}

function toFullTarget(target: UsageTarget): UsageTarget {
  if (target.kind === 'libs') return target;
  return isGranularLibrary(target.libraryName) ? { kind: 'full', libraryName: target.libraryName } : target;
}

function sameTarget(left: UsageTarget | null, right: UsageTarget): boolean {
  if (!left || left.kind !== right.kind) return false;
  if (left.kind === 'libs' || right.kind === 'libs') return left.kind === right.kind;
  if (left.libraryName !== right.libraryName) return false;
  return left.kind !== 'symbol' || (right.kind === 'symbol' && left.symbol === right.symbol);
}

function libraryPackId(libraryName: Exclude<LibraryName, 'antd' | 'antdIcons'>): string;
function libraryPackId(libraryName: LibraryName): string;
function libraryPackId(libraryName: LibraryName): string {
  switch (libraryName) {
    case 'React':
      return 'react';
    case 'ReactDOM':
      return 'react-dom/client';
    case 'dayjs':
      return 'dayjs';
    case 'lodash':
      return 'lodash';
    case 'math':
      return 'mathjs';
    case 'formula':
      return 'formulajs';
    case 'clientSdk':
      return '@nocobase/sdk/client';
    case 'antd':
      return 'antd/full';
    case 'antdIcons':
      return 'antd-icons/full';
    default:
      return libraryName;
  }
}

function iconGroup(symbol: string): string {
  const first = Array.from(symbol)[0] || '';
  return /^[A-Za-z]$/u.test(first) ? first.toUpperCase() : 'other';
}

function moduleTarget(moduleName: string, symbol?: string): UsageTarget | null {
  if (moduleName === '@nocobase/sdk/client') return { kind: 'library', libraryName: 'clientSdk' };
  if (moduleName === 'react' || moduleName.startsWith('react/')) return { kind: 'library', libraryName: 'React' };
  if (moduleName === 'react-dom' || moduleName === 'react-dom/client') {
    return { kind: 'library', libraryName: 'ReactDOM' };
  }
  if (moduleName === 'dayjs' || moduleName.startsWith('dayjs/')) return { kind: 'library', libraryName: 'dayjs' };
  if (moduleName === 'lodash' || moduleName.startsWith('lodash/')) return { kind: 'library', libraryName: 'lodash' };
  if (moduleName === 'mathjs') return { kind: 'library', libraryName: 'math' };
  if (moduleName === '@formulajs/formulajs') return { kind: 'library', libraryName: 'formula' };
  if (moduleName === 'antd') {
    return symbol ? { kind: 'symbol', libraryName: 'antd', symbol } : { kind: 'full', libraryName: 'antd' };
  }
  if (moduleName.startsWith('antd/es/') || moduleName.startsWith('antd/lib/')) {
    const entry = moduleName.split('/')[2] || '';
    const entrySymbol = entry ? toPascalCase(entry) : symbol;
    return entrySymbol
      ? { kind: 'symbol', libraryName: 'antd', symbol: entrySymbol }
      : { kind: 'full', libraryName: 'antd' };
  }
  if (moduleName === '@ant-design/icons') {
    return symbol ? { kind: 'symbol', libraryName: 'antdIcons', symbol } : { kind: 'full', libraryName: 'antdIcons' };
  }
  return null;
}

function toPascalCase(value: string): string {
  return value
    .split(/[-_]/u)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join('');
}

function leftmostEntityName(name: EntityName): string {
  let current = name;
  while ('left' in current) current = current.left;
  return current.text;
}

function isFunctionLike(ts: TypeScriptModule, node: Node): node is import('typescript').FunctionLikeDeclaration {
  return (
    ts.isFunctionDeclaration(node) ||
    ts.isFunctionExpression(node) ||
    ts.isArrowFunction(node) ||
    ts.isMethodDeclaration(node) ||
    ts.isGetAccessorDeclaration(node) ||
    ts.isSetAccessorDeclaration(node) ||
    ts.isConstructorDeclaration(node)
  );
}

function isJsxNode(ts: TypeScriptModule, node: Node): boolean {
  return (
    ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node) || ts.isJsxFragment(node) || ts.isJsxOpeningElement(node)
  );
}

function compareRequests(left: RunJSTypeLibraryRequest, right: RunJSTypeLibraryRequest): number {
  return (
    left.packId.localeCompare(right.packId) ||
    String('symbol' in left ? left.symbol : '').localeCompare(String('symbol' in right ? right.symbol : '')) ||
    left.libraryName.localeCompare(right.libraryName) ||
    left.kind.localeCompare(right.kind)
  );
}
