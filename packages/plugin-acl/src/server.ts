import { Plugin } from '@nocobase/server';
import { ACL } from '@nocobase/acl';
import path from 'path';
import { availableActionResource } from './actions/available-actions';
import { roleCollectionsResource } from './actions/role-collections';
import { createACL } from './acl';

async function actionModelToParams(actionModel, resourceName) {
  const fields = actionModel.get('fields');
  const actionName = actionModel.get('name');
  const actionPath = `${resourceName}:${actionName}`;

  const actionParams = {
    fields,
  };

  const scope = await actionModel.getScope();

  if (scope) {
    actionParams['filter'] = scope.get('scope');
  }

  return {
    actionPath,
    actionParams,
    resourceName,
    actionName,
  };
}

interface AssociationFieldAction {
  associationActions: string[];
  associatedActions?: string[];
}
interface AssociationFieldActions {
  [availableActionName: string]: AssociationFieldAction;
}

interface AssociationFieldsActions {
  [associationType: string]: AssociationFieldActions;
}

export default class PluginACL extends Plugin {
  acl: ACL;

  associationFieldsActions: AssociationFieldsActions = {};

  registerAssociationFieldAction(associationType: string, value: AssociationFieldActions) {
    this.associationFieldsActions[associationType] = value;
  }

  getACL() {
    return this.acl;
  }

  registerAssociationFieldsActions() {
    this.registerAssociationFieldAction('linkTo', {
      view: {
        associationActions: ['list', 'get'],
      },
      create: {
        associationActions: ['add'],
        associatedActions: ['view'],
      },
      update: {
        associationActions: ['add', 'remove', 'toggle'],
        associatedActions: ['view'],
      },
    });

    this.registerAssociationFieldAction('attachments', {
      view: {
        associationActions: ['list', 'get'],
      },
      add: {
        associationActions: ['upload', 'add'],
      },
      update: {
        associationActions: ['update', 'add', 'remove', 'toggle'],
      },
    });

    this.registerAssociationFieldAction('subTable', {
      view: {
        associationActions: ['list', 'get'],
      },
      create: {
        associationActions: ['create'],
      },
      update: {
        associationActions: ['update', 'destroy'],
      },
    });
  }

  async load() {
    const acl = createACL();
    this.acl = acl;

    await this.app.db.import({
      directory: path.resolve(__dirname, 'collections'),
    });

    this.registerAssociationFieldsActions();

    this.app.resourcer.define(availableActionResource);
    this.app.resourcer.define(roleCollectionsResource);

    this.app.resourcer.use(this.acl.middleware());

    this.app.db.on('roles.afterSave', (model) => {
      const roleName = model.get('name');
      let role = acl.getRole(roleName);

      if (!role) {
        role = acl.define({
          role: model.get('name'),
        });
      }

      role.setStrategy({
        ...(model.get('strategy') || {}),
        allowConfigure: model.get('allowConfigure'),
      });
    });

    this.app.db.on('roles.afterDestroy', (model) => {
      const roleName = model.get('name');
      acl.removeRole(roleName);
    });

    this.app.db.on('rolesResources.afterSave', async (model, options) => {
      const roleName = model.get('roleName');
      const role = acl.getRole(roleName);

      if (model.usingActionsConfig === true && model._previousDataValues.usingActionsConfig === false) {
        const actions = await model.getActions();
        for (const action of actions) {
          const { actionPath, actionParams } = await actionModelToParams(action, model.get('name'));
          role.grantAction(actionPath, actionParams);
        }
      }

      if (model._previousDataValues.usingActionsConfig === true && model.usingActionsConfig === false) {
        role.revokeResource(model.get('name'));
      }
    });

    this.app.db.on('rolesResourcesActions.beforeBulkUpdate', async (options) => {
      options.individualHooks = true;
    });

    this.app.db.on('rolesResourcesActions.afterSave', async (model) => {
      const resource = await model.getResource();

      // revoke resource action
      if (!resource) {
        const previousResource = await this.app.db.getRepository('rolesResources').findOne({
          filter: {
            id: model._previousDataValues.rolesResourceId,
          },
        });

        const roleName = previousResource.get('roleName') as string;
        const role = acl.getRole(roleName);
        role.revokeAction(`${previousResource.get('name')}:${model.get('name')}`);
        return;
      }

      const roleName = resource.get('roleName');
      const role = acl.getRole(roleName);

      const { actionPath, actionParams, resourceName, actionName } = await actionModelToParams(
        model,
        resource.get('name'),
      );

      role.grantAction(actionPath, actionParams);

      const collection = this.app.db.getCollection(resourceName);
      const fields = actionParams.fields || [];

      const availableAction = this.acl.resolveActionAlias(actionName);

      for (const field of fields) {
        const collectionField = collection.getField(field);
        const fieldType = collectionField.get('interface') as string;

        const fieldActions: AssociationFieldAction = this.associationFieldsActions?.[fieldType]?.[availableAction];

        if (fieldActions) {
          const associationActions = fieldActions.associationActions || [];
          associationActions.forEach((associationAction) => {
            role.grantAction(`${resourceName}.${field}:${associationAction}`);
          });

          const associatedActions = fieldActions.associatedActions || [];
          associatedActions.forEach((associatedAction) => {
            role.grantAction(`${field}:${associatedAction}`);
          });
        }
      }
    });
  }
}
