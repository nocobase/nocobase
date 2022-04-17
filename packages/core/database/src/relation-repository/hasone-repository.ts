import { Model } from '../model';
import { CreateOptions } from '../repository';
import { SingleRelationFindOption, SingleRelationRepository } from './single-relation-repository';

interface HasOneFindOptions extends SingleRelationFindOption {}

interface IHasOneRepository<M extends Model> {
  // 不需要 findOne，find 就是 findOne
  find(options?: HasOneFindOptions): Promise<M>;
  findOne(options?: HasOneFindOptions): Promise<M>;
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

export class HasOneRepository extends SingleRelationRepository implements IHasOneRepository<any> {}
