/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { existsSync, readFileSync, statSync } from 'fs';
import { dirname, resolve as resolvePath } from 'path';
import * as ts from 'typescript';
import { parseFlowSurfaceTranslationExpressionLabel } from './labels';
import { createFlowSurfaceExtractionRecorder } from './recorder';
import type { FlowSurfaceNodeSpec } from '../types';
import type {
  FlowSurfaceExtractionEvent,
  FlowSurfaceExtractorFlowStaticStatus,
  FlowSurfaceExtractorLabelFields,
  FlowSurfaceFieldBindingRole,
} from './types';

const FIELD_BINDING_ROLE_BY_MODEL = new Map<string, FlowSurfaceFieldBindingRole>([
  ['DisplayItemModel', 'display'],
  ['DetailsItemModel', 'display'],
  ['FormAssociationItemModel', 'display'],
  ['EditableItemModel', 'editable'],
  ['FormItemModel', 'editable'],
  ['AssignFormItemModel', 'editable'],
  ['FilterableItemModel', 'filterable'],
  ['FilterFormItemModel', 'filterable'],
]);
const SLOT_BY_MODEL_USE = new Map<string, string>([
  ['FormItemModel', 'fields'],
  ['AssignFormItemModel', 'fields'],
  ['FormAssociationFieldGroupModel', 'fields'],
  ['FormCustomItemModel', 'fields'],
  ['FormJSFieldItemModel', 'fields'],
  ['DetailsItemModel', 'fields'],
  ['DetailsCustomItemModel', 'fields'],
  ['DetailsJSFieldItemModel', 'fields'],
  ['FilterFormItemModel', 'fields'],
  ['FilterFormCustomItemModel', 'fields'],
]);
const STATIC_TRANSLATION_HELPER_NAMES = new Set(['t', 'tExpr']);

export type FlowSurfaceAstExtractionInput = {
  source: string;
  sourceFile?: string;
  sourcePath?: string;
};

type FlowSurfaceAstExtractionContext = {
  source: string;
  sourcePath?: string;
  namespaceImports: Map<string, string>;
  namedImports: Map<string, FlowSurfaceNamedImport>;
  moduleSourceCache: Map<string, FlowSurfaceResolvedModuleSource | undefined>;
};

type FlowSurfaceNamedImport = {
  specifier: string;
  importedName: string;
};

type FlowSurfaceResolvedModuleSource = {
  filePath: string;
  source: string;
};

type FlowSurfaceStaticObjectRegistration = {
  name: string;
  initializer?: ts.Expression;
};

