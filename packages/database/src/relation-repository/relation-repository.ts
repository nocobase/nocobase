import { Association, BelongsTo, BelongsToMany, HasMany, HasOne, Model, ModelCtor, Transaction } from 'sequelize';
import { OptionsParser } from '../options-parser';
import { Collection } from '../collection';
import { CreateOptions, Filter, FindOptions } from '../repository';
import FilterParser from '../filter-parser';
import { UpdateGuard } from '../update-guard';
import { updateAssociations } from '../update-associations';
import lodash from 'lodash';
import { transactionWrapperBuilder } from '../transaction-decorator';

export const transaction = transactionWrapperBuilder(function () {
  return this.source.model.sequelize.transaction();
});

export abstract class RelationRepository {
  source: Collection;
  association: Association;
  target: ModelCtor<any>;
  targetCollection: Collection;
  associationName: string;
  sourceKeyValue: string | number;
  sourceModel: Model;

  constructor(source: Collection, association: string, sourceKeyValue: string | number) {
    this.source = source;
    this.sourceKeyValue = sourceKeyValue;
    this.associationName = association;
    this.association = this.source.model.associations[association];

    this.target = this.association.target;
    this.targetCollection = this.source.context.database.modelCollection.get(this.target);
  }

  protected accessors() {
    return (<BelongsTo | HasOne | HasMany | BelongsToMany>this.association).accessors;
  }

  async create(options?: CreateOptions): Promise<any> {
    const createAccessor = this.accessors().create;

    const guard = UpdateGuard.fromOptions(this.target, options);
    const values = options.values;

    const sourceModel = await this.getSourceModel();

    const instance = await sourceModel[createAccessor](guard.sanitize(options.values), options);

    await updateAssociations(instance, values, options);

    return instance;
  }

  async getSourceModel(transaction?: any) {
    if (!this.sourceModel) {
      this.sourceModel = await this.source.model.findOne({
        where: {
          [this.source.filterTargetKey]: this.sourceKeyValue,
        },
      });
    }

    return this.sourceModel;
  }

  protected associationField() {
    return this.source.fields.get(this.associationName);
  }

  protected buildQueryOptions(options: FindOptions) {
    const parser = new OptionsParser(
      this.source.context.database.modelCollection.get(this.target),
      this.source.context.database,
      options,
    );
    const params = parser.toSequelizeParams();
    return { ...options, ...params };
  }

  protected parseFilter(filter: Filter) {
    const parser = new FilterParser(this.target, this.source.context.database, filter);
    return parser.toSequelizeParams();
  }

  protected async getTransaction(options: any, autoGen = false): Promise<Transaction | null> {
    if (lodash.isPlainObject(options) && options.transaction) {
      return options.transaction;
    }

    if (autoGen) {
      return await this.source.model.sequelize.transaction();
    }

    return null;
  }
}
