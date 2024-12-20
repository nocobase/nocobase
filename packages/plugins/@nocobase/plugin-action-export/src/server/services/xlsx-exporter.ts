import XLSX from 'xlsx';
import { BaseExporter, ExportOptions } from './base-exporter';
import { NumberField } from '@nocobase/database';

type ExportColumn = {
  dataIndex: Array<string>;
  title?: string;
  defaultTitle: string;
};

type XlsxExportOptions = Omit<ExportOptions, 'fields'> & {
  columns: Array<ExportColumn>;
};

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

  private workbook: XLSX.WorkBook;
  private worksheet: XLSX.WorkSheet;
  private startRowNumber: number;

  constructor(options: XlsxExportOptions) {
    const fields = options.columns.map((col) => col.dataIndex);
    super({ ...options, fields });
  }

  async init(ctx?): Promise<void> {
    this.workbook = XLSX.utils.book_new();
    this.worksheet = XLSX.utils.sheet_new();

    // write headers
    XLSX.utils.sheet_add_aoa(this.worksheet, [this.renderHeaders(this.options.columns)], {
      origin: 'A1',
    });

    this.startRowNumber = 2;
  }

  async handleRow(row: any, ctx?): Promise<void> {
    const rowData = [
      this.options.columns.map((col) => {
        return this.formatValue(row, col.dataIndex, ctx);
      }),
    ];

    XLSX.utils.sheet_add_aoa(this.worksheet, rowData, {
      origin: `A${this.startRowNumber}`,
    });

    this.startRowNumber += 1;
  }

  async finalize(): Promise<XLSX.WorkBook> {
    for (const col of this.options.columns) {
      const fieldInstance = this.findFieldByDataIndex(col.dataIndex);
      if (fieldInstance instanceof NumberField) {
        // set column cell type to number
        const colIndex = this.options.columns.indexOf(col);
        const cellRange = XLSX.utils.decode_range(this.worksheet['!ref']);

        for (let r = 1; r <= cellRange.e.r; r++) {
          const cell = this.worksheet[XLSX.utils.encode_cell({ c: colIndex, r })];
          // if cell and cell.v is a number, set cell.t to 'n'
          if (cell && isNumeric(cell.v)) {
            cell.t = 'n';
          }
        }
      }
    }

    XLSX.utils.book_append_sheet(this.workbook, this.worksheet, 'Data');
    return this.workbook;
  }

  private renderHeaders(columns: Array<ExportColumn>) {
    return columns.map((col) => {
      const fieldInstance = this.findFieldByDataIndex(col.dataIndex);
      return col.title || fieldInstance?.options.title || col.defaultTitle;
    });
  }
}

function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}
