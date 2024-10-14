/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import XLSX, { WorkBook } from 'xlsx';
import lodash from 'lodash';
import { ICollection, ICollectionManager, IRelationField } from '@nocobase/data-source-manager';
import { Collection as DBCollection, Database } from '@nocobase/database';
import { Transaction } from 'sequelize';
import EventEmitter from 'events';

export type ImportColumn = {
  dataIndex: Array<string>;
  defaultTitle: string;
};

type ImporterOptions = {
  collectionManager: ICollectionManager;
  collection: ICollection;
  columns: Array<ImportColumn>;
  workbook: WorkBook;
  chunkSize?: number;
  explain?: string;
};

type RunOptions = {
  transaction?: Transaction;
  context?: any;
};

export class XlsxImporter extends EventEmitter {
  constructor(private options: ImporterOptions) {
    super();

    if (options.columns.length == 0) {
      throw new Error(`columns is empty`);
    }
  }

  async run(options: RunOptions = {}) {
    let transaction = options.transaction;

    // @ts-ignore
    if (!transaction && this.options.collectionManager.db) {
      // @ts-ignore
      transaction = options.transaction = await this.options.collectionManager.db.sequelize.transaction();
    }

    try {
      const imported = await this.performImport(options);

      // @ts-ignore
      if (this.options.collectionManager.db) {
        await this.resetSeq(options);
      }

      transaction && (await transaction.commit());

      return imported;
    } catch (error) {
      transaction && (await transaction.rollback());

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
    for (const importedDataIndex of this.options.columns) {
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

  async performImport(options?: RunOptions) {
    const transaction = options?.transaction;
    const rows = this.getData();
    const chunks = lodash.chunk(rows, this.options.chunkSize || 200);

    let handingRowIndex = 1;

    if (this.options.explain) {
      handingRowIndex += 1;
    }

    let imported = 0;

    for (const chunkRows of chunks) {
      for (const row of chunkRows) {
        const rowValues = {};
        handingRowIndex += 1;
        try {
          for (let index = 0; index < this.options.columns.length; index++) {
            const column = this.options.columns[index];

            const field = this.options.collection.getField(column.dataIndex[0]);

            if (!field) {
              throw new Error(`Field not found: ${column.dataIndex[0]}`);
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
              transaction,
              field,
            };

            if (column.dataIndex.length > 1) {
              ctx.associationField = field;
              ctx.targetCollection = (field as IRelationField).targetCollection();
              ctx.filterKey = column.dataIndex[1];
            }

            rowValues[dataKey] = await interfaceInstance.toValue(this.trimString(str), ctx);
          }

          await this.options.collection.repository.create({
            values: rowValues,
            context: options?.context,
            transaction,
          });

          imported += 1;

          await new Promise((resolve) => setTimeout(resolve, 5));
        } catch (error) {
          throw new Error(
            `failed to import row ${handingRowIndex}, ${this.renderErrorMessage(error)}, rowData: ${JSON.stringify(
              rowValues,
            )}`,
            { cause: error },
          );
        }
      }

      // await to prevent high cpu usage
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    return imported;
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

  getData() {
    const firstSheet = this.firstSheet();
    const rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: null });

    if (this.options.explain) {
      rows.shift();
    }

    const headers = rows[0];

    const columns = this.options.columns;

    // validate headers
    for (let i = 0; i < columns.length; i++) {
      const column = columns[i];
      if (column.defaultTitle !== headers[i]) {
        throw new Error(`Invalid header: ${column.defaultTitle} !== ${headers[i]}`);
      }
    }

    // remove header
    rows.shift();

    return rows;
  }

  firstSheet() {
    return this.options.workbook.Sheets[this.options.workbook.SheetNames[0]];
  }
}
