/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import * as ts from 'typescript';
import type { FlowSurfaceExtractorLabelFields } from './types';

export function parseFlowSurfaceTranslationExpressionLabel(value: string): FlowSurfaceExtractorLabelFields | undefined {
  const expression = getMustacheTranslationExpression(value);
  if (!expression) {
    return undefined;
  }
  const sourceFile = ts.createSourceFile(
    'flow-surface-label.ts',
    `const __flowSurfaceLabel = ${expression};`,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  const initializer = getVariableInitializer(sourceFile);
  if (!initializer || !ts.isCallExpression(initializer) || getExpressionName(initializer.expression) !== 't') {
    return undefined;
  }
  const labelKey = getStaticString(initializer.arguments[0]);
  if (!labelKey) {
    return undefined;
  }
  const labelFallback =
    getStaticObjectStringProperty(initializer.arguments[1], 'defaultValue') ||
    getStaticObjectStringProperty(initializer.arguments[1], 'fallback') ||
    labelKey;
  return {
    label: labelFallback,
    labelKey,
    labelFallback,
  };
}

function getMustacheTranslationExpression(value: string) {
  const trimmed = value.trim();
  return trimmed.startsWith('{{') && trimmed.endsWith('}}') ? trimmed.slice(2, -2).trim() : undefined;
}

function getVariableInitializer(sourceFile: ts.SourceFile) {
  const statement = sourceFile.statements[0];
  if (!statement || !ts.isVariableStatement(statement)) {
    return undefined;
  }
  return statement.declarationList.declarations[0]?.initializer;
}

function getExpressionName(node: ts.Node | undefined) {
  if (!node) {
    return undefined;
  }
  if (ts.isIdentifier(node)) {
    return node.text;
  }
  if (ts.isPropertyAccessExpression(node)) {
    return node.name.text;
  }
  return undefined;
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

function getStaticObjectStringProperty(node: ts.Node | undefined, key: string) {
  if (!node || !ts.isObjectLiteralExpression(node)) {
    return undefined;
  }
  const property = node.properties.find(
    (item): item is ts.PropertyAssignment => ts.isPropertyAssignment(item) && getPropertyNameText(item.name) === key,
  );
  return getStaticString(property?.initializer);
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
