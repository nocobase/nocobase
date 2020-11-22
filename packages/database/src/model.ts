import {
  Model as SequelizeModel, Op, Sequelize, ProjectionAlias, Utils, SaveOptions,
} from 'sequelize';
import Database from './database';
import { HasOne, HasMany, BelongsTo, BelongsToMany, getDataTypeKey } from './fields';
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
    // 这里可以认为 parseApiJson 之前的 action.params 已经解决了默认值的问题
    // 只要有值都应该是成对出现
    if (page && perPage) {
      data.limit = perPage;
      data.offset = data.limit * (page > 0 ? page - 1 : 0);
    }
    if (data.attributes && data.attributes.length === 0) {
      delete data.attributes;
    }
    return data;
  }

  /**
   * 关联数据的更新
   * 
   * TODO: 暂不支持除主键以外关联字段的更新
   * 
   * @param data
   */
  async updateAssociations(data: any, options?: SaveOptions & { context?: any }) {
    const model = this;
    const name = this.constructor.name;
    const table = this.database.getTable(name);
    for (const [key, association] of table.getAssociations()) {
      if (!data[key]) {
        continue;
      }
      let item = data[key];
      const accessors = association.getAccessors();
      if (association instanceof BelongsTo || association instanceof HasOne) {
        if (typeof item === 'number' || typeof item === 'string') {
          await model[accessors.set](item, options);
          continue;
        }
        if (item instanceof SequelizeModel) {
          await model[accessors.set](item, options);
          continue;
        }
        if (typeof item !== 'object') {
          continue;
        }
        const Target = association.getTargetModel();
        const targetAttribute = association instanceof BelongsTo 
          ? association.options.targetKey 
          : association.options.sourceKey;
        if (item[targetAttribute]) {
          await model[accessors.set](item[targetAttribute], options);
          if (Object.keys(item).length > 1) {
            const target = await Target.findOne({
              where: {
                [targetAttribute]: item[targetAttribute],
              },
            });
            await target.update(item, options);
            // @ts-ignore
            await target.updateAssociations(item, options);
          }
          continue;
        }
        const t = await model[accessors.create](item, options);
        await t.updateAssociations(item, options);
      }
      if (association instanceof HasMany || association instanceof BelongsToMany) {
        if (!Array.isArray(item)) {
          item = [item];
        }
        if (item.length === 0) {
          continue;
        }
        await model[accessors.set](null, options);
        const Target = association.getTargetModel();
        await Promise.all(item.map(async value => {
          let target: SequelizeModel;
          let targetKey: string;
          // 支持 number 和 string 类型的字段作为关联字段
          if (typeof value === 'number' || typeof value === 'string') {
            targetKey = (association instanceof BelongsToMany ? association.options.targetKey : Target.primaryKeyAttribute) as string;
            let targetKeyType = getDataTypeKey(Target.rawAttributes[targetKey].type).toLocaleLowerCase();
            if (targetKeyType === 'integer') {
              targetKeyType = 'number';
            }
            let primaryKeyType = getDataTypeKey(Target.rawAttributes[Target.primaryKeyAttribute].type).toLocaleLowerCase();
            if (primaryKeyType === 'integer') {
              primaryKeyType = 'number';
            }
            if (typeof value === targetKeyType) {
              target = await Target.findOne({
                where: {
                  [targetKey] : value,
                },
              });
            }
            if (Target.primaryKeyAttribute !== targetKey && !target && typeof value === primaryKeyType) {
              target = await Target.findOne({
                where: {
                  [Target.primaryKeyAttribute] : value,
                },
              });
            }
            if (!target) {
              console.log(targetKey);
              throw new Error(`target [${value}] does not exist`);
            }
            return await model[accessors.add](target, options);
          }
          if (value instanceof SequelizeModel) {
            if (association instanceof HasMany) {
              return await model[accessors.add](value.getDataValue(Target.primaryKeyAttribute), options);
            }
            return await model[accessors.add](value, options);
          }
          if (typeof value !== 'object') {
            return;
          }
          targetKey = association.options.targetKey as string;
          // 如果有主键，直接查询主键
          if (value[Target.primaryKeyAttribute]) {
            target = await Target.findOne({
              where: {
                [Target.primaryKeyAttribute]: value[Target.primaryKeyAttribute],
              },
            });
          }
          // 如果主键和关系字段配置的不一样
          else if (Target.primaryKeyAttribute !== targetKey && value[targetKey]) {
            target = await Target.findOne({
              where: {
                [targetKey]: value[targetKey],
              },
            });
          }
          if (target) {
            await model[accessors.add](target, options);
            if (Object.keys(value).length > 1) {
              await target.update(value, options);
              // @ts-ignore
              await target.updateAssociations(value, options);
            }
            if (association instanceof BelongsToMany) {
              const ThroughModel = association.getThroughModel();
              const throughName = association.getThroughName();
              if (typeof value[throughName] === 'object') {
                const { foreignKey, sourceKey, otherKey, targetKey } = association.options;
                const through = await ThroughModel.findOne({
                  where: {
                    [foreignKey]: this.get(sourceKey),
                    [otherKey]: target.get(targetKey),
                  },
                });
                const throughValues = value[throughName];
                await through.update(throughValues);
                await through.updateAssociations(throughValues);
              }
            }
            return;
          }
          const t = await model[accessors.create](value, options);
          // console.log(t);
          await model[accessors.add](t, options);
          await t.updateAssociations(value, options);
          if (association instanceof BelongsToMany) {
            const ThroughModel = association.getThroughModel();
            const throughName = association.getThroughName();
            if (typeof value[throughName] === 'object') {
              const { foreignKey, sourceKey, otherKey, targetKey } = association.options;
              const through = await ThroughModel.findOne({
                where: {
                  [foreignKey]: this.get(sourceKey),
                  [otherKey]: t.get(targetKey),
                },
              });
              const throughValues = value[throughName];
              await through.update(throughValues);
              await through.updateAssociations(throughValues);
            }
          }
          return;
        }));
      }
    }
  }
}

/**
 * ModelCtor 需要为当前 Model 的
 */
export type ModelCtor<M extends Model> = typeof Model & { new(): M } & { [key: string]: any };

export default Model;
