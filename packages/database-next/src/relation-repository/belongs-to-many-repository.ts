import {
  CreateOptions,
  transaction,
  UpdateOptions,
} from './relation-repository';
import { BelongsToMany, Model, Op, Transaction } from 'sequelize';
import { updateThroughTableValue } from '../update-associations';
import {
  DestroyOptions,
  FindAndCountOptions,
  FindOneOptions,
  MultipleRelationRepository,
} from './multiple-relation-repository';
import { FindOptions } from '../repository';
import {
  AssociatedOptions,
  PrimaryKey,
  PrimaryKeyWithThroughValues,
} from './types';
import lodash from 'lodash';

type CreateBelongsToManyOptions = CreateOptions;

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
  set(options: PrimaryKey | PrimaryKey[] | AssociatedOptions): Promise<void>;
  // 附加关联，存在中间表数据
  add(options: PrimaryKey | PrimaryKey[] | AssociatedOptions): Promise<void>;
  // 移除关联
  remove(options: PrimaryKey | PrimaryKey[] | AssociatedOptions): Promise<void>;
  toggle(
    options: PrimaryKey | { pk?: PrimaryKey; transaction?: Transaction },
  ): Promise<void>;
}

export class BelongsToManyRepository
  extends MultipleRelationRepository
  implements IBelongsToManyRepository<any>
{
  @transaction()
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

  @transaction((args, transaction) => {
    return {
      filterByPk: args[0],
      transaction,
    };
  })
  async destroy(
    options?: number | string | number[] | string[] | DestroyOptions,
  ): Promise<Boolean> {
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
    } else if (options && options['filterByPk']) {
      options = options['filterByPk'];

      const instances = (<any>this.association).toInstanceArray(options);
      ids = instancesToIds(instances);
    } else if (options && !options['filterByPk']) {
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

    return true;
  }

  protected async setTargets(
    call: 'add' | 'set',
    options:
      | PrimaryKey
      | PrimaryKey[]
      | PrimaryKeyWithThroughValues
      | PrimaryKeyWithThroughValues[]
      | AssociatedOptions,
  ) {
    let handleKeys: PrimaryKey[] | PrimaryKeyWithThroughValues[];

    const transaction = await this.getTransaction(options, false);

    if (lodash.isPlainObject(options)) {
      options = (<AssociatedOptions>options).pk || [];
    }

    if (lodash.isString(options) || lodash.isNumber(options)) {
      handleKeys = [<PrimaryKey>options];
    } // if it is type primaryKeyWithThroughValues
    else if (
      lodash.isArray(options) &&
      options.length == 2 &&
      lodash.isPlainObject(options[0][1])
    ) {
      handleKeys = [<PrimaryKeyWithThroughValues>options];
    } else {
      handleKeys = <PrimaryKey[] | PrimaryKeyWithThroughValues[]>options;
    }

    const sourceModel = await this.getSourceModel(transaction);

    const setObj = (<any>handleKeys).reduce((carry, item) => {
      if (Array.isArray(item)) {
        carry[item[0]] = item[1];
      } else {
        carry[item] = true;
      }
      return carry;
    }, {});

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
    return {
      pk: args[0],
      transaction,
    };
  })
  async add(
    options:
      | PrimaryKey
      | PrimaryKey[]
      | PrimaryKeyWithThroughValues
      | PrimaryKeyWithThroughValues[]
      | AssociatedOptions,
  ): Promise<void> {
    await this.setTargets('add', options);
  }

  @transaction((args, transaction) => {
    return {
      pk: args[0],
      transaction,
    };
  })
  async set(
    options:
      | PrimaryKey
      | PrimaryKey[]
      | PrimaryKeyWithThroughValues
      | PrimaryKeyWithThroughValues[]
      | AssociatedOptions,
  ): Promise<void> {
    await this.setTargets('set', options);
  }

  @transaction((args, transaction) => {
    return {
      pk: args[0],
      transaction,
    };
  })
  async toggle(
    options: PrimaryKey | { pk?: PrimaryKey; transaction?: Transaction },
  ): Promise<void> {
    const transaction = await this.getTransaction(options);
    const sourceModel = await this.getSourceModel(transaction);
    const has = await sourceModel[this.accessors().hasSingle](options['pk'], {
      transaction,
    });

    if (has) {
      await this.remove({
        ...(<any>options),
        transaction,
      });
    } else {
      await this.add({
        ...(<any>options),
        transaction,
      });
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
