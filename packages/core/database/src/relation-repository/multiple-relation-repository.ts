import { omit } from 'lodash';
import { MultiAssociationAccessors, Op, Sequelize, Transaction, Transactionable } from 'sequelize';
import {
  CommonFindOptions,
  CountOptions,
  DestroyOptions,
  Filter,
  FilterByTk,
  FindOptions,
  TargetKey,
  TK,
  UpdateOptions,
} from '../repository';
import { updateModelByValues } from '../update-associations';
import { UpdateGuard } from '../update-guard';
import { RelationRepository, transaction } from './relation-repository';
import { handleAppendsQuery } from '../utils';

export interface FindAndCountOptions extends CommonFindOptions {}

export interface FindOneOptions extends CommonFindOptions, FilterByTk {}

export interface AssociatedOptions extends Transactionable {
  tk?: TK;
}

export abstract class MultipleRelationRepository extends RelationRepository {
  extendFindOptions(findOptions) {
    return findOptions;
  }

  async find(options?: FindOptions): Promise<any> {
    const transaction = await this.getTransaction(options);

    const findOptions = {
      ...this.extendFindOptions(
        this.buildQueryOptions({
          ...options,
        }),
      ),
      subQuery: false,
    };

    const getAccessor = this.accessors().get;
    const sourceModel = await this.getSourceModel(transaction);

    if (findOptions.include && findOptions.include.length > 0) {
      const ids = (
        await sourceModel[getAccessor]({
          ...findOptions,
          includeIgnoreAttributes: false,
          attributes: [this.targetKey()],
          group: `${this.targetModel.name}.${this.targetKey()}`,
          transaction,
        })
      ).map((row) => {
        return { row, pk: row.get(this.targetKey()) };
      });

      if (ids.length == 0) {
        return [];
      }

      return await handleAppendsQuery({
        templateModel: ids[0].row,
        queryPromises: findOptions.include.map((include) => {
          return sourceModel[getAccessor]({
            ...omit(findOptions, ['limit', 'offset']),
            include: [include],
            where: {
              [this.targetKey()]: {
                [Op.in]: ids.map((id) => id.pk),
              },
            },
            transaction,
          }).then((rows) => {
            return { rows, include };
          });
        }),
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
    let handleKeys = options['tk'];

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

    const guard = UpdateGuard.fromOptions(this.targetModel, options);

    const values = guard.sanitize(options.values);

    const queryOptions = this.buildQueryOptions(options as any);

    const instances = await this.find({
      ...queryOptions,
      transaction,
    });

    for (const instance of instances) {
      await updateModelByValues(instance, values, {
        ...options,
        sanitized: true,
        sourceModel: this.sourceInstance,
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

  async destroy(options?: TK | DestroyOptions): Promise<Boolean> {
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
