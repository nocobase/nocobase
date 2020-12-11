import {
  Model as SequelizeModel, Op, Sequelize, ProjectionAlias, Utils, SaveOptions
} from 'sequelize';
import Database from './database';
import {
  getDataTypeKey,
  HASONE,
  HASMANY,
  BELONGSTO,
  BELONGSTOMANY,
} from './fields';
import { toInclude } from './utils';

export interface ApiJsonOptions {

  /**
   * 字段
   * 
   * 数组式：
   * ['col', 'association.col1', 'association_count'],
   * 
   * 白名单：
   * {
   *   only: ['col1'],
   *   appends: ['association_count'],
   * }
   * 
   * 黑名单：
   * {
   *   except: ['col1'],
   *   appends: ['association_count'],
   * }
   */
  fields?: string[] | {
    only?: string[];
    appends?: string[];
  } | {
    except?: string[];
    appends?: string[];
  };

  /**
   * 过滤
   * 
   * 常规用法：
   * {
   *   col1: {
   *     $eq: 'val1'
   *   },
   * }
   * 
   * scope 的用法（如果 scope 与 col 同名，只会执行 scope）：
   * {
   *   scope1: value
   * }
   * 
   * json 数据 & 关系数据，可以用点号：
   * {
   *   'association.col1': {
   *     $eq: 'val1'
   *   },
   * }
   *
   * meta 为 json 字段时
   * {
   *   'meta.key': {
   *     $eq: 'val1'
   *   },
   * }
   * 
   * json 数据 & 关系数据的查询也可以不用点号：
   * {
   *   association: {
   *     col1: {
   *       $eq: 'val1'
   *     },
   *   },
   * }
   */
  filter?: any;

  /**
   * 排序
   * 
   * TODO
   * 
   * ['col1', '-col2', 'association.col1', '-association.col2']
   */
  sort?: any;

  /**
   * 页码
   */
  page?: number;
  perPage?: number;

  context?: any;

  [key: string]: any;
}

export interface WithCountAttributeOptions {

  /**
   * 关系名
   */
  association: string;

  /**
   * SourceModel 别名
   * 
   * 在 include 里使用时，需要指定，一般与 include 的 association 同名
   * 
   * include: {
   *   association: 'user', // Post.belongsTo(User)
   *   attributes: [
   *     User.withCountAttribute({
   *       association: 'posts',
   *       sourceAlias: 'user', // 内嵌时，需要指定 source 别名
   *     })
   *   ]
   * }
   */
  sourceAlias?: string;

  where?: any;

  /**
   * 别名，默认为 association_count
   */
  alias?: string;

  [key: string]: any;
}

export const DEFAULT_OFFSET = 0;
export const DEFAULT_LIMIT = 100;
export const MAX_LIMIT = 500;

/**
 * Model 相关
 * 
 * TODO: 自定义 model 时的提示问题
 */
// @ts-ignore
export abstract class Model extends SequelizeModel {

  /**
   * 防止 ts 报错提示
   */
  [key: string]: any;

  /**
   * 当前 Model 的 database
   * 
   * 与 Model.sequelize 对应，database 也用了 public static readonly
   */
  public static database: Database;

  /**
   * 供 model 实例访问的 database
   */
  get database(): Database {
    // @ts-ignore
    return this.constructor.database;
  }

  /**
   * sub query 关联数据的数量
   * 
   * TODO: 关联字段暂不支持主键以外的字段
   * 
   * @param options 
   */
  static withCountAttribute(options?: string | WithCountAttributeOptions): (string | ProjectionAlias) {
    if (typeof options === 'string') {
      options = { association: options };
    }

    const { sourceAlias, association, where = {}, alias, ...restOptions } = options;
    const associator = this.associations[association];
    const table = this.database.getTable(this.name);
    const field = table.getField(association);
    const { targetKey, otherKey, foreignKey, sourceKey } = field.options as any;

    if (associator.associationType === 'HasMany') {
      where[foreignKey as string] = {
        [Op.eq]: Sequelize.col(`${sourceAlias||this.name}.${sourceKey}`),
      };
    } else if (associator.associationType === 'BelongsToMany') {
      where[targetKey] = {
        // @ts-ignore
        [Op.in]: Sequelize.literal(`(${associator.through.model.selectQuery({
          attributes: [otherKey],
          where: {
            [foreignKey]: {
              [Op.eq]: Sequelize.col(`${sourceAlias||this.name}.${sourceKey}`),
            },
            // @ts-ignore
            ...(associator.through.scope||{}),
          },
        })})`),
      };
    }

    let countLiteral = 'count(*)';

    if (this.database.sequelize.getDialect() === 'postgres') {
      countLiteral = 'cast(count(*) as integer)';
    }

    const attribute = [
      Sequelize.literal(
        // @ts-ignore
        `(${associator.target.selectQuery({
          ...restOptions,
          attributes: [[Sequelize.literal(countLiteral), 'count']],
          where: {
            // @ts-ignore
            ...where, ...(associator.scope||{}),
          },
        })})`
      ),
      alias || Utils.underscoredIf(`${association}Count`, this.options.underscored),
    ].filter(Boolean);

    return attribute as ProjectionAlias;
  }

