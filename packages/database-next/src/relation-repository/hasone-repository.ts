import { RelationRepository } from './relation-repository';
import { HasOne, Model, Sequelize } from 'sequelize';
import { Appends, Expect, Fields } from '../repository';
import { updateModelByValues } from '../update-associations';
import lodash from 'lodash';

interface HasOneFindOptions {
  fields?: Fields;
  expect?: Expect;
  appends?: Appends;
}

interface CreateOptions {
  // 数据
  values?: any;
  // 字段白名单
  whitelist?: string[];
  // 字段黑名单
  blacklist?: string[];
  // 关系数据默认会新建并建立关联处理，如果是已存在的数据只关联，但不更新关系数据
  // 如果需要更新关联数据，可以通过 updateAssociationValues 指定
  updateAssociationValues?: string[];
}

interface UpdateOptions {
  // 数据
  values?: any;
  // 字段白名单
  whitelist?: string[];
  // 字段黑名单
  blacklist?: string[];
  // 关系数据默认会新建并建立关联处理，如果是已存在的数据只关联，但不更新关系数据
  // 如果需要更新关联数据，可以通过 updateAssociationValues 指定
  updateAssociationValues?: string[];
}

interface IHasOneRepository<M extends Model> {
  // 不需要 findOne，find 就是 findOne
  find(options?: HasOneFindOptions): Promise<Model<any>>;
  // 新增并关联，如果存在关联，解除之后，与新数据建立关联
  create(options?: CreateOptions): Promise<M>;
  // 更新
  update(options?): Promise<M>;
  // 删除
  destroy(): Promise<Boolean>;
  // 建立关联
  set(primaryKey: any): Promise<void>;
  // 移除关联
  remove(): Promise<void>;
}

export class HasOneRepository<M extends Model>
  extends RelationRepository
  implements IHasOneRepository<M>
{
  async create(options: CreateOptions): Promise<M> {
    const createAccessor = this.accessors().create;
    const values = options.values;
    const sourceModel = await this.getSourceModel();

    return sourceModel[createAccessor](values);
  }

  async destroy(): Promise<Boolean> {
    const target = await this.find();

    await target.destroy();
    return true;
  }

  async find(options?: HasOneFindOptions): Promise<Model<any>> {
    const findOptions = this.buildQueryOptions({
      ...options,
    });

    const getAccessor = this.accessors().get;
    const sourceModel = await this.getSourceModel();

    return await sourceModel[getAccessor](findOptions);
  }

  async remove(): Promise<void> {
    const sourceModel = await this.getSourceModel();
    return await sourceModel[this.accessors().set](null);
  }

  async set(primaryKey: any): Promise<void> {
    const sourceModel = await this.getSourceModel();
    return await sourceModel[this.accessors().set](primaryKey);
  }

  async update(options?): Promise<any> {
    const target = await this.find();
    await updateModelByValues(
      target,
      options?.values,
      lodash.omit(options, 'values'),
    );
    return target;
  }

  accessors() {
    return (<HasOne>this.association).accessors;
  }
}
