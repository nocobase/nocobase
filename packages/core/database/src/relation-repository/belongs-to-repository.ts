import { BelongsTo } from 'sequelize';
import { SingleRelationFindOption, SingleRelationRepository } from './single-relation-repository';

type BelongsToFindOptions = SingleRelationFindOption;

export class BelongsToRepository extends SingleRelationRepository {
  async filterOptions(sourceModel) {
    const association = this.association as BelongsTo;

    return {
      // @ts-ignore
      [association.targetKey]: sourceModel.get(association.foreignKey),
    };
  }
}
