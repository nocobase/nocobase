import { RelationRepository } from './relation-repository';
import { BelongsTo, Model, SingleAssociationAccessors } from 'sequelize';
import { updateModelByValues } from '../update-associations';
import lodash from 'lodash';
import { Appends, Expect, Fields } from '../repository';

export type SingleRelationFindOption = {
  fields?: Fields;
  expect?: Expect;
  appends?: Appends;
};

export abstract class SingleRelationRepository extends RelationRepository {
  async remove(): Promise<void> {
    const sourceModel = await this.getSourceModel();
    return await sourceModel[this.accessors().set](null);
  }

  async set(primaryKey: any): Promise<void> {
    const sourceModel = await this.getSourceModel();
    return await sourceModel[this.accessors().set](primaryKey);
  }

  async find(options?: SingleRelationFindOption): Promise<Model<any>> {
    const findOptions = this.buildQueryOptions({
      ...options,
    });

    const getAccessor = this.accessors().get;
    const sourceModel = await this.getSourceModel();

    return await sourceModel[getAccessor](findOptions);
  }

  async destroy(): Promise<Boolean> {
    const target = await this.find();

    await target.destroy();
    return true;
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
    return <SingleAssociationAccessors>super.accessors();
  }
}
