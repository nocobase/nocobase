import {
  InitOptions,
  ModelAttributes,
  ModelOptions,
  ModelIndexesOptions,
  Utils,
  SyncOptions,
} from 'sequelize';
import {
  buildField,
  FieldOptions,
  Relation,
  BELONGSTO,
  BELONGSTOMANY,
  SORT
} from './fields';
import Database from './database';
import { Model, ModelCtor } from './model';
import _ from 'lodash';
import merge from 'deepmerge';

export interface MergeOptions extends merge.Options {

}

const registeredModels = new Map<string, any>();

export function registerModel(key: string, model: any) {
  registeredModels.set(key, model);
}

export function registerModels(models) {
  for (const key in models) {
    if (models.hasOwnProperty(key)) {
      registerModel(key, models[key]);
    }
  }
}

// TODO: 判断如果 key 是 model 直接返回
export function getRegisteredModel(key) {
  if (typeof key === 'string') {
    return registeredModels.get(key);
  }
  return key;
}

export interface TableOptions extends Omit<ModelOptions<Model>, 'name' | 'modelName'> {

  /**
   * 唯一标识，与 ModelOptions 的 name 有区别
   * 
   * 注意：name 可用于初始化 tableName、modelName，但是 tableName 和 modelName 可能有所不同
   * name 主要用于获取指定的 tables 和 models
   * 如果没有特殊指定 tableName 时，name、tableName、modelName 都是一个值
   * 
   * TODO: name, tableName, modelName，freezeTableName，underscored，单复数等等情况还比较混乱
   */
  name: string;

  /**
   * 自定义 model
   */
  model?: ModelCtor<Model> | string;

  /**
   * 字段配置
   */
  fields?: Array<FieldOptions>;

  /**
   * 其他的一些情况
   */
  [key: string]: any;
}

/**
 * 上下文，Tabel 配置需要的其他变量
 */
export interface TabelContext {
  database: Database;
}

/**
 * 是否重新初始化 Model。配置更新时，需要重新初始化 model。
 *
 * - reinitialize = false 只执行 Model.init
 * - reinitialize = true 重新初始化 Model 并执行 Model.init 和 Model.associate
 * - reinitialize = modelOnly 只初始化 Model 并执行 Model.init
 */
export type Reinitialize = boolean | 'modelOnly';

/**
 * 表配置
 * 
 * 用于处理相关 Model 的配置
 */
export class Table {

  protected database: Database;

  protected options: TableOptions;

  protected fields = new Map<string, any>();

  protected modelAttributes: ModelAttributes;

  protected modelOptions: InitOptions;

  /**
   * 全部关系字段的配置
   */
  protected associations = new Map<string, Relation>();

  /**
   * 待建立关系的 association
   */
  protected associating = new Map<string, Relation>();

  /**
   * 索引
   */
  protected indexes = new Map<string, any>();

  protected Model: ModelCtor<Model>;

  protected defaultModel: ModelCtor<Model>;

  /**
   * 是否是中间表
   */
  public isThroughTable: boolean = false;

  public relationTables = new Set<string>();

  get sortable(): boolean {
    return Array.from(this.fields.values()).some(field => field instanceof SORT);
  }

  constructor(options: TableOptions, context: TabelContext) {
    const { database } = context;
    database.runHooks('beforeTableInit', options);
    const {
      model,
      fields = [],
      indexes = [],
    } = options;
    this.options = options;
    this.database = database;
    // 初始化的时候获取
    this.defaultModel = getRegisteredModel(model);
    this.modelAttributes = {};
    // 在 set fields 之前 model init 的原因是因为关系字段可能需要用到 model 的相关配置
    // @ts-ignore
    this.addIndexes(indexes, 'modelOnly');
    // this.modelInit('modelOnly');
    this.setFields(fields);
    database.runHooks('afterTableInit', this);
  }

  public modelInit(reinitialize: Reinitialize = false) {
    if (reinitialize || !this.Model) {
      this.Model = this.defaultModel || class extends Model { };
      this.Model.database = this.database;
      // 关系的建立是在 model.init 之后，在配置中表字段（Column）和关系（Relation）都在 fields，
      // 所以需要单独提炼出 associations 字段，并在 Model.init 之后执行 Model.associate
      // @ts-ignore
      this.Model.associate = (models: { [key: string]: ModelCtor<Model> }) => {
        for (const [key, association] of this.associating) {
          const { type, target } = association.getAssociationArguments();
          if (this.database.isDefined(target)) {
            const TargetModel = this.database.getModel(target);
            // 如果关系表在之后才定义，未设置 targetKey 时，targetKey 默认值需要在 target model 初始化之后才能取到
            if (association instanceof BELONGSTO || association instanceof BELONGSTOMANY) {
              association.updateOptionsAfterTargetModelBeDefined();
            }
            this.Model[type](TargetModel, association.getAssociationOptions());
            // 建立关系之后，需要删除待处理的 associating，避免重复和提高效率
            this.associating.delete(key);
          }
        }
      }
    }

    this.Model.init(this.getModelAttributes(), this.getModelOptions());

    if (reinitialize === true) {
      this.associating = new Map(this.associations);
      // 需要额外处理 associating 的情况
      // 建立表关系需要遍历多个 Model，所以在这里需要标记哪些已定义的 Model 需要建立表关系
      if (this.associating.size > 0) {
        this.database.associating.add(this.options.name);
      } else {
        this.database.associating.delete(this.options.name);
      }
      this.database.associate();
    }
  }

