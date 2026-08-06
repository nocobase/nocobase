/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { posix as pathPosix } from 'path';
import ts from 'typescript';

import { JS_TEMPLATE_DESCRIPTOR_FILE, JS_TEMPLATE_SUPPORTED_KINDS, type JsTemplateKind } from '../../../constants';
import type { JsTemplateDiagnostic } from '../../../shared/types';
import { createRunJSWorkspaceDiagnosticAt as diagnosticAt } from '@nocobase/runjs-workspace/server';
import {
  analyzeJsTemplateAuthoringImportDeclaration,
  isJsTemplateAuthoringModuleSpecifier,
  rewriteJsTemplateAuthoringImports,
  type JsTemplateAuthoringImportDiagnostic,
} from '../conversion/jsTemplateAuthoringImports';
import type { DiagnosticTarget } from './types';
import { getTemplateRootPath, normalizeSourcePath, sharedSourceRoot } from './workspacePolicy';

const allowedRunJSBuiltInImports = new Set([
  'react',
  'react-dom/client',
  'antd',
  '@ant-design/icons',
  'dayjs',
  'lodash',
  'mathjs',
  '@formulajs/formulajs',
]);

export function validateExternalSdkImport(
  node: ts.ImportDeclaration,
  sourceFile: ts.SourceFile,
  specifier: string,
  target: Omit<DiagnosticTarget, 'path'>,
): JsTemplateDiagnostic[] {
  if (isAllowedRunJSBuiltInImport(specifier)) {
    return validateRunJSBuiltInImport(node, sourceFile, specifier, target);
  }

  if (isJsTemplateAuthoringModuleSpecifier(specifier)) {
    const analysis = analyzeJsTemplateAuthoringImportDeclaration(node, sourceFile);
    return toJsTemplateDiagnostics(analysis.diagnostics, target);
  }

  return [
    diagnosticAt(
      sourceFile,
      node.moduleSpecifier.getStart(sourceFile),
      'import_not_allowed',
      'error',
      `Import "${specifier}" is not allowed in js-template source`,
      target,
    ),
  ];
}

export function validateJsTemplateAuthoringSource(
  path: string,
  content: string,
  target: Omit<DiagnosticTarget, 'path'>,
): JsTemplateDiagnostic[] {
  return toJsTemplateDiagnostics(rewriteJsTemplateAuthoringImports(path, content).diagnostics, target);
}

function isAllowedRunJSBuiltInImport(specifier: string): boolean {
  return allowedRunJSBuiltInImports.has(specifier);
}

function validateRunJSBuiltInImport(
  node: ts.ImportDeclaration,
  sourceFile: ts.SourceFile,
  specifier: string,
  target: Omit<DiagnosticTarget, 'path'>,
): JsTemplateDiagnostic[] {
  const importClause = node.importClause;
  if (importClause?.isTypeOnly) {
    return [];
  }

  const namedBindings = importClause?.namedBindings;
  const hasRuntimeBinding =
    Boolean(importClause?.name) ||
    Boolean(namedBindings && ts.isNamespaceImport(namedBindings)) ||
    Boolean(
      namedBindings && ts.isNamedImports(namedBindings) && namedBindings.elements.some((item) => !item.isTypeOnly),
    );
  const hasTypeOnlyNamedBindings = Boolean(
    namedBindings &&
      ts.isNamedImports(namedBindings) &&
      namedBindings.elements.length > 0 &&
      namedBindings.elements.every((item) => item.isTypeOnly),
  );

  if (!hasRuntimeBinding && !hasTypeOnlyNamedBindings) {
    return [
      diagnosticAt(
        sourceFile,
        node.moduleSpecifier.getStart(sourceFile),
        'import_not_allowed',
        'error',
        `Runtime import from "${specifier}" must bind a default, namespace, or named export`,
        target,
      ),
    ];
  }
  return [];
}

export function isRelativeImportOutsideCurrentTemplate(
  filePath: string,
  specifier: string,
  target: Omit<DiagnosticTarget, 'path'>,
  templateRootPath?: string,
): boolean {
  if (!specifier.startsWith('.') || !target.kind || !target.templateName || !isJsTemplateKind(target.kind)) {
    return false;
  }

  const resolvedPath = normalizeSourcePath(pathPosix.join(pathPosix.dirname(filePath), specifier));
  if (resolvedPath === sharedSourceRoot || resolvedPath.startsWith(`${sharedSourceRoot}/`)) {
    return false;
  }
  const rootPath = templateRootPath || getTemplateRootPath(target.kind, target.templateName);
  return resolvedPath !== rootPath && !resolvedPath.startsWith(`${rootPath}/`);
}

export function isRelativeImportOutsideSharedRoot(filePath: string, specifier: string): boolean {
  const resolvedPath = normalizeSourcePath(pathPosix.join(pathPosix.dirname(filePath), specifier));
  return resolvedPath !== sharedSourceRoot && !resolvedPath.startsWith(`${sharedSourceRoot}/`);
}

export function isTemplateDescriptorImport(filePath: string, specifier: string): boolean {
  if (!specifier.startsWith('.')) {
    return false;
  }

  const resolvedPath = normalizeSourcePath(pathPosix.join(pathPosix.dirname(filePath), specifier));
  return pathPosix.basename(resolvedPath) === JS_TEMPLATE_DESCRIPTOR_FILE;
}

export function scriptKind(path: string): ts.ScriptKind {
  if (path.endsWith('.tsx')) {
    return ts.ScriptKind.TSX;
  }
  if (path.endsWith('.jsx')) {
    return ts.ScriptKind.JSX;
  }
  if (path.endsWith('.js')) {
    return ts.ScriptKind.JS;
  }
  return ts.ScriptKind.TS;
}

export function getImportSpecifier(moduleSpecifier: ts.Expression): string | null {
  return ts.isStringLiteral(moduleSpecifier) ? moduleSpecifier.text : null;
}

export function getImportTypeSpecifier(node: ts.ImportTypeNode): string | null {
  return ts.isLiteralTypeNode(node.argument) && ts.isStringLiteral(node.argument.literal)
    ? node.argument.literal.text
    : null;
}

export function getImportEqualsSpecifier(node: ts.ImportEqualsDeclaration): string | null {
  if (!ts.isExternalModuleReference(node.moduleReference)) {
    return null;
  }
  const expression = node.moduleReference.expression;
  return expression && ts.isStringLiteral(expression) ? expression.text : null;
}

export function isJsTemplateKind(value: string): value is JsTemplateKind {
  return (JS_TEMPLATE_SUPPORTED_KINDS as readonly string[]).includes(value);
}

function toJsTemplateDiagnostics(
  diagnostics: JsTemplateAuthoringImportDiagnostic[],
  target: Omit<DiagnosticTarget, 'path'>,
): JsTemplateDiagnostic[] {
  return diagnostics.map((diagnostic) => ({
    ...diagnostic,
    kind: target.kind,
    templateName: target.templateName,
  }));
}
