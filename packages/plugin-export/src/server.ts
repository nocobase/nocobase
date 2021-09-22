import { PluginOptions } from '@nocobase/server';
import _export from './actions/export';

export const ACTION_NAME_EXPORT = 'export';

export default {
  name: 'export',
  async load() {
    const resourcer = this.app.resourcer;
    resourcer.registerActionHandler(ACTION_NAME_EXPORT, _export);
    // // TODO(temp): 继承 list 权限的临时写法
    // resourcer.use(async (ctx, next) => {
    //   if (ctx.action.params.actionName === ACTION_NAME_EXPORT) {
    //     ctx.action.mergeParams({
    //       actionName: 'list'
    //     });
  
    //     console.log('action name in export has been rewritten to:', ctx.action.params.actionName);
  
    //     const permissionPlugin = ctx.app.getPluginInstance('@nocobase/plugin-permissions');
    //     if (permissionPlugin) {
    //       return permissionPlugin.middleware(ctx, next);
    //     }
    //   }
  
    //   await next();
    // });
  }
} as PluginOptions;
