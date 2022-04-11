import { ACL, ACLRole } from '@nocobase/acl';
import { Database, Model } from '@nocobase/database';
import { AssociationFieldAction, AssociationFieldsActions, GrantHelper } from '../server';

export class RoleResourceActionModel extends Model {
  async writeToACL(options: {
    acl: ACL;
    role: ACLRole;
    resourceName: string;
    associationFieldsActions: AssociationFieldsActions;
    grantHelper: GrantHelper;
  }) {
    // @ts-ignore
    const db: Database = this.constructor.database;

    const { resourceName, role, acl, associationFieldsActions, grantHelper } = options;
    const actionName = this.get('name') as string;

    const fields = this.get('fields') as any;

    const actionPath = `${resourceName}:${actionName}`;
    const actionParams = {
      fields,
    };

    // @ts-ignore
    const scope = await this.getScope();

    if (scope) {
      actionParams['own'] = scope.get('key') === 'own';
      actionParams['filter'] = scope.get('scope');
    }

    role.grantAction(actionPath, actionParams);

    const collection = db.getCollection(resourceName);

    if (!collection) {
      return;
    }

    const availableAction = acl.resolveActionAlias(actionName);

    for (const field of fields) {
      const collectionField = collection.getField(field);
      const fieldType = collectionField.get('interface') as string;

      const fieldActions: AssociationFieldAction = associationFieldsActions?.[fieldType]?.[availableAction];

      if (fieldActions) {
        const associationActions = fieldActions.associationActions || [];
        associationActions.forEach((associationAction) => {
          const actionName = `${resourceName}.${field}:${associationAction}`;
          role.grantAction(actionName);
        });

        const targetActions = fieldActions.targetActions || [];

        targetActions.forEach((targetAction) => {
          const targetActionPath = `${field}:${targetAction}`;

          grantHelper.resourceTargetActionMap.set(resourceName, [
            ...(grantHelper.resourceTargetActionMap.get(resourceName) || []),
            targetActionPath,
          ]);

          grantHelper.targetActionResourceMap.set(targetActionPath, [
            ...(grantHelper.targetActionResourceMap.get(targetActionPath) || []),
            resourceName,
          ]);

          role.grantAction(targetActionPath);
        });
      }
    }
  }
}