export function collectFlowSurfaceExtractorAstEvents(
  input: FlowSurfaceAstExtractionInput,
): FlowSurfaceExtractionEvent[] {
  const recorder = createFlowSurfaceExtractionRecorder();
  const source = input.sourceFile || 'ast';
  const sourceFile = ts.createSourceFile(source, input.source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const context: FlowSurfaceAstExtractionContext = {
    source,
    ...(input.sourcePath || input.sourceFile ? { sourcePath: input.sourcePath || input.sourceFile } : {}),
    namespaceImports: collectNamespaceImports(sourceFile),
    namedImports: collectNamedImports(sourceFile),
    moduleSourceCache: new Map(),
  };
  const skippedLoaderFunctions = collectRegisteredModelLoaderFunctionNodes(sourceFile, context);

  function visit(node: ts.Node) {
    if (skippedLoaderFunctions.has(node)) {
      return;
    }
    if (ts.isCallExpression(node)) {
      inspectCallExpression(node, recorder, context);
      if (getPropertyAccessName(node.expression) === 'registerModelLoaders') {
        return;
      }
    }
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      inspectJsxElement(node, recorder, context.source);
    }
    if (ts.isVariableStatement(node)) {
      inspectVariableStatement(node, recorder, context.source);
    }
    if (ts.isClassDeclaration(node)) {
      inspectClassDeclaration(node, recorder, context.source);
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return recorder.getEvents();
}

export function collectFlowSurfaceExtractorModuleSpecifiers(input: FlowSurfaceAstExtractionInput): string[] {
  const sourceFile = ts.createSourceFile(
    input.sourceFile || 'ast',
    input.source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const specifiers = new Set<string>();

  function addSpecifier(node: ts.Expression | undefined) {
    if (node && (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node))) {
      specifiers.add(node.text);
    }
  }

  function visit(node: ts.Node) {
    if (ts.isImportDeclaration(node) && !isTypeOnlyImportDeclaration(node)) {
      addSpecifier(node.moduleSpecifier);
    } else if (ts.isExportDeclaration(node) && !isTypeOnlyExportDeclaration(node)) {
      addSpecifier(node.moduleSpecifier);
    } else if (
      ts.isImportEqualsDeclaration(node) &&
      !node.isTypeOnly &&
      ts.isExternalModuleReference(node.moduleReference)
    ) {
      addSpecifier(node.moduleReference.expression);
    } else if (
      ts.isCallExpression(node) &&
      (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
        (ts.isIdentifier(node.expression) && node.expression.text === 'require'))
    ) {
      addSpecifier(node.arguments[0]);
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return Array.from(specifiers);
}

function isTypeOnlyImportDeclaration(node: ts.ImportDeclaration) {
  if (node.importClause?.isTypeOnly) {
    return true;
  }
  const bindings = node.importClause?.namedBindings;
  return (
    !!bindings &&
    ts.isNamedImports(bindings) &&
    bindings.elements.length > 0 &&
    bindings.elements.every((item) => item.isTypeOnly)
  );
}

function isTypeOnlyExportDeclaration(node: ts.ExportDeclaration) {
  return (
    node.isTypeOnly ||
    (!!node.exportClause &&
      ts.isNamedExports(node.exportClause) &&
      node.exportClause.elements.length > 0 &&
      node.exportClause.elements.every((item) => item.isTypeOnly))
  );
}

function collectRegisteredModelLoaderFunctionNodes(
  sourceFile: ts.SourceFile,
  context: FlowSurfaceAstExtractionContext,
) {
  const nodes = new WeakSet<ts.Node>();

  function visit(node: ts.Node) {
    if (ts.isCallExpression(node) && getPropertyAccessName(node.expression) === 'registerModelLoaders') {
      collectModelLoaderFunctionNodes(node.arguments[0], node, context).forEach((loaderNode) => {
        nodes.add(loaderNode);
      });
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return nodes;
}

function inspectCallExpression(
  node: ts.CallExpression,
  recorder: ReturnType<typeof createFlowSurfaceExtractionRecorder>,
  context: FlowSurfaceAstExtractionContext,
) {
  const propertyName = getPropertyAccessName(node.expression);
  switch (propertyName) {
    case 'registerModels':
      collectRegisteredModels(node, recorder, context);
      break;
    case 'registerModelLoaders':
      collectRegisteredModelLoaders(node, recorder, context);
      break;
    case 'registerFlow':
      collectRegisteredFlow(node, recorder, context);
      break;
    case 'define':
      collectModelDefinition(node, recorder, context.source);
      break;
    case 'bindModelToInterface':
      collectFieldBinding(node, recorder, context.source);
      break;
    default:
      break;
  }
}

function inspectJsxElement(
  node: ts.JsxOpeningElement | ts.JsxSelfClosingElement,
  recorder: ReturnType<typeof createFlowSurfaceExtractionRecorder>,
  source: string,
) {
  if (node.tagName.getText() !== 'AddSubModelButton') {
    return;
  }
  const attributes = getJsxAttributes(node);
  const normalizedSlot = normalizeSubModelSlot(attributes.subModelKey);
  const inferredSlot =
    inferSlotFromModelUse(attributes.subModelBaseClassUse) || inferSlotFromModelUses(attributes.subModelBaseClassUses);
  const slot = normalizedSlot === 'items' ? inferredSlot || normalizedSlot : normalizedSlot || inferredSlot;
  const staticItems = getStaticJsxItems(attributes.itemsExpression, node);
  staticItems.forEach((item) => {
    recorder.recordMenuItem({
      menuKey: item.key,
      ...item.labelFields,
      modelUse: item.modelUse || attributes.modelUse,
      slot,
      createModelOptionsStatus: item.createModelOptionsStatus,
      ...(item.createModelOptionsUse ? { createModelOptionsUse: item.createModelOptionsUse } : {}),
      ...(item.createModelOptions ? { createModelOptions: item.createModelOptions } : {}),
      source,
      evidenceSource: 'ast',
      confidence: item.modelUse || attributes.modelUse ? 'medium' : 'low',
    });
  });
  if (staticItems.length) {
    return;
  }
  const labelFields = firstLabelFields(attributes.titleLabel, attributes.labelLabel);
  recorder.recordMenuItem({
    menuKey: attributes.key,
    ...labelFields,
    modelUse: attributes.modelUse,
    slot,
    createModelOptionsStatus: attributes.itemsExpression ? 'dynamic' : 'unresolved',
    source,
    evidenceSource: 'ast',
    confidence: attributes.modelUse ? 'medium' : 'low',
  });
}

function inspectClassDeclaration(
  node: ts.ClassDeclaration,
  recorder: ReturnType<typeof createFlowSurfaceExtractionRecorder>,
  source: string,
) {
  const modelUse = node.name?.text;
  if (!modelUse || !/Model$/.test(modelUse)) {
    return;
  }
  const baseClass = node.heritageClauses
    ?.find((clause) => clause.token === ts.SyntaxKind.ExtendsKeyword)
    ?.types.map((type) => getExpressionName(type.expression))
    .find(Boolean);
  if (!baseClass) {
    return;
  }
  recorder.recordModelClass({
    modelUse,
    modelBaseClass: baseClass,
    source,
    evidenceSource: 'ast',
    confidence: 'medium',
  });
}

function inspectVariableStatement(
  node: ts.VariableStatement,
  recorder: ReturnType<typeof createFlowSurfaceExtractionRecorder>,
  source: string,
) {
  node.declarationList.declarations.forEach((declaration) => {
    if (!ts.isIdentifier(declaration.name) || !/^ALLOWED_.+_ACTIONS$/.test(declaration.name.text)) {
      return;
    }
    getStaticStringList(declaration.initializer).forEach((modelUse, index) => {
      recorder.recordMenuItem({
        menuKey: toStaticActionMenuKey(modelUse, index),
        modelUse,
        slot: 'actions',
        createModelOptionsStatus: 'static',
        createModelOptionsUse: modelUse,
        source,
        evidenceSource: 'ast',
        confidence: 'medium',
      });
    });
  });
}

function collectRegisteredModels(
  node: ts.CallExpression,
  recorder: ReturnType<typeof createFlowSurfaceExtractionRecorder>,
  context: FlowSurfaceAstExtractionContext,
) {
  collectStaticObjectRegistrations(node.arguments[0], node, context).forEach((registration) => {
    recorder.recordModel({
      modelUse: registration.name,
      className: getExpressionName(registration.initializer) || registration.name,
      source: context.source,
      evidenceSource: 'ast',
      confidence: 'medium',
    });
  });
}

function collectRegisteredModelLoaders(
  node: ts.CallExpression,
  recorder: ReturnType<typeof createFlowSurfaceExtractionRecorder>,
  context: FlowSurfaceAstExtractionContext,
) {
  collectStaticObjectRegistrations(node.arguments[0], node, context).forEach((registration) => {
    recorder.recordModelLoader({
      modelUse: registration.name,
      loaderName: getLoaderNameFromInitializer(registration.initializer),
      source: context.source,
      evidenceSource: 'ast',
      confidence: 'medium',
    });
  });
}

function collectModelLoaderFunctionNodes(
  node: ts.Node | undefined,
  usageNode: ts.Node,
  context: FlowSurfaceAstExtractionContext,
) {
  const expression =
    node && ts.isExpression(node) ? resolveStaticExpressionNode(node, usageNode) || unwrapExpression(node) : undefined;
  const properties = getObjectLiteralProperties(expression);
  return properties.flatMap((property) =>
    getLoaderFunctionNodesFromInitializer(getPropertyInitializer(property), usageNode),
  );
}

function collectRegisteredFlow(
  node: ts.CallExpression,
  recorder: ReturnType<typeof createFlowSurfaceExtractionRecorder>,
  context: FlowSurfaceAstExtractionContext,
) {
  const keyArgument = getStaticString(node.arguments[0]);
  const flowNode = keyArgument ? node.arguments[1] : node.arguments[0];
  const flow = resolveStaticFlowObjectLiteral(flowNode, node, context);
  const propertyAccess = ts.isPropertyAccessExpression(node.expression) ? node.expression : undefined;
  const modelUse = propertyAccess ? getRegisterFlowModelUse(propertyAccess.expression) : undefined;
  recorder.recordFlow({
    modelUse,
    flowKey: keyArgument || getStaticString(getObjectPropertyValue(flow, 'key')),
    title: getStaticTitle(getObjectPropertyValue(flow, 'title')),
    sort: getStaticNumber(getObjectPropertyValue(flow, 'sort')),
    staticStatus: flow ? getStaticStatusFromNode(flow) : flowNode ? 'dynamic' : 'unresolved',
    source: context.source,
    evidenceSource: 'ast',
    confidence: 'medium',
  });
}

function collectModelDefinition(
  node: ts.CallExpression,
  recorder: ReturnType<typeof createFlowSurfaceExtractionRecorder>,
  source: string,
) {
  const definition = getObjectLiteral(node.arguments[0]);
  const propertyAccess = ts.isPropertyAccessExpression(node.expression) ? node.expression : undefined;
  const modelUse = propertyAccess ? getExpressionName(propertyAccess.expression) : undefined;
  if (!modelUse || !definition) {
    return;
  }
  const createModelOptions = getObjectPropertyValue(definition, 'createModelOptions');
  const createModelOptionsObject = getObjectLiteral(createModelOptions);
  const createModelOptionsUse = getStaticString(getObjectPropertyValue(createModelOptionsObject, 'use'));
  const staticCreateModelOptions = getStaticCreateModelOptions(createModelOptions);
  const labelFields = firstLabelFields(
    getStaticLabel(getObjectPropertyValue(definition, 'label')),
    getStaticLabel(getObjectPropertyValue(definition, 'title')),
  );
  recorder.recordMenuItem({
    ...labelFields,
    modelUse,
    slot: inferSlotFromModelUse(modelUse),
    createModelOptionsStatus: getCreateModelOptionsStaticStatus(createModelOptions),
    ...(createModelOptionsUse ? { createModelOptionsUse } : {}),
    ...getCreateModelOptionsSubModels(createModelOptionsObject),
    ...(staticCreateModelOptions ? { createModelOptions: staticCreateModelOptions } : {}),
    source,
    evidenceSource: 'ast',
    confidence: 'medium',
  });
}

function collectFieldBinding(
  node: ts.CallExpression,
  recorder: ReturnType<typeof createFlowSurfaceExtractionRecorder>,
  source: string,
) {
  const propertyAccess = ts.isPropertyAccessExpression(node.expression) ? node.expression : undefined;
  const binderName = propertyAccess ? getExpressionName(propertyAccess.expression) : undefined;
  const modelUse = getStaticString(node.arguments[0]);
  const fieldInterfaces = getStaticStringList(node.arguments[1]);
  const role = inferFieldBindingRole(binderName);
  fieldInterfaces.forEach((fieldInterface) => {
    recorder.recordFieldBinding({
      fieldInterface,
      modelUse,
      role,
      source,
      evidenceSource: 'ast',
      confidence: 'medium',
    });
  });
}

function getObjectLiteralProperties(node: ts.Node | undefined) {
  const objectLiteral = getObjectLiteral(node);
  if (!objectLiteral) {
    return [];
  }
  return objectLiteral.properties.filter(
    (property): property is ts.PropertyAssignment | ts.ShorthandPropertyAssignment =>
      ts.isPropertyAssignment(property) || ts.isShorthandPropertyAssignment(property),
  );
}

function collectStaticObjectRegistrations(
  node: ts.Node | undefined,
  usageNode: ts.Node,
  context: FlowSurfaceAstExtractionContext,
): FlowSurfaceStaticObjectRegistration[] {
  const expression =
    node && ts.isExpression(node) ? resolveStaticExpressionNode(node, usageNode) || unwrapExpression(node) : undefined;
  const properties = getObjectLiteralProperties(expression);
  if (properties.length) {
    return properties.flatMap((property) => {
      const name = getPropertyNameText(property.name);
      return name
        ? [
            {
              name,
              initializer: getPropertyInitializer(property),
            },
          ]
        : [];
    });
  }
  const namespaceIdentifier = expression
    ? getStaticNamespaceImportIdentifier(expression, usageNode, context.namespaceImports)
    : undefined;
  if (!namespaceIdentifier) {
    return [];
  }
  return collectNamespaceImportModelNames(namespaceIdentifier, context).map((name) => ({
    name,
  }));
}

function collectNamespaceImports(sourceFile: ts.SourceFile) {
  const imports = new Map<string, string>();
  sourceFile.statements.forEach((statement) => {
    if (
      !ts.isImportDeclaration(statement) ||
      !statement.importClause ||
      !ts.isStringLiteral(statement.moduleSpecifier)
    ) {
      return;
    }
    const namedBindings = statement.importClause.namedBindings;
    if (!namedBindings || !ts.isNamespaceImport(namedBindings)) {
      return;
    }
    imports.set(namedBindings.name.text, statement.moduleSpecifier.text);
  });
  return imports;
}

function collectNamedImports(sourceFile: ts.SourceFile) {
  const imports = new Map<string, FlowSurfaceNamedImport>();
  sourceFile.statements.forEach((statement) => {
    if (
      !ts.isImportDeclaration(statement) ||
      !statement.importClause ||
      !ts.isStringLiteral(statement.moduleSpecifier)
    ) {
      return;
    }
    const moduleSpecifier = statement.moduleSpecifier;
    const namedBindings = statement.importClause.namedBindings;
    if (!namedBindings || !ts.isNamedImports(namedBindings)) {
      return;
    }
    namedBindings.elements.forEach((element) => {
      imports.set(element.name.text, {
        specifier: moduleSpecifier.text,
        importedName: element.propertyName?.text || element.name.text,
      });
    });
  });
  return imports;
}

function resolveStaticFlowObjectLiteral(
  node: ts.Node | undefined,
  usageNode: ts.Node,
  context: FlowSurfaceAstExtractionContext,
): ts.ObjectLiteralExpression | undefined {
  if (!node || !ts.isExpression(node)) {
    return undefined;
  }
  const expression = resolveStaticExpressionNode(node, usageNode) || unwrapExpression(node);
  const directObject = unwrapDefineFlowCall(expression);
  if (directObject) {
    return directObject;
  }
  if (!ts.isIdentifier(expression)) {
    return undefined;
  }
  const importedFlow = context.namedImports.get(expression.text);
  if (!importedFlow) {
    return undefined;
  }
  return resolveImportedFlowObjectLiteral(importedFlow, context);
}

function resolveImportedFlowObjectLiteral(
  importedFlow: FlowSurfaceNamedImport,
  context: FlowSurfaceAstExtractionContext,
): ts.ObjectLiteralExpression | undefined {
  const moduleSource = resolveRelativeModuleSource(
    importedFlow.specifier,
    context.sourcePath,
    context.moduleSourceCache,
  );
  if (!moduleSource) {
    return undefined;
  }
  return findExportedObjectLiteral(moduleSource, importedFlow.importedName);
}

function findExportedObjectLiteral(
  moduleSource: FlowSurfaceResolvedModuleSource,
  exportName: string,
): ts.ObjectLiteralExpression | undefined {
  const sourceFile = ts.createSourceFile(
    moduleSource.filePath,
    moduleSource.source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement) || !hasExportModifier(statement)) {
      continue;
    }
    for (const declaration of statement.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name) || declaration.name.text !== exportName || !declaration.initializer) {
        continue;
      }
      const objectLiteral = unwrapDefineFlowCall(unwrapExpression(declaration.initializer));
      if (objectLiteral) {
        return objectLiteral;
      }
    }
  }
  return undefined;
}

function unwrapDefineFlowCall(node: ts.Node | undefined): ts.ObjectLiteralExpression | undefined {
  if (!node) {
    return undefined;
  }
  if (ts.isObjectLiteralExpression(node)) {
    return node;
  }
  if (ts.isCallExpression(node) && getExpressionName(node.expression) === 'defineFlow') {
    return getObjectLiteral(node.arguments[0]);
  }
  return undefined;
}

function getStaticNamespaceImportIdentifier(
  node: ts.Node,
  usageNode: ts.Node,
  namespaceImports: Map<string, string>,
): ts.Identifier | undefined {
  const expression = unwrapExpression(node);
  if (ts.isIdentifier(expression) && namespaceImports.has(expression.text)) {
    return expression;
  }
  if (!ts.isIdentifier(expression)) {
    return undefined;
  }
  const aliasInitializer = findConstInitializer(expression, usageNode);
  if (!aliasInitializer) {
    return undefined;
  }
  const aliasExpression = unwrapExpression(aliasInitializer);
  return ts.isIdentifier(aliasExpression) && namespaceImports.has(aliasExpression.text) ? aliasExpression : undefined;
}

function collectNamespaceImportModelNames(
  identifier: ts.Identifier,
  context: FlowSurfaceAstExtractionContext,
): string[] {
  const specifier = context.namespaceImports.get(identifier.text);
  if (!specifier) {
    return [];
  }
  const moduleSource = resolveRelativeModuleSource(specifier, context.sourcePath, context.moduleSourceCache);
  if (!moduleSource) {
    return [];
  }
  return collectExportedModelNames(moduleSource, context.moduleSourceCache, new Set(), 0);
}

function collectExportedModelNames(
  moduleSource: FlowSurfaceResolvedModuleSource,
  moduleSourceCache: Map<string, FlowSurfaceResolvedModuleSource | undefined>,
  visited: Set<string>,
  depth: number,
): string[] {
  if (visited.has(moduleSource.filePath) || depth > 3) {
    return [];
  }
  visited.add(moduleSource.filePath);
  const names = new Set<string>();
  const sourceFile = ts.createSourceFile(
    moduleSource.filePath,
    moduleSource.source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  sourceFile.statements.forEach((statement) => {
    collectExportedDeclarationModelNames(statement).forEach((name) => names.add(name));
    if (!ts.isExportDeclaration(statement)) {
      return;
    }
    collectNamedExportModelNames(statement).forEach((name) => names.add(name));
    if (statement.exportClause || !statement.moduleSpecifier || !ts.isStringLiteral(statement.moduleSpecifier)) {
      return;
    }
    const reexportedModule = resolveRelativeModuleSource(
      statement.moduleSpecifier.text,
      moduleSource.filePath,
      moduleSourceCache,
    );
    if (!reexportedModule) {
      return;
    }
    collectExportedModelNames(reexportedModule, moduleSourceCache, new Set(visited), depth + 1).forEach((name) =>
      names.add(name),
    );
  });
  return Array.from(names).sort((left, right) => left.localeCompare(right));
}

function collectExportedDeclarationModelNames(statement: ts.Statement): string[] {
  if (!hasExportModifier(statement)) {
    return [];
  }
  if (ts.isClassDeclaration(statement) || ts.isFunctionDeclaration(statement)) {
    const name = statement.name?.text;
    return name && isModelExportName(name) ? [name] : [];
  }
  if (!ts.isVariableStatement(statement)) {
    return [];
  }
  return statement.declarationList.declarations.flatMap((declaration) => {
    const name = ts.isIdentifier(declaration.name) ? declaration.name.text : undefined;
    return name && isModelExportName(name) ? [name] : [];
  });
}

function collectNamedExportModelNames(statement: ts.ExportDeclaration): string[] {
  if (!statement.exportClause || !ts.isNamedExports(statement.exportClause)) {
    return [];
  }
  return statement.exportClause.elements.flatMap((element) => {
    const name = element.name.text;
    return isModelExportName(name) ? [name] : [];
  });
}

function resolveRelativeModuleSource(
  specifier: string,
  importerPath: string | undefined,
  cache: Map<string, FlowSurfaceResolvedModuleSource | undefined>,
): FlowSurfaceResolvedModuleSource | undefined {
  if (!importerPath || !specifier.startsWith('.')) {
    return undefined;
  }
  const cacheKey = `${importerPath}::${specifier}`;
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }
  const basePath = resolvePath(dirname(importerPath), specifier);
  const filePath = getExistingModulePath(basePath);
  const moduleSource = filePath
    ? {
        filePath,
        source: readFileSync(filePath, 'utf8'),
      }
    : undefined;
  cache.set(cacheKey, moduleSource);
  return moduleSource;
}

function getExistingModulePath(basePath: string): string | undefined {
  const candidates = [
    basePath,
    `${basePath}.ts`,
    `${basePath}.tsx`,
    `${basePath}.js`,
    `${basePath}.jsx`,
    resolvePath(basePath, 'index.ts'),
    resolvePath(basePath, 'index.tsx'),
    resolvePath(basePath, 'index.js'),
    resolvePath(basePath, 'index.jsx'),
  ];
  return candidates.find((candidate) => isExistingFile(candidate));
}

function isExistingFile(filePath: string) {
  try {
    return existsSync(filePath) && statSync(filePath).isFile();
  } catch {
    return false;
  }
}

function hasExportModifier(node: ts.Node) {
  return (
    ts.canHaveModifiers(node) &&
    !!ts.getModifiers(node)?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)
  );
}

function isModelExportName(name: string) {
  return /Model$/.test(name);
}

function getObjectLiteral(node: ts.Node | undefined) {
  return node && ts.isObjectLiteralExpression(node) ? node : undefined;
}

function getPropertyInitializer(property: ts.PropertyAssignment | ts.ShorthandPropertyAssignment) {
  return ts.isPropertyAssignment(property) ? property.initializer : property.name;
}

function getPropertyNameText(name: ts.PropertyName | undefined) {
  if (!name) {
    return undefined;
  }
  if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)) {
    return name.text;
  }
  return undefined;
}

