import { Association, BelongsTo, BelongsToMany, HasMany, HasOne, Model, ModelCtor, Transaction } from 'sequelize';
import { OptionsParser } from '../options-parser';
import { Collection } from '../collection';
import { CreateOptions, Filter, FindOptions } from '../repository';
import FilterParser from '../filter-parser';
import { UpdateGuard } from '../update-guard';
import { updateAssociations } from '../update-associations';
import lodash from 'lodash';
import { transactionWrapperBuilder } from '../transaction-decorator';
import { Field, RelationField } from '@nocobase/database';

export const transaction = transactionWrapperBuilder(function () {
  return this.sourceCollection.model.sequelize.transaction();
});

export abstract class RelationRepository {
  sourceCollection: Collection;
  association: Association;
  targetModel: ModelCtor<any>;
  targetCollection: Collection;
  associationName: string;
  associationField: RelationField;
  sourceKeyValue: string | number;
  sourceInstance: Model;

  constructor(sourceCollection: Collection, association: string, sourceKeyValue: string | number) {
    this.sourceCollection = sourceCollection;
    this.sourceKeyValue = sourceKeyValue;
    this.associationName = association;
    this.association = this.sourceCollection.model.associations[association];

    this.associationField = this.sourceCollection.getField(association);

    this.targetModel = this.association.target;
    this.targetCollection = this.sourceCollection.context.database.modelCollection.get(this.targetModel);
  }

  targetKey() {
    return this.associationField.targetKey;
  }

  protected accessors() {
    return (<BelongsTo | HasOne | HasMany | BelongsToMany>this.association).accessors;
  }

  async create(options?: CreateOptions): Promise<any> {
    const createAccessor = this.accessors().create;

    const guard = UpdateGuard.fromOptions(this.targetModel, options);
    const values = options.values;

    const sourceModel = await this.getSourceModel();

    const instance = await sourceModel[createAccessor](guard.sanitize(options.values), options);

    await updateAssociations(instance, values, options);

    return instance;
  }

  async getSourceModel(transaction?: any) {
    if (!this.sourceInstance) {
      this.sourceInstance = await this.sourceCollection.model.findOne({
        where: {
          [this.associationField.sourceKey]: this.sourceKeyValue,
        },
      });
    }

    return this.sourceInstance;
  }

  protected buildQueryOptions(options: FindOptions) {
    const parser = new OptionsParser(options, {
      collection: this.targetCollection,
    });
    const params = parser.toSequelizeParams();
    return { ...options, ...params };
  }

  protected parseFilter(filter: Filter) {
    const parser = new FilterParser(this.targetModel, this.sourceCollection.context.database, filter);
    return parser.toSequelizeParams();
  }

  protected async getTransaction(options: any, autoGen = false): Promise<Transaction | null> {
    if (lodash.isPlainObject(options) && options.transaction) {
      return options.transaction;
    }

    if (autoGen) {
      return await this.sourceCollection.model.sequelize.transaction();
    }

    return null;
  }
}
