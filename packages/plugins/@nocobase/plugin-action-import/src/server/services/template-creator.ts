/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ICollection } from '@nocobase/data-source-manager';
import { ImportColumn } from './xlsx-importer';
import { WorkbookConverter } from '../utils/workbook-converter';
import * as XLSX from 'xlsx';
import { Workbook as ExcelJSWorkbook } from 'exceljs';

export type TemplateCreatorOptions = {
  collection?: ICollection;
  title?: string;
  explain?: string;
  columns: Array<ImportColumn>;
};

export type TemplateResult = {
  workbook: XLSX.WorkBook | ExcelJSWorkbook;
  headerRowIndex: number;
};

export class TemplateCreator {
  private headerRowIndex: number;

  constructor(private options: TemplateCreatorOptions) {}

  getHeaderRowIndex() {
    return this.headerRowIndex;
  }

  async run(options?: any): Promise<XLSX.WorkBook | ExcelJSWorkbook> {
    const workbook = new ExcelJSWorkbook();
    const worksheet = workbook.addWorksheet('Sheet 1');

    const headers = this.renderHeaders();
    let currentRow = 1;

    let explainText = '';

    if (this.options.explain && this.options.explain?.trim() !== '') {
      explainText = this.options.explain;
    }

    const fieldDescriptions = this.options.columns
      .filter((col) => col.description)
      .map((col) => `${col.title || col.defaultTitle}：${col.description}`);

    if (fieldDescriptions.length > 0) {
      if (explainText) {
        explainText += '\n\n';
      }
      explainText += fieldDescriptions.join('\n');
    }

    if (explainText.trim() !== '') {
      const lines = explainText.split('\n');
      const EXPLAIN_MERGE_COLUMNS = 5; // Default merge 5 columns

      // Pre-set the required number of columns and their widths
      const columnsNeeded = Math.max(EXPLAIN_MERGE_COLUMNS, headers.length);
      for (let i = 1; i <= columnsNeeded; i++) {
        const col = worksheet.getColumn(i);
        // Set first column wider
        col.width = i === 1 ? 60 : 30;
      }

      lines.forEach((line, index) => {
        const row = worksheet.getRow(index + 1);
        // Merge first 5 cells for explanation text
        worksheet.mergeCells(index + 1, 1, index + 1, EXPLAIN_MERGE_COLUMNS);

        const cell = row.getCell(1);
        cell.value = line;

        cell.alignment = {
          vertical: 'middle',
          horizontal: 'left',
          indent: 1,
          wrapText: true,
        };
      });

      currentRow = lines.length + 1;
    }

    // Write headers and set styles
    const headerRow = worksheet.getRow(currentRow);
    headerRow.height = 25;
    headers.forEach((header, index) => {
      const cell = headerRow.getCell(index + 1);
      cell.value = header;
      cell.font = {
        bold: true,
        size: 10,
        name: 'Arial',
      };
      cell.border = {
        top: { style: 'thin' },
        bottom: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' },
      };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE9ECEF' }, // Darker gray background for headers
      };
      cell.alignment = {
        vertical: 'middle',
        horizontal: 'left',
        indent: 1,
        wrapText: true,
      };

      // 如果是第一列，恢复到正常宽度
      if (index === 0) {
        worksheet.getColumn(1).width = 30;
      }
    });

    // Set column widths
    headers.forEach((_, index) => {
      const col = worksheet.getColumn(index + 1);
      col.width = 30;

      // Set style for the first column
      if (index === 0) {
        col.eachCell({ includeEmpty: false }, (cell, rowNumber) => {
          // Only set background color for headers, not for other rows
          if (rowNumber === currentRow) {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFE9ECEF' },
            };
          }
        });
      }
    });

    this.headerRowIndex = currentRow;

    if (options?.returnXLSXWorkbook) {
      return await WorkbookConverter.excelJSToXLSX(workbook);
    }

    return workbook;
  }

  renderHeaders() {
    return this.options.columns.map((col) => {
      return col.title || col.defaultTitle;
    });
  }
}
