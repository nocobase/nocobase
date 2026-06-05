/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Document } from '@langchain/core/documents';
import * as XLSX from 'xlsx';

const normalizeCellValue = (value: unknown): string => {
  if (value === undefined || value === null) {
    return '';
  }

  return String(value);
};

const trimTrailingEmptyCells = (row: unknown[]): unknown[] => {
  let end = row.length;

  while (end > 0 && normalizeCellValue(row[end - 1]).trim() === '') {
    end -= 1;
  }

  return row.slice(0, end);
};

const sheetToLines = (sheet: XLSX.WorkSheet): string[] => {
  const rows = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    raw: false,
    defval: '',
    blankrows: false,
  }) as unknown[][];

  return rows
    .map((row) => trimTrailingEmptyCells(Array.isArray(row) ? row : []))
    .filter((row) => row.length > 0)
    .map((row) => row.map((cell) => normalizeCellValue(cell)).join('\t'))
    .filter((line) => line.trim().length > 0);
};

export const loadXlsx = async (blob: Blob): Promise<Document[]> => {
  const buffer = await blob.arrayBuffer();
  const workbook = XLSX.read(buffer, {
    type: 'array',
    cellText: true,
  });

  const documents: Document[] = [];

  workbook.SheetNames.forEach((sheetName, index) => {
    const sheet = workbook.Sheets[sheetName];

    if (!sheet) {
      return;
    }

    const lines = sheetToLines(sheet);

    if (!lines.length) {
      return;
    }

    documents.push(
      new Document({
        pageContent: [`Sheet: ${sheetName}`, ...lines].join('\n'),
        metadata: {
          source: 'blob',
          blobType: blob.type,
          sheetName,
          sheetIndex: index,
        },
      }),
    );
  });

  return documents;
};
