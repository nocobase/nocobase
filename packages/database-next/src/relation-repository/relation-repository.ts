import {
  Association,
  BelongsTo,
  BelongsToMany,
  HasMany,
  HasOne,
  Model,
  ModelCtor,
  Transaction,
} from 'sequelize';
import { OptionsParser } from '../optionsParser';
import { Collection } from '../collection';
import {
  AssociationKeysToBeUpdate,
  BlackList,
  Filter,
  FindOptions,
  TransactionAble,
  Values,
  WhiteList,
} from '../repository';
import FilterParser from '../filterParser';
import { UpdateGuard } from '../update-guard';
import {
  updateAssociations,
  updateModelByValues,
} from '../update-associations';
import lodash from 'lodash';
import { PrimaryKey } from './types';

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

export interface UpdateOptions extends TransactionAble {
  values: Values;
  filter?: Filter;
  filterByPk?: PrimaryKey;
  whitelist?: WhiteList;
  blacklist?: BlackList;
  updateAssociationValues?: AssociationKeysToBeUpdate;
}

/**
 * inject transaction to decorated function
 *
 * @param transactionInjector
 */
export function transaction(transactionInjector?) {
  return (target, name, descriptor) => {
    const oldValue = descriptor.value;

    descriptor.value = async function () {
      let transaction;
      let newTransaction = false;

      if (arguments.length > 0 && typeof arguments[0] === 'object') {
        transaction = arguments[0]['transaction'];
      }

      if (!transaction) {
        transaction = await this.source.model.sequelize.transaction();
        newTransaction = true;
      }

      // 需要将 newTransaction 注入到被装饰函数参数内
      if (newTransaction) {
        try {
          let callArguments;
          if (lodash.isPlainObject(arguments[0])) {
            callArguments = {
              ...arguments[0],
              transaction,
            };
          } else if (transactionInjector) {
            callArguments = transactionInjector(arguments, transaction);
          } else {
            throw new Error(
              `please provide transactionInjector for ${name} call`,
            );
          }

          const results = await oldValue.apply(this, [callArguments]);

          await transaction.commit();

          return results;
        } catch (err) {
          await transaction.rollback();
          throw err;
        }
      } else {
        return oldValue.apply(this, arguments);
      }
    };

    return descriptor;
  };
}

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

  async getSourceModel(transaction?: any) {
    if (!this.sourceModel) {
      this.sourceModel = await this.source.model.findByPk(this.sourceId, {
        transaction,
      });
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

  protected parseFilter(filter: Filter) {
    const parser = new FilterParser(
      this.target,
      this.source.context.database,
      filter,
    );
    return parser.toSequelizeParams();
  }

  protected async getTransaction(
    options: any,
    autoGen = false,
  ): Promise<Transaction | null> {
    if (
      options &&
      typeof options === 'object' &&
      !Array.isArray(options) &&
      options.transaction
    ) {
      return options.transaction;
    }

    if (autoGen) {
      return await this.source.model.sequelize.transaction();
    }

    return null;
  }
}
