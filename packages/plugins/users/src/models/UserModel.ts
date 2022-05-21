import Database, { Model, Transactionable } from '@nocobase/database';

export class UserModel extends Model {
  async setDefaultRole(roleName: string, options: Transactionable = {}) {
    if (roleName == 'anonymous') {
      return false;
    }

    const db = (this.constructor as any).database as Database;
    const repository = db.getRepository('rolesUsers');
    if (!repository) {
      return false;
    }
    const transaction = options.transaction || (await db.sequelize.transaction());

    try {
      await repository.update({
        filter: {
          userId: this.get('id'),
        },
        values: {
          default: false,
        },
        transaction,
      });
      await repository.update({
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
