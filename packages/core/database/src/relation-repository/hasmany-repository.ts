import { omit } from 'lodash';
import { HasMany, Op } from 'sequelize';
import { AggregateOptions, DestroyOptions, FindOptions, TK, TargetKey } from '../repository';
import { AssociatedOptions, MultipleRelationRepository } from './multiple-relation-repository';
import { transaction } from './relation-repository';
export class HasManyRepository extends MultipleRelationRepository {
  async find(options?: FindOptions): Promise<any> {
    const targetRepository = this.targetCollection.repository;

    const addFilter = {
      [this.association.foreignKey]: this.sourceKeyValue,
    };

    if (options?.filterByTk) {
      addFilter[this.associationField.targetKey] = options.filterByTk;
    }

    const findOptions = {
      ...omit(options, ['filterByTk', 'where', 'values', 'attributes']),
      filter: {
        $and: [options.filter || {}, addFilter],
      },
    };

    return await targetRepository.find(findOptions);
  }

  async aggregate(options: AggregateOptions) {
    const targetRepository = this.targetCollection.repository;
    const addFilter = {
      [this.association.foreignKey]: this.sourceKeyValue,
    };

    const aggOptions = {
      ...options,
      filter: {
        $and: [options.filter || {}, addFilter],
      },
    };

    return await targetRepository.aggregate(aggOptions);
  }

  @transaction((args, transaction) => {
    return {
      filterByTk: args[0],
      transaction,
    };
  })
  async destroy(options?: TK | DestroyOptions): Promise<boolean> {
    const transaction = await this.getTransaction(options);

    const sourceModel = await this.getSourceModel(transaction);

    const where = [
      {
        [this.association.foreignKey]: sourceModel.get((this.association as any).sourceKey),
      },
    ];

    if (options && options['filter']) {
      const filterResult = this.parseFilter(options['filter'], options);

      if (filterResult.include && filterResult.include.length > 0) {
        return await this.destroyByFilter(options['filter'], transaction);
      }

      where.push(filterResult.where);
    }

    if (options && options['filterByTk']) {
      if (typeof options === 'object' && options['filterByTk']) {
        options = options['filterByTk'];
      }

      where.push({
        [this.targetKey()]: options,
      });
    }

    await this.targetModel.destroy({
      where: {
        [Op.and]: where,
      },
      individualHooks: true,
      transaction,
    });

    return true;
  }

  @transaction((args, transaction) => {
    return {
      tk: args[0],
      transaction,
    };
  })
  async set(options: TargetKey | TargetKey[] | AssociatedOptions): Promise<void> {
    const transaction = await this.getTransaction(options);

    const sourceModel = await this.getSourceModel(transaction);

    await sourceModel[this.accessors().set](this.convertTks(options), {
      transaction,
    });
  }

  @transaction((args, transaction) => {
    return {
      tk: args[0],
      transaction,
    };
  })
  async add(options: TargetKey | TargetKey[] | AssociatedOptions): Promise<void> {
    const transaction = await this.getTransaction(options);
    const sourceModel = await this.getSourceModel(transaction);

    await sourceModel[this.accessors().add](this.convertTks(options), {
      transaction,
    });
  }

  accessors() {
    return (<HasMany>this.association).accessors;
  }
}
