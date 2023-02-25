import { NoPermissionError } from '@nocobase/acl';
import { Context, utils as actionUtils } from '@nocobase/actions';
import { Collection, RelationField, snakeCase } from '@nocobase/database';
import { Plugin } from '@nocobase/server';
import lodash from 'lodash';
import { resolve } from 'path';
import { availableActionResource } from './actions/available-actions';
import { checkAction } from './actions/role-check';
import { roleCollectionsResource } from './actions/role-collections';
import { setDefaultRole } from './actions/user-setDefaultRole';
import { setCurrentRole } from './middlewares/setCurrentRole';
import { RoleModel } from './model/RoleModel';
import { RoleResourceActionModel } from './model/RoleResourceActionModel';
import { RoleResourceModel } from './model/RoleResourceModel';

export interface AssociationFieldAction {
  associationActions: string[];
  targetActions?: string[];
}

interface AssociationFieldActions {
  [availableActionName: string]: AssociationFieldAction;
}

export interface AssociationFieldsActions {
  [associationType: string]: AssociationFieldActions;
}

export class GrantHelper {
  resourceTargetActionMap = new Map<string, string[]>();
  targetActionResourceMap = new Map<string, string[]>();

  constructor() {}
}

export class PluginACL extends Plugin {
  // association field actions config

  associationFieldsActions: AssociationFieldsActions = {};

  grantHelper = new GrantHelper();

  get acl() {
    return this.app.acl;
  }

  registerAssociationFieldAction(associationType: string, value: AssociationFieldActions) {
    this.associationFieldsActions[associationType] = value;
  }

  registerAssociationFieldsActions() {
    // if grant create action to role, it should
    // also grant add action and association target's view action

    this.registerAssociationFieldAction('hasOne', {
      view: {
        associationActions: ['list', 'get', 'view'],
      },
      create: {
        associationActions: ['create', 'set'],
      },
      update: {
        associationActions: ['update', 'remove', 'set'],
      },
    });

    this.registerAssociationFieldAction('hasMany', {
      view: {
        associationActions: ['list', 'get', 'view'],
      },
      create: {
        associationActions: ['create', 'set', 'add'],
      },
      update: {
        associationActions: ['update', 'remove', 'set'],
      },
    });

    this.registerAssociationFieldAction('belongsTo', {
      view: {
        associationActions: ['list', 'get', 'view'],
      },
      create: {
        associationActions: ['create', 'set'],
      },
      update: {
        associationActions: ['update', 'remove', 'set'],
      },
    });

    this.registerAssociationFieldAction('belongsToMany', {
      view: {
        associationActions: ['list', 'get', 'view'],
      },
      create: {
        associationActions: ['create', 'set', 'add'],
      },
      update: {
        associationActions: ['update', 'remove', 'set', 'toggle'],
      },
    });
  }

  async writeResourceToACL(resourceModel: RoleResourceModel, transaction) {
    await resourceModel.writeToACL({
      acl: this.acl,
      associationFieldsActions: this.associationFieldsActions,
      transaction: transaction,
      grantHelper: this.grantHelper,
    });
  }

  async writeActionToACL(actionModel: RoleResourceActionModel, transaction) {
    const resource = actionModel.get('resource') as RoleResourceModel;
    const role = this.acl.getRole(resource.get('roleName') as string);
    await actionModel.writeToACL({
      acl: this.acl,
      role,
      resourceName: resource.get('name') as string,
      associationFieldsActions: this.associationFieldsActions,
      grantHelper: this.grantHelper,
    });
  }

  async writeRolesToACL() {
    const roles = (await this.app.db.getRepository('roles').find({
      appends: ['resources', 'resources.actions'],
    })) as RoleModel[];

    for (const role of roles) {
      role.writeToAcl({ acl: this.acl });
      for (const resource of role.get('resources') as RoleResourceModel[]) {
        await this.writeResourceToACL(resource, null);
      }
    }
  }

