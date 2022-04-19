import { omit } from 'lodash';
import { HasMany, Op } from 'sequelize';
import { Model } from '../model';
import { CreateOptions, DestroyOptions, FindOptions, TargetKey, TK, UpdateOptions } from '../repository';
import {
  AssociatedOptions,
  FindAndCountOptions,
  FindOneOptions,
  MultipleRelationRepository
} from './multiple-relation-repository';
import { transaction } from './relation-repository';

interface IHasManyRepository<M extends Model> {
  find(options?: FindOptions): Promise<M>;
  findAndCount(options?: FindAndCountOptions): Promise<[M[], number]>;
  findOne(options?: FindOneOptions): Promise<M>;
  // 新增并关联
  create(options?: CreateOptions): Promise<M>;
  // 更新
  update(options?: UpdateOptions): Promise<M>;
  // 删除
  destroy(options?: TK | DestroyOptions): Promise<Boolean>;
  // 建立关联
  set(options: TargetKey | TargetKey[] | AssociatedOptions): Promise<void>;
  // 附加关联
  add(options: TargetKey | TargetKey[] | AssociatedOptions): Promise<void>;
  // 移除关联
  remove(options: TargetKey | TargetKey[] | AssociatedOptions): Promise<void>;
}

export class HasManyRepository extends MultipleRelationRepository implements IHasManyRepository<any> {
  async find(options?: FindOptions): Promise<any> {
    const targetRepository = this.targetCollection.repository;

    const addFilter = {
      [this.association.foreignKey]: this.sourceKeyValue,
    };

    if (options?.filterByTk) {
      addFilter[this.associationField.targetKey] = options.filterByTk;
    }

    return await targetRepository.find({
      ...omit(options, ['filterByTk']),
      filter: {
        $and: [options.filter || {}, addFilter],
      },
    });
  }

  @transaction((args, transaction) => {
    return {
      filterByTk: args[0],
      transaction,
    };
  })
  async destroy(options?: TK | DestroyOptions): Promise<Boolean> {
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

  handleKeyOfAdd(options) {
    let handleKeys;

    if (typeof options !== 'object' && !Array.isArray(options)) {
      handleKeys = [options];
    } else {
      handleKeys = options['pk'];
    }
    return handleKeys;
  }

  @transaction((args, transaction) => {
    return {
      pk: args[0],
      transaction,
    };
  })
  async set(options: TargetKey | TargetKey[] | AssociatedOptions): Promise<void> {
    const transaction = await this.getTransaction(options);

    const sourceModel = await this.getSourceModel(transaction);

    await sourceModel[this.accessors().set](this.handleKeyOfAdd(options), {
      transaction,
    });
  }

  @transaction((args, transaction) => {
    return {
      pk: args[0],
      transaction,
    };
  })
  async add(options: TargetKey | TargetKey[] | AssociatedOptions): Promise<void> {
    const transaction = await this.getTransaction(options);

    const sourceModel = await this.getSourceModel(transaction);

    await sourceModel[this.accessors().add](this.handleKeyOfAdd(options), {
      transaction,
    });
  }

  accessors() {
    return (<HasMany>this.association).accessors;
  }
}
