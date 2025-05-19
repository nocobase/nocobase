/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import * as Excel from 'exceljs';
import { BaseExporter, ExportOptions } from './base-exporter';
import fs from 'fs';

type ExportColumn = {
  dataIndex: Array<string>;
  title?: string;
  defaultTitle: string;
};

type XlsxExportOptions = Omit<ExportOptions, 'fields'> & {
  columns: Array<ExportColumn>;
};

const XLSX_LIMIT_CHAER = 32767;

export class XlsxExporter extends BaseExporter<XlsxExportOptions & { fields: Array<Array<string>> }> {
  /**
   * You can adjust the maximum number of exported rows based on business needs and system
   * available resources. However, please note that you need to fully understand the risks
   * after the modification. Increasing the maximum number of rows that can be exported may
   * increase system resource usage, leading to increased processing delays for other
   * requests, or even server processes being recycled by the operating system.
   *
   * 您可以根据业务需求和系统可用资源等参数，调整最大导出数量的限制。但请注意，您需要充分了解修改之后的风险，
   * 增加最大可导出的行数可能会导致系统资源占用率升高，导致其他请求处理延迟增加、无法处理、甚至
   * 服务端进程被操作系统回收等问题。
   */

  private workbook: Excel.stream.xlsx.WorkbookWriter;
  private worksheet: Excel.Worksheet;

  public outputPath: string;

  constructor(options: XlsxExportOptions) {
    const fields = options.columns.map((col) => col.dataIndex);
    super({ ...options, fields });
    this.outputPath = options.outputPath || this.generateOutputPath('xlsx', '.xlsx');
  }

  async init(ctx?): Promise<void> {
    this.workbook = new Excel.stream.xlsx.WorkbookWriter({
      filename: this.outputPath,
      useStyles: true,
      useSharedStrings: false, // 减少内存使用
    });
    this.worksheet = this.workbook.addWorksheet('Data', {
      properties: { defaultRowHeight: 20 },
    });
    this.worksheet.columns = this.options.columns.map((x) => ({
      key: x.dataIndex[0],
      header: this.renderHeader(x),
    }));
    this.worksheet.getRow(1).font = { bold: true };
    this.worksheet.getRow(1).commit();
  }

  async handleRow(row: any, ctx?): Promise<void> {
    const rowData = this.options.columns.map((col) => {
      return this.formatValue(row, col.dataIndex, ctx);
    });

    this.worksheet.addRow(rowData).commit();
  }

  async finalize(): Promise<any> {
    await this.worksheet.commit();
    await this.workbook.commit();
    return this.workbook;
  }

  cleanOutputFile() {
    fs.unlink(this.outputPath, (err) => {});
  }

  getXlsxBuffer() {
    const buffer = fs.readFileSync(this.outputPath);
    return buffer;
  }

  private renderHeader(col: ExportColumn) {
    const fieldInstance = this.findFieldByDataIndex(col.dataIndex);
    return col.title || fieldInstance?.options.title || col.defaultTitle;
  }
}
