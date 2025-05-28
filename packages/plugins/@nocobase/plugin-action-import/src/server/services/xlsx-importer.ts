/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import * as XLSX from 'xlsx';
import lodash from 'lodash';
import { ICollection, ICollectionManager, IRelationField } from '@nocobase/data-source-manager';
import {
  Collection as DBCollection,
  Database,
  Model,
  Repository,
  UpdateGuard,
  updateAssociations,
} from '@nocobase/database';
import { Transaction } from 'sequelize';
import EventEmitter from 'events';
import { ImportValidationError, ImportError } from '../errors';
import { Context } from '@nocobase/actions';
import _ from 'lodash';
import { Logger } from '@nocobase/logger';
import { LoggerService } from '../utils';

export type ImportColumn = {
  dataIndex: Array<string>;
  defaultTitle: string;
  title?: string;
  description?: string;
};

export type ImporterOptions = {
  collectionManager: ICollectionManager;
  collection: ICollection;
  columns: Array<ImportColumn>;
  workbook: any;
  chunkSize?: number;
  explain?: string;
  repository?: any;
  logger?: Logger;
};

export type RunOptions = {
  transaction?: Transaction;
  context?: any;
};

export class XlsxImporter extends EventEmitter {
  private repository: Repository;

  protected loggerService: LoggerService;

  protected logger: Logger;

  constructor(protected options: ImporterOptions) {
    super();
    if (typeof options.columns === 'string') {
      options.columns = JSON.parse(options.columns);
    }

    if (options.columns.length == 0) {
      throw new Error(`columns is empty`);
    }

    this.repository = options.repository ? options.repository : options.collection.repository;
    this.logger = options.logger;
    this.loggerService = new LoggerService({ logger: this.logger });
  }

  async beforePerformImport(data: string[][], options: RunOptions): Promise<string[][]> {
    return data;
  }

  async validate(ctx?: Context) {
    const columns = this.getColumnsByPermission(ctx);
    if (columns.length == 0) {
      throw new ImportValidationError('Columns configuration is empty');
    }

    for (const column of this.options.columns) {
      const field = this.options.collection.getField(column.dataIndex[0]);
      if (!field) {
        throw new ImportValidationError('Field not found: {{field}}', { field: column.dataIndex[0] });
      }
    }

    const data = await this.getData(ctx);
    return data;
  }

  async run(options: RunOptions = {}) {
    let transaction = options.transaction;

    // @ts-ignore
    if (!transaction && this.options.collectionManager.db) {
      // @ts-ignore
      transaction = options.transaction = await this.options.collectionManager.db.sequelize.transaction();
    }

    try {
      const data = await this.loggerService.measureExecutedTime(
        async () => this.validate(options.context),
        'Validation completed in {time}ms',
      );

      const imported = await this.loggerService.measureExecutedTime(
        async () => this.performImport(data, options),
        'Data import completed in {time}ms',
      );

      this.logger?.info(`Import completed successfully, imported ${imported} records`);

      // @ts-ignore
      if (this.options.collectionManager.db) {
        await this.loggerService.measureExecutedTime(
          async () => this.resetSeq(options),
          'Sequence reset completed in {time}ms',
        );
      }

      transaction && (await transaction.commit());

      return imported;
    } catch (error) {
      transaction && (await transaction.rollback());
      this.logger?.error(`Import failed: ${this.renderErrorMessage(error)}`, {
        originalError: error.stack || error.toString(),
      });
      throw error;
    }
  }

