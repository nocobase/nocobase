import { PasswordField } from '@nocobase/database';
import { UiSchemaRepository } from '@nocobase/plugin-ui-schema-storage';
import { Plugin } from '@nocobase/server';

class PasswordError extends Error {}

export class PluginPublicFormsServer extends Plugin {
  // TODO
  async getMetaByTk(filterByTk: string, options: { password?: string; token?: string }) {
    const { token, password } = options;
    const publicForms = this.db.getRepository('publicForms');
    const uiSchema = this.db.getRepository<UiSchemaRepository>('uiSchemas');
    const instance = await publicForms.findOne({
      filter: {
        key: filterByTk,
      },
    });
    if (!token) {
      if (instance.get('password')) {
        const Password = publicForms.collection.getField<PasswordField>('password');
        const r = await Password.verify(password, instance.get('password'));
        if (!r) {
          throw new PasswordError('Please enter your password');
        }
      }
    }
    const keys = instance.collection.split('.');
    const collectionName = keys.pop();
    const dataSourceKey = keys.pop() || 'main';
    let schema = {};

    const tableName = instance.get('collection');
    const enabledName = instance.get('enabled');
    const tableForms = this.db.getRepository('fields');
    const tableList = await tableForms.find({
      filter: {
        collectionName: tableName,
      },
    });
    const fields = [];
    if (enabledName) {
      tableList.map((item) => {
        fields.push({
          ...item.dataValues,
          uiSchema: item.dataValues.options.uiSchema,
        });
      });
      schema = await uiSchema.getJsonSchema(filterByTk);
    }

    return {
      dataSource: {
        key: dataSourceKey,
        displayName: dataSourceKey,
        collections: [
          {
            name: tableName,
            // fields: [
            //   {
            //     key: '9nlc0hg2yw3',
            //     name: 'id',
            //     type: 'bigInt',
            //     interface: 'id',
            //     description: null,
            //     collectionName: 'users',
            //     parentKey: null,
            //     reverseKey: null,
            //     uiSchema: {
            //       type: 'number',
            //       title: '{{t("ID")}}',
            //       'x-component': 'InputNumber',
            //       'x-read-pretty': true,
            //     },
            //     allowNull: false,
            //     primaryKey: true,
            //     autoIncrement: true,
            //   },
            //   {
            //     key: '7wkjj2n3ngj',
            //     name: 'nickname',
            //     type: 'string',
            //     interface: 'input',
            //     description: null,
            //     collectionName: 'users',
            //     parentKey: null,
            //     reverseKey: null,
            //     uiSchema: {
            //       type: 'string',
            //       title: '{{t("Nickname")}}',
            //       'x-component': 'Input',
            //     },
            //   },
            //   {
            //     key: 'js94s37qyzg',
            //     name: 'username',
            //     type: 'string',
            //     interface: 'input',
            //     description: null,
            //     collectionName: 'users',
            //     parentKey: null,
            //     reverseKey: null,
            //     unique: true,
            //     uiSchema: {
            //       type: 'string',
            //       title: '{{t("Username")}}',
            //       required: true,
            //       'x-component': 'Input',
            //       'x-validator': {
            //         username: true,
            //       },
            //     },
            //   },
            //   {
            //     key: 'uj0pbokt8o9',
            //     name: 'email',
            //     type: 'string',
            //     interface: 'email',
            //     description: null,
            //     collectionName: 'users',
            //     parentKey: null,
            //     reverseKey: null,
            //     unique: true,
            //     uiSchema: {
            //       type: 'string',
            //       title: '{{t("Email")}}',
            //       required: true,
            //       'x-component': 'Input',
            //       'x-validator': 'email',
            //     },
            //   },
            //   {
            //     key: 'rdhnp68luwv',
            //     name: 'phone',
            //     type: 'string',
            //     interface: 'input',
            //     description: null,
            //     collectionName: 'users',
            //     parentKey: null,
            //     reverseKey: null,
            //     unique: true,
            //     uiSchema: {
            //       type: 'string',
            //       title: '{{t("Phone")}}',
            //       required: true,
            //       'x-component': 'Input',
            //     },
            //   },
            //   {
            //     key: 'lhhaalru7om',
            //     name: 'password',
            //     type: 'password',
            //     interface: 'password',
            //     description: null,
            //     collectionName: 'users',
            //     parentKey: null,
            //     reverseKey: null,
            //     hidden: true,
            //     uiSchema: {
            //       type: 'string',
            //       title: '{{t("Password")}}',
            //       'x-component': 'Password',
            //     },
            //   },
            // ],
            fields,
          },
        ],
      },
      token: this.app.authManager.jwt.sign({
        // todo
      }),
      schema,
    };
  }