function getPropertyAccessName(node: ts.Expression) {
  return ts.isPropertyAccessExpression(node) ? node.name.text : undefined;
}

function getExpressionName(node: ts.Node | undefined) {
  if (!node) {
    return undefined;
  }
  const expression = unwrapExpression(node);
  if (ts.isIdentifier(expression)) {
    return expression.text;
  }
  if (ts.isPropertyAccessExpression(expression)) {
    return expression.name.text;
  }
  return undefined;
}

function getRegisterFlowModelUse(node: ts.Node | undefined) {
  const expressionName = getExpressionName(node);
  if (!expressionName || expressionName === 'flowEngine') {
    return undefined;
  }
  return expressionName;
}

function unwrapExpression(node: ts.Node): ts.Node {
  let current = node;
  while (
    ts.isParenthesizedExpression(current) ||
    ts.isAsExpression(current) ||
    ts.isTypeAssertionExpression(current) ||
    ts.isNonNullExpression(current) ||
    ts.isSatisfiesExpression(current)
  ) {
    current = current.expression;
  }
  return current;
}

function getLoaderNameFromInitializer(node: ts.Expression | undefined) {
  if (!node) {
    return undefined;
  }
  if (ts.isIdentifier(node) || ts.isFunctionExpression(node)) {
    return getExpressionName(node);
  }
  if (!ts.isObjectLiteralExpression(node)) {
    return undefined;
  }
  const loader = getObjectPropertyValue(node, 'loader');
  return getExpressionName(loader);
}

