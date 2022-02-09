import { Database } from '@nocobase/database';
import { ServerHookModel } from './model';

export type HookType =
  | 'onSchemaDestroy'
  | 'onCollectionDestroy'
  | 'onCollectionFieldDestroy'
  | 'onAnyCollectionFieldDestroy'
  | 'onSelfCreate';

export class ServerHooks {
  hooks = new Map<HookType, Map<string, any>>();

  constructor(protected db: Database) {
    this.listen();
  }

  listen() {
    this.db.on('fields.afterDestroy', async (model, options) => {
      await this.onCollectionFieldDestroy(model, options);
      await this.onAnyCollectionFieldDestroy(model, options);
    });

    this.db.on('collections.afterDestroy', async (model, options) => {
      await this.onCollectionDestroy(model, options);
    });

    this.db.on('ui_schemas.afterCreateWithAssociations', async (model, options) => {
      await this.onUiSchemaCreate(model, options);
    });
  }

  protected async onCollectionDestroy(collectionModel, options) {
    const { transaction } = options;

    await this.findHooksAndCall(
      {
        type: 'onCollectionDestroy',
        collection: collectionModel.get('name'),
      },
      {
        collectionModel,
        options,
      },
      transaction,
    );
  }

  protected async onAnyCollectionFieldDestroy(fieldModel, options) {
    const { transaction } = options;
    const collectionName = fieldModel.get('collectionName');

    await this.findHooksAndCall(
      {
        type: 'onAnyCollectionFieldDestroy',
        collection: collectionName,
      },
      {
        fieldInstance: fieldModel,
        options,
      },
      transaction,
    );
  }

  protected async onCollectionFieldDestroy(fieldModel, options) {
    const { transaction } = options;
    const collectionName = fieldModel.get('collectionName');
    const fieldName = fieldModel.get('name');

    await this.findHooksAndCall(
      {
        type: 'onCollectionFieldDestroy',
        collection: collectionName,
        'fields.$anyOf': [fieldName],
      },
      {
        fieldInstance: fieldModel,
        options,
      },
      transaction,
    );
  }

  protected async onUiSchemaCreate(uiSchemaModel, options) {
    const { transaction } = options;

    await this.findHooksAndCall(
      {
        type: 'onSelfCreate',
        uid: uiSchemaModel.schema['x-uid'],
      },
      {
        uiSchemaModel,
        options,
      },
      transaction,
    );
  }

  protected async findHooksAndCall(hooksFilter, hooksArgs, transaction) {
    const hooks = (await this.db.getRepository('uiSchemaServerHooks').find({
      filter: hooksFilter,
      appends: ['uiSchema'],
      transaction,
    })) as ServerHookModel[];

    for (const hookRecord of hooks) {
      const hoodMethodName = hookRecord.get('method') as string;
      const hookFunc = this.hooks.get(hookRecord.get('type') as HookType)?.get(hoodMethodName);

      if (hookFunc) {
        await hookFunc({ ...hooksArgs, schemaInstance: (<any>hookRecord).uiSchema });
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
