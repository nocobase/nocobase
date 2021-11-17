import { RelationRepository } from './relation-repository';
import { BelongsToMany, HasMany, Model, Op, Sequelize } from 'sequelize';
import { UpdateGuard } from '../update-guard';
import {
  updateAssociations,
  updateModelByValues,
} from '../update-associations';
import lodash, { omit } from 'lodash';
import { MultipleRelationRepository } from './multiple-relation-repository';

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

interface IHasManyRepository<M extends Model> {
  find(options?: FindOptions): Promise<M>;
  findAndCount(options?: FindAndCountOptions): Promise<[M[], number]>;
  findOne(options?: FindOneOptions): Promise<M>;
  // 新增并关联
  create(options?: CreateOptions): Promise<M>;
  // 更新
  update(options?: UpdateOptions): Promise<M>;
  // 删除
  destroy(options?: number | string | number[] | string[]): Promise<Boolean>;
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
  destroy(options?: number | string | number[] | string[]): Promise<Boolean> {
    return Promise.resolve(false);
  }

  async remove(primaryKey: primaryKey | Array<primaryKey>): Promise<void> {
    if (!Array.isArray(primaryKey)) {
      primaryKey = [primaryKey];
    }

    const sourceModel = await this.getSourceModel();
    await sourceModel[this.accessors().removeMultiple](primaryKey);
  }

  async set(primaryKey: primaryKey | Array<primaryKey>): Promise<void> {
    if (!Array.isArray(primaryKey)) {
      primaryKey = [primaryKey];
    }

    const sourceModel = await this.getSourceModel();
    await sourceModel[this.accessors().set](primaryKey);
  }

  async add(primaryKey: primaryKey | Array<primaryKey>): Promise<void> {
    if (!Array.isArray(primaryKey)) {
      primaryKey = [primaryKey];
    }

    const sourceModel = await this.getSourceModel();
    await sourceModel[this.accessors().add](primaryKey);
  }

  async update(options?: UpdateOptions): Promise<any> {
    const guard = UpdateGuard.fromOptions(this.target, options);

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
    return (<HasMany>this.association).accessors;
  }
}
