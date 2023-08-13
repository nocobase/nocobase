import { Model } from '../model';
import { selectQuery } from './query-generator';

export class SQLModel extends Model {
  static sql: string;

  static get queryInterface() {
    const queryInterface = this.sequelize.getQueryInterface();
    const queryGenerator = queryInterface.queryGenerator as any;
    const sqlGenerator = new Proxy(queryGenerator, {
      get(target, prop) {
        if (prop === 'selectQuery') {
          return selectQuery.bind(target);
        }
        return Reflect.get(target, prop);
      },
    });
    return new Proxy(queryInterface, {
      get(target, prop) {
        if (prop === 'queryGenerator') {
          return sqlGenerator;
        }
        return Reflect.get(target, prop);
      },
    });
  }

  static async sync(): Promise<any> {}
}
