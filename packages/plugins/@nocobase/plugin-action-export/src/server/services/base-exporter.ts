import {
  FindOptions,
  ICollection,
  ICollectionManager,
  IField,
  IModel,
  IRelationField,
} from '@nocobase/data-source-manager';
import EventEmitter from 'events';
import { deepGet } from '../utils/deep-get';
import path from 'path';
import os from 'os';

export type ExportOptions = {
  collectionManager: ICollectionManager;
  collection: ICollection;
  repository?: any;
  fields: Array<Array<string>>;
  findOptions?: FindOptions;
  chunkSize?: number;
  limit?: number;
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

  protected constructor(protected options: T) {
    super();
    this.limit = options.limit ?? (process.env['EXPORT_LIMIT'] ? parseInt(process.env['EXPORT_LIMIT']) : 2000);
  }

  abstract init(ctx?): Promise<void>;
  abstract finalize(): Promise<any>;
  abstract handleRow(row: any, ctx?): Promise<void>;

  async run(ctx?): Promise<any> {
    await this.init(ctx);

    const { collection, chunkSize, repository } = this.options;

    const total = await (repository || collection.repository).count(this.getFindOptions());
    let current = 0;

    await (repository || collection.repository).chunk({
      ...this.getFindOptions(),
      chunkSize: chunkSize || 200,
      callback: async (rows, options) => {
        for (const row of rows) {
          await this.handleRow(row, ctx);
          current += 1;

          this.emit('progress', {
            total,
            current,
          });
        }
      },
    });

    return this.finalize();
  }

  protected getAppendOptionsFromFields() {
    return this.options.fields
      .map((field) => {
        const fieldInstance = this.options.collection.getField(field[0]);
        if (!fieldInstance) {
          throw new Error(`Field "${field[0]}" not found: , please check the fields configuration.`);
        }

        if (fieldInstance.isRelationField()) {
          return field.join('.');
        }

        return null;
      })
      .filter(Boolean);
  }

  protected getFindOptions() {
    const { findOptions = {} } = this.options;

    if (this.limit) {
      findOptions.limit = this.limit;
    }

    const appendOptions = this.getAppendOptionsFromFields();

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
