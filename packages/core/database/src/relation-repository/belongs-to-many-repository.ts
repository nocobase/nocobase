import lodash from 'lodash';
import { BelongsToMany, Op, Transaction } from 'sequelize';
import { Model } from '../model';
import { CreateOptions, DestroyOptions, FindOptions, TargetKey, UpdateOptions } from '../repository';
import { updateThroughTableValue } from '../update-associations';
import { FindAndCountOptions, FindOneOptions, MultipleRelationRepository } from './multiple-relation-repository';
import { transaction } from './relation-repository';
import { AssociatedOptions, PrimaryKeyWithThroughValues } from './types';

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
  destroy(options?: number | string | number[] | string[] | DestroyOptions): Promise<Boolean>;
  // 建立关联
  set(options: TargetKey | TargetKey[] | AssociatedOptions): Promise<void>;
  // 附加关联，存在中间表数据
  add(options: TargetKey | TargetKey[] | AssociatedOptions): Promise<void>;
  // 移除关联
  remove(options: TargetKey | TargetKey[] | AssociatedOptions): Promise<void>;
  toggle(options: TargetKey | { pk?: TargetKey; transaction?: Transaction }): Promise<void>;
}

export class BelongsToManyRepository extends MultipleRelationRepository implements IBelongsToManyRepository<any> {
  @transaction()
  async create(options?: CreateBelongsToManyOptions): Promise<any> {
    if (Array.isArray(options.values)) {
      return Promise.all(options.values.map((record) => this.create({ ...options, values: record })));
    }

    const transaction = await this.getTransaction(options);

    const createAccessor = this.accessors().create;

    const values = options.values || {};

    const sourceModel = await this.getSourceModel(transaction);

    const createOptions = {
      ...options,
      through: values[this.throughName()],
      transaction,
    };

    return sourceModel[createAccessor](values, createOptions);
  }

  @transaction((args, transaction) => {
    return {
      filterByTk: args[0],
      transaction,
    };
  })
  async destroy(options?: TargetKey | TargetKey[] | DestroyOptions): Promise<Boolean> {
    const transaction = await this.getTransaction(options);
    const association = <BelongsToMany>this.association;

    const instancesToIds = (instances) => {
      return instances.map((instance) => instance.get(this.targetKey()));
    };

    // Through Table
    const throughTableWhere: Array<any> = [
      {
        [association.foreignKey]: this.sourceKeyValue,
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

    if (options && options['filterByTk']) {
      const instances = (<any>this.association).toInstanceArray(options['filterByTk']);
      ids = ids ? lodash.intersection(ids, instancesToIds(instances)) : instancesToIds(instances);
    }

    if (options && !options['filterByTk'] && !options['filter']) {
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

    await this.targetModel.destroy({
      where: {
        [this.targetKey()]: {
          [Op.in]: ids,
        },
      },
      transaction,
    });

    return true;
  }

  protected async setTargets(
    call: 'add' | 'set',
    options: TargetKey | TargetKey[] | PrimaryKeyWithThroughValues | PrimaryKeyWithThroughValues[] | AssociatedOptions,
  ) {
    let handleKeys: TargetKey[] | PrimaryKeyWithThroughValues[];

    const transaction = await this.getTransaction(options, false);

    if (lodash.isPlainObject(options)) {
      options = (<AssociatedOptions>options).tk || [];
    }

    if (lodash.isString(options) || lodash.isNumber(options)) {
      handleKeys = [<TargetKey>options];
    } // if it is type primaryKeyWithThroughValues
    else if (lodash.isArray(options) && options.length == 2 && lodash.isPlainObject(options[0][1])) {
      handleKeys = [<PrimaryKeyWithThroughValues>options];
    } else {
      handleKeys = <TargetKey[] | PrimaryKeyWithThroughValues[]>options;
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
        const instance = await this.targetModel.findByPk(id, {
          transaction,
        });
        await updateThroughTableValue(instance, this.throughName(), throughValues, sourceModel, transaction);
      }
    }
  }

  @transaction((args, transaction) => {
    return {
      tk: args[0],
      transaction,
    };
  })
  async add(
    options: TargetKey | TargetKey[] | PrimaryKeyWithThroughValues | PrimaryKeyWithThroughValues[] | AssociatedOptions,
  ): Promise<void> {
    await this.setTargets('add', options);
  }

  @transaction((args, transaction) => {
    return {
      tk: args[0],
      transaction,
    };
  })
  async set(
    options: TargetKey | TargetKey[] | PrimaryKeyWithThroughValues | PrimaryKeyWithThroughValues[] | AssociatedOptions,
  ): Promise<void> {
    await this.setTargets('set', options);
  }

  @transaction((args, transaction) => {
    return {
      tk: args[0],
      transaction,
    };
  })
  async toggle(options: TargetKey | { tk?: TargetKey; transaction?: Transaction }): Promise<void> {
    const transaction = await this.getTransaction(options);
    const sourceModel = await this.getSourceModel(transaction);

    const has = await sourceModel[this.accessors().hasSingle](options['tk'], {
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

  extendFindOptions(findOptions) {
    let joinTableAttributes;
    if (lodash.get(findOptions, 'fields')) {
      joinTableAttributes = [];
    }

    return {
      ...findOptions,
      joinTableAttributes,
    };
  }

  throughName() {
    return this.throughModel().name;
  }

  throughModel() {
    return (<any>this.association).through.model;
  }
}
