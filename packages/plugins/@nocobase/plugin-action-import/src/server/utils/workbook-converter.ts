import * as XLSX from 'xlsx';
import { Workbook as ExcelJSWorkbook } from 'exceljs';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { promisify } from 'util';

export class WorkbookConverter {
  /**
   * Convert ExcelJS Workbook to XLSX Workbook
   */
  static async excelJSToXLSX(workbook: ExcelJSWorkbook): Promise<XLSX.WorkBook> {
    // Convert ExcelJS workbook to buffer in memory
    const buffer = await workbook.xlsx.writeBuffer();
    // Convert buffer to XLSX workbook
    return XLSX.read(buffer, { type: 'buffer' });
  }
}
