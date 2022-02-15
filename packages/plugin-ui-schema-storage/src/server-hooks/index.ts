import { Database } from '@nocobase/database';
import { hooks } from './hooks';
import { ServerHookModel } from './model';

export type HookType =
  | 'onSelfDestroy'
  | 'onCollectionDestroy'
  | 'onCollectionFieldDestroy'
  | 'onAnyCollectionFieldDestroy'
  | 'onSelfCreate';

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
    const { transaction } = options;

    const serverHooks = schemaInstance.get('serverHooks') || [];

    const onSelfCreateHooks = serverHooks.filter((serverHook) => serverHook.get('type') === 'onSelfCreate');

    for (const serverHook of onSelfCreateHooks) {
      const hookFunc = this.hooks.get('onSelfCreate')?.get(serverHook.get('method'));
      await hookFunc({
        schemaInstance,
        options,
        db: this.db,
        params: serverHook.get('params'),
      });
    }
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
}
