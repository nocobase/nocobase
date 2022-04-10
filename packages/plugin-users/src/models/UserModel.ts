import Database, { Model, TransactionAble } from '@nocobase/database';

export class UserModel extends Model {
  async setDefaultRole(roleName: string, options: TransactionAble = {}) {
    if (roleName == 'anonymous') {
      return false;
    }

    const db = (this.constructor as any).database as Database;
    const transaction = options.transaction || (await db.sequelize.transaction());

    try {
      await db.getRepository('rolesUsers').update({
        filter: {
          userId: this.get('id'),
        },
        values: {
          default: false,
        },
        transaction,
      });

      await db.getRepository('rolesUsers').update({
        filter: {
          userId: this.get('id'),
          roleName,
        },
        values: {
          default: true,
        },
        transaction,
      });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }

    return true;
  }
}