  /**
   * 当前 Model 的 SQL
   * 
   * @param options 
   */
  static selectQuery(options = {}): string {
    // @ts-ignore
    return this.queryGenerator.selectQuery(
      this.getTableName(), 
      options,
      this,
    ).replace(/;$/, '');
  }

  static parseApiJson(options: ApiJsonOptions) {
    const { fields, filter, sort, context, page, perPage } = options;
    const data = toInclude({fields, filter, sort}, {
      model: this,
      associations: this.associations,
      dialect: this.sequelize.getDialect(),
      ctx: context,
    });
    if (page || perPage) {
      data.limit = perPage === -1 ? MAX_LIMIT : Math.min(perPage || DEFAULT_LIMIT, MAX_LIMIT);
      data.offset = data.limit * (page > 0 ? page - 1 : DEFAULT_OFFSET);
    }
    if (data.attributes && data.attributes.length === 0) {
      delete data.attributes;
    }
    return data;
  }

  getScopeWhere(scope: string[] = []) {
    const Model = this.constructor as ModelCtor<Model>;
    const table = this.database.getTable(this.constructor.name);
    const associations = table.getAssociations();
    const where = {};
    scope.forEach(col => {
      const association = associations.get(col);
      const dataKey = association && association instanceof BELONGSTO
        ? association.options.foreignKey
        : col;
      if (!Model.rawAttributes[dataKey]) {
        return;
      }
      const value = this.getDataValue(dataKey);
      if (typeof value !== 'undefined') {
        where[dataKey] = value;
      }
    });
    return where;
  }

  async updateSingleAssociation(key: string, data: any, options: SaveOptions<any> & { context?: any; } = {}) {
    const {
      fields,
      transaction = await this.sequelize.transaction(),
      ...opts
    } = options;
    Object.assign(opts, { transaction });

    const table = this.database.getTable(this.constructor.name);
    const association = table.getAssociations().get(key);
    const accessors = association.getAccessors();

    if (typeof data === 'number' || typeof data === 'string' || data instanceof SequelizeModel) {
      await this[accessors.set](data, opts);
    } else if (typeof data === 'object') {
      const Target = association.getTargetModel();
      const targetAttribute = association instanceof BELONGSTO 
        ? association.options.targetKey 
        : association.options.sourceKey;
      if (data[targetAttribute]) {
        await this[accessors.set](data[targetAttribute], opts);
        if (Object.keys(data).length > 1) {
          const target = await Target.findOne({
            where: {
              [targetAttribute]: data[targetAttribute],
            },
            transaction
          });
          await target.update(data, opts);
          // @ts-ignore
          await target.updateAssociations(data, opts);
        }
      } else {
        const t = await this[accessors.create](data, opts);
        await t.updateAssociations(data, opts);
      }
    }
    if (!options.transaction) {
      await transaction.commit();
    }
  }

