import { DataTypes, Op } from 'sequelize';
import parser from 'cron-parser';
import moment from 'moment';

import { Registry } from '@nocobase/utils';

import { Model } from '..';
import { BaseColumnFieldOptions, Field, FieldContext } from './field';

interface Pattern {
  validate?(options): string | null;
  generate(this: SerialStringField, instance: Model, options): Promise<string> | string;
  getLength(options): number;
}

export const serialPatterns = new Registry<Pattern>();

serialPatterns.register('string', {
  validate(options) {
    if (!options?.value) {
      return 'options.value should be configured as a non-empty string';
    }
    return null;
  },
  generate(instance, { options }) {
    return options.value;
  },
  getLength(options) {
    return options.value.length;
  }
});

serialPatterns.register('integer', {
  async generate(instance: Model, pattern) {
    const model = <typeof Model>instance.constructor;
    const { options = {} } = pattern;
    const { digits = 1, start = 0, cycle } = options;
    const max = Math.pow(10, digits) - 1;
    const requireLast = typeof options.current === 'undefined' || cycle;
    const last = requireLast
      ? await model.findOne({
        attributes: [this.options.name, 'createdAt'],
        order: [
          ['createdAt', 'DESC']
        ]
      })
      : null;

    if (typeof options.current === 'undefined') {
      options.current = last ? Number.parseInt(this.parse(last[this.options.name], options), 10) + 1 : start;
    } else {
      options.current += 1;
    }

    // cycle as cron string
    if (cycle && last) {
      const interval = parser.parseExpression(cycle, { currentDate: <Date>last.get('createdAt') });
      const next = interval.next();
      if ((<Date>instance.get('createdAt')).getTime() >= next.getTime()) {
        options.current = start;
      }
    }

    if (options.current > max) {
      options.current = start;
    }

    // update options
    Object.assign(pattern, { options });

    return `${options.current}`.padStart(digits, '0');
  },

  getLength({ digits = 1 } = {}) {
    return digits;
  }
});

serialPatterns.register('date', {
  generate(instance, { options }) {
    return moment(instance.get(options?.field ?? 'createdAt')).format(options?.format ?? 'YYYYMMDD');
  },
  getLength(options) {
    return options.format?.length ?? 0;
  }
});

interface PatternConfig {
  type: string;
  title?: string;
  options?: any;
}
export interface SerialStringFieldOptions extends BaseColumnFieldOptions {
  type: 'serialString';
  patterns: PatternConfig[]
}

export class SerialStringField extends Field {
  get dataType() {
    return DataTypes.STRING;
  }

  constructor(options: SerialStringFieldOptions, context: FieldContext) {
    super(options, context);
    if (!options.patterns || !options.patterns.length) {
      throw new Error('at least one pattern should be defined for serialString type');
    }
    options.patterns.forEach(pattern => {
      const P = serialPatterns.get(pattern.type);
      if (!P) {
        throw new Error(`pattern type ${pattern.type} is not registered`);
      }
      if (P.validate) {
        const error = P.validate(pattern.options);
        if (error) {
          throw new Error(error);
        }
      }
    });
  }

  setValue = async (instance, options) => {
    const { name, patterns } = this.options;
    const results = await patterns.reduce((promise, p) => promise.then(async result => {
      const item = await serialPatterns.get(p.type).generate.call(this, instance, p);
      return result.concat(item);
    }), Promise.resolve([]));
    instance.set(name, results.join(''));
  };

  parse(value: string, pattern: PatternConfig): string {
    for (let i = 0, index = 0; i < this.options.patterns.length; i += 1) {
      const { type, options } = this.options.patterns[i];
      const { getLength } = serialPatterns.get(type);
      const length = getLength(options);
      if (pattern === this.options.patterns[i]) {
        return value.substring(index, index + length);
      }
      index += length;
    }
    return '';
  }

  bind() {
    super.bind();
    this.on('beforeCreate', this.setValue);
  }
}
