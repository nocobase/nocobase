import { Database } from '@nocobase/database';
import { UiSchemaModel } from '../model';

export type HookType = 'afterDestroyField' | 'afterDestroyCollection' | 'afterCreateSelf';

export class ServerHooks {
  hooks = new Map<HookType, Map<string, any>>();

  constructor(protected db: Database) {
    this.listen();
  }

  listen() {
    this.db.on('fields.afterDestroy', async (model, options) => {
      await this.afterFieldDestroy(model, options);
    });

    this.db.on('collections.afterDestroy', async (model, options) => {
      await this.afterCollectionDestroy(model, options);
    });

    this.db.on('ui_schemas.afterCreate', async (model, options) => {
      await this.afterUiSchemaCreated(model, options);
    });
  }

  protected async afterUiSchemaCreated(uiSchemaModel, options) {
    const { transaction } = options;
    const listenHooksName = uiSchemaModel.getListenServerHooks('afterCreateSelf');

    for (const listenHookName of listenHooksName) {
      const hookFunc = this.hooks.get('afterCreateSelf')?.get(listenHookName);

      await hookFunc({
        schemaInstance: uiSchemaModel,
        options,
      });
    }
  }

  protected async afterCollectionDestroy(collectionModel, options) {
    const { transaction } = options;

    const collectionPath = collectionModel.get('name');

    const listenSchemas = (await this.db.getRepository('ui_schemas').find({
      filter: {
        'attrs.collectionPath': collectionPath,
      },
      transaction,
    })) as UiSchemaModel[];

    for (const listenSchema of listenSchemas) {
      const listenHooksName = listenSchema.getListenServerHooks('afterDestroyCollection');
      for (const listenHookName of listenHooksName) {
        const hookFunc = this.hooks.get('afterDestroyCollection')?.get(listenHookName);

        await hookFunc({
          collectionInstance: collectionModel,
          schemaInstance: listenSchema,
          options,
        });
      }
    }
  }

  protected async afterFieldDestroy(fieldModel, options) {
    const { transaction } = options;

    const collectionPath = `${fieldModel.get('collectionName')}.${fieldModel.get('name')}`;

    const listenSchemas = (await this.db.getRepository('ui_schemas').find({
      filter: {
        'attrs.collectionPath': collectionPath,
      },
      transaction,
    })) as UiSchemaModel[];

    for (const listenSchema of listenSchemas) {
      const listenHooksName = listenSchema.getListenServerHooks('afterDestroyField');
      for (const listenHookName of listenHooksName) {
        const hookFunc = this.hooks.get('afterDestroyField')?.get(listenHookName);

        await hookFunc({
          fieldInstance: fieldModel,
          schemaInstance: listenSchema,
          options,
        });
      }
    }
  }

  /**
   * register a server hook function
   * @param type type of server hook
   * @param name name of server hook
   * @param hookFunc server hook function
   */
  register(type: HookType, name: string, hookFunc: any) {
    if (!this.hooks.has(type)) {
      this.hooks.set(type, new Map());
    }

    const hookTypeMap = this.hooks.get(type);
    hookTypeMap.set(name, hookFunc);
  }
}