  public getName(): string {
    return this.options.name;
  }

  public getTableName(): string {
    return this.options.name;
  }

  /**
   * 
   * @param key 获取数据表配置，也可以指定 key
   */
  public getOptions(key?: any): TableOptions {
    return key ? _.get(this.options, key) : this.options;
  }

  public getModel(): ModelCtor<Model> {
    return this.database.getModel(this.getName());
  }

  public getModelAttributes(): ModelAttributes {
    return this.modelAttributes;
  }

  public getModelOptions(): InitOptions {
    const {
      name,
      underscored = true,
      ...restOptions
    } = this.options;
    const hooks = _.get(this.getModel(), 'options.hooks') || this.options.hooks || {};
    return {
      underscored,
      modelName: name,
      tableName: name,
      sequelize: this.database.sequelize,
      createdAt: Utils.underscoredIf('createdAt', underscored),
      updatedAt: Utils.underscoredIf('updatedAt', underscored),
      indexes: Array.from(this.indexes.values()),
      // freezeTableName: true,
      ..._.omit(restOptions, ['model', 'fields', 'indexes']),
      hooks,
    };
  }

  /**
   * 获取相关 table names，一般用于 sync
   */
  public getRelatedTableNames(): Set<string> {
    const names = new Set<string>();
    this.options.name && names.add(this.options.name);
    for (const association of this.associations.values()) {
      const target = association.getTarget();
      target && names.add(target);
      if (association instanceof BELONGSTOMANY) {
        const throughName = association.getThroughName();
        throughName && names.add(throughName);
      }
    }
    return names;
  }

  public getAssociations() {
    return this.associations;
  }

  public getFields() {
    return this.fields;
  }

  public setFields(fields: Array<FieldOptions>) {
    this.fields.clear();
    this.associating.clear();
    this.associations.clear();
    for (const key in fields) {
      this.addField(fields[key], false);
    }
    this.modelInit(true);
  }

  public hasField(name: string) {
    return this.fields.has(name);
  }

  public getField(name: string) {
    return this.fields.get(name);
  }

  /**
   * 添加字段
   * 
   * @param options 
   * @param reinitialize 
   */
  public addField(options: FieldOptions, reinitialize: Reinitialize = true) {
    this.database.runHooks('beforeAddField', options, this);
    const { name, index } = options;
    const field = buildField(options, {
      sourceTable: this,
      database: this.database,
    });
    // 添加字段后 table.options 中的 fields 并不会更新，这导致 table.getOptions() 拿不到最新的字段配置
    // 所以在同时更新 table.options.fields 数组
    if (!this.options.fields) {
      this.options.fields = [];
    }
    const existIndex = this.options.fields.findIndex(field => field.name === name);
    if (existIndex !== -1) {
      this.options.fields.splice(existIndex, 1, options);
    } else {
      this.options.fields.push(options);
    }

    this.fields.set(name, field);

    if (field instanceof Relation) {
      // 关系字段先放到 associating 里待处理，等相关 target model 初始化之后，再通过 associate 建立关系
      this.associating.set(name, field);
      this.associations.set(name, field);
    } else {
      if (index === true) {
        this.addIndex(name, false);
      } else if (typeof index === 'object') {
        this.addIndex({
          fields: [name],
          ...index,
        }, false);
      }
      this.modelAttributes[name] = field.getAttributeOptions();
    }
    this.modelInit(reinitialize);
    this.database.runHooks('afterAddField', field, this);
    return field;
  }

  /**
   * 添加索引
   * 
   * @param indexOptions 
   * @param reinitialize 
   */
  public addIndex(indexOptions: string | ModelIndexesOptions, reinitialize: Reinitialize = true) {
    const options = typeof indexOptions === 'string' ? {
      fields: [indexOptions],
    } : indexOptions;
    // @ts-ignore
    const index = Utils.nameIndex(options, this.options.name);
    console.log(this.options, { index, options });
    this.indexes.set(index.name, {
      type: '',
      parser: null,
      ...index,
    });
    this.modelInit(reinitialize);
  }

  /**
   * 批量添加索引
   * 
   * @param indexes 
   * @param reinitialize 
   */
  public addIndexes(indexes: Array<string | ModelIndexesOptions>, reinitialize: Reinitialize = true) {
    for (const index in indexes) {
      this.addIndex(indexes[index], false);
    }
    this.modelInit(reinitialize);
  }

  /**
   * 扩展（实验性 API）
   * 
   * @param options 
   */
  public extend(options: TableOptions, mergeOptions: MergeOptions = {}) {
    const {
      fields = [],
      indexes = [],
      model,
      ...restOptions
    } = options;
    if (model) {
      this.defaultModel = getRegisteredModel(model);
    }
    const { arrayMerge = (target: any[], source: any[]) => source } = mergeOptions;
    this.options = merge(this.options, restOptions, {
      arrayMerge,
      ...mergeOptions,
    });
    for (const key in fields) {
      this.addField(fields[key], false);
    }
    // @ts-ignore
    this.addIndexes(indexes, false);
    this.modelInit(true);
  }

  /**
   * 相关表字段更新
   * 
   * @param options 
   */
  public async sync(options: SyncOptions = {}) {
    const tables = [];
    for (const name of this.getRelatedTableNames()) {
      tables.push(name);
    }
    return this.database.sync({
      ...options,
      tables,
    });
  }
}

export default Table;
