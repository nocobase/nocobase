import { Database } from '@nocobase/database';
import { hooks } from './hooks';
import { ServerHookModel } from './model';

export type HookType =
  | 'onSelfDestroy'
  | 'onCollectionDestroy'
  | 'onCollectionFieldDestroy'
  | 'onAnyCollectionFieldDestroy'
  | 'onSelfCreate'
  | 'onSelfSave'
  | 'onSelfMove';

export class ServerHooks {
  hooks = new Map<HookType, Map<string, any>>();

  constructor(protected db: Database) {
    this.listen();
    this.registerHooks();
  }

  registerHooks() {
    hooks.forEach((hook) => this.register(hook.hookType, hook.hookName, hook.hookFunc));
  }

  listen() {
    this.db.on('fields.afterDestroy', async (model, options) => {
      await this.onCollectionFieldDestroy(model, options);
      await this.onAnyCollectionFieldDestroy(model, options);
    });

    this.db.on('collections.afterDestroy', async (model, options) => {
      await this.onCollectionDestroy(model, options);
    });

    this.db.on('uiSchemas.afterCreateWithAssociations', async (model, options) => {
      await this.onUiSchemaCreate(model, options);
    });

    this.db.on('uiSchemaMove', async (model, options) => {
      await this.onUiSchemaMove(model, options);
    });

    this.db.on('uiSchemas.afterSave', async (model, options) => {
      await this.onUiSchemaSave(model, options);
    });
  }

  protected async callSchemaInstanceHooksByType(schemaInstance, options, type: HookType) {
    const { transaction } = options;

    const hooks = schemaInstance.getServerHooksByType(type);

    for (const hook of hooks) {
      const hookFunc = this.hooks.get(type)?.get(hook['method']);
      await hookFunc?.({
        schemaInstance,
        options,
        db: this.db,
        params: hook['params'],
      });
    }
  }

  protected async onUiSchemaMove(schemaInstance, options) {
    await this.callSchemaInstanceHooksByType(schemaInstance, options, 'onSelfMove');
  }

  protected async onCollectionDestroy(collectionModel, options) {
    const { transaction } = options;

    await this.findHooksAndCall(
      {
        type: 'onCollectionDestroy',
        collection: collectionModel.get('name'),
      },
      {
        collectionInstance: collectionModel,
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
        collectionFieldInstance: fieldModel,
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
        field: fieldName,
      },
      {
        collectionFieldInstance: fieldModel,
        options,
      },
      transaction,
    );
  }

  protected async onUiSchemaCreate(schemaInstance, options) {
    await this.callSchemaInstanceHooksByType(schemaInstance, options, 'onSelfCreate');
  }

  protected async onUiSchemaSave(schemaInstance, options) {
    await this.callSchemaInstanceHooksByType(schemaInstance, options, 'onSelfSave');
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
        await hookFunc({
          ...hooksArgs,
          schemaInstance: (<any>hookRecord).uiSchema,
          db: this.db,
          params: hookRecord.get('params'),
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

  remove(type: HookType, name: string) {
    if (!this.hooks.has(type)) {
      return;
    }

    const hookTypeMap = this.hooks.get(type);
    hookTypeMap.delete(name);
  }
}
