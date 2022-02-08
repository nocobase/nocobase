import { MagicAttributeModel } from '@nocobase/database';
import { HookType } from './server-hooks';

class UiSchemaModel extends MagicAttributeModel {
  getListenServerHooks(type: HookType) {
    const hooks = this.get('x-server-hooks');
    return hooks[type] || [];
  }
}

export { UiSchemaModel };
