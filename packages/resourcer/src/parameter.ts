import _ from 'lodash';



const types = new Map<string, typeof ActionParameter>();

export class ActionParameterTypes {
  static register(type: Exclude<string, '_'>, Type: typeof ActionParameter) {
    types.set(type, Type);
  }

  static get(type: string): typeof ActionParameter {
    return types.get(type);
  }
}



// TODO(optimize) 当前要兼容 resourcer 和 action 已有的参数形式
// 更好的情况可以定义参数从 ctx 对象中的来源路径，适应性可能更好
export abstract class ActionParameter {
  // TODO(optimize): 设计稍微有点奇怪
  // 选取未来传入参数集中的哪些键，同时值为默认值
  static picking: { [key: string]: any }

  // 默认逻辑是直接选取传入对象中的对应键
  static pick(params: { [key: string]: any }) {
    const result: { [key: string]: any } = {};
    Object.keys(this.picking).forEach(key => {
      if (typeof this.picking[key] !== 'undefined') {
        result[key] = this.picking[key];
      }
      if (typeof params[key] !== 'undefined') {
        result[key] = params[key];
      }
    });

    return result;
  }

  // 暂时以对象加一层包装，以便类似 pager 这样有多个参数的情况
  params: { [key: string]: any } = {};

  constructor(params) {
    this.merge(params);
  }

  get() {
    return _.cloneDeep(this.params);
  }

  merge(params, strategy?: string): void {
    this.params = ActionParameter.pick(params);
  }
}



export class FieldsParameter extends ActionParameter {
  static picking = { fields: {} };

  static parse(fields: any) {
    if (!fields) {
      return {}
    }
    if (typeof fields === 'string') {
      fields = fields.split(',').map(field => field.trim());
    }
    if (Array.isArray(fields)) {
      const onlyFields = [];
      const output: any = {};
      fields.forEach(item => {
        if (typeof item === 'string') {
          onlyFields.push(item);
        } else if (typeof item === 'object') {
          if (item.only) {
            onlyFields.push(...item.only.toString().split(','));
          }
          Object.assign(output, this.parse(item));
        }
      });
      if (onlyFields.length) {
        output.only = onlyFields;
      }
      return output;
    }
    if (fields.only && typeof fields.only === 'string') {
      fields.only = fields.only.split(',').map(field => field.trim());
    }
    if (fields.except && typeof fields.except === 'string') {
      fields.except = fields.except.split(',').map(field => field.trim());
    }
    if (fields.appends && typeof fields.appends === 'string') {
      fields.appends = fields.appends.split(',').map(field => field.trim());
    }
    return fields;
  }

  static intersect(defaults: any, inputs: any) {
    let fields: any = {};
    defaults = this.parse(defaults);
    inputs = this.parse(inputs);
    if (inputs.only) {
      // 前端提供 only，后端提供 only
      if (defaults.only) {
        fields.only = defaults.only.filter(field => inputs.only.includes(field))
      }
      // 前端提供 only，后端提供 except，输出 only 排除 except
      else if (defaults.except) {
        fields.only = inputs.only.filter(field => !defaults.except.includes(field))
      }
      // 前端提供 only，后端没有提供 only 或 except
      else {
        fields.only = inputs.only;
      }
    } else if (inputs.except) {
      // 前端提供 except，后端提供 only，只输出 only 里排除 except 的字段
      if (defaults.only) {
        fields.only = defaults.only.filter(field => !inputs.except.includes(field))
      }
      // 前端提供 except，后端提供 except 或不提供，合并 except
      else {
        fields.except = _.uniq([...inputs.except, ...(defaults.except||[])]);
      }
    }
    // 前端没提供 only 或 except
    else {
      fields = defaults;
    }
    // 如果前端提供了 appends
    if (!_.isEmpty(inputs.appends)) {
      fields.appends = _.uniq([...inputs.appends, ...(defaults.appends||[])]);
    }
    if (!fields.appends) {
      fields.appends = [];
    }
    return fields;
  }

  static append(defaults, inputs) {
    let fields: any = {};
    defaults = this.parse(defaults);
    inputs = this.parse(inputs);

    ['only', 'except', 'appends'].forEach(key => {
      fields[key] = _.uniq([...defaults[key], ...inputs[key]]);
    });
    return fields;
  }

  params = { fields: {} };

  merge(params, strategy: 'intersect' | 'append' | 'replace' = 'intersect') {
    switch (strategy) {
      case 'intersect':
        this.params = {
          fields: FieldsParameter.intersect(this.params.fields, FieldsParameter.pick(params).fields)
        };
      case 'append':
        this.params = {
          fields: FieldsParameter.append(this.params.fields, FieldsParameter.pick(params).fields)
        };
        break;
      default:
        throw new Error('not implemented yet');
    }
  }
}



export class FilterParameter extends ActionParameter {
  static picking = { filter: {} };

  params = { filter: {} };

  merge(params, strategy: 'and' | 'or' = 'and') {
    const { filter } = ActionParameter.pick(params);
    if (!filter || _.isEmpty(filter)) {
      return;
    }
    if (_.isEmpty(this.params.filter)) {
      this.params.filter = filter;
    } else {
      this.params.filter = {
        [strategy]: [this.params.filter, filter]
      };
    }
  }
}



export class PageParameter extends ActionParameter {
  static picking = { page: undefined, perPage: undefined };

  static DEFAULT_PAGE = 1;
  static DEFAULT_PER_PAGE = 20;
  static MAX_PER_PAGE = 100;

  params = {};

  maxPerPage = PageParameter.MAX_PER_PAGE;

  constructor(options = { maxPerPage: PageParameter.MAX_PER_PAGE }) {
    super(options);

    if (typeof options.maxPerPage !== 'undefined') {
      this.maxPerPage = options.maxPerPage;
    }
  }

  merge(params) {
    const data = ActionParameter.pick(params);
    if (typeof params.per_page !== 'undefined') {
      data.perPage = params.per_page;
    }

    if (data.perPage == -1) {
      data.perPage = this.maxPerPage;
    }

    Object.assign(this.params, data);
  }
}



export class PayloadParameter extends ActionParameter {
  static picking = { values: undefined };

  merge(params, strategy: 'replace' | 'merge' | 'intersect' = 'replace') {
    const data = ActionParameter.pick(params);
    switch (strategy) {
      case 'replace':
        this.params.values = data.values;
        break;
      case 'merge':
        _.merge(this.params, _.cloneDeep(data));
        break;
      default:
        throw new Error('not implemented yet');
    }
  }
}



export class UnknownParameter {
  params: { [key: string]: any } = {};
  parameterTypes: string[];

  constructor(options) {
    this.parameterTypes = options.parameterTypes || [];
    this.merge(options);
  }

  get() {
    return _.cloneDeep(this.params);
  }

  merge(params, strategy: 'replace' | 'merge' | 'intersect' = 'merge') {
    const knownKeys = new Set<string>();
    this.parameterTypes.forEach(key => {
      Object.keys(types.get(key).picking).forEach(key => knownKeys.add(key));
    });
    const data = _.omit(params, Array.from(knownKeys));

    switch (strategy) {
      case 'merge':
        _.merge(this.params, _.cloneDeep(data));
        break;
      case 'replace':
        this.params = data;
        break;
      default:
        throw new Error('not implemented yet');
    }
  }
}



ActionParameterTypes.register('fields', FieldsParameter);
ActionParameterTypes.register('filter', FilterParameter);
ActionParameterTypes.register('page', PageParameter);
ActionParameterTypes.register('payload', PayloadParameter);
