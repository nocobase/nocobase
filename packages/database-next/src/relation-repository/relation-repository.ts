import {
  Association,
  BelongsTo,
  BelongsToMany,
  HasMany,
  HasOne,
  Model,
  ModelCtor,
} from 'sequelize';
import { OptionsParser } from '../optionsParser';
import { Collection } from '../collection';
import { Filter, FindOptions } from '../repository';
import FilterParser from '../filterParser';
import { UpdateGuard } from '../update-guard';
import {
  updateAssociations,
  updateModelByValues,
} from '../update-associations';

export type CreateOptions = {
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

export type UpdateOptions = {
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

export abstract class RelationRepository {
  source: Collection;
  association: Association;
  target: ModelCtor<any>;
  sourceId: string | number;
  sourceModel: Model;

  constructor(
    source: Collection,
    association: string,
    sourceId: string | number,
  ) {
    this.source = source;
    this.sourceId = sourceId;
    this.association = this.source.model.associations[association];

    this.target = this.association.target;
  }

  protected accessors() {
    return (<BelongsTo | HasOne | HasMany | BelongsToMany>this.association)
      .accessors;
  }

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

  async getSourceModel() {
    if (!this.sourceModel) {
      this.sourceModel = await this.source.model.findByPk(this.sourceId);
    }

    return this.sourceModel;
  }

  protected buildQueryOptions(options: FindOptions) {
    const parser = new OptionsParser(
      this.target,
      this.source.context.database,
      options,
    );
    const params = parser.toSequelizeParams();
    return { ...options, ...params };
  }
}
