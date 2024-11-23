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

export type ExportOptions = {
  collectionManager: ICollectionManager;
  collection: ICollection;
  repository?: any;
  fields: Array<Array<string>>;
  findOptions?: FindOptions;
  chunkSize?: number;
};

abstract class BaseExporter<T extends ExportOptions = ExportOptions> extends EventEmitter {
  limit = 0;

  protected constructor(protected options: T) {
    super();
  }

  abstract init(ctx?): Promise<void>;
  abstract finalize(): Promise<any>;
  abstract addRows(rows: Array<any>, ctx?): Promise<void>;

  async run(ctx?): Promise<any> {
    await this.init(ctx);

    const { collection, chunkSize, repository } = this.options;

    const total = await (repository || collection.repository).count(this.getFindOptions());
    let current = 0;

    await (repository || collection.repository).chunk({
      ...this.getFindOptions(),
      chunkSize: chunkSize || 200,
      callback: async (rows, options) => {
        await this.addRows(rows, ctx);

        current += rows.length;

        this.emit('progress', {
          total,
          current,
        });
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
}

export { BaseExporter };
