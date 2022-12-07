import { DataTypes, Transactionable, ValidationError, ValidationErrorItem } from 'sequelize';
import parser from 'cron-parser';
import moment from 'moment';
import { escapeRegExp } from 'lodash';

import { Registry } from '@nocobase/utils';
import { Model, BaseColumnFieldOptions, Field, FieldContext } from '@nocobase/database';


export interface Pattern {
  validate?(options): string | null;
  generate(this: SequenceField, instance: Model, index: number, options: Transactionable): Promise<string> | string;
  getLength(options): number;
  getMatcher(options): string;
  update?(this: SequenceField, instance: Model, value: string, options, transactionable: Transactionable): Promise<void>;
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
  // validate(options) {
  //   if (!options?.key) {
  //     return 'options.key should be configured as an integer';
  //   }
  //   return null;
  // },
  async generate(this: SequenceField, instance: Model, index, { transaction }) {
    const recordTime = <Date>instance.get('createdAt');
    const { options = {} } = this.options.patterns[index];
    const { digits = 1, start = 0, base = 10, cycle, key } = options;
    const max = Math.pow(base, digits) - 1;
    const SeqRepo = this.database.getRepository('sequences');
    const lastSeq = await SeqRepo.findOne({
      filter: {
        collection: this.collection.name,
        field: this.name,
        key
      },
      transaction
    });

    let next;
    if (lastSeq && lastSeq.get('current') != null) {
      next = lastSeq.get('current') + 1;

      // cycle as cron string
      if (cycle) {
        const interval = parser.parseExpression(cycle, { currentDate: <Date>lastSeq.get('lastGeneratedAt') });
        const nextTime = interval.next();
        if (recordTime.getTime() >= nextTime.getTime()) {
          next = start;
        }
      }
    } else {
      next = start;
    }

    if (next > max) {
      next = start;
    }

    // update options
    if (lastSeq) {
      await lastSeq.update({ current: next, lastGeneratedAt: recordTime }, { transaction });
    } else {
      await SeqRepo.create({
        values: {
          collection: this.collection.name,
          field: this.name,
          key,
          current: next,
          lastGeneratedAt: recordTime
        },
        transaction
      });
    }

    return next.toString(base).padStart(digits, '0');
  },

  getLength({ digits = 1 } = {}) {
    return digits;
  },

  getMatcher(options = {}) {
    const { digits = 1, start = 0, base = 10 } = options;
    const chars = '0123456789abcdefghijklmnopqrstuvwxyz'.slice(0, base);
    return `[${chars}]{${digits}}`;
  },

  async update(instance, value, options, { transaction }) {
    const recordTime = <Date>instance.get('createdAt');
    const { digits = 1, start = 0, base = 10, cycle, key } = options;
    const SeqRepo = this.database.getRepository('sequences');
    const lastSeq = await SeqRepo.findOne({
      filter: {
        collection: this.collection.name,
        field: this.name,
        key
      },
      transaction
    });
    const current = Number.parseInt(value, base);
    if (!lastSeq) {
      return SeqRepo.create({
        values: {
          collection: this.collection.name,
          field: this.name,
          key,
          current,
          lastGeneratedAt: recordTime
        },
        transaction
      });
    }
    if (lastSeq.get('current') == null) {
      return lastSeq.update({
        current,
        lastGeneratedAt: recordTime
      }, { transaction });
    }

    if (cycle) {
      const interval = parser.parseExpression(cycle, { currentDate: <Date>lastSeq.get('lastGeneratedAt') });
      const nextTime = interval.next();
      if (recordTime.getTime() >= nextTime.getTime()) {
        lastSeq.set({
          current,
          lastGeneratedAt: recordTime
        });
      } else {
        if (current > lastSeq.get('current')) {
          lastSeq.set({
            current,
            lastGeneratedAt: recordTime
          });
        }
      }
    } else {
      if (current > lastSeq.get('current')) {
        lastSeq.set({
          current,
          lastGeneratedAt: recordTime
        });
      }
    }

    return lastSeq.save({ transaction });
  }
});

sequencePatterns.register('date', {
  generate(this: SequenceField, instance, index) {
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

  validate = (instance: Model) => {
    const { name, inputable, match } = this.options;
    const value = instance.get(name);
    if (value != null && inputable && match && !this.match(value)) {
      throw new ValidationError(null, [
        new ValidationErrorItem(
          `input value of ${name} field not match the sequence pattern (${this.matcher.toString()}) which is required`,
          'Validation error',
          name,
          value,
          instance,
          'sequence_pattern_not_match'
        )
      ]);
    }
  };

  setValue = async (instance: Model, options) => {
    const { name, patterns, inputable, match } = this.options;
    const value = instance.get(name);
    if (value != null && inputable) {
      this.update(instance, options);
      return;
    }

    const results = await patterns.reduce((promise, p, i) => promise.then(async (result) => {
      const item = await (sequencePatterns.get(p.type)).generate.call(this, instance, i, options);
      return result.concat(item);
    }), Promise.resolve([]));
    instance.set(name, results.join(''));
  };

  match(value) {
    return typeof value === 'string' ? value.match(this.matcher) : null;
  }

  async update(instance: Model, options) {
    const { name, patterns } = this.options;
    const matched = this.match(instance.get(name));
    if (matched) {
      await matched.slice(1)
        .map((_, i) => sequencePatterns.get(patterns[i].type).update).filter(Boolean)
        .reduce((promise, update, i) => promise.then(() => update.call(this, instance, matched[i + 1], patterns[i].options, options)), Promise.resolve());
    }
  }

  bind() {
    super.bind();
    this.on('beforeValidate', this.validate);
    this.on('beforeCreate', this.setValue);
  }

  unbind() {
    super.unbind();
    this.off('beforeValidate', this.validate);
    this.off('beforeCreate', this.setValue);
  }
}
