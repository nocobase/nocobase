import { BelongsToMany, HasMany, Model, Op, Sequelize } from 'sequelize';

import {
  DestroyOptions,
  MultipleRelationRepository,
  UpdateOptions,
} from './multiple-relation-repository';
import { Filter, FilterAble, PK, TransactionAble } from '../repository';
import { types } from 'util';
import { transaction } from './relation-repository';
import { type } from 'os';

type FindOptions = any;
type FindAndCountOptions = any;
type FindOneOptions = any;
type CreateOptions = {
  // 数据
  values?: any;
  // 字段白名单
  whitelist?: string[];
  // 字段黑名单
  blacklist?: string[];
  // 关系数据默认会新建并建立关联处理，如果是已存在的数据只关联，但不更新关系数据
  // 如果需要更新关联数据，可以通过 updateAssociationValues 指定
  updateAssociationValues?: string[];
};

type primaryKey = string | number;

interface IHasManyRepository<M extends Model> {
  find(options?: FindOptions): Promise<M>;
  findAndCount(options?: FindAndCountOptions): Promise<[M[], number]>;
  findOne(options?: FindOneOptions): Promise<M>;
  // 新增并关联
  create(options?: CreateOptions): Promise<M>;
  // 更新
  update(options?: UpdateOptions): Promise<M>;
  // 删除
  destroy(options?: PK | DestroyOptions): Promise<Boolean>;
  // 建立关联
  set(primaryKey: primaryKey | Array<primaryKey>): Promise<void>;
  // 附加关联
  add(primaryKey: primaryKey | Array<primaryKey>): Promise<void>;
  // 移除关联
  remove(primaryKey: primaryKey | Array<primaryKey>): Promise<void>;
}

export class HasManyRepository
  extends MultipleRelationRepository
  implements IHasManyRepository<any>
{
  @transaction((args, transaction) => {
    return {
      filterByPk: args[0],
      transaction,
    };
  })
  async destroy(options?: PK | DestroyOptions): Promise<Boolean> {
    const transaction = await this.getTransaction(options);

    const sourceModel = await this.getSourceModel(transaction);

    const where = [
      {
        [this.association.foreignKey]: sourceModel.get(
          this.source.model.primaryKeyAttribute,
        ),
      },
    ];

    if (options && options['filter']) {
      const filterResult = this.parseFilter(options['filter']);

      if (filterResult.include && filterResult.include.length > 0) {
        return await this.destroyByFilter(options['filter'], transaction);
      }

      where.push(filterResult.where);
    } else if (options && options['filterByPk']) {
      if (typeof options === 'object' && options['filterByPk']) {
        options = options['filterByPk'];
      }

      const targetInstances = (<any>this.association).toInstanceArray(options);

      where.push({
        [this.target.primaryKeyAttribute]: targetInstances.map(
          (targetInstance) =>
            targetInstance.get(this.target.primaryKeyAttribute),
        ),
      });
    }

    await this.target.destroy({
      where: {
        [Op.and]: where,
      },
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
  async set(primaryKey: primaryKey | Array<primaryKey>): Promise<void> {
    const transaction = await this.getTransaction(primaryKey);

    const sourceModel = await this.getSourceModel(transaction);

    await sourceModel[this.accessors().set](this.handleKeyOfAdd(primaryKey), {
      transaction,
    });
  }

  @transaction((args, transaction) => {
    return {
      pk: args[0],
      transaction,
    };
  })
  async add(primaryKey: primaryKey | Array<primaryKey>): Promise<void> {
    const transaction = await this.getTransaction(primaryKey);

    const sourceModel = await this.getSourceModel(transaction);

    await sourceModel[this.accessors().add](this.handleKeyOfAdd(primaryKey), {
      transaction,
    });
  }

  accessors() {
    return (<HasMany>this.association).accessors;
  }
}
