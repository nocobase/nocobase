import { Database, Model } from '@nocobase/database';

export class AuthModel extends Model {
  async findUser(uuid: string) {
    let user: Model;
    const users = await this.getUsers({
      through: {
        where: { uuid },
      },
    });
    if (users.length) {
      user = users[0];
      return user;
    }
  }

  async newUser(uuid: string, values?: any) {
    let user: Model;
    const db: Database = (this.constructor as any).database;
    await this.sequelize.transaction(async (transaction) => {
      // Create a new user if not exists
      user = await this.createUser(
        values || {
          nickname: uuid,
        },
        {
          through: {
            uuid: uuid,
          },
          transaction,
        },
      );
      await db.emitAsync(`users.afterCreateWithAssociations`, user, {
        transaction,
      });
    });
    return user;
  }

  async findOrCreateUser(uuid: string, userValues?: any) {
    const user = await this.findUser(uuid);
    if (user) {
      return user;
    }

    return await this.newUser(uuid, userValues);
  }
}