  async resetSeq(options?: RunOptions) {
    const { transaction } = options;

    // @ts-ignore
    const db: Database = this.options.collectionManager.db;
    const collection: DBCollection = this.options.collection as DBCollection;

    // @ts-ignore
    const autoIncrementAttribute = collection.model.autoIncrementAttribute;
    if (!autoIncrementAttribute) {
      return;
    }

    let hasImportedAutoIncrementPrimary = false;
    for (const importedDataIndex of this.getColumnsByPermission(options?.context)) {
      if (importedDataIndex.dataIndex[0] === autoIncrementAttribute) {
        hasImportedAutoIncrementPrimary = true;
        break;
      }
    }

    if (!hasImportedAutoIncrementPrimary) {
      return;
    }

    let tableInfo = collection.getTableNameWithSchema();
    if (typeof tableInfo === 'string') {
      tableInfo = {
        tableName: tableInfo,
      };
    }

    const autoIncrInfo = await db.queryInterface.getAutoIncrementInfo({
      tableInfo,
      fieldName: autoIncrementAttribute,
      transaction,
    });

    const maxVal = (await collection.model.max(autoIncrementAttribute, { transaction })) as number;

    const queryInterface = db.queryInterface;

    await queryInterface.setAutoIncrementVal({
      tableInfo,
      columnName: collection.model.rawAttributes[autoIncrementAttribute].field,
      currentVal: maxVal,
      seqName: autoIncrInfo.seqName,
      transaction,
    });

    this.emit('seqReset', { maxVal, seqName: autoIncrInfo.seqName });
  }

  private getColumnsByPermission(ctx: Context): ImportColumn[] {
    const columns = this.options.columns;
    return columns.filter((x) =>
      _.isEmpty(ctx?.permission?.can?.params)
        ? true
        : _.includes(ctx?.permission?.can?.params?.fields || [], x.dataIndex[0]),
    );
  }

  async performImport(data: string[][], options?: RunOptions): Promise<any> {
    const chunkSize = this.options.chunkSize || 1000;
    const chunks = lodash.chunk(data.slice(1), chunkSize);

    let handingRowIndex = 1;
    let imported = 0;

    // Calculate total rows to be imported
    const total = data.length - 1; // Subtract header row

    if (this.options.explain) {
      handingRowIndex += 1;
    }

    for (const chunkRows of chunks) {
      await this.handleChuckRows(chunkRows, options, { handingRowIndex, context: options?.context });
      imported += chunkRows.length;
      this.emit('progress', {
        total,
        current: imported,
      });
    }

    return imported;
  }

  async handleRowValuesWithColumns(row: any, rowValues: any, options: RunOptions) {
    for (let index = 0; index < this.options.columns.length; index++) {
      const column = this.options.columns[index];
      const field = this.options.collection.getField(column.dataIndex[0]);
      if (!field) {
        throw new ImportValidationError('Import validation.Field not found', {
          field: column.dataIndex[0],
        });
      }

      const str = row[index];
      const dataKey = column.dataIndex[0];
      const fieldOptions = field.options;
      const interfaceName = fieldOptions.interface;
      const InterfaceClass = this.options.collectionManager.getFieldInterface(interfaceName);
      if (!InterfaceClass) {
        rowValues[dataKey] = str;
        continue;
      }

      const interfaceInstance = new InterfaceClass(field.options);

      const ctx: any = {
        transaction: options.transaction,
        field,
      };

      if (column.dataIndex.length > 1) {
        ctx.associationField = field;
        ctx.targetCollection = (field as IRelationField).targetCollection();
        ctx.filterKey = column.dataIndex[1];
      }

      rowValues[dataKey] = await interfaceInstance.toValue(this.trimString(str), ctx);
    }
    const guard = UpdateGuard.fromOptions(this.repository.model, {
      ...options,
      action: 'create',
      underscored: this.repository.collection.options.underscored,
    });

    rowValues = (this.repository.model as typeof Model).callSetters(guard.sanitize(rowValues || {}), options);
  }

  async handleChuckRows(
    chunkRows: string[][],
    runOptions?: RunOptions,
    options?: {
      handingRowIndex: number;
      context: any;
    },
  ) {
    let { handingRowIndex = 1 } = options;
    const { transaction } = runOptions;
    const rows = [];
    for (const row of chunkRows) {
      const rowValues = {};
      handingRowIndex += 1;
      await this.handleRowValuesWithColumns(row, rowValues, runOptions);
      rows.push(rowValues);
    }

    try {
      await this.loggerService.measureExecutedTime(
        async () =>
          this.performInsert({
            values: rows,
            transaction,
            context: options?.context,
          }),
        'Record insertion completed in {time}ms',
      );
      await new Promise((resolve) => setTimeout(resolve, 5));
    } catch (error) {
      this.logger?.error(`Import error at row ${handingRowIndex}: ${error.message}`, {
        rowIndex: handingRowIndex,
        rowData: rows[handingRowIndex],
        originalError: error.stack || error.toString(),
      });

      throw new ImportError(`Import failed at row ${handingRowIndex}`, {
        rowIndex: handingRowIndex,
        rowData: rows[handingRowIndex],
        cause: error,
      });
    }

    return;
  }