function getLoaderFunctionNodesFromInitializer(node: ts.Expression | undefined, usageNode: ts.Node): ts.Node[] {
  if (!node) {
    return [];
  }
  const initializer = resolveStaticExpressionNode(node, usageNode) || unwrapExpression(node);
  const functionNode = getStaticFunctionNode(initializer, usageNode);
  if (functionNode) {
    return [functionNode];
  }
  if (!ts.isObjectLiteralExpression(initializer)) {
    return [];
  }
  return initializer.properties.flatMap((property) => {
    if (ts.isMethodDeclaration(property) && getPropertyNameText(property.name) === 'loader') {
      return [property];
    }
    if (!ts.isPropertyAssignment(property) || getPropertyNameText(property.name) !== 'loader') {
      return [];
    }
    const loader =
      resolveStaticExpressionNode(property.initializer, usageNode) || unwrapExpression(property.initializer);
    const functionNode = getStaticFunctionNode(loader, usageNode);
    return functionNode ? [functionNode] : [];
  });
}

function getStaticFunctionNode(node: ts.Node, usageNode: ts.Node): ts.Node | undefined {
  if (ts.isFunctionExpression(node) || ts.isArrowFunction(node)) {
    return node;
  }
  if (ts.isIdentifier(node)) {
    return findFunctionDeclaration(node, usageNode);
  }
  return undefined;
}

