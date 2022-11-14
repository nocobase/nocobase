import { DataTypes, Transactionable } from 'sequelize';
import parser from 'cron-parser';
import moment from 'moment';
import { escapeRegExp } from 'lodash';

import { Registry } from '@nocobase/utils';

import { Model } from '..';
import { BaseColumnFieldOptions, Field, FieldContext } from './field';

interface Pattern {
  validate?(options): string | null;
  generate(this: SequenceField, instance: Model, index: number): string;
  getLength(options): number;
  getMatcher(options): string;
}

export const sequencePatterns = new Registry<Pattern>();

sequencePatterns.register('string', {
  validate(options) {
    if (!options?.value) {
      return 'options.value should be configured as a non-empty string';
    }
    return null;
  },
  generate(instance, index) {
    const { options } = this.options.patterns[index];
    return options.value;
  },
  getLength(options) {
    return options.value.length;
  },
  getMatcher(options) {
    return escapeRegExp(options.value);
  }
});

sequencePatterns.register('integer', {
  generate(instance: Model, index) {
    const { options = {} } = this.options.patterns[index];
    const { digits = 1, start = 0, base = 10, cycle } = options;
    const max = Math.pow(base, digits) - 1;
    const { lastRecord = null } = this.options;

    if (typeof options.current === 'undefined') {
      if (lastRecord && lastRecord.get(this.options.name)) {
        // if match current pattern
        const matcher = this.match(lastRecord.get(this.options.name));
        if (matcher) {
          const lastNumber = Number.parseInt(matcher[index + 1], base);
          options.current = Number.isNaN(lastNumber) ? start : lastNumber + 1;
        } else {
          options.current = start;
        }
      } else {
        options.current = start;
      }
    } else {
      options.current += 1;
    }

    // cycle as cron string
    if (cycle && lastRecord) {
      const interval = parser.parseExpression(cycle, { currentDate: <Date>lastRecord.get('createdAt') });
      const next = interval.next();
      if ((<Date>instance.get('createdAt')).getTime() >= next.getTime()) {
        options.current = start;
      }
    }

    if (options.current > max) {
      options.current = start;
    }

    // update options
    Object.assign(this.options.patterns[index], { options });

    return options.current.toString(base).padStart(digits, '0');
  },

  getLength({ digits = 1 } = {}) {
    return digits;
  },

  getMatcher(options = {}) {
    const { digits = 1, start = 0, base = 10 } = options;
    const startLen = start ? start.toString(base).length : 1;
    const chars = '0123456789abcdefghijklmnopqrstuvwxyz'.slice(0, base);
    return `[${chars}]{${digits}}`;
  }
});

sequencePatterns.register('date', {
  generate(instance, index) {
    const { options } = this.options.patterns[index];
    return moment(instance.get(options?.field ?? 'createdAt')).format(options?.format ?? 'YYYYMMDD');
  },
  getLength(options) {
    return options.format?.length ?? 8;
  },
  getMatcher(options = {}) {
    return `.{${options?.format?.length ?? 8}}`;
  }
});

interface PatternConfig {
  type: string;
  title?: string;
  options?: any;
}
export interface SequenceFieldOptions extends BaseColumnFieldOptions {
  type: 'sequence';
  patterns: PatternConfig[]
}

export class SequenceField extends Field {
  matcher: RegExp;

  get dataType() {
    return DataTypes.STRING;
  }

  constructor(options: SequenceFieldOptions, context: FieldContext) {
    super(options, context);
    if (!options.patterns || !options.patterns.length) {
      throw new Error('at least one pattern should be defined for sequence type');
    }
    options.patterns.forEach(pattern => {
      const P = sequencePatterns.get(pattern.type);
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

    const patterns = options.patterns
      .map(({ type, options }) => sequencePatterns.get(type).getMatcher(options));
    this.matcher = new RegExp(`^${patterns.map(p => `(${p})`).join('')}$`, 'i');
  }

  setValue = async (instance: Model, options) => {
    const { name, patterns } = this.options;
    // NOTE: only load when value is not set, if null stand for no last record
    if (typeof this.options.lastRecord === 'undefined') {
      const model = <typeof Model>instance.constructor;
      this.options.lastRecord = await model.findOne({
        attributes: [model.primaryKeyAttribute, this.options.name, 'createdAt'],
        order: [
          ['createdAt', 'DESC'],
          // TODO(bug): will cause problem if no auto-increment id
          [model.primaryKeyAttribute, 'DESC']
        ],
        transaction: options.transaction
      });
    }

    const results = patterns.reduce((result, p, i) => {
      const item = sequencePatterns.get(p.type).generate.call(this, instance, i, options);
      return result.concat(item);
    }, []);
    instance.set(name, results.join(''));
  };

  setLast = (instance: Model, options) => {
    this.options.lastRecord = instance;
  };

  match(value) {
    return typeof value === 'string' ? value.match(this.matcher) : null;
  }

  parse(value: string, patternIndex: number): string {
    for (let i = 0, index = 0; i < this.options.patterns.length; i += 1) {
      const { type, options } = this.options.patterns[i];
      const { getLength } = sequencePatterns.get(type);
      const length = getLength(options);
      if (i === patternIndex) {
        return value.substring(index, index + length);
      }
      index += length;
    }
    return '';
  }

  bind() {
    super.bind();
    this.on('beforeCreate', this.setValue);
    this.on('afterCreate', this.setLast);
  }

  unbind() {
    super.unbind();
    this.off('beforeCreate', this.setValue);
    this.off('afterCreate', this.setLast);
  }
}
