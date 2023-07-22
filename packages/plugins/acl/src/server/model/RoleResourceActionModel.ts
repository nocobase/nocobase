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

      if (!collectionField) {
        console.log(`field ${field} does not exist at ${collection.name}`);
        continue;
      }

      const fieldType = collectionField.get('type') as string;

      const fieldActions: AssociationFieldAction = associationFieldsActions?.[fieldType]?.[availableAction];

      const fieldTarget = collectionField.get('target');

      if (fieldActions) {
        // grant association actions to role
        const associationActions = fieldActions.associationActions || [];

        associationActions.forEach((associationAction) => {
          const actionName = `${resourceName}.${collectionField.get('name')}:${associationAction}`;
          role.grantAction(actionName);
        });

        const targetActions = fieldActions.targetActions || [];

        targetActions.forEach((targetAction) => {
          const targetActionPath = `${fieldTarget}:${targetAction}`;

          const existsAction = role.getActionParams(targetActionPath);

          if (existsAction) {
            return;
          }

          // set resource target action with current resourceName
          grantHelper.resourceTargetActionMap.set(`${role.name}.${resourceName}`, [
            ...(grantHelper.resourceTargetActionMap.get(resourceName) || []),
            targetActionPath,
          ]);

          grantHelper.targetActionResourceMap.set(targetActionPath, [
            ...(grantHelper.targetActionResourceMap.get(targetActionPath) || []),
            `${role.name}.${resourceName}`,
          ]);

          role.grantAction(targetActionPath);
        });
      }
    }
  }
}
