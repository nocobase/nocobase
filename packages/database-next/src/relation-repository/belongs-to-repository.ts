import { RelationRepository } from './relation-repository';
import { BelongsTo, HasOne, Model } from 'sequelize';
import { updateModelByValues } from '../update-associations';
import lodash from 'lodash';

type BelongsToFindOptions = any;
type CreateOptions = any;
type UpdateOptions = any;

interface IBelongsToRepository<M extends Model> {
  // 不需要 findOne，find 就是 findOne
  find(options?: BelongsToFindOptions): Promise<M>;
  // 新增并关联，如果存在关联，解除之后，与新数据建立关联
  create(options?: CreateOptions): Promise<M>;
  // 更新
  update(options?: UpdateOptions): Promise<M>;
  // 删除
  destroy(): Promise<Boolean>;
  // 建立关联
  set(primaryKey: any): Promise<void>;
  // 移除关联
  remove(): Promise<void>;
}

class BelongsToRepository
  extends RelationRepository
  implements IBelongsToRepository<any>
{
  async destroy(): Promise<Boolean> {
    const target = await this.find();

    await target.destroy();
    return true;
  }

  async find(options?: BelongsToFindOptions): Promise<Model<any>> {
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
    return (<BelongsTo>this.association).accessors;
  }
}
