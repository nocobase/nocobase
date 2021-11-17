import { RelationRepository } from './relation-repository';
import { BelongsToMany, HasMany, Model } from 'sequelize';
import { UpdateGuard } from '../update-guard';
import {
  updateAssociations,
  updateModelByValues,
} from '../update-associations';

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
  extends RelationRepository
  implements IHasManyRepository<any>
{
  async create(options?: CreateOptions): Promise<any> {
    const createAccessor = this.accessors().create;

    const guard = UpdateGuard.fromOptions(this.target, options);
    const values = options.values;

    const sourceModel = await this.getSourceModel();

    const instance = await sourceModel[createAccessor](
      guard.sanitize(options.values),
    );

    await updateAssociations(instance, values, options);

    return instance;
  }

  destroy(options?: number | string | number[] | string[]): Promise<Boolean> {
    return Promise.resolve(false);
  }

  async find(options?: FindOptions): Promise<any> {
    const findOptions = this.buildQueryOptions({
      ...options,
    });

    const getAccessor = this.accessors().get;
    const sourceModel = await this.getSourceModel();

    return await sourceModel[getAccessor](findOptions);
  }

  async findAndCount(options?: FindAndCountOptions): Promise<[any[], number]> {
    const rows = await this.find(options);
    const sourceModel = await this.getSourceModel();
    const queryOptions = this.buildQueryOptions(options);
    const count = await sourceModel[this.accessors().count](queryOptions);

    return [rows, count];
  }

  async findOne(options?: FindOneOptions): Promise<any> {
    const findOptions = this.buildQueryOptions({
      ...options,
    });

    const getAccessor = this.accessors().get;
    const sourceModel = await this.getSourceModel();

    const rows = await sourceModel[getAccessor]({ ...findOptions, limit: 1 });

    return rows.length == 1 ? rows[0] : null;
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
