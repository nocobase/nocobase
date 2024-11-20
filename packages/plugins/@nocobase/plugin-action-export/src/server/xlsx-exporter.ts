import XLSX from 'xlsx';
import BaseExporter, { ExportOptions } from './services/base-exporter';
import { NumberField } from '@nocobase/database';

type ExportColumn = {
  dataIndex: Array<string>;
  title?: string;
  defaultTitle: string;
};

type XlsxExportOptions = Omit<ExportOptions, 'fields'> & {
  columns: Array<ExportColumn>;
};

class XlsxExporter extends BaseExporter<XlsxExportOptions & { fields: Array<Array<string>> }> {
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

  async addRows(rows: Array<any>, ctx?): Promise<void> {
    const chunkData = rows.map((r) => {
      return this.options.columns.map((col) => {
        return this.formatValue(r, col.dataIndex, ctx);
      });
    });

    XLSX.utils.sheet_add_aoa(this.worksheet, chunkData, {
      origin: `A${this.startRowNumber}`,
    });

    this.startRowNumber += rows.length;
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

export default XlsxExporter;
