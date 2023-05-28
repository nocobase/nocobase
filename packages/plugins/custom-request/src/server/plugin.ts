import { InstallOptions, Plugin } from '@nocobase/server';
import { customRequestActions } from './actions';
import { resolve } from 'path';
import { rolesCustomRequestActions } from './actions/rolesCustomRequestAction';
import { enUS, ptBR, zhCN } from '../client/locale';
import { NAME_SPACE } from './actions/utils';

export class CustomRequestPlugin extends Plugin {
  afterAdd() {}

  beforeLoad() {
    this.app.acl.registerSnippet({
      name: `ui.customRequest`,
      actions: ['customRequest:*'],
    });

    this.app.resourcer.define({
      name: 'customRequest',
      actions: customRequestActions,
    });
    this.app.resourcer.define({
      name: 'rolesCustomRequest',
      actions: rolesCustomRequestActions,
    });

    this.app.acl.allow('customRequest', ['get', 'list', 'set', 'send'], 'loggedIn');
    this.app.acl.allow('rolesCustomRequest', ['get', 'set', 'list'], 'loggedIn');
  }

  async load() {
    this.app.i18n.addResources('zh-CN', NAME_SPACE, zhCN);
    this.app.i18n.addResources('en-US', NAME_SPACE, enUS);
    this.app.i18n.addResources('pt-BR', NAME_SPACE, ptBR);

    await this.importCollections(resolve(__dirname, 'collections'));
  }

  async install(options?: InstallOptions) {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default CustomRequestPlugin;
