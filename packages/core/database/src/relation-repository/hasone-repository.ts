import { HasOne } from 'sequelize';
import { SingleRelationRepository } from './single-relation-repository';

export class HasOneRepository extends SingleRelationRepository {
  filterOptions(sourceModel) {
    const association = this.association as HasOne;

    return {
      // @ts-ignore
      [association.foreignKey]: sourceModel.get(association.sourceKey),
    };
  }
}
