import { Model } from '../model';
import { selectQuery } from './query-generator';

export class SQLModel extends Model {
  static sql: string;

  static get queryGenerator() {
    const queryGenerator = this.sequelize.getQueryInterface().queryGenerator as any;
    queryGenerator.selectQuery = selectQuery.bind(queryGenerator);
    return queryGenerator;
  }
}