function getObjectPropertyValue(objectLiteral: ts.ObjectLiteralExpression | undefined, key: string) {
  if (!objectLiteral) {
    return undefined;
  }
  const property = objectLiteral.properties.find(
    (item): item is ts.PropertyAssignment => ts.isPropertyAssignment(item) && getPropertyNameText(item.name) === key,
  );
  return property?.initializer;
}

function getStaticString(node: ts.Node | undefined): string | undefined {
  if (!node) {
    return undefined;
  }
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    return node.text.trim() || undefined;
  }
  return undefined;
}

function getStaticLabel(node: ts.Node | undefined): FlowSurfaceExtractorLabelFields {
  if (!node) {
    return {};
  }
  const literal = getStaticString(node);
  if (literal) {
    return normalizeStaticLabelString(literal);
  }
  if (!ts.isCallExpression(node)) {
    return {};
  }
  const calleeName = getExpressionName(node.expression);
  if (calleeName !== 'tExpr' && calleeName !== 't') {
    return {};
  }
  const labelKey = getStaticString(node.arguments[0]);
  if (!labelKey) {
    return {};
  }
  const options = getObjectLiteral(node.arguments[1]);
  const labelFallback =
    getStaticString(getObjectPropertyValue(options, 'defaultValue')) ||
    getStaticString(getObjectPropertyValue(options, 'fallback')) ||
    labelKey;
  return {
    label: labelFallback,
    labelKey,
    labelFallback,
  };
}

