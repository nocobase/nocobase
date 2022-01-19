import path from 'path';
import { Plugin } from '@nocobase/server';
import { CollectionModel } from './models/collection';
import { FieldModel } from './models/field';
import { uid } from '@nocobase/utils';
import beforeInitOptions from './hooks/beforeInitOptions';
import { beforeCreateForChildrenCollection } from './hooks/beforeCreateForChildrenCollection';
import { beforeCreateForReverseField } from './hooks/beforeCreateForReverseField';
import { afterCreateForReverseField } from './hooks/afterCreateForReverseField';

export default class CollectionManagerPlugin extends Plugin {
  async load() {
    this.app.db.registerModels({
      CollectionModel,
      FieldModel,
    });
    await this.app.db.import({
      directory: path.resolve(__dirname, './collections'),
    });
    // 要在 beforeInitOptions 之前处理
    this.app.db.on('fields.beforeCreate', beforeCreateForReverseField(this.app.db));
    this.app.db.on('fields.beforeCreate', beforeCreateForChildrenCollection(this.app.db));
    this.app.db.on('fields.beforeCreate', async (model, options) => {
      const type = model.get('type');
      await this.app.db.emitAsync(`fields.${type}.beforeInitOptions`, model, options);
    });
    for (const key in beforeInitOptions) {
      if (Object.prototype.hasOwnProperty.call(beforeInitOptions, key)) {
        const fn = beforeInitOptions[key];
        this.app.db.on(`fields.${key}.beforeInitOptions`, fn);
      }
    }
    this.app.db.on('fields.afterCreate', afterCreateForReverseField(this.app.db));
    this.app.db.on('collections.afterCreate', async (model, options) => {
      if (options.context) {
        await model.migrate();
      }
    });
    this.app.db.on('fields.afterCreate', async (model, options) => {
      if (options.context) {
        await model.migrate();
      }
    });
  }
}
