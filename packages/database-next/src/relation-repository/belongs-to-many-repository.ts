import { RelationRepository, transaction } from './relation-repository';
import {
  BelongsToMany,
  HasOne,
  Model,
  Op,
  Sequelize,
  Transactionable,
} from 'sequelize';
import FilterParser from '../filterParser';
import {
  updateModelByValues,
  updateThroughTableValue,
} from '../update-associations';
import { MultipleRelationRepository } from './multiple-relation-repository';
import { PK } from '../repository';
import { type } from 'os';

type FindOptions = any;
type FindAndCountOptions = any;
type FindOneOptions = any;
type CreateBelongsToManyOptions = any;
type UpdateOptions = {
  values: { [key: string]: any };
  filter?: any;
  filterByPk?: number | string;
  // 字段白名单
  whitelist?: string[];
  // 字段黑名单
  blacklist?: string[];
  // 关系数据默认会新建并建立关联处理，如果是已存在的数据只关联，但不更新关系数据
  // 如果需要更新关联数据，可以通过 updateAssociationValues 指定
  updateAssociationValues?: string[];
};

type DestroyOptions = any;
type primaryKey = string | number;
type primaryKeyWithThroughValues = [primaryKey, any];

interface AssociatedOptions extends Transactionable {
  pk?:
    | primaryKey
    | primaryKey[]
    | primaryKeyWithThroughValues
    | primaryKeyWithThroughValues[];
}

type setAssociationOptions =
  | primaryKey
  | primaryKey[]
  | primaryKeyWithThroughValues
  | primaryKeyWithThroughValues[]
  | AssociatedOptions;

interface IBelongsToManyRepository<M extends Model> {
  find(options?: FindOptions): Promise<M[]>;
  findAndCount(options?: FindAndCountOptions): Promise<[M[], number]>;
  findOne(options?: FindOneOptions): Promise<M>;
  // 新增并关联，存在中间表数据
  create(options?: CreateBelongsToManyOptions): Promise<M>;
  // 更新，存在中间表数据
  update(options?: UpdateOptions): Promise<M>;
  // 删除
  destroy(
    options?: number | string | number[] | string[] | DestroyOptions,
  ): Promise<Boolean>;
  // 建立关联
  set(primaryKey: primaryKey | primaryKey[]): Promise<void>;
  // 附加关联，存在中间表数据
  add(primaryKey: primaryKey | primaryKey[]): Promise<void>;
  // 移除关联
  remove(primaryKey: primaryKey | primaryKey[]): Promise<void>;
  toggle(primaryKey: primaryKey): Promise<void>;
}

export class BelongsToManyRepository
  extends MultipleRelationRepository
  implements IBelongsToManyRepository<any>
{
  async create(options?: CreateBelongsToManyOptions): Promise<any> {
    const transaction = await this.getTransaction(options);

    const createAccessor = this.accessors().create;
    const values = options.values;

    const sourceModel = await this.getSourceModel(transaction);

    const createOptions = {
      through: values[this.throughName()],
      transaction,
    };

    return sourceModel[createAccessor](values, createOptions);
  }

  async destroy(options?: PK | DestroyOptions): Promise<Boolean> {
    const transaction = await this.getTransaction(options);
    const association = <BelongsToMany>this.association;

    const instancesToIds = (instances) => {
      return instances.map((instance) =>
        instance.get(this.target.primaryKeyAttribute),
      );
    };

    // Through Table
    const throughTableWhere: Array<any> = [
      {
        [association.foreignKey]: this.sourceId,
      },
    ];

    let ids;

    if (options && options['filter']) {
      const instances = await this.find({
        filter: options['filter'],
        transaction,
      });

      ids = instancesToIds(instances);
    }

    if (options) {
      if (typeof options === 'object' && options['filterByPk']) {
        options = options['filterByPk'];
      }

      const instances = (<any>this.association).toInstanceArray(options);
      ids = instancesToIds(instances);
    }

    if (!options) {
      const sourceModel = await this.getSourceModel(transaction);

      const instances = await sourceModel[this.accessors().get]({
        transaction,
      });

      ids = instancesToIds(instances);
    }

    throughTableWhere.push({
      [association.otherKey]: {
        [Op.in]: ids,
      },
    });

    // delete through table data
    await this.throughModel().destroy({
      where: throughTableWhere,
      transaction,
    });

    await this.target.destroy({
      where: {
        [this.target.primaryKeyAttribute]: {
          [Op.in]: ids,
        },
      },
      transaction,
    });

    await transaction.commit();
    return true;
  }

  protected async setTargets(
    call: 'add' | 'set',
    primaryKey: setAssociationOptions,
  ) {
    let handleKeys: primaryKey[] | primaryKeyWithThroughValues[];

    const transaction = await this.getTransaction(primaryKey, false);

    if (
      primaryKey !== null &&
      typeof primaryKey === 'object' &&
      !Array.isArray(primaryKey)
    ) {
      primaryKey = <AssociatedOptions>primaryKey.pk || [];
    }

    // if it is type primaryKey
    if (!Array.isArray(primaryKey)) {
      handleKeys = [<primaryKey>primaryKey];
    } // if it is type primaryKeyWithThroughValues
    else if (handleKeys?.length == 1 && typeof primaryKey[0][1] === 'object') {
      handleKeys = [<primaryKeyWithThroughValues>handleKeys];
    } else {
      handleKeys = primaryKey;
    }

    const sourceModel = await this.getSourceModel(transaction);

    const setObj = handleKeys
      ? (<any>handleKeys).reduce((carry, item) => {
          if (Array.isArray(item)) {
            carry[item[0]] = item[1];
          } else {
            carry[item] = true;
          }
          return carry;
        }, {})
      : {};

    await sourceModel[this.accessors()[call]](Object.keys(setObj), {
      transaction,
    });

    for (const [id, throughValues] of Object.entries(setObj)) {
      if (typeof throughValues === 'object') {
        const instance = await this.target.findByPk(id, {
          transaction,
        });
        await updateThroughTableValue(
          instance,
          this.throughName(),
          throughValues,
          sourceModel,
          transaction,
        );
      }
    }
  }

  @transaction((args, transaction) => {
    return [
      {
        pk: args[0],
        transaction,
      },
    ];
  })
  async add(primaryKey: setAssociationOptions): Promise<void> {
    await this.setTargets('add', primaryKey);
  }

  @transaction((args, transaction) => {
    return [
      {
        pk: args[0],
        transaction,
      },
    ];
  })
  async set(primaryKey: setAssociationOptions): Promise<void> {
    await this.setTargets('set', primaryKey);
  }

  async toggle(primaryKey: primaryKey): Promise<void> {
    const sourceModel = await this.getSourceModel();
    const has = await sourceModel[this.accessors().hasSingle](primaryKey);

    if (has) {
      await this.remove(primaryKey);
    } else {
      await this.add(primaryKey);
    }
    return;
  }

  throughName() {
    return this.throughModel().name;
  }

  throughModel() {
    return (<any>this.association).through.model;
  }
}