function getStaticTitle(node: ts.Node | undefined): string | undefined {
  return getStaticString(node) || getDisplayLabel(getStaticLabel(node));
}

function normalizeStaticLabelString(value: string): FlowSurfaceExtractorLabelFields {
  const translation = parseFlowSurfaceTranslationExpressionLabel(value);
  if (translation) {
    return translation;
  }
  return {
    label: value,
    labelText: value,
  };
}

function firstLabelFields(...items: Array<FlowSurfaceExtractorLabelFields | undefined>) {
  return items.find((item) => item?.label || item?.labelText || item?.labelKey || item?.labelFallback) || {};
}

function getDisplayLabel(source: FlowSurfaceExtractorLabelFields) {
  return source.labelText || source.labelFallback || source.label || source.labelKey;
}

function getStaticNumber(node: ts.Node | undefined): number | undefined {
  if (!node) {
    return undefined;
  }
  return ts.isNumericLiteral(node) ? Number(node.text) : undefined;
}

function getStaticStringList(node: ts.Node | undefined): string[] {
  const singleValue = getStaticString(node);
  if (singleValue) {
    return [singleValue];
  }
  if (!node || !ts.isArrayLiteralExpression(node)) {
    return [];
  }
  return node.elements.flatMap((element) => {
    const value = getStaticString(element);
    return value ? [value] : [];
  });
}

function getCreateModelOptionsSubModels(createModelOptionsObject: ts.ObjectLiteralExpression | undefined) {
  const subModels = getObjectLiteral(getObjectPropertyValue(createModelOptionsObject, 'subModels'));
  if (!subModels) {
    return {};
  }
  const createModelOptionsSubModels: Record<string, string[]> = {};
  subModels.properties.forEach((property) => {
    if (!ts.isPropertyAssignment(property)) {
      return;
    }
    const subModelKey = getPropertyNameText(property.name);
    const items = property.initializer;
    if (!subModelKey || !ts.isArrayLiteralExpression(items)) {
      return;
    }
    createModelOptionsSubModels[subModelKey] = items.elements.flatMap((element) => {
      if (!ts.isObjectLiteralExpression(element)) {
        return [];
      }
      const use = getStaticString(getObjectPropertyValue(element, 'use'));
      return use ? [use] : [];
    });
  });
  return Object.keys(createModelOptionsSubModels).length ? { createModelOptionsSubModels } : {};
}

function toStaticActionMenuKey(modelUse: string, index: number) {
  const normalized = modelUse
    .replace(/Model$/, '')
    .replace(/Action$/, '')
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .toLowerCase();
  return `allowed-action-${String(index).padStart(2, '0')}-${normalized}`;
}

function getStaticStatusFromNode(node: ts.Node): FlowSurfaceExtractorFlowStaticStatus {
  return isSerializableLiteralNode(node) ? 'static' : 'dynamic';
}

function getCreateModelOptionsStaticStatus(node: ts.Node | undefined) {
  if (!node) {
    return 'unresolved';
  }
  return isSerializableLiteralNode(node) ? 'static' : 'dynamic';
}

function isSerializableLiteralNode(node: ts.Node | undefined): boolean {
  if (!node) {
    return false;
  }
  if (
    ts.isStringLiteral(node) ||
    ts.isNoSubstitutionTemplateLiteral(node) ||
    ts.isNumericLiteral(node) ||
    node.kind === ts.SyntaxKind.TrueKeyword ||
    node.kind === ts.SyntaxKind.FalseKeyword ||
    node.kind === ts.SyntaxKind.NullKeyword
  ) {
    return true;
  }
  if (ts.isPrefixUnaryExpression(node)) {
    return (
      (node.operator === ts.SyntaxKind.MinusToken || node.operator === ts.SyntaxKind.PlusToken) &&
      ts.isNumericLiteral(node.operand)
    );
  }
  if (ts.isArrayLiteralExpression(node)) {
    return node.elements.every((element) => !ts.isSpreadElement(element) && isSerializableLiteralNode(element));
  }
  if (ts.isCallExpression(node) && isStaticTranslationHelperCall(node)) {
    return node.arguments.every((argument) => isSerializableLiteralNode(argument));
  }
  if (ts.isObjectLiteralExpression(node)) {
    return node.properties.every((property) => {
      if (!ts.isPropertyAssignment(property)) {
        return false;
      }
      if (!isStaticPropertyName(property.name)) {
        return false;
      }
      return isSerializableLiteralNode(property.initializer);
    });
  }
  return false;
}

function getStaticCreateModelOptions(node: ts.Node | undefined): FlowSurfaceNodeSpec | undefined {
  if (!isSerializableLiteralNode(node)) {
    return undefined;
  }
  const value = serializeLiteralNode(node);
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }
  const record = value as Record<string, unknown>;
  if (typeof record.use !== 'string') {
    return undefined;
  }
  return value as FlowSurfaceNodeSpec;
}

function serializeLiteralNode(node: ts.Node): unknown {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    return node.text;
  }
  if (ts.isNumericLiteral(node)) {
    return Number(node.text);
  }
  if (node.kind === ts.SyntaxKind.TrueKeyword) {
    return true;
  }
  if (node.kind === ts.SyntaxKind.FalseKeyword) {
    return false;
  }
  if (node.kind === ts.SyntaxKind.NullKeyword) {
    return null;
  }
  if (ts.isPrefixUnaryExpression(node) && ts.isNumericLiteral(node.operand)) {
    const value = Number(node.operand.text);
    return node.operator === ts.SyntaxKind.MinusToken ? -value : value;
  }
  if (ts.isArrayLiteralExpression(node)) {
    return node.elements.map((element) => serializeLiteralNode(element));
  }
  if (ts.isCallExpression(node) && isStaticTranslationHelperCall(node)) {
    const args = node.arguments.map((argument) => serializeLiteralNode(argument));
    return `{{t(${args.map((argument) => JSON.stringify(argument)).join(', ')})}}`;
  }
  if (ts.isObjectLiteralExpression(node)) {
    return Object.fromEntries(
      node.properties.map((property) => {
        const assignment = property as ts.PropertyAssignment;
        return [getPropertyNameText(assignment.name) || '', serializeLiteralNode(assignment.initializer)];
      }),
    );
  }
  return undefined;
}

