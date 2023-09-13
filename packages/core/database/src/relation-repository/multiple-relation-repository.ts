import lodash from 'lodash';
import { HasOne, MultiAssociationAccessors, Sequelize, Transaction, Transactionable } from 'sequelize';
import injectTargetCollection from '../decorators/target-collection-decorator';
import {
  CommonFindOptions,
  CountOptions,
  DestroyOptions,
  Filter,
  FindOneOptions,
  FindOptions,
  TK,
  TargetKey,
  UpdateOptions,
} from '../repository';
import { updateModelByValues } from '../update-associations';
import { UpdateGuard } from '../update-guard';
import { RelationRepository, transaction } from './relation-repository';

export type FindAndCountOptions = CommonFindOptions;

export interface AssociatedOptions extends Transactionable {
  tk?: TK;
}

export abstract class MultipleRelationRepository extends RelationRepository {
  extendFindOptions(findOptions) {
    return findOptions;
  }

  async find(options?: FindOptions): Promise<any> {
    const targetRepository = this.targetCollection.repository;

    const association = this.association as any;

    const oneFromTargetOptions = {
      as: '_pivot_',
      foreignKey: association.otherKey,
      sourceKey: association.targetKey,
      realAs: association.through.model.name,
    };

    const pivotAssoc = new HasOne(association.target, association.through.model, oneFromTargetOptions);

    const appendFilter = {
      isPivotFilter: true,
      association: pivotAssoc,
      where: {
        [association.foreignKey]: this.sourceKeyValue,
      },
    };

    return targetRepository.find({
      include: [appendFilter],
      ...options,
    });
  }

  async findAndCount(options?: FindAndCountOptions): Promise<[any[], number]> {
    const transaction = await this.getTransaction(options, false);

    return [
      await this.find({
        ...options,
        transaction,
      }),
      await this.count({
        ...options,
        transaction,
      }),
    ];
  }

  async count(options?: CountOptions) {
    const transaction = await this.getTransaction(options);

    const sourceModel = await this.getSourceModel(transaction);
    if (!sourceModel) return 0;

    const queryOptions = this.buildQueryOptions(options);

    const count = await sourceModel[this.accessors().get]({
      where: queryOptions.where,
      include: queryOptions.include,
      includeIgnoreAttributes: false,
      attributes: [
        [
          Sequelize.fn(
            'COUNT',
            Sequelize.fn('DISTINCT', Sequelize.col(`${this.targetModel.name}.${this.targetKey()}`)),
          ),
          'count',
        ],
      ],
      raw: true,
      plain: true,
      transaction,
    });

    return parseInt(count.count);
  }

  async findOne(options?: FindOneOptions): Promise<any> {
    const transaction = await this.getTransaction(options, false);
    const rows = await this.find({ ...options, limit: 1, transaction });
    return rows.length == 1 ? rows[0] : null;
  }

  @transaction((args, transaction) => {
    return {
      tk: args[0],
      transaction,
    };
  })
  async remove(options: TargetKey | TargetKey[] | AssociatedOptions): Promise<void> {
    const transaction = await this.getTransaction(options);
    const sourceModel = await this.getSourceModel(transaction);
    await sourceModel[this.accessors().removeMultiple](this.convertTks(options), {
      transaction,
    });
    return;
  }

  @transaction()
  @injectTargetCollection
  async update(options?: UpdateOptions): Promise<any> {
    const transaction = await this.getTransaction(options);

    const guard = UpdateGuard.fromOptions(this.targetModel, options);

    const values = guard.sanitize(options.values);

    const instances = await this.find({
      ...(lodash.omit(options, ['values']) as any),
      transaction,
    });

    for (const instance of instances) {
      await updateModelByValues(instance, values, {
        ...options,
        sanitized: true,
        sourceModel: await this.getSourceModel(transaction),
        transaction,
      });
    }

    for (const instance of instances) {
      if (options.hooks !== false) {
        await this.db.emitAsync(`${this.targetCollection.name}.afterUpdateWithAssociations`, instance, {
          ...options,
          transaction,
        });
        await this.db.emitAsync(`${this.targetCollection.name}.afterSaveWithAssociations`, instance, {
          ...options,
          transaction,
        });
      }
    }

    return instances;
  }

  async destroy(options?: TK | DestroyOptions): Promise<boolean> {
    return false;
  }

  protected async destroyByFilter(filter: Filter, transaction?: Transaction) {
    const instances = await this.find({
      filter: filter,
      transaction,
    });

    return await this.destroy({
      filterByTk: instances.map((instance) => instance.get(this.targetCollection.filterTargetKey)),
      transaction,
    });
  }

  protected filterHasInclude(filter: Filter, options?: any) {
    const filterResult = this.parseFilter(filter, options);
    return filterResult.include && filterResult.include.length > 0;
  }

  protected accessors() {
    return <MultiAssociationAccessors>super.accessors();
  }
}
