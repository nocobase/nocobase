import { RelationRepository } from './relation-repository';
import { BelongsToMany, HasOne, Model, Op, Sequelize } from 'sequelize';
import FilterParser from '../filterParser';
import {
  updateModelByValues,
  updateThroughTableValue,
} from '../update-associations';
import { UpdateGuard } from '../update-guard';
import { omit } from 'lodash';
import { MultipleRelationRepository } from './multiple-relation-repository';

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
    const createAccessor = this.accessors().create;
    const values = options.values;

    const sourceModel = await this.getSourceModel();

    const createOptions = {
      through: values[this.throughName()],
    };

    return sourceModel[createAccessor](values, createOptions);
  }

  destroy(
    options?: number | string | number[] | string[] | DestroyOptions,
  ): Promise<Boolean> {
    return Promise.resolve(false);
  }

  async setTargets(
    call: 'add' | 'set',
    primaryKey: primaryKey | primaryKey[] | primaryKeyWithThroughValues[],
  ) {
    if (!Array.isArray(primaryKey)) {
      primaryKey = [primaryKey];
    }

    const sourceModel = await this.getSourceModel();

    // @ts-ignore
    const setObj = primaryKey.reduce((carry, item) => {
      if (Array.isArray(item)) {
        carry[item[0]] = item[1];
      } else {
        carry[item] = true;
      }
      return carry;
    }, {});

    await sourceModel[this.accessors()[call]](Object.keys(setObj));

    for (const [id, throughValues] of Object.entries(setObj)) {
      if (typeof throughValues === 'object') {
        const instance = await this.target.findByPk(id);
        await updateThroughTableValue(
          instance,
          this.throughName(),
          throughValues,
          sourceModel,
        );
      }
    }
  }

  async add(
    primaryKey: primaryKey | primaryKey[] | primaryKeyWithThroughValues[],
  ): Promise<void> {
    await this.setTargets('add', primaryKey);
  }

  async set(
    primaryKey: primaryKey | primaryKey[] | primaryKeyWithThroughValues[],
  ): Promise<void> {
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

  async remove(primaryKey: primaryKey | primaryKey[]): Promise<void> {
    if (!Array.isArray(primaryKey)) {
      primaryKey = [primaryKey];
    }

    const sourceModel = await this.getSourceModel();
    await sourceModel[this.accessors().removeMultiple](primaryKey);
    return;
  }

  async update(options?: UpdateOptions): Promise<any> {
    const guard = new UpdateGuard();
    guard.setModel(this.target);
    guard.setWhiteList(options.whitelist);
    guard.setBlackList(options.blacklist);
    guard.setAssociationKeysToBeUpdate(options.updateAssociationValues);

    const values = guard.sanitize(options.values);

    const queryOptions = this.buildQueryOptions(options);

    const instances = await this.find(queryOptions);
    for (const instance of instances) {
      await updateModelByValues(instance, values, {
        sanitized: true,
        sourceModel: this.sourceModel,
      });
    }

    return true;
  }

  accessors() {
    return (<BelongsToMany>this.association).accessors;
  }

  throughName() {
    // @ts-ignore
    return this.association.through.model.name;
  }
}
