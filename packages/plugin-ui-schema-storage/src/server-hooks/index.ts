import { Database } from '@nocobase/database';
import { UiSchemaModel } from '../model';

export type HookType = 'afterDestroyField';

export class ServerHooks {
  hooks = new Map<HookType, Map<string, any>>();

  constructor(protected db: Database) {
    this.listen();
  }

  listen() {
    this.db.on('fields.afterDestroy', async (model, options) => {
      await this.afterFieldDestroy(model, options);
    });
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
          model: listenSchema,
          transaction,
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
