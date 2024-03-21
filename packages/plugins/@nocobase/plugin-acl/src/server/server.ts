import { Context, utils as actionUtils } from '@nocobase/actions';
import { Cache } from '@nocobase/cache';
import { Collection, RelationField } from '@nocobase/database';
import { Plugin } from '@nocobase/server';
import { Mutex } from 'async-mutex';
import lodash from 'lodash';
import { resolve } from 'path';
import { availableActionResource } from './actions/available-actions';
import { checkAction } from './actions/role-check';
import { roleCollectionsResource } from './actions/role-collections';
import { setDefaultRole } from './actions/user-setDefaultRole';
import { setCurrentRole } from './middlewares/setCurrentRole';
import { createWithACLMetaMiddleware } from './middlewares/with-acl-meta';
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

  async writeRolesToACL(options) {
    const roles = (await this.app.db.getRepository('roles').find({
      appends: ['resources', 'resources.actions'],
    })) as RoleModel[];

    for (const role of roles) {
      await this.writeRoleToACL(role, options);
    }
  }

  async writeRoleToACL(role: RoleModel, options: any = {}) {
    const transaction = options?.transaction;

    role.writeToAcl({ acl: this.acl, withOutStrategy: true });

    if (options.withOutResources) {
      return;
    }

    let resources = role.get('resources') as RoleResourceModel[];

    if (!resources) {
      resources = await role.getResources({ transaction });
    }

    for (const resource of resources as RoleResourceModel[]) {
      await this.writeResourceToACL(resource, transaction);
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
        'roles.users:*',
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

    this.app.on('acl:writeRoleToACL', async (roleModel: RoleModel) => {
      await this.writeRoleToACL(roleModel, {
        withOutResources: true,
      });

      await this.app.db.getRepository('dataSourcesRoles').updateOrCreate({
        values: {
          roleName: roleModel.get('name'),
          dataSourceKey: 'main',
          strategy: roleModel.get('strategy'),
        },
        filterKeys: ['roleName', 'dataSourceKey'],
      });
    });

    this.app.db.on('roles.afterSaveWithAssociations', async (model, options) => {
      const { transaction } = options;

      await this.writeRoleToACL(model, {
        withOutResources: true,
      });

      // this will update or create a record in dataSourcesRoles
      await this.app.db.getRepository('dataSourcesRoles').updateOrCreate({
        values: {
          roleName: model.get('name'),
          dataSourceKey: 'main',
          strategy: model.get('strategy'),
        },
        filterKeys: ['roleName', 'dataSourceKey'],
        transaction,
      });

      await this.app.emitAsync('acl:writeResources', {
        roleName: model.get('name'),
        transaction,
      });

      //  role is default
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

    this.app.db.on('collections.afterDestroy', async (model, options) => {
      const { transaction } = options;
      await this.app.db.getRepository('dataSourcesRolesResources').destroy({
        filter: {
          name: model.get('name'),
          dataSourceKey: 'main',
        },
        transaction,
      });
    });

    this.app.db.on('fields.afterCreate', async (model, options) => {
      const { transaction } = options;

      const collectionName = model.get('collectionName');

      const fieldName = model.get('name');

      const resourceActions = await this.app.db.getRepository('dataSourcesRolesResourcesActions').find({
        filter: {
          'resource.name': collectionName,
          'resource.dataSourceKey': 'main',
        },
        transaction,
        appends: ['resource'],
      });

      for (const resourceAction of resourceActions) {
        const fields = resourceAction.get('fields') as string[];
        const newFields = [...fields, fieldName];

        await this.app.db.getRepository('dataSourcesRolesResourcesActions').update({
          filterByTk: resourceAction.get('id'),
          values: {
            fields: newFields,
          },
          transaction,
        });
      }
    });

    const mutex = new Mutex();

    this.app.db.on('fields.afterDestroy', async (model, options) => {
      await mutex.runExclusive(async () => {
        const collectionName = model.get('collectionName');
        const fieldName = model.get('name');

        const resourceActions = await this.app.db.getRepository('dataSourcesRolesResourcesActions').find({
          filter: {
            'resource.name': collectionName,
            'fields.$anyOf': [fieldName],
            'resource.dataSourceKey': 'main',
          },
          transaction: options.transaction,
        });

        for (const resourceAction of resourceActions) {
          const fields = resourceAction.get('fields') as string[];
          const newFields = fields.filter((field) => field != fieldName);

          await this.app.db.getRepository('dataSourcesRolesResourcesActions').update({
            filterByTk: resourceAction.get('id') as number,
            values: {
              fields: newFields,
            },
            transaction: options.transaction,
          });
        }
      });
    });

    // Delete cache when the roles of a user changed
    this.app.db.on('rolesUsers.afterSave', async (model) => {
      const cache = this.app.cache as Cache;
      await cache.del(`roles:${model.get('userId')}`);
    });
    this.app.db.on('rolesUsers.afterDestroy', async (model) => {
      const cache = this.app.cache as Cache;
      await cache.del(`roles:${model.get('userId')}`);
    });

    const writeRolesToACL = async (app, options) => {
      const exists = await this.app.db.collectionExistsInDb('roles');
      if (exists) {
        this.log.info('write roles to ACL', { method: 'writeRolesToACL' });
        await this.writeRolesToACL(options);
      }
    };

    // sync database role data to acl
    this.app.on('afterStart', async () => {
      await writeRolesToACL(this.app, {
        withOutResources: true,
      });
    });

    // this.app.on('afterInstall', writeRolesToACL);

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

      const rolesResourcesScopes = this.app.db.getRepository('dataSourcesRolesResourcesScopes');
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

    this.app.on('beforeSignOut', ({ userId }) => {
      this.app.cache.del(`roles:${userId}`);
    });
    this.app.resourcer.use(setCurrentRole, { tag: 'setCurrentRole', before: 'acl', after: 'auth' });

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

    this.app.acl.beforeGrantAction(async (ctx) => {
      const actionName = this.app.acl.resolveActionAlias(ctx.actionName);

      if (lodash.isPlainObject(ctx.params)) {
        if (actionName === 'view' && ctx.params.fields) {
          const appendFields = [];

          const collection = this.app.db.getCollection(ctx.resourceName);

          if (!collection) {
            return;
          }

          if (collection.model.primaryKeyAttribute) {
            appendFields.push(collection.model.primaryKeyAttribute);
          }

          if (collection.model.rawAttributes['createdAt']) {
            appendFields.push('createdAt');
          }

          if (collection.model.rawAttributes['updatedAt']) {
            appendFields.push('updatedAt');
          }

          ctx.params = {
            ...lodash.omit(ctx.params, 'fields'),
            fields: [...ctx.params.fields, ...appendFields],
          };
        }
      }
    });

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
            const filteredParams = this.app.acl.filterParams(ctx, collectionName, action?.params || {});
            const params = await parseJsonTemplate(filteredParams, ctx);

            const sourceInstance = await ctx.db.getRepository(collectionName).findOne({
              filterByTk: resourceOf,
              filter: params.filter || {},
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

          if (!repository) {
            await next();
            return;
          }

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

    const withACLMeta = createWithACLMetaMiddleware();

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
      dumpRules: 'required',
      origin: this.options.packageName,
    });
  }
}

export default PluginACL;
