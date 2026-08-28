/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { VAR_NAME_RE } from '../../re';

export type BulkImportVariable = {
  name: string;
  value: string;
  type: 'default' | 'secret';
};

export type BulkImportError = {
  code: 'missingSeparator' | 'emptyName' | 'invalidName' | 'emptyValue';
  line: number;
};

export function parseBulkImportText(
  input: string,
  type: BulkImportVariable['type'],
): { items: BulkImportVariable[]; errors: BulkImportError[] } {
  const items: BulkImportVariable[] = [];
  const errors: BulkImportError[] = [];

  input.split(/\r?\n/).forEach((rawLine, index) => {
    const line = rawLine.trim();
    if (!line) {
      return;
    }

    const separatorIndex = line.indexOf('=');
    if (separatorIndex === -1) {
      errors.push({ code: 'missingSeparator', line: index + 1 });
      return;
    }

    const name = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();
    let valid = true;

    if (!name) {
      errors.push({ code: 'emptyName', line: index + 1 });
      valid = false;
    } else if (!VAR_NAME_RE.test(name)) {
      errors.push({ code: 'invalidName', line: index + 1 });
      valid = false;
    }

    if (!value) {
      errors.push({ code: 'emptyValue', line: index + 1 });
      valid = false;
    }

    if (valid) {
      items.push({ name, value, type });
    }
  });

  return { items, errors };
}
