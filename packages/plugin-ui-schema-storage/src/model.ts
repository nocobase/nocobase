import { MagicAttributeModel } from '@nocobase/database';
import { HookType } from './server-hooks';

class UiSchemaModel extends MagicAttributeModel {
  getServerHooksByType(type: HookType) {
    const hooks = this.get('x-server-hooks') || [];
    return hooks.filter((hook) => hook.type === type);
  }
}

export { UiSchemaModel };