  async updateMultipleAssociation(associationName: string, data: any, options: SaveOptions<any> & { context?: any; } = {}) {
    const items = Array.isArray(data) ? data : [data];
    if (!items.length) {
      return;
    }

    const {
      fields,
      transaction = await this.sequelize.transaction(),
      ...opts
    } = options;
    Object.assign(opts, { transaction });

    const table = this.database.getTable(this.constructor.name);
    const association = table.getAssociations().get(associationName);
    const accessors = association.getAccessors();
    const Target = association.getTargetModel();
    // 当前表关联 target 表的外键（大部分情况与 target 表主键相同，但可以设置为不同的，要考虑）
    const { targetKey = Target.primaryKeyAttribute } = association.options;
    // target 表的主键
    const targetPk = Target.primaryKeyAttribute;
    const targetKeyIsPk = targetKey === targetPk;
    // 准备设置的关联主键
    const toSetPks = new Set();
    const toSetUks = new Set();
    // 筛选后准备设置的关联主键
    const toSetItems = new Set();
    // 准备添加的关联对象
    const toUpsertObjects = [];

    // 遍历所有值成员准备数据
    items.forEach(item => {
      if (item instanceof SequelizeModel) {
        if (targetKeyIsPk) {
          toSetPks.add(item.getDataValue(targetPk));
        } else {
          toSetUks.add(item.getDataValue(targetKey));
        }
        return;
      }
      if (typeof item === 'number' || typeof item === 'string') {
        let targetKeyType = getDataTypeKey(Target.rawAttributes[targetKey].type).toLocaleLowerCase();
        if (targetKeyType === 'integer') {
          targetKeyType = 'number';
        }
        // 如果传值类型与之前在 Model 上定义的 targetKey 不同，则报错。
        // 不应兼容定义的 targetKey 不是 primaryKey 却传了 primaryKey 的值的情况。
        if (typeof item !== targetKeyType) {
          throw new Error(`target key type [${typeof item}] does not match to [${targetKeyType}]`);
        }
        if (targetKeyIsPk) {
          toSetPks.add(item);
        } else {
          toSetUks.add(item);
        }
        return;
      }
      if (typeof item === 'object') {
        toUpsertObjects.push(item);
      }
    });

    /* 仅传关联键处理开始 */
    // 查找已存在的数据
    const byPkExistItems = toSetPks.size ? await Target.findAll({
      ...opts,
      // @ts-ignore
      where: {
        [targetPk]: {
          [Op.in]: Array.from(toSetPks)
        }
      },
      attributes: [targetPk]
    }) : [];
    byPkExistItems.forEach(item => {
      toSetItems.add(item);
    });

    const byUkExistItems = toSetUks.size ? await Target.findAll({
      ...opts,
      // @ts-ignore
      where: {
        [targetKey]: {
          [Op.in]: Array.from(toSetUks)
        }
      },
      attributes: [targetPk, targetKey]
    }) : [];
    byUkExistItems.forEach(item => {
      toSetItems.add(item);
    });
    /* 仅传关联键处理结束 */

    const belongsToManyList = [];
    /* 值为对象处理开始 */
    for (const item of toUpsertObjects) {
      let target;
      if (typeof item[targetKey] === 'undefined') {
        target = await this[accessors.create](item, opts);
      } else {
        target = await Target.findOne({
          ...opts,
          where: { [targetKey]: item[targetKey] },
        });
        if (!target) {
          target = await this[accessors.create](item, opts);
        } else {
          await target.update(item, opts);
        }
      }
      // TODO(optimize): 此处添加的对象其实已经创建了关联，
      // 但考虑到单条 create 的 hook 要求带上关联键，且后面的 set，
      // 所以仍然交给 set 再调用关联一次。
      toSetItems.add(target);

      if (association instanceof BELONGSTOMANY) {
        belongsToManyList.push({
          item,
          target
        });
      }

      await target.updateAssociations(item, opts);
    }
    /* 值为对象处理结束 */

    // 添加所有计算后的关联
    await this[accessors.set](Array.from(toSetItems), opts);

    // 后处理 belongsToMany 的更新内容
    if (belongsToManyList.length) {
      const ThroughModel = (association as BELONGSTOMANY).getThroughModel();
      const throughName = (association as BELONGSTOMANY).getThroughName();

      for (const { item, target } of belongsToManyList) {
        const throughValues = item[throughName];
        if (typeof throughValues === 'object') {
          const { foreignKey, sourceKey, otherKey } = association.options;
          const through = await ThroughModel.findOne({
            where: {
              [foreignKey]: this.get(sourceKey),
              [otherKey]: target.get(targetKey),
            },
            transaction
          });
          await through.update(throughValues, opts);
          await through.updateAssociations(throughValues, opts);
        }
      }
    }

    if (!options.transaction) {
      await transaction.commit();
    }
  }

  async updateAssociation(key: string, data: any, options: SaveOptions<any> & { context?: any; }) {
    const table = this.database.getTable(this.constructor.name);
    const association = table.getAssociations().get(key);
    switch (true) {
      case association instanceof BELONGSTO:
      case association instanceof HASONE:
        return this.updateSingleAssociation(key, data, options);
      case association instanceof HASMANY:
      case association instanceof BELONGSTOMANY:
        return this.updateMultipleAssociation(key, data, options);
    }
  }

  /**
   * 关联数据的更新
   * 
   * TODO: 暂不支持除主键以外关联字段的更新
   * 
   * @param data
   */
  async updateAssociations(data: any, options: SaveOptions & { context?: any } = {}) {
    const { transaction = await this.sequelize.transaction() } = options;
    const table = this.database.getTable(this.constructor.name);
    for (const key of table.getAssociations().keys()) {
      if (!data[key]) {
        continue;
      }
      await this.updateAssociation(key, data[key], {
        ...options,
        transaction
      });
    }

    if (!options.transaction) {
      await transaction.commit();
    }
  }
}

/**
 * ModelCtor 需要为当前 Model 的
 */
export type ModelCtor<M extends Model> = typeof Model & { new(): M } & { [key: string]: any };

export default Model;