function isStaticTranslationHelperCall(node: ts.CallExpression) {
  return STATIC_TRANSLATION_HELPER_NAMES.has(getExpressionName(node.expression) || '');
}

function isStaticPropertyName(name: ts.PropertyName) {
  return ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name);
}

function inferFieldBindingRole(binderName: string | undefined): FlowSurfaceFieldBindingRole {
  if (!binderName) {
    return 'wrapper';
  }
  const explicitRole = FIELD_BINDING_ROLE_BY_MODEL.get(binderName);
  if (explicitRole) {
    return explicitRole;
  }
  if (/Display/i.test(binderName)) {
    return 'display';
  }
  if (/Filter/i.test(binderName)) {
    return 'filterable';
  }
  if (/Edit|FormItem/i.test(binderName)) {
    return 'editable';
  }
  return 'wrapper';
}

function getJsxAttributes(node: ts.JsxOpeningElement | ts.JsxSelfClosingElement) {
  const attributes: Record<string, string | boolean | undefined> = {};
  let itemsExpression: ts.Expression | undefined;
  let subModelBaseClassUses: string[] | undefined;
  let titleLabel: FlowSurfaceExtractorLabelFields | undefined;
  let labelLabel: FlowSurfaceExtractorLabelFields | undefined;
  node.attributes.properties.forEach((property) => {
    if (!ts.isJsxAttribute(property)) {
      return;
    }
    const name = ts.isIdentifier(property.name) ? property.name.text : property.name.getText();
    attributes[name] = getJsxAttributeString(property.initializer);
    if (name === 'title') {
      titleLabel = getJsxAttributeLabel(property.initializer);
    }
    if (name === 'label') {
      labelLabel = getJsxAttributeLabel(property.initializer);
    }
    if (name === 'items') {
      itemsExpression = getJsxAttributeExpression(property.initializer);
    }
    if (name === 'subModelBaseClass') {
      attributes.subModelBaseClassUse = getJsxModelClassName(property.initializer);
    }
    if (name === 'subModelBaseClasses') {
      subModelBaseClassUses = getJsxModelClassNames(property.initializer);
    }
  });
  return {
    ...attributes,
    ...(itemsExpression ? { itemsExpression } : {}),
    ...(subModelBaseClassUses?.length ? { subModelBaseClassUses } : {}),
    ...(titleLabel ? { titleLabel } : {}),
    ...(labelLabel ? { labelLabel } : {}),
  } as {
    key?: string;
    modelUse?: string;
    subModelKey?: string;
    subModelBaseClassUse?: string;
    subModelBaseClassUses?: string[];
    itemsExpression?: ts.Expression;
    titleLabel?: FlowSurfaceExtractorLabelFields;
    labelLabel?: FlowSurfaceExtractorLabelFields;
  };
}

function getJsxAttributeString(node: ts.JsxAttributeValue | undefined) {
  if (!node) {
    return undefined;
  }
  if (ts.isStringLiteral(node)) {
    return node.text.trim() || undefined;
  }
  if (ts.isJsxExpression(node)) {
    return getStaticString(node.expression);
  }
  return undefined;
}

function getJsxAttributeExpression(node: ts.JsxAttributeValue | undefined) {
  if (!node || !ts.isJsxExpression(node)) {
    return undefined;
  }
  return node.expression;
}

function getJsxAttributeLabel(node: ts.JsxAttributeValue | undefined): FlowSurfaceExtractorLabelFields {
  if (!node) {
    return {};
  }
  if (ts.isStringLiteral(node)) {
    const value = node.text.trim();
    return value ? normalizeStaticLabelString(value) : {};
  }
  if (!ts.isJsxExpression(node) || !node.expression) {
    return {};
  }
  return getStaticLabel(node.expression);
}

function getStaticJsxItems(node: ts.Expression | undefined, usageNode: ts.Node) {
  if (!node) {
    return [];
  }
  const staticNode = resolveStaticExpressionNode(node, usageNode);
  const items = staticNode && ts.isArrayLiteralExpression(staticNode) ? staticNode.elements : [staticNode];
  return items.flatMap((item) => getStaticJsxItemTree(item));
}

function getStaticJsxItemTree(item: ts.Node | undefined): Array<{
  key?: string;
  labelFields: FlowSurfaceExtractorLabelFields;
  modelUse?: string;
  createModelOptionsStatus: ReturnType<typeof getCreateModelOptionsStaticStatus>;
  createModelOptionsUse?: string;
  createModelOptions?: FlowSurfaceNodeSpec;
}> {
  if (!item || !ts.isObjectLiteralExpression(item)) {
    return [];
  }
  const createModelOptions = getObjectPropertyValue(item, 'createModelOptions');
  const createModelOptionsObject = getObjectLiteral(createModelOptions);
  const createModelOptionsUse = getStaticString(getObjectPropertyValue(createModelOptionsObject, 'use'));
  const staticCreateModelOptions = getStaticCreateModelOptions(createModelOptions);
  const children = getStaticJsxItemChildren(item);
  return [
    {
      key: getStaticString(getObjectPropertyValue(item, 'key')),
      labelFields: getStaticLabel(getObjectPropertyValue(item, 'label')),
      modelUse:
        getStaticString(getObjectPropertyValue(item, 'modelUse')) ||
        getStaticString(getObjectPropertyValue(item, 'useModel')) ||
        createModelOptionsUse,
      createModelOptionsStatus: getCreateModelOptionsStaticStatus(createModelOptions),
      ...(createModelOptionsUse ? { createModelOptionsUse } : {}),
      ...(staticCreateModelOptions ? { createModelOptions: staticCreateModelOptions } : {}),
    },
    ...children,
  ];
}

