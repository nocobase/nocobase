/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import ts from 'typescript';

export type StaticModuleReferenceKind = 'import-declaration' | 'export-declaration' | 'import-type';

export interface StaticModuleReference {
  kind: StaticModuleReferenceKind;
  specifier: string;
  typeOnly: boolean;
  /** Start of the quoted module specifier in the source file. */
  start: number;
  /** End of the quoted module specifier in the source file. */
  end: number;
  /** One-based source line of the quoted module specifier. */
  line: number;
  /** One-based source column of the quoted module specifier. */
  column: number;
}

export function collectStaticModuleReferences(sourceFile: ts.SourceFile): StaticModuleReference[] {
  const references: StaticModuleReference[] = [];

  const addReference = (kind: StaticModuleReferenceKind, moduleSpecifier: ts.StringLiteralLike, typeOnly: boolean) => {
    const start = moduleSpecifier.getStart(sourceFile);
    const location = sourceFile.getLineAndCharacterOfPosition(start);
    references.push({
      kind,
      specifier: moduleSpecifier.text,
      typeOnly,
      start,
      end: moduleSpecifier.getEnd(),
      line: location.line + 1,
      column: location.character + 1,
    });
  };

  const visit = (node: ts.Node) => {
    if (ts.isImportDeclaration(node) && ts.isStringLiteralLike(node.moduleSpecifier)) {
      addReference('import-declaration', node.moduleSpecifier, isTypeOnlyImport(node));
    } else if (ts.isExportDeclaration(node) && node.moduleSpecifier && ts.isStringLiteralLike(node.moduleSpecifier)) {
      addReference('export-declaration', node.moduleSpecifier, isTypeOnlyExport(node));
    } else if (ts.isImportTypeNode(node)) {
      const moduleSpecifier = getImportTypeModuleSpecifier(node);
      if (moduleSpecifier) {
        addReference('import-type', moduleSpecifier, true);
      }
    }
    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
  return references.sort((left, right) => left.start - right.start || left.end - right.end);
}

function getImportTypeModuleSpecifier(node: ts.ImportTypeNode): ts.StringLiteralLike | null {
  if (!ts.isLiteralTypeNode(node.argument) || !ts.isStringLiteralLike(node.argument.literal)) {
    return null;
  }
  return node.argument.literal;
}

function isTypeOnlyImport(statement: ts.ImportDeclaration): boolean {
  const clause = statement.importClause;
  if (!clause) {
    return false;
  }
  if (clause.isTypeOnly) {
    return true;
  }
  return Boolean(
    !clause.name &&
      clause.namedBindings &&
      ts.isNamedImports(clause.namedBindings) &&
      clause.namedBindings.elements.length > 0 &&
      clause.namedBindings.elements.every((element) => element.isTypeOnly),
  );
}

function isTypeOnlyExport(statement: ts.ExportDeclaration): boolean {
  if (statement.isTypeOnly) {
    return true;
  }
  return Boolean(
    statement.exportClause &&
      ts.isNamedExports(statement.exportClause) &&
      statement.exportClause.elements.length > 0 &&
      statement.exportClause.elements.every((element) => element.isTypeOnly),
  );
}
