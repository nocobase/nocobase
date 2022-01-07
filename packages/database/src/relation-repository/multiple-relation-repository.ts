import { RelationRepository, transaction } from './relation-repository';
import lodash, { omit } from 'lodash';
import { MultiAssociationAccessors, Op, Sequelize, Transaction } from 'sequelize';
import { UpdateGuard } from '../update-guard';
import { updateModelByValues } from '../update-associations';
import {
  CommonFindOptions,
  CountOptions,
  DestroyOptions,
  Filter,
  FilterByTk,
  FindOptions,
  PK,
  PrimaryKey,
  TransactionAble,
  UpdateOptions,
} from '../repository';

export interface FindAndCountOptions extends CommonFindOptions {}

export interface FindOneOptions extends CommonFindOptions, FilterByTk {}

export interface AssociatedOptions extends TransactionAble {
  tk?: PK;
}

export abstract class MultipleRelationRepository extends RelationRepository {
  targetKey() {
    return lodash.get(this.associationField(), 'options.targetKey', this.target.primaryKeyAttribute);
  }

  extendFindOptions(findOptions) {
    return findOptions;
  }

  async find(options?: FindOptions): Promise<any> {
    const transaction = await this.getTransaction(options);

    const findOptions = this.extendFindOptions(
      this.buildQueryOptions({
        ...options,
      }),
    );

    const getAccessor = this.accessors().get;
    const sourceModel = await this.getSourceModel(transaction);

    if (findOptions.include && findOptions.include.length > 0) {
      const ids = (
        await sourceModel[getAccessor]({
          ...findOptions,
          includeIgnoreAttributes: false,
          attributes: [this.targetKey()],
          group: `${this.target.name}.${this.targetKey()}`,
          transaction,
        })
      ).map((row) => row.get(this.targetKey()));

      return await sourceModel[getAccessor]({
        ...omit(findOptions, ['limit', 'offset']),
        where: {
          [this.targetKey()]: {
            [Op.in]: ids,
          },
        },
        transaction,
      });
    }

    return await sourceModel[getAccessor]({
      ...findOptions,
      transaction,
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
    const queryOptions = this.buildQueryOptions(options);

    const count = await sourceModel[this.accessors().get]({
      where: queryOptions.where,
      include: queryOptions.include,
      includeIgnoreAttributes: false,
      attributes: [
        [
          Sequelize.fn('COUNT', Sequelize.fn('DISTINCT', Sequelize.col(`${this.target.name}.${this.targetKey()}`))),
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
      pk: args[0],
      transaction,
    };
  })
  async remove(options: PrimaryKey | PrimaryKey[] | AssociatedOptions): Promise<void> {
    const transaction = await this.getTransaction(options);
    let handleKeys = options['pk'];

    if (!Array.isArray(handleKeys)) {
      handleKeys = [handleKeys];
    }

    const sourceModel = await this.getSourceModel(transaction);
    await sourceModel[this.accessors().removeMultiple](handleKeys, {
      transaction,
    });
    return;
  }

  @transaction()
  async update(options?: UpdateOptions): Promise<any> {
    const transaction = await this.getTransaction(options);

    const guard = UpdateGuard.fromOptions(this.target, options);

    const values = guard.sanitize(options.values);

    const queryOptions = this.buildQueryOptions(options as any);

    const instances = await this.find(queryOptions);

    for (const instance of instances) {
      await updateModelByValues(instance, values, {
        ...options,
        sanitized: true,
        sourceModel: this.sourceModel,
        transaction,
      });
    }

    return instances;
  }

  async destroy(options?: PK | DestroyOptions): Promise<Boolean> {
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

  protected filterHasInclude(filter: Filter) {
    const filterResult = this.parseFilter(filter);
    return filterResult.include && filterResult.include.length > 0;
  }
  protected accessors() {
    return <MultiAssociationAccessors>super.accessors();
  }
}
