import lodash, { omit } from 'lodash';
import { SingleAssociationAccessors, Transactionable } from 'sequelize';
import { Model } from '../model';
import { Appends, Except, Fields, Filter, TargetKey, UpdateOptions } from '../repository';
import { updateModelByValues } from '../update-associations';
import { RelationRepository, transaction } from './relation-repository';
import { handleAppendsQuery } from '../utils';

export interface SingleRelationFindOption extends Transactionable {
  fields?: Fields;
  except?: Except;
  appends?: Appends;
  filter?: Filter;
}

interface SetOption extends Transactionable {
  tk?: TargetKey;
}

export abstract class SingleRelationRepository extends RelationRepository {
  @transaction()
  async remove(options?: Transactionable): Promise<void> {
    const transaction = await this.getTransaction(options);
    const sourceModel = await this.getSourceModel(transaction);
    return await sourceModel[this.accessors().set](null, {
      transaction,
    });
  }

  @transaction((args, transaction) => {
    return {
      tk: args[0],
      transaction,
    };
  })
  async set(options: TargetKey | SetOption): Promise<void> {
    const transaction = await this.getTransaction(options);
    let handleKey = lodash.isPlainObject(options) ? (<SetOption>options).tk : options;

    const sourceModel = await this.getSourceModel(transaction);

    return await sourceModel[this.accessors().set](handleKey, {
      transaction,
    });
  }

  async find(options?: SingleRelationFindOption): Promise<Model<any>> {
    const transaction = await this.getTransaction(options);

    const findOptions = this.buildQueryOptions({
      ...options,
    });

    const getAccessor = this.accessors().get;
    const sourceModel = await this.getSourceModel(transaction);

    if (findOptions?.include?.length > 0) {
      const templateModel = await sourceModel[getAccessor]({
        ...findOptions,
        includeIgnoreAttributes: false,
        transaction,
        attributes: [this.targetKey()],
        group: `${this.targetModel.name}.${this.targetKey()}`,
      });

      const results = await handleAppendsQuery({
        templateModel,
        queryPromises: findOptions.include.map((include) => {
          return sourceModel[getAccessor]({
            ...findOptions,
            include: [include],
          }).then((row) => {
            return { rows: [row], include };
          });
        }),
      });

      return results[0];
    }

    return await sourceModel[getAccessor]({
      ...findOptions,
      transaction,
    });
  }

  async findOne(options?: SingleRelationFindOption): Promise<Model<any>> {
    return this.find({ ...options, filterByTk: null } as any);
  }

  @transaction()
  async destroy(options?: Transactionable): Promise<Boolean> {
    const transaction = await this.getTransaction(options);

    const target = await this.find({
      transaction,
    });

    await target.destroy({
      transaction,
    });

    return true;
  }

  @transaction()
  async update(options: UpdateOptions): Promise<any> {
    const transaction = await this.getTransaction(options);

    const target = await this.find({
      transaction,
    });

    if (!target) {
      throw new Error('The record does not exist');
    }

    await updateModelByValues(target, options?.values, {
      ...lodash.omit(options, 'values'),
      transaction,
    });

    return target;
  }

  accessors() {
    return <SingleAssociationAccessors>super.accessors();
  }
}
