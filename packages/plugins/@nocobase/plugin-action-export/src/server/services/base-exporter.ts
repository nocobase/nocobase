/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  FindOptions,
  ICollection,
  ICollectionManager,
  IField,
  IModel,
  IRelationField,
  IRepository,
} from '@nocobase/data-source-manager';
import EventEmitter from 'events';
import { deepGet } from '../utils/deep-get';
import path from 'path';
import os from 'os';
import { Logger } from '@nocobase/logger';
import _ from 'lodash';

export type ExportOptions = {
  collectionManager: ICollectionManager;
  collection: ICollection;
  repository?: IRepository;
  fields: Array<Array<string>>;
  findOptions?: FindOptions;
  chunkSize?: number;
  limit?: number;
  logger?: Logger;
  outputPath?: string;
};

abstract class BaseExporter<T extends ExportOptions = ExportOptions> extends EventEmitter {
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
  protected limit: number;

  protected logger: Logger;

  protected _batchQueryStartTime: [number, number] | null = null;

  protected constructor(protected options: T) {
    super();
    this.limit = options.limit ?? (process.env['EXPORT_LIMIT'] ? parseInt(process.env['EXPORT_LIMIT']) : 2000);
    this.logger = options.logger;
  }

  abstract init(ctx?): Promise<void>;
  abstract finalize(): Promise<any>;
  abstract handleRow(row: any, ctx?): Promise<void>;

  async run(ctx?): Promise<any> {
    try {
      this.logger?.info('Export started......');
      await this.init(ctx);

      const { collection, chunkSize, repository } = this.options;
      const repo = repository || collection.repository;
      const total = (await repo.count(this.getFindOptions(ctx))) as number;
      this.logger?.info(`Found ${total} records to export from collection [${collection.name}]`);
      const totalCountStartTime = process.hrtime();
      let current = 0;

      // gt 200000, offset + limit will be slow,so use cursor
      const chunkHandle = (total > 200000 ? repo.chunkWithCursor : repo.chunk).bind(repo);
      const findOptions = {
        ...this.getFindOptions(ctx),
        chunkSize: chunkSize || 200,
        beforeFind: async (options) => {
          this._batchQueryStartTime = process.hrtime();
        },
        afterFind: async (rows, options) => {
          if (this._batchQueryStartTime) {
            const diff = process.hrtime(this._batchQueryStartTime);
            const executionTime = (diff[0] * 1000 + diff[1] / 1000000).toFixed(2);
            if (Number(executionTime) > 1200) {
              this.logger?.warn(
                `Query took too long: ${executionTime}ms, fetched ${rows.length} records, options: ${JSON.stringify(
                  options,
                )}`,
              );
            } else {
              this.logger?.info(`Query completed in ${executionTime}ms, fetched ${rows.length} records`);
            }
            this._batchQueryStartTime = null;
          }
        },
        callback: async (rows, options) => {
          for (const row of rows) {
            const startTime = process.hrtime();
            await this.handleRow(row, ctx);
            const diff = process.hrtime(startTime);
            const executionTime = (diff[0] * 1000 + diff[1] / 1000000).toFixed(2);
            if (Number(executionTime) > 500) {
              this.logger?.info(`HandleRow took too long, completed in ${executionTime}ms`);
            } else {
              this.logger?.info(`HandleRow completed, ${executionTime}ms`);
            }
          }
          this.emit('progress', {
            total,
            current: (current += rows.length),
          });
          const totalDiff = process.hrtime(totalCountStartTime);
          const elapsedSeconds = totalDiff[0] + totalDiff[1] / 1e9;
          const estimatedTimeRemaining = (elapsedSeconds * (total - current)) / current;

          this.logger?.info(
            `Processed ${current}/${total} records (${Math.round((current / total) * 100)}%), ` +
              `elapsed time: ${elapsedSeconds.toFixed(2)}s, ` +
              `estimated remaining: ${estimatedTimeRemaining.toFixed(2)}s`,
          );
        },
      };
      await chunkHandle(findOptions);
      this.logger?.info(`Export completed...... processed ${current} records in total`);
      return this.finalize();
    } catch (error) {
      this.logger?.error(`Export failed: ${error.message}`, { error });
      throw error;
    }
  }

  private removePathAfterFileField(fieldPath: string[]): string[] {
    let currentCollection = this.options.collection;

    for (let i = 0; i < fieldPath.length; i++) {
      const fieldInstance = currentCollection.getField(fieldPath[i]);

      if (_.get(fieldInstance, 'collection.options.template') === 'file') {
        return fieldPath.slice(0, i);
      }

      if (fieldInstance?.isRelationField() && i < fieldPath.length - 1) {
        currentCollection = (fieldInstance as IRelationField).targetCollection();
      }
    }

    return fieldPath;
  }

  protected getAppendOptionsFromFields(ctx?) {
    return this.options.fields
      .filter((fieldPath) => {
        const field = fieldPath[0];
        const hasPermission =
          _.isEmpty(ctx?.permission?.can?.params) || (ctx?.permission?.can?.params?.appends || []).includes(field);
        return hasPermission;
      })
      .map((fieldPath) => {
        const fieldInstance = this.options.collection.getField(fieldPath[0]);
        if (!fieldInstance) {
          throw new Error(`Field "${fieldPath[0]}" not found: , please check the fields configuration.`);
        }

        const cleanedPath = this.removePathAfterFileField([...fieldPath]);

        if (fieldInstance.isRelationField()) {
          return cleanedPath.join('.');
        }

        return null;
      })
      .filter(Boolean);
  }
  protected getFindOptions(ctx?) {
    const { findOptions = {} } = this.options;

    if (this.limit) {
      findOptions.limit = this.limit;
    }

    const appendOptions = this.getAppendOptionsFromFields(ctx);

    if (appendOptions.length) {
      return {
        ...findOptions,
        appends: appendOptions,
      };
    }

    return findOptions;
  }

  protected findFieldByDataIndex(dataIndex: Array<string>): IField {
    const { collection } = this.options;
    const currentField = collection.getField(dataIndex[0]);

    if (dataIndex.length > 1) {
      let targetCollection: ICollection;

      for (let i = 0; i < dataIndex.length; i++) {
        const isLast = i === dataIndex.length - 1;

        if (isLast) {
          return targetCollection.getField(dataIndex[i]);
        }

        targetCollection = (currentField as IRelationField).targetCollection();
      }
    }

    return currentField;
  }

  protected renderRawValue(value) {
    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value);
    }

    return value;
  }

  protected getFieldRenderer(field?: IField, ctx?): (value) => any {
    const InterfaceClass = this.options.collectionManager.getFieldInterface(field?.options?.interface);
    if (!InterfaceClass) {
      return this.renderRawValue;
    }
    const fieldInterface = new InterfaceClass(field?.options);
    return (value) => fieldInterface.toString(value, ctx);
  }

  protected formatValue(rowData: IModel, dataIndex: Array<string>, ctx?) {
    rowData = rowData.toJSON();
    const value = rowData[dataIndex[0]];
    const field = this.findFieldByDataIndex(dataIndex);
    const render = this.getFieldRenderer(field, ctx);

    if (dataIndex.length > 1) {
      const deepValue = deepGet(rowData, dataIndex);

      if (Array.isArray(deepValue)) {
        return deepValue.map(render).join(',');
      }

      return render(deepValue);
    }
    return render(value);
  }

  public generateOutputPath(prefix = 'export', ext = '', destination = os.tmpdir()): string {
    const fileName = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    return path.join(destination, fileName);
  }
}

export { BaseExporter };