  async beforeLoad() {
    this.db.addMigrations({
      namespace: this.name,
      directory: resolve(__dirname, './migrations'),
      context: {
        plugin: this,
      },
    });

    this.app.db.registerModels({
      RoleResourceActionModel,
      RoleResourceModel,
      RoleModel,
    });

    this.app.acl.registerSnippet({
      name: `pm.${this.name}.roles`,
      actions: [
        'roles:*',
        'roles.snippets:*',
        'availableActions:list',
        'roles.collections:list',
        'roles.resources:*',
        'uiSchemas:getProperties',
        'roles.menuUiSchemas:*',
      ],
    });

    // change resource fields to association fields
    this.app.acl.beforeGrantAction((ctx) => {
      const actionName = this.app.acl.resolveActionAlias(ctx.actionName);
      const collection = this.app.db.getCollection(ctx.resourceName);

      if (!collection) {
        return;
      }

      const fieldsParams = ctx.params.fields;

      if (!fieldsParams) {
        return;
      }

      if (actionName == 'view' || actionName == 'export') {
        const associationsFields = fieldsParams.filter((fieldName) => {
          const field = collection.getField(fieldName);
          return field instanceof RelationField;
        });

        ctx.params = {
          ...ctx.params,
          fields: lodash.difference(fieldsParams, associationsFields),
          appends: associationsFields,
        };
      }
    });

    this.registerAssociationFieldsActions();

    this.app.resourcer.define(availableActionResource);
    this.app.resourcer.define(roleCollectionsResource);

    this.app.resourcer.registerActionHandler('roles:check', checkAction);

    this.app.resourcer.registerActionHandler(`users:setDefaultRole`, setDefaultRole);

    this.db.on('users.afterCreateWithAssociations', async (model, options) => {
      const { transaction } = options;
      const repository = this.app.db.getRepository('roles');
      const defaultRole = await repository.findOne({
        filter: {
          default: true,
        },
        transaction,
      });

      if (defaultRole && (await model.countRoles({ transaction })) == 0) {
        await model.addRoles(defaultRole, { transaction });
      }
    });

    this.app.db.on('roles.afterSaveWithAssociations', async (model, options) => {
      const { transaction } = options;

      model.writeToAcl({
        acl: this.acl,
      });

      for (const resource of (await model.getResources({ transaction })) as RoleResourceModel[]) {
        await this.writeResourceToACL(resource, transaction);
      }

      // model is default
      if (model.get('default')) {
        await this.app.db.getRepository('roles').update({
          values: {
            default: false,
          },
          filter: {
            'name.$ne': model.get('name'),
          },
          hooks: false,
          transaction,
        });
      }
    });

    this.app.db.on('roles.afterDestroy', (model) => {
      const roleName = model.get('name');
      this.acl.removeRole(roleName);
    });

    this.app.db.on('rolesResources.afterSaveWithAssociations', async (model: RoleResourceModel, options) => {
      await this.writeResourceToACL(model, options.transaction);
    });

    this.app.db.on('rolesResourcesActions.afterUpdateWithAssociations', async (model, options) => {
      const { transaction } = options;
      const resource = await model.getResource({
        transaction,
      });

      await this.writeResourceToACL(resource, transaction);
    });

    this.app.db.on('rolesResources.afterDestroy', async (model, options) => {
      const role = this.acl.getRole(model.get('roleName'));

      if (role) {
        role.revokeResource(model.get('name'));
      }
    });

    this.app.db.on('collections.afterDestroy', async (model, options) => {
      const { transaction } = options;
      await this.app.db.getRepository('rolesResources').destroy({
        filter: {
          name: model.get('name'),
        },
        transaction,
      });
    });

    this.app.db.on('fields.afterCreate', async (model, options) => {
      const { transaction } = options;

      const collectionName = model.get('collectionName');

      const fieldName = model.get('name');

      const resourceActions = (await this.app.db.getRepository('rolesResourcesActions').find({
        filter: {
          'resource.name': collectionName,
        },
        transaction,
        appends: ['resource'],
      })) as RoleResourceActionModel[];

      for (const resourceAction of resourceActions) {
        const fields = resourceAction.get('fields') as string[];
        const newFields = [...fields, fieldName];

        await this.app.db.getRepository('rolesResourcesActions').update({
          filterByTk: resourceAction.get('id') as number,
          values: {
            fields: newFields,
          },
          transaction,
        });
      }
    });

    this.app.db.on('fields.afterDestroy', async (model, options) => {
      const collectionName = model.get('collectionName');
      const fieldName = model.get('name');

      const resourceActions = await this.app.db.getRepository('rolesResourcesActions').find({
        filter: {
          'resource.name': collectionName,
          'fields.$anyOf': [fieldName],
        },
        transaction: options.transaction,
      });

      for (const resourceAction of resourceActions) {
        const fields = resourceAction.get('fields') as string[];
        const newFields = fields.filter((field) => field != fieldName);

        await this.app.db.getRepository('rolesResourcesActions').update({
          filterByTk: resourceAction.get('id') as number,
          values: {
            fields: newFields,
          },
          transaction: options.transaction,
        });
      }
    });

    // sync database role data to acl
    this.app.on('afterLoad', async (app, options) => {
      if (options?.method === 'install' || options?.method === 'upgrade') {
        return;
      }
      const exists = await this.app.db.collectionExistsInDb('roles');
      if (exists) {
        await this.writeRolesToACL();
      }
    });

    this.app.on('afterInstall', async (app, options) => {
      const exists = await this.app.db.collectionExistsInDb('roles');
      if (exists) {
        await this.writeRolesToACL();
      }
    });

    this.app.on('afterInstallPlugin', async (plugin) => {
      if (plugin.getName() !== 'users') {
        return;
      }
      const User = this.db.getCollection('users');
      await User.repository.update({
        values: {
          roles: ['root', 'admin', 'member'],
        },
        forceUpdate: true,
      });

      const RolesUsers = this.db.getCollection('rolesUsers');
      await RolesUsers.repository.update({
        filter: {
          userId: 1,
          roleName: 'root',
        },
        values: {
          default: true,
        },
      });
    });

    this.app.on('beforeInstallPlugin', async (plugin) => {
      if (plugin.getName() !== 'users') {
        return;
      }
      const roles = this.app.db.getRepository('roles');
      await roles.createMany({
        records: [
          {
            name: 'root',
            title: '{{t("Root")}}',
            hidden: true,
            snippets: ['ui.*', 'pm', 'pm.*'],
          },
          {
            name: 'admin',
            title: '{{t("Admin")}}',
            allowConfigure: true,
            allowNewMenu: true,
            strategy: { actions: ['create', 'view', 'update', 'destroy'] },
            snippets: ['ui.*', 'pm', 'pm.*'],
          },
          {
            name: 'member',
            title: '{{t("Member")}}',
            allowNewMenu: true,
            strategy: { actions: ['view', 'update:own', 'destroy:own', 'create'] },
            default: true,
            snippets: ['!ui.*', '!pm', '!pm.*'],
          },
        ],
      });
      const rolesResourcesScopes = this.app.db.getRepository('rolesResourcesScopes');
      await rolesResourcesScopes.createMany({
        records: [
          {
            key: 'all',
            name: '{{t("All records")}}',
            scope: {},
          },
          {
            key: 'own',
            name: '{{t("Own records")}}',
            scope: {
              createdById: '{{ ctx.state.currentUser.id }}',
            },
          },
        ],
      });
    });

    this.app.resourcer.use(setCurrentRole, { tag: 'setCurrentRole', before: 'acl', after: 'parseToken' });

    this.app.acl.allow('users', 'setDefaultRole', 'loggedIn');
    this.app.acl.allow('roles', 'check', 'loggedIn');

    this.app.acl.allow('*', '*', (ctx) => {
      return ctx.state.currentRole === 'root';
    });

    this.app.acl.addFixedParams('collections', 'destroy', () => {
      return {
        filter: {
          $and: [{ 'name.$ne': 'roles' }, { 'name.$ne': 'rolesUsers' }],
        },
      };
    });

    this.app.acl.addFixedParams('rolesResourcesScopes', 'destroy', () => {
      return {
        filter: {
          $and: [{ 'key.$ne': 'all' }, { 'key.$ne': 'own' }],
        },
      };
    });

    this.app.acl.addFixedParams('rolesResourcesScopes', 'update', () => {
      return {
        filter: {
          $and: [{ 'key.$ne': 'all' }, { 'key.$ne': 'own' }],
        },
      };
    });

    this.app.acl.addFixedParams('roles', 'destroy', () => {
      return {
        filter: {
          $and: [{ 'name.$ne': 'root' }, { 'name.$ne': 'admin' }, { 'name.$ne': 'member' }],
        },
      };
    });

    this.app.resourcer.use(async (ctx, next) => {
      const { actionName, resourceName, params } = ctx.action;
      const { showAnonymous } = params || {};
      if (actionName === 'list' && resourceName === 'roles') {
        if (!showAnonymous) {
          ctx.action.mergeParams({
            filter: {
              'name.$ne': 'anonymous',
            },
          });
        }
      }

      if (actionName === 'update' && resourceName === 'roles.resources') {
        ctx.action.mergeParams({
          updateAssociationValues: ['actions'],
        });
      }

      await next();
    });

    this.app.acl.use(async (ctx: Context, next) => {
      const { actionName, resourceName } = ctx.action;
      if (actionName === 'get' || actionName === 'list') {
        if (!Array.isArray(ctx?.permission?.can?.params?.fields)) {
          return next();
        }
        let collection: Collection;
        if (resourceName.includes('.')) {
          const [collectionName, associationName] = resourceName.split('.');
          const field = ctx.db.getCollection(collectionName)?.getField?.(associationName);
          if (field.target) {
            collection = ctx.db.getCollection(field.target);
          }
        } else {
          collection = ctx.db.getCollection(resourceName);
        }

        if (collection && collection.hasField('createdById')) {
          ctx.permission.can.params.fields.push('createdById');
        }
      }
      return next();
    });

    const parseJsonTemplate = this.app.acl.parseJsonTemplate;

    this.app.acl.use(
      async (ctx: Context, next) => {
        const { actionName, resourceName, resourceOf } = ctx.action;
        // is association request
        if (resourceName.includes('.') && resourceOf) {
          if (!ctx?.permission?.can?.params) {
            return next();
          }
          // 关联数据去掉 filter
          delete ctx.permission.can.params.filter;
          // 关联数据能不能处理取决于 source 是否有权限
          const [collectionName] = resourceName.split('.');
          const action = ctx.can({ resource: collectionName, action: actionName });

          const availableAction = this.app.acl.getAvailableAction(actionName);

          if (availableAction?.options?.onNewRecord) {
            if (action) {
              ctx.permission.skip = true;
            } else {
              ctx.permission.can = false;
            }
          } else {
            const filter = parseJsonTemplate(action?.params?.filter || {}, ctx);
            const sourceInstance = await ctx.db.getRepository(collectionName).findOne({
              filterByTk: resourceOf,
              filter,
            });
            if (!sourceInstance) {
              ctx.permission.can = false;
            }
          }
        }
        await next();
      },
      {
        before: 'core',
      },
    );

    // throw error when user has no fixed params permissions
    this.app.acl.use(
      async (ctx: any, next) => {
        const action = ctx.permission?.can?.action;

        if (action == 'destroy' && !ctx.action.resourceName.includes('.')) {
          const repository = actionUtils.getRepositoryFromParams(ctx);

          // params after merge with fixed params
          const filteredCount = await repository.count(ctx.permission.mergedParams);

          // params user requested
          const queryCount = await repository.count(ctx.permission.rawParams);

          if (queryCount > filteredCount) {
            ctx.throw(403, 'No permissions');
            return;
          }
        }

        await next();
      },
      {
        after: 'core',
        group: 'after',
      },
    );

    const withACLMeta = async (ctx: any, next) => {
      await next();

      if (!ctx.action) {
        return;
      }

      const { resourceName, actionName } = ctx.action;

      if (!ctx.get('X-With-ACL-Meta')) {
        return;
      }

      if (ctx.status !== 200) {
        return;
      }

      if (!['list', 'get'].includes(actionName)) {
        return;
      }

      const collection = ctx.db.getCollection(resourceName);

      if (!collection) {
        return;
      }

      const Model = collection.model;

      const primaryKeyField = Model.primaryKeyField || Model.primaryKeyAttribute;

      const dataPath = ctx.body?.rows ? 'body.rows' : 'body';
      let listData = lodash.get(ctx, dataPath);

      if (actionName == 'get') {
        listData = lodash.castArray(listData);
      }

      const actions = ['view', 'update', 'destroy'];

      const actionsParams = [];

      for (const action of actions) {
        const actionCtx: any = {
          db: ctx.db,
          action: {
            actionName: action,
            name: action,
            params: {},
            resourceName: ctx.action.resourceName,
            resourceOf: ctx.action.resourceOf,
            mergeParams() {},
          },
          state: {
            currentRole: ctx.state.currentRole,
            currentUser: (() => {
              if (!ctx.state.currentUser) {
                return null;
              }
              if (ctx.state.currentUser.toJSON) {
                return ctx.state.currentUser?.toJSON();
              }

              return ctx.state.currentUser;
            })(),
          },
          permission: {},
          throw(...args) {
            throw new NoPermissionError(...args);
          },
        };

        try {
          await this.app.acl.getActionParams(actionCtx);
        } catch (e) {
          if (e instanceof NoPermissionError) {
            continue;
          }

          throw e;
        }

        actionsParams.push([
          action,
          actionCtx.permission?.can === null && !actionCtx.permission.skip
            ? null
            : actionCtx.permission?.parsedParams || {},
          actionCtx,
        ]);
      }

      const ids = (() => {
        if (collection.options.tree) {
          if (listData.length == 0) return [];
          const getAllNodeIds = (data) => [data[primaryKeyField], ...(data.children || []).flatMap(getAllNodeIds)];
          return listData.map((tree) => getAllNodeIds(tree.toJSON())).flat();
        }

        return listData.map((item) => item[primaryKeyField]);
      })();

      const conditions = [];

      const allAllowed = [];

      for (const [action, params, actionCtx] of actionsParams) {
        if (!params) {
          continue;
        }

        if (lodash.isEmpty(params) || lodash.isEmpty(params.filter)) {
          allAllowed.push(action);
          continue;
        }

        const queryParams = collection.repository.buildQueryOptions({
          ...params,
          context: actionCtx,
        });

        const actionSql = ctx.db.sequelize.queryInterface.queryGenerator.selectQuery(
          Model.getTableName(),
          {
            where: (() => {
              const filterObj = queryParams.where;
              if (!this.db.options.underscored) {
                return filterObj;
              }

              const iterate = (rootObj, path = []) => {
                const obj = path.length == 0 ? rootObj : lodash.get(rootObj, path);

                if (Array.isArray(obj)) {
                  for (let i = 0; i < obj.length; i++) {
                    if (obj[i] === null) {
                      continue;
                    }

                    if (typeof obj[i] === 'object') {
                      iterate(rootObj, [...path, i]);
                    }
                  }

                  return;
                }

                Reflect.ownKeys(obj).forEach((key) => {
                  if (Array.isArray(obj) && key == 'length') {
                    return;
                  }

                  if ((typeof obj[key] === 'object' && obj[key] !== null) || typeof obj[key] === 'symbol') {
                    iterate(rootObj, [...path, key]);
                  }

                  if (typeof key === 'string' && key !== snakeCase(key)) {
                    lodash.set(rootObj, [...path, snakeCase(key)], lodash.cloneDeep(obj[key]));
                    lodash.unset(rootObj, [...path, key]);
                  }
                });
              };

              iterate(filterObj);

              return filterObj;
            })(),
            attributes: [primaryKeyField],
            includeIgnoreAttributes: false,
          },
          Model,
        );

        const whereCase = actionSql.match(/WHERE (.*?);/)[1];

        conditions.push({
          whereCase,
          action,
          include: queryParams.include,
        });
      }

      const results = await collection.model.findAll({
        where: {
          [primaryKeyField]: ids,
        },
        attributes: [
          primaryKeyField,
          ...conditions.map((condition) => {
            return [ctx.db.sequelize.literal(`CASE WHEN ${condition.whereCase} THEN 1 ELSE 0 END`), condition.action];
          }),
        ],
        include: conditions.map((condition) => condition.include).flat(),
      });

      const allowedActions = actions
        .map((action) => {
          if (allAllowed.includes(action)) {
            return [action, ids];
          }

          return [action, results.filter((item) => Boolean(item.get(action))).map((item) => item.get(primaryKeyField))];
        })
        .reduce((acc, [action, ids]) => {
          acc[action] = ids;
          return acc;
        }, {});

      if (actionName == 'get') {
        ctx.bodyMeta = {
          ...(ctx.bodyMeta || {}),
          allowedActions: allowedActions,
        };
      }

      if (actionName == 'list') {
        ctx.body.allowedActions = allowedActions;
      }
    };

    // append allowedActions to list & get response
    this.app.use(
      async (ctx, next) => {
        try {
          await withACLMeta(ctx, next);
        } catch (error) {
          ctx.logger.error(error);
        }
      },
      { after: 'restApi', group: 'after' },
    );
  }

  async install() {
    const repo = this.db.getRepository<any>('collections');
    if (repo) {
      await repo.db2cm('roles');
    }
  }

  async load() {
    await this.importCollections(resolve(__dirname, 'collections'));
    this.db.extendCollection({
      name: 'rolesUischemas',
      namespace: 'acl',
      duplicator: 'required',
    });
  }
}

export default PluginACL;
