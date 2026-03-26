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
import {
  ICollection,
  ICollectionManager,
  IRelationField,
  SequelizeCollectionManager,
} from '@nocobase/data-source-manager';
import {
  Collection as DBCollection,
  Database,
  IntegerField,
  Model,
  MultipleRelationRepository,
  NumberField,
  RelationRepository,
  Repository,
  UpdateGuard,
  updateAssociations,
} from '@nocobase/database';
import { MultiAssociationAccessors, Transaction, ValidationError } from 'sequelize';
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
  /** Parsed SheetJS workbook. Used for the synchronous (small-file) import path. */
  workbook?: any;
  /**
   * Absolute path to the XLSX file on disk. When set, the importer uses ExcelJS
   * streaming reader so the file is never fully loaded into memory — rows are
   * yielded one by one and processed in chunks. This is the preferred path for
   * large async imports.
   */
  filePath?: string;
  chunkSize?: number;
  explain?: string;
  repository?: any;
  logger?: Logger;
  rowDefaultValues?: Record<string, any>;
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

  async validateBySpaces(data: string[][], ctx?: Context) {
    if (ctx?.space?.can) {
      await ctx.space.can({
        data: data?.slice(1) || [],
        columns: this.options.columns.map((column) => column.dataIndex),
        collection: this.options.collection.name,
        ctx,
      });
    }
  }

  async validate(ctx?: Context) {
    this.validateColumns(ctx);

    const data = await this.getData(ctx);

    await this.validateBySpaces(data, ctx);

    return data;
  }

  async run(options: RunOptions = {}) {
    // If the caller already provides a transaction, keep using it as a single global transaction
    // to respect external atomicity requirements (e.g. tests, integrations).
    // Otherwise, each chunk will manage its own transaction to avoid holding a single large
    // transaction open for the entire import (which causes high DB memory usage with 100k+ rows).
    const hasExternalTransaction = !!options.transaction;

    const { db } = this.options.collectionManager as SequelizeCollectionManager;

    if (hasExternalTransaction) {
      // Legacy path: single global transaction provided by caller.
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

        if (db) {
          await this.loggerService.measureExecutedTime(
            async () => this.resetSeq(options),
            'Sequence reset completed in {time}ms',
          );
        }

        return imported;
      } catch (error) {
        this.logger?.error(`Import failed: ${this.renderErrorMessage(error)}`, {
          originalError: error.stack || error.toString(),
        });
        throw error;
      }
    }

    // Per-chunk transaction path: each chunk commits independently, avoiding a single
    // long-lived transaction that accumulates all rows in DB memory.
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

      if (db) {
        await this.loggerService.measureExecutedTime(
          async () => this.resetSeq({}),
          'Sequence reset completed in {time}ms',
        );
      }

      return imported;
    } catch (error) {
      this.logger?.error(`Import failed: ${this.renderErrorMessage(error)}`, {
        originalError: error.stack || error.toString(),
      });
      throw error;
    }
  }

  async resetSeq(options?: RunOptions) {
    const { transaction } = options;

    const { db } = this.options.collectionManager as SequelizeCollectionManager;
    const collection: DBCollection = this.options.collection as DBCollection;

    // @ts-ignore
    const autoIncrementAttribute = collection.model.autoIncrementAttribute;
    if (!autoIncrementAttribute) {
      return;
    }
    const field = this.options.collection.getField(autoIncrementAttribute);
    if (field && !(field instanceof NumberField)) {
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

    if (maxVal == null) {
      return;
    }

    if (typeof autoIncrInfo.currentVal === 'number' && maxVal <= autoIncrInfo.currentVal) {
      return;
    }

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

  protected validateColumns(ctx?: Context) {
    const columns = this.getColumnsByPermission(ctx as Context);
    if (columns.length === 0) {
      throw new ImportValidationError('Columns configuration is empty');
    }

    for (const column of columns) {
      if (!Array.isArray(column?.dataIndex) || column.dataIndex.length === 0) {
        throw new ImportValidationError('Columns configuration is empty');
      }

      if (column.dataIndex.length > 2) {
        throw new ImportValidationError('Invalid field: {{field}}', {
          field: column.dataIndex.join('.'),
        });
      }

      const [fieldName, filterKey] = column.dataIndex;

      if (typeof fieldName !== 'string' || fieldName.trim() === '') {
        throw new ImportValidationError('Invalid field: {{field}}', { field: String(fieldName) });
      }

      const field = this.options.collection.getField(fieldName);
      if (!field) {
        throw new ImportValidationError('Field not found: {{field}}', { field: fieldName });
      }

      if (column.dataIndex.length > 1) {
        if (typeof field.isRelationField !== 'function' || !field.isRelationField()) {
          throw new ImportValidationError('Invalid field: {{field}}', {
            field: column.dataIndex.join('.'),
          });
        }

        if (typeof filterKey !== 'string' || filterKey.trim() === '') {
          throw new ImportValidationError('Invalid field: {{field}}', {
            field: column.dataIndex.join('.'),
          });
        }

        const targetCollection = (field as IRelationField).targetCollection?.();
        if (!targetCollection) {
          throw new ImportValidationError('Field not found: {{field}}', {
            field: column.dataIndex.join('.'),
          });
        }

        // Check if filterKey is a valid field in target collection
        // Use both getField (for NocoBase fields) and getAttributes (for auto-generated fields like 'id')
        const targetField = targetCollection.getField(filterKey);
        const isValidAttribute = (targetCollection as DBCollection).model?.getAttributes()?.[filterKey];
        if (!targetField && !isValidAttribute) {
          throw new ImportValidationError('Field not found: {{field}}', {
            field: `${fieldName}.${filterKey}`,
          });
        }
      }
    }
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

    // Use shift() to release each chunk reference after processing,
    // allowing GC to reclaim memory progressively during large imports.
    let chunkRows: string[][];
    while ((chunkRows = chunks.shift()) !== undefined) {
      await this.handleChuckRows(chunkRows, options, { handingRowIndex, context: options?.context });
      imported += chunkRows.length;
      this.emit('progress', {
        total,
        current: imported,
      });
    }

    return imported;
  }

  protected getModel(): typeof Model {
    return (this.repository instanceof RelationRepository ? this.repository.targetModel : this.repository.model) as any;
  }

  async handleRowValuesWithColumns(row: any, rowValues: any, options: RunOptions, columns: ImportColumn[]) {
    for (let index = 0; index < columns.length; index++) {
      const column = columns[index];
      const field = this.options.collection.getField(column.dataIndex[0]);
      if (!field) {
        throw new ImportValidationError('Import validation. Field not found', {
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

      try {
        rowValues[dataKey] = str == null ? null : await interfaceInstance.toValue(this.trimString(str), ctx);
      } catch (error) {
        throw new ImportValidationError('Failed to parse field {{field}} in row {{rowIndex}}: {{message}}', {
          rowIndex: options?.context?.handingRowIndex || 1,
          field: dataKey,
          message: error.message,
        });
      }
    }
    const model = this.getModel();
    const guard = UpdateGuard.fromOptions(model, {
      ...options,
      action: 'create',
      underscored: this.repository.collection.options.underscored,
    });

    rowValues =
      this.repository instanceof RelationRepository
        ? model.callSetters(guard.sanitize(rowValues || {}), options)
        : guard.sanitize(rowValues);
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

    // If no external transaction is provided, create a per-chunk transaction so that
    // each chunk commits independently and doesn't accumulate in a single large transaction.
    // @ts-ignore
    const db = this.options.collectionManager.db;
    const externalTransaction = runOptions?.transaction;
    const transaction = externalTransaction || (db ? await db.sequelize.transaction() : null);

    const chunkRunOptions = { ...runOptions, transaction };
    const columns = this.getColumnsByPermission(options?.context);

    const translate = (message: string) => {
      if (options.context?.t) {
        return options.context.t(message, { ns: 'action-import' });
      } else {
        return message;
      }
    };

    // Row processing and insert are both inside the try-catch so that any error
    // (including errors thrown by toValue() during row parsing, before performInsert)
    // always triggers a rollback of the per-chunk transaction.
    const rows = [];
    try {
      for (const row of chunkRows) {
        const rowValues = {};
        await this.handleRowValuesWithColumns(row, rowValues, chunkRunOptions, columns);
        rows.push({
          ...(this.options.rowDefaultValues || {}),
          ...rowValues,
        });
      }

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
      handingRowIndex += chunkRows.length;
      if (!externalTransaction) {
        await transaction?.commit();
      }
    } catch (error) {
      if (!externalTransaction) {
        await transaction?.rollback();
      }

      // Validation errors thrown during row parsing (e.g. field not found, toValue failure)
      // are re-thrown as-is. They are not wrapped in ImportError because ImportError
      // semantically represents a DB-level insert/update failure, and wrapping would
      // change the error structure that callers (and tests) depend on.
      if (error.name === 'ImportValidationError') {
        throw error;
      }

      if (error.name === 'SequelizeUniqueConstraintError') {
        throw new Error(`${translate('Unique constraint error, fields:')} ${JSON.stringify(error.fields)}`);
      }

      if (error.params?.rowIndex) {
        handingRowIndex += error.params.rowIndex;
        error.params.rowIndex = handingRowIndex;
      }
      this.logger?.error(`Import error at row ${handingRowIndex}: ${error.message}`, {
        rowIndex: handingRowIndex,
        rowData: rows[handingRowIndex],
        originalError: error.stack || error.toString(),
      });

      throw new ImportError(`Import failed at row ${handingRowIndex}`, {
        rowIndex: handingRowIndex,
        rowData: rows[handingRowIndex - (this.options.explain ? 2 : 1)],
        cause: error,
      });
    }

    return;
  }

  async performInsert(insertOptions: { values: any[]; transaction: Transaction; context: any; hooks?: boolean }) {
    const { values, transaction, context } = insertOptions;
    const instances = await this.loggerService.measureExecutedTime(
      async () =>
        this.getModel().bulkCreate(values, {
          transaction,
          hooks: insertOptions.hooks == undefined ? true : insertOptions.hooks,
          returning: true,
          context,
        } as any),
      'Row {{rowIndex}}: bulkCreate completed in {time}ms',
    );

    if (this.repository instanceof RelationRepository) {
      await this.associateRecords(instances, _.omit(insertOptions, 'values'));
    }
    // @ts-ignore
    const db = this.options.collectionManager.db as Database;
    for (let i = 0; i < instances.length; i++) {
      const instance = instances[i];
      const value = values[i];

      if (insertOptions.hooks !== false) {
        await this.loggerService.measureExecutedTime(
          async () => {
            await db.emitAsync(`${this.repository.collection.name}.afterCreate`, instance, {
              transaction,
            });
            await db.emitAsync(`${this.repository.collection.name}.afterSave`, instance, {
              transaction,
            });
            instance.clearChangedWithAssociations();
          },
          `Row ${i + 1}: afterSave event emitted in {time}ms`,
          'debug',
        );
      }

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

      // Release the instance reference after all events have been processed so the
      // heavy Sequelize Model object (dataValues, _previousDataValues, etc.) can be
      // garbage collected before the next chunk starts.
      instances[i] = null;
    }
    return instances;
  }

  async associateRecords(targets: Model[], options: any = {}) {
    if (!(this.repository instanceof RelationRepository)) {
      return;
    }
    const accessors = this.repository.accessors();
    const sourceModel = await this.repository.getSourceModel();

    if (!accessors || !sourceModel) {
      throw new Error('Missing accessors or source model.');
    }

    if ((accessors as MultiAssociationAccessors).addMultiple) {
      // For hasMany, belongsToMany
      await sourceModel[(accessors as MultiAssociationAccessors).addMultiple](targets, options);
    } else if ((accessors as MultiAssociationAccessors).add) {
      // Also works for hasMany / belongsToMany
      await Promise.all(
        targets.map((target) => sourceModel[(accessors as MultiAssociationAccessors).add](target, options)),
      );
    } else if (accessors.set) {
      // set accessor（hasOne, belongsTo）
      if (targets.length > 1) {
        throw new Error('Cannot associate multiple records to a single-valued relation.');
      }
      await sourceModel[accessors.set](targets[0], options);
    } else {
      throw new Error(`Unsupported association or no usable accessor on ${this.repository['association']}`);
    }
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

  protected getExpectedHeaders(ctx?: Context): string[] {
    const columns = this.getColumnsByPermission(ctx);
    return columns.map((col) => col.title || col.defaultTitle);
  }

  async getData(ctx?: Context) {
    const workbook = this.options.workbook;
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];

    let data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null, blankrows: false }) as string[][];

    // Release the workbook reference immediately after converting to plain data array,
    // so the large parsed XLSX object can be garbage collected during import.
    this.options.workbook = null;

    // Find and validate header row
    const expectedHeaders = this.getExpectedHeaders(ctx);
    const { headerRowIndex, headers } = this.findAndValidateHeaders({ data, expectedHeaders });
    if (headerRowIndex === -1) {
      throw new ImportValidationError('Headers not found. Expected headers: {{headers}}', {
        headers: expectedHeaders.join(', '),
      });
    }
    data = this.alignWithHeaders({ data, expectedHeaders, headerRowIndex });
    // Extract data rows
    const rows = data.slice(headerRowIndex + 1);

    // if no data rows, throw error
    if (rows.length === 0) {
      throw new ImportValidationError('No data to import');
    }

    return [headers, ...rows];
  }

  private alignWithHeaders(params: {
    data: string[][];
    expectedHeaders: string[];
    headerRowIndex: number;
  }): string[][] {
    const { data, expectedHeaders, headerRowIndex } = params;
    const headerRow = data[headerRowIndex];
    const keepCols = expectedHeaders.map((header) => headerRow.indexOf(header));

    if (keepCols.some((index) => index < 0)) {
      throw new ImportValidationError('Headers not found. Expected headers: {{headers}}', {
        headers: expectedHeaders.join(', '),
      });
    }

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

    return { headerRowIndex: -1, headers: [] };
  }
}
