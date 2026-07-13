/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { posix as pathPosix } from 'path';
import { parseSettingsTypeImport } from '@nocobase/light-extension-sdk/typegen';
import ts from 'typescript';

import {
  LIGHT_EXTENSION_ENTRY_DESCRIPTOR_FILE,
  LIGHT_EXTENSION_SUPPORTED_KINDS,
  type LightExtensionKind,
} from '../../../constants';
import type { LightExtensionDiagnostic } from '../../../shared/types';
import { diagnosticAt } from './diagnostics';
import type { DiagnosticTarget } from './types';
import { getEntryRootPath, normalizeSourcePath, sharedSourceRoot } from './workspacePolicy';

const allowedClientSdkImports = new Set([
  '@nocobase/light-extension-sdk/client',
  '@nocobase/light-extension-sdk/shared',
]);
const allowedSdkRuntimeHelpers = new Set(['defineSettings', 'assertSettings']);

export function validateExternalSdkImport(
  node: ts.ImportDeclaration,
  sourceFile: ts.SourceFile,
  specifier: string,
  target: Omit<DiagnosticTarget, 'path'>,
): LightExtensionDiagnostic[] {
  if (specifier.startsWith('light-extension:settings/')) {
    return validateSettingsTypeImport(node, sourceFile, specifier, target);
  }

  if (!allowedClientSdkImports.has(specifier)) {
    return [
      diagnosticAt(
        sourceFile,
        node.moduleSpecifier.getStart(sourceFile),
        'import_not_allowed',
        'error',
        `Import "${specifier}" is not allowed in light-extension source`,
        target,
      ),
    ];
  }

  const importClause = node.importClause;
  if (!importClause) {
    return [
      diagnosticAt(
        sourceFile,
        node.moduleSpecifier.getStart(sourceFile),
        'import_not_allowed',
        'error',
        `Side-effect import from "${specifier}" is not allowed in light-extension source`,
        target,
      ),
    ];
  }
  if (importClause.name) {
    return [
      diagnosticAt(
        sourceFile,
        importClause.name.getStart(sourceFile),
        'import_not_allowed',
        'error',
        `Default import from "${specifier}" is not allowed in light-extension source`,
        target,
      ),
    ];
  }
  if (!importClause.namedBindings) {
    return importClause.isTypeOnly
      ? []
      : [
          diagnosticAt(
            sourceFile,
            importClause.getStart(sourceFile),
            'import_not_allowed',
            'error',
            `Runtime import from "${specifier}" must use allowed helpers`,
            target,
          ),
        ];
  }
  if (ts.isNamespaceImport(importClause.namedBindings)) {
    return importClause.isTypeOnly
      ? []
      : [
          diagnosticAt(
            sourceFile,
            importClause.namedBindings.getStart(sourceFile),
            'import_not_allowed',
            'error',
            `Namespace import from "${specifier}" is only allowed as import type`,
            target,
          ),
        ];
  }
  if (!importClause.isTypeOnly && importClause.namedBindings.elements.length === 0) {
    return [
      diagnosticAt(
        sourceFile,
        importClause.namedBindings.getStart(sourceFile),
        'import_not_allowed',
        'error',
        `Runtime import from "${specifier}" must use allowed helpers`,
        target,
      ),
    ];
  }

  const diagnostics: LightExtensionDiagnostic[] = [];
  for (const element of importClause.namedBindings.elements) {
    if (importClause.isTypeOnly || element.isTypeOnly) {
      continue;
    }
    const imported = element.propertyName?.text || element.name.text;
    if (allowedSdkRuntimeHelpers.has(imported)) {
      continue;
    }
    diagnostics.push(
      diagnosticAt(
        sourceFile,
        element.getStart(sourceFile),
        'import_not_allowed',
        'error',
        `Runtime import "${imported}" from "${specifier}" is not allowed in light-extension source`,
        target,
      ),
    );
  }

  return diagnostics;
}

export function validateSettingsTypeImport(
  node: ts.ImportDeclaration,
  sourceFile: ts.SourceFile,
  specifier: string,
  target: Omit<DiagnosticTarget, 'path'>,
): LightExtensionDiagnostic[] {
  const importClause = node.importClause;
  if (!importClause?.isTypeOnly) {
    return [
      diagnosticAt(
        sourceFile,
        node.moduleSpecifier.getStart(sourceFile),
        'settings_type_import_runtime_not_allowed',
        'error',
        `Settings type import "${specifier}" must use import type`,
        target,
      ),
    ];
  }
  if (importClause.name) {
    return [
      diagnosticAt(
        sourceFile,
        importClause.name.getStart(sourceFile),
        'settings_type_import_invalid',
        'error',
        `Default import from "${specifier}" is not supported`,
        target,
      ),
    ];
  }

  return validateSettingsTypeSpecifier(sourceFile, node.moduleSpecifier.getStart(sourceFile), specifier, target);
}

export function validateSettingsImportTypeNode(
  node: ts.ImportTypeNode,
  sourceFile: ts.SourceFile,
  specifier: string,
  target: Omit<DiagnosticTarget, 'path'>,
): LightExtensionDiagnostic[] {
  return validateSettingsTypeSpecifier(sourceFile, node.argument.getStart(sourceFile), specifier, target);
}

export function validateSettingsTypeSpecifier(
  sourceFile: ts.SourceFile,
  position: number,
  specifier: string,
  target: Omit<DiagnosticTarget, 'path'>,
): LightExtensionDiagnostic[] {
  if (parseSettingsTypeImport(specifier)) {
    return [];
  }

  return [
    diagnosticAt(
      sourceFile,
      position,
      'settings_type_import_invalid',
      'error',
      `Settings type import "${specifier}" is not valid`,
      target,
    ),
  ];
}

export function isRelativeImportOutsideCurrentEntry(
  filePath: string,
  specifier: string,
  target: Omit<DiagnosticTarget, 'path'>,
  entryRootPath?: string,
): boolean {
  if (!specifier.startsWith('.') || !target.kind || !target.entryName || !isLightExtensionKind(target.kind)) {
    return false;
  }

  const resolvedPath = normalizeSourcePath(pathPosix.join(pathPosix.dirname(filePath), specifier));
  if (resolvedPath === sharedSourceRoot || resolvedPath.startsWith(`${sharedSourceRoot}/`)) {
    return false;
  }
  const rootPath = entryRootPath || getEntryRootPath(target.kind, target.entryName);
  return resolvedPath !== rootPath && !resolvedPath.startsWith(`${rootPath}/`);
}

export function isRelativeImportOutsideSharedRoot(filePath: string, specifier: string): boolean {
  const resolvedPath = normalizeSourcePath(pathPosix.join(pathPosix.dirname(filePath), specifier));
  return resolvedPath !== sharedSourceRoot && !resolvedPath.startsWith(`${sharedSourceRoot}/`);
}

export function isEntryDescriptorImport(filePath: string, specifier: string): boolean {
  if (!specifier.startsWith('.')) {
    return false;
  }

  const resolvedPath = normalizeSourcePath(pathPosix.join(pathPosix.dirname(filePath), specifier));
  return pathPosix.basename(resolvedPath) === LIGHT_EXTENSION_ENTRY_DESCRIPTOR_FILE;
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

export function isLightExtensionKind(value: string): value is LightExtensionKind {
  return (LIGHT_EXTENSION_SUPPORTED_KINDS as readonly string[]).includes(value);
}