  // TODO
  getPublicFormsMeta = async (ctx, next) => {
    const token = ctx.get('X-Form-Token');
    const { filterByTk, password } = ctx.action.params;
    try {
      ctx.body = await this.getMetaByTk(filterByTk, { password, token });
    } catch (error) {
      if (error instanceof PasswordError) {
        ctx.throw(401, error.message);
      } else {
        throw error;
      }
    }
    await next();
  };

  // TODO
  parseToken = async (ctx, next) => {
    if (!ctx.action) {
      return next();
    }
    const { actionName, resourceName, params } = ctx.action;
    // 有密码时，跳过 token
    if (resourceName === 'publicForms' && actionName === 'getMeta' && params.password) {
      return next();
    }
    const jwt = this.app.authManager.jwt;
    const token = ctx.get('X-Form-Token');
    if (token) {
      try {
        // TODO：decode token
        ctx.PublicForm = {};
        // 将 publicSubmit 转为 create（用于触发工作流的 Action 事件）
        const actionName = ctx.action.actionName;
        if (actionName === 'publicSubmit') {
          ctx.action.actionName = 'create';
        }
      } catch (error) {
        ctx.throw(401, error.message);
      }
    }
    await next();
  };

  // TODO：用于处理哪些可选项的接口可以访问
  parseACL = async (ctx, next) => {
    if (ctx.PublicForm) {
      ctx.permission = {
        skip: true,
      };
    }
    await next();
  };

  getEnabled = async (ctx, next) => {
    const publicForms = this.db.getRepository('publicForms');
    const instance = await publicForms.findOne({
      filter: {
        key: ctx.action.params.values.filterByTk,
      },
    });
    ctx.body = {
      instance: instance,
    };
    await next();
  };
  setEnabled = async (ctx, next) => {
    const publicForms = this.db.getRepository('publicForms');
    const instance = await publicForms.update({
      filter: {
        key: ctx.action.params.values.filterByTk,
      },
      values: {
        enabled: ctx.action.params.values.enabled,
      },
    });
    ctx.body = {
      message: 'success',
    };
    await next();
  };
  setPassword = async (ctx, next) => {
    const publicForms = this.db.getRepository('publicForms');
    const instance = await publicForms.update({
      filter: {
        key: ctx.action.params.values.filterByTk,
      },
      values: {
        password: ctx.action.params.values.password ? ctx.action.params.values.password : '',
      },
    });
    ctx.body = {
      message: 'success',
    };
    await next();
  };

  async load() {
    this.app.acl.allow('publicForms', 'getMeta', 'public');
    this.app.acl.allow('publicForms', 'setEnabled');
    this.app.resourceManager.registerActionHandlers({
      'publicForms:getMeta': this.getPublicFormsMeta,
    });
    this.app.resourceManager.registerActionHandlers({
      'publicForms:setEnabled': this.setEnabled,
      'publicForms:getEnabled': this.getEnabled,
      'publicForms:setPassword': this.setPassword,
    });

    this.app.dataSourceManager.afterAddDataSource((dataSource) => {
      dataSource.resourceManager.use(this.parseToken, {
        before: 'acl',
      });
      dataSource.acl.use(this.parseACL, {
        before: 'core',
      });
      dataSource.resourceManager.registerActionHandlers({
        publicSubmit: dataSource.resourceManager.getRegisteredHandler('create'),
      });
    });
  }

  async install() {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default PluginPublicFormsServer;
