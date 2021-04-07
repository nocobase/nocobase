import { actions } from '@nocobase/actions';

export function actionParams(options: any = {}) {
  return async (ctx: actions.Context, next: actions.Next) => {
    const { actionName, resourceField, resourceName, fields = {} } = ctx.action.params;
    const table = ctx.db.getTable(resourceField ? resourceField.options.target : resourceName);
    // ctx.state.developerMode = {[Op.not]: null};
    ctx.state.developerMode = false;
    if (table && table.hasField('developerMode') && ctx.state.developerMode === false) {
      ctx.action.mergeParams({ filter: { "developerMode.$isFalsy": true } }, { filter: 'and' });
    }
    if (table && ['get', 'list'].includes(actionName)) {
      const except = [];
      const appends = [];
      for (const [name, field] of table.getFields()) {
        if (field.options.hidden) {
          except.push(field.options.name);
        }
        // if (field.options.appends) {
        //   appends.push(field.options.name);
        // }
      }
      ctx.action.mergeParams({ fields: {
        except,
        appends
      } }, { fields: 'append' });
      // console.log('ctx.action.params.fields', ctx.action.params.fields, except, appends);
    }
    await next();
  }
}