function getStaticJsxItemChildren(item: ts.ObjectLiteralExpression) {
  const children = getObjectPropertyValue(item, 'children');
  if (!children || !ts.isArrayLiteralExpression(children)) {
    return [];
  }
  return children.elements.flatMap((child) => getStaticJsxItemTree(child));
}

function resolveStaticExpressionNode(node: ts.Expression, usageNode: ts.Node): ts.Expression | undefined {
  const expression = unwrapExpression(node);
  if (!ts.isIdentifier(expression)) {
    return expression as ts.Expression;
  }
  return findConstInitializer(expression, usageNode);
}

function findConstInitializer(identifier: ts.Identifier, usageNode: ts.Node): ts.Expression | undefined {
  let current: ts.Node | undefined = usageNode;
  while (current) {
    const statements = getLexicalScopeStatements(current);
    const initializer = statements
      ? findConstInitializerInStatements(statements, identifier.text, identifier.getStart())
      : undefined;
    if (initializer) {
      return unwrapExpression(initializer) as ts.Expression;
    }
    current = current.parent;
  }
  return undefined;
}

function findFunctionDeclaration(identifier: ts.Identifier, usageNode: ts.Node): ts.FunctionDeclaration | undefined {
  let current: ts.Node | undefined = usageNode;
  while (current) {
    const statements = getLexicalScopeStatements(current);
    const declaration = statements?.find(
      (statement): statement is ts.FunctionDeclaration =>
        ts.isFunctionDeclaration(statement) && statement.name?.text === identifier.text,
    );
    if (declaration) {
      return declaration;
    }
    current = current.parent;
  }
  return undefined;
}

function getLexicalScopeStatements(node: ts.Node): readonly ts.Statement[] | undefined {
  if (
    ts.isSourceFile(node) ||
    ts.isBlock(node) ||
    ts.isModuleBlock(node) ||
    ts.isCaseClause(node) ||
    ts.isDefaultClause(node)
  ) {
    return node.statements;
  }
  return undefined;
}

function findConstInitializerInStatements(
  statements: readonly ts.Statement[],
  name: string,
  usageStart: number,
): ts.Expression | undefined {
  for (const statement of statements) {
    if (statement.getStart() >= usageStart) {
      return undefined;
    }
    if (!ts.isVariableStatement(statement) || !isConstDeclarationList(statement.declarationList)) {
      continue;
    }
    const initializer = statement.declarationList.declarations.find(
      (declaration) => ts.isIdentifier(declaration.name) && declaration.name.text === name,
    )?.initializer;
    if (initializer) {
      return initializer;
    }
  }
  return undefined;
}

function isConstDeclarationList(declarationList: ts.VariableDeclarationList) {
  return (declarationList.flags & ts.NodeFlags.Const) !== 0;
}

function getJsxModelClassName(node: ts.JsxAttributeValue | undefined) {
  if (!node) {
    return undefined;
  }
  if (ts.isStringLiteral(node)) {
    return node.text.trim() || undefined;
  }
  if (!ts.isJsxExpression(node) || !node.expression) {
    return undefined;
  }
  return getModelClassNameFromExpression(node.expression);
}

function getJsxModelClassNames(node: ts.JsxAttributeValue | undefined) {
  if (!node) {
    return [];
  }
  if (ts.isStringLiteral(node)) {
    return [node.text.trim()].filter(Boolean);
  }
  if (!ts.isJsxExpression(node) || !node.expression) {
    return [];
  }
  return getModelClassNamesFromExpression(node.expression);
}

function getModelClassNamesFromExpression(node: ts.Expression): string[] {
  if (ts.isArrayLiteralExpression(node)) {
    return node.elements.flatMap((element) => {
      if (ts.isSpreadElement(element)) {
        return [];
      }
      return getModelClassNamesFromExpression(element);
    });
  }
  if (
    ts.isCallExpression(node) &&
    ts.isPropertyAccessExpression(node.expression) &&
    getExpressionName(node.expression) === 'filter'
  ) {
    return getModelClassNamesFromExpression(node.expression.expression);
  }
  const modelClassName = getModelClassNameFromExpression(node);
  return modelClassName ? [modelClassName] : [];
}

function getModelClassNameFromExpression(node: ts.Expression): string | undefined {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    return node.text.trim() || undefined;
  }
  if (ts.isCallExpression(node)) {
    const callee = getExpressionName(node.expression);
    if (callee === 'getModelClassName') {
      return getStaticString(node.arguments[0]);
    }
  }
  return undefined;
}

function normalizeSubModelSlot(subModelKey: string | undefined) {
  switch (subModelKey) {
    case 'actions':
    case 'recordActions':
    case 'blocks':
    case 'fields':
    case 'fieldComponents':
    case 'subModels':
      return subModelKey;
    case 'columns':
      return 'fields';
    default:
      return subModelKey;
  }
}

function inferSlotFromModelUse(modelUse: string) {
  const explicitSlot = SLOT_BY_MODEL_USE.get(modelUse);
  if (explicitSlot) {
    return explicitSlot;
  }
  if (/(?:Action|ActionGroup)Model$/.test(modelUse)) {
    return 'actions';
  }
  if (/FieldModel$/.test(modelUse)) {
    return 'fields';
  }
  if (/(?:Item|Column|FieldGroup)Model$/.test(modelUse)) {
    return 'fields';
  }
  if (/BlockModel$/.test(modelUse)) {
    return 'blocks';
  }
  return undefined;
}

function inferSlotFromModelUses(modelUses: string[] | undefined) {
  if (!modelUses?.length) {
    return undefined;
  }
  const slots = new Set(modelUses.map((modelUse) => inferSlotFromModelUse(modelUse)).filter(Boolean));
  if (slots.size === 1) {
    return Array.from(slots)[0];
  }
  return undefined;
}
