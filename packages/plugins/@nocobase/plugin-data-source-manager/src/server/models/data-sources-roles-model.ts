import { Model } from '@nocobase/database';
import { ACL } from '@nocobase/acl';
import { Transaction } from 'sequelize';
import { DataSourcesRolesResourcesModel } from './connections-roles-resources';

export class DataSourcesRolesModel extends Model {
  async writeToAcl(options: { acl: ACL; transaction?: Transaction; associationFieldsActions: any; grantHelper: any }) {
    const { acl, transaction } = options;
    const roleName = this.get('roleName') as string;
    let role = acl.getRole(roleName);

    if (!role) {
      role = acl.define({
        role: roleName,
      });
    }

    role.setStrategy({
      ...((this.get('strategy') as object) || {}),
    });

    const resources: Array<DataSourcesRolesResourcesModel> = await this.db
      .getRepository('dataSourcesRolesResources')
      .find({
        filter: {
          roleName,
          dataSourceKey: this.get('dataSourceKey'),
        },
        transaction,
      });

    for (const resource of resources) {
      await resource.writeToACL({
        acl,
        transaction,
        grantHelper: options.grantHelper,
        associationFieldsActions: options.associationFieldsActions,
      });
    }
  }
}