  async performInsert(insertOptions: { values: any[]; transaction: Transaction; context: any; hooks?: boolean }) {
    const { values, transaction, context } = insertOptions;

    const instances = await this.loggerService.measureExecutedTime(
      async () =>
        this.repository.model.bulkCreate(values, {
          transaction,
          hooks: insertOptions.hooks == undefined ? true : insertOptions.hooks,
          returning: true,
        }),
      'Row {{rowIndex}}: bulkCreate completed in {time}ms',
    );

    // @ts-ignore
    const db = this.options.collectionManager.db as Database;
    for (let i = 0; i < instances.length; i++) {
      const instance = instances[i];
      const value = values[i];

      await this.loggerService.measureExecutedTime(
        async () => updateAssociations(instance, value, { transaction }),
        `Row ${i + 1}: updateAssociations completed in {time}ms`,
        'debug',
      );

      if (context?.skipWorkflow !== true) {
        await this.loggerService.measureExecutedTime(
          async () => {
            await db.emitAsync(`${this.repository.collection.name}.afterCreateWithAssociations`, instance, {
              transaction,
            });
            await db.emitAsync(`${this.repository.collection.name}.afterSaveWithAssociations`, instance, {
              transaction,
            });
            instance.clearChangedWithAssociations();
          },
          `Row ${i + 1}: afterCreate event emitted in {time}ms`,
          'debug',
        );
      }
    }
    return instances;
  }

  renderErrorMessage(error) {
    let message = error.message;
    if (error.parent) {
      message += `: ${error.parent.message}`;
    }

    return message;
  }
  trimString(str: string) {
    if (typeof str === 'string') {
      return str.trim();
    }

    return str;
  }

  private getExpectedHeaders(ctx?: Context): string[] {
    const columns = this.getColumnsByPermission(ctx);
    return columns.map((col) => col.title || col.defaultTitle);
  }

  async getData(ctx?: Context) {
    const workbook = this.options.workbook;
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];

    let data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null }) as string[][];

    // Find and validate header row
    const expectedHeaders = this.getExpectedHeaders(ctx);
    const { headerRowIndex, headers } = this.findAndValidateHeaders({ data, expectedHeaders });
    if (headerRowIndex === -1) {
      throw new ImportValidationError('Headers not found. Expected headers: {{headers}}', {
        headers: expectedHeaders.join(', '),
      });
    }
    data = this.alignWithHeaders({ data, expectedHeaders, headers });
    // Extract data rows
    const rows = data.slice(headerRowIndex + 1);

    // if no data rows, throw error
    if (rows.length === 0) {
      throw new ImportValidationError('No data to import');
    }

    return [headers, ...rows];
  }

  private alignWithHeaders(params: { headers: string[]; expectedHeaders: string[]; data: string[][] }): string[][] {
    const { expectedHeaders, headers, data } = params;
    const keepCols = headers.map((x, i) => (expectedHeaders.includes(x) ? i : -1)).filter((i) => i > -1);

    return data.map((row) => keepCols.map((i) => row[i]));
  }

  private findAndValidateHeaders(options: { expectedHeaders: string[]; data: string[][] }): {
    headerRowIndex: number;
    headers: string[];
  } {
    const { data, expectedHeaders } = options;

    // Find header row and validate
    for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
      const row = data[rowIndex];
      const actualHeaders = row.filter((cell) => cell !== null && cell !== '');

      const allHeadersFound = expectedHeaders.every((header) => actualHeaders.includes(header));

      if (allHeadersFound) {
        const orderedHeaders = expectedHeaders.filter((h) => actualHeaders.includes(h));
        return { headerRowIndex: rowIndex, headers: orderedHeaders };
      }
    }
  }
}
