import { Context, Next } from '@nocobase/actions';
import { Collection, Repository } from '@nocobase/database';
import xlsx from 'node-xlsx';
import XLSX from 'xlsx';
import { namespace } from '../../';

const IMPORT_LIMIT_COUNT = 10000;

class Importer {
  repository: Repository;
  collection: Collection;
  columns: any[];
  items: any[][] = [];
  headerRow;
  context: Context;

  constructor(ctx: Context) {
    const { resourceName, resourceOf } = ctx.action;
    this.context = ctx;
    this.repository = ctx.db.getRepository<any>(resourceName, resourceOf);
    this.collection = this.repository.collection;
    this.parseXlsx();
  }

  getRows() {
    const workbook = XLSX.read(this.context.file.buffer, {
      type: 'buffer',
      // cellDates: true,
      // raw: false,
    });
    const r = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<any>(r, { header: 1, defval: null, raw: false });
    return rows;
  }

  parseXlsx() {
    const rows = this.getRows();
    let columns = (this.context.request.body as any).columns as any[];
    if (typeof columns === 'string') {
      columns = JSON.parse(columns);
    }
    this.columns = columns.map((column) => {
      return {
        ...column,
        field: this.collection.fields.get(column.dataIndex[0]),
      };
    });
    const str = this.columns.map((column) => column.defaultTitle).join('||');
    for (const row of rows) {
      if (this.hasHeaderRow()) {
        if (row && row.join('').trim()) {
          this.items.push(row);
        }
      }
      if (str === row.filter((r) => r).join('||')) {
        this.headerRow = row;
      }
    }
  }

  getFieldByIndex(index) {
    return this.columns[index].field;
  }

  async getItems() {
    const items: any[] = [];
    for (const row of this.items) {
      const values = {};
      const errors = [];
      for (let index = 0; index < row.length; index++) {
        if (!this.columns[index]) {
          continue;
        }
        const column = this.columns[index];
        const { field, defaultTitle } = column;
        let value = row[index];
        if (value === undefined || value === null) {
          continue;
        }
        const parser = this.context.db.buildFieldValueParser(field, { ...this.context, column });
        await parser.setValue(typeof value === 'string' ? value.trim() : value);
        value = parser.getValue();
        if (parser.errors.length > 0) {
          errors.push(`${defaultTitle}: ${parser.errors.join(';')}`);
        }
        if (value === undefined) {
          continue;
        }
        values[field.name] = value;
      }
      items.push({
        row,
        values,
        errors,
      });
    }
    return items;
  }

  hasSortField() {
    return !!this.collection.options.sortable;
  }

  async run() {
    return await this.context.db.sequelize.transaction(async (transaction) => {
      let sort = 0;
      if (this.hasSortField()) {
        sort = await this.repository.model.max<number, any>('sort', { transaction });
      }
      const result: any = [[], []];
      for (const { row, values, errors } of await this.getItems()) {
        if (errors.length > 0) {
          row.push(errors.join(';'));
          result[1].push(row);
          continue;
        }
        if (this.hasSortField()) {
          values['sort'] = ++sort;
        }
        try {
          const instance = await this.repository.create({
            values,
            transaction,
            logging: false,
            context: this.context,
          });
          result[0].push(instance);
        } catch (error) {
          this.context.log.error(error, row);
          row.push(error.message);
          result[1].push(row);
        }
      }
      return result;
    });
  }

  hasHeaderRow() {
    return !!this.headerRow;
  }
}

export async function importXlsx(ctx: Context, next: Next) {
  const importer = new Importer(ctx);

  if (!importer.hasHeaderRow()) {
    ctx.throw(400, ctx.t('Imported template does not match, please download again.', { ns: namespace }));
  }

  const [success, failure] = await importer.run();

  ctx.body = {
    rows: xlsx.build([
      {
        name: ctx.file.originalname,
        data: [importer.headerRow].concat(failure),
      },
    ]),
    successCount: success.length,
    failureCount: failure.length,
  };

  await next();
}
