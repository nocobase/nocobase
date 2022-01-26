import { Plugin } from '@nocobase/server';
import { ACL } from '@nocobase/acl';
import path from 'path';
import { availableActionResource } from './actions/available-actions';
import { roleCollectionsResource } from './actions/role-collections';
import { createACL } from './acl';
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
        targetActions: ['view'],
      },
      update: {
        associationActions: ['add', 'remove', 'toggle'],
        targetActions: ['view'],
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
    this.app.db.registerModels({
      RoleResourceActionModel,
      RoleResourceModel,
    });

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

    this.app.db.on('rolesResources.afterSaveWithAssociations', async (model: RoleResourceModel, options) => {
      await model.writeToACL({
        acl: this.acl,
        associationFieldsActions: this.associationFieldsActions,
        transaction: options.transaction,
      });
    });
  }
}
