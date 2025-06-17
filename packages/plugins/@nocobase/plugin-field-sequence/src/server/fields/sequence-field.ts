/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  BaseColumnFieldOptions,
  DataTypes,
  Field,
  FieldContext,
  Model,
  Transactionable,
  ValidationError,
  ValidationErrorItem,
} from '@nocobase/database';
import { Registry } from '@nocobase/utils';
import parser from 'cron-parser';
import dayjs from 'dayjs';
import lodash from 'lodash';

export interface Pattern {
  validate?(options): string | null;
  generate(
    this: SequenceField,
    instance: Model,
    opts: { [key: string]: any },
    options: Transactionable,
  ): Promise<string> | string;
  batchGenerate(
    this: SequenceField,
    instances: Model[],
    values: string[],
    opts: { [key: string]: any },
    options: Transactionable,
  ): Promise<void> | void;
  getLength(options): number;
  getMatcher(options): string;
  update?(
    this: SequenceField,
    instance: Model,
    value: string,
    options,
    transactionable: Transactionable,
  ): Promise<void>;
}

export const sequencePatterns = new Registry<Pattern>();

function parseBigInt(str, radix = 10) {
  if (typeof str !== 'string') throw new TypeError('Input must be a string');
  if (typeof radix !== 'number' || radix < 2 || radix > 36) throw new RangeError('Radix must be between 2 and 36');

  let negative = false;
  if (str.startsWith('-')) {
    negative = true;
    str = str.slice(1);
  }

  const chars = str.toLowerCase();
  const digits = '0123456789abcdefghijklmnopqrstuvwxyz';

  let result = 0n;
  for (const ch of chars) {
    const value = BigInt(digits.indexOf(ch));
    if (value < 0n || value >= BigInt(radix)) throw new SyntaxError(`Invalid digit "${ch}" for base ${radix}`);
    result = result * BigInt(radix) + value;
  }

  return negative ? -result : result;
}

sequencePatterns.register('string', {
  validate(options) {
    if (!options?.value) {
      return 'options.value should be configured as a non-empty string';
    }
    return null;
  },
  generate(instance, options) {
    return options.value;
  },
  batchGenerate(instances, values, options) {
    instances.forEach((instance, i) => {
      values[i] = options.value;
    });
  },
  getLength(options) {
    return options.value.length;
  },
  getMatcher(options) {
    return lodash.escapeRegExp(options.value);
  },
});

sequencePatterns.register('integer', {
  // validate(options) {
  //   if (!options?.key) {
  //     return 'options.key should be configured as an integer';
  //   }
  //   return null;
  // },
  async generate(this: SequenceField, instance: Model, options, { transaction }) {
    const recordTime = <Date>instance.get('createdAt') ?? new Date();
    const { digits = 1, start = 0, base = 10, cycle, key } = options;
    const { repository: SeqRepo, model: SeqModel } = this.database.getCollection('sequences');
    const lastSeq =
      (await SeqRepo.findOne({
        filter: {
          collection: this.collection.name,
          field: this.name,
          key,
        },
        transaction,
      })) ||
      SeqModel.build({
        collection: this.collection.name,
        field: this.name,
        key,
      });

    let next = start;
    if (lastSeq.get('current') != null) {
      const bn = BigInt(lastSeq.get('current')) + 1n;
      next = bn > start ? bn : start;
      const max = BigInt(base) ** BigInt(digits) - 1n;
      if (next > max) {
        next = start;
      }

      // cycle as cron string
      if (cycle) {
        const interval = parser.parseExpression(cycle, { currentDate: <Date>lastSeq.get('lastGeneratedAt') });
        const nextTime = interval.next();
        if (recordTime.getTime() >= nextTime.getTime()) {
          next = start;
        }
      }
    }

    lastSeq.set({
      current: next,
      lastGeneratedAt: recordTime,
    });
    await lastSeq.save({ transaction });

    return next.toString(base).padStart(digits, '0');
  },

  getLength({ digits = 1 } = {}) {
    return digits;
  },

  getMatcher(options = {}) {
    const { digits = 1, base = 10 } = options;
    const chars = '0123456789abcdefghijklmnopqrstuvwxyz'.slice(0, base);
    return `[${chars}]{${digits}}`;
  },

  async batchGenerate(instances, values, options, { transaction }) {
    const { name, patterns } = this.options;
    const { digits = 1, start = 0, base = 10, cycle, key } = options;

    const { repository: SeqRepo, model: SeqModel } = this.database.getCollection('sequences');
    const lastSeq =
      (await SeqRepo.findOne({
        filter: {
          collection: this.collection.name,
          field: this.name,
          key,
        },
        transaction,
      })) ||
      SeqModel.build({
        collection: this.collection.name,
        field: this.name,
        key,
      });

    instances.forEach((instance, i) => {
      const recordTime = <Date>instance.get('createdAt') ?? new Date();
      const value = instance.get(name);
      if (value != null && this.options.inputable) {
        const matcher = this.match(value);
        // 如果匹配到了，需要检查是否要更新 current 值
        if (matcher) {
          const patternIndex = patterns.indexOf(options);
          const number = Number.parseInt(matcher[patternIndex + 1], base);
          // 如果当前值大于 lastSeq.current，则更新 lastSeq.current
          if (lastSeq.get('current') == null) {
            lastSeq.set({
              current: number,
              lastGeneratedAt: recordTime,
            });
          } else {
            if (number > BigInt(lastSeq.get('current'))) {
              lastSeq.set({
                current: number,
                lastGeneratedAt: recordTime,
              });
            }
          }
        }
        // 否则交给 validate 检查是否要求 match，如果要求，则相应报错
      } else {
        // 自动生成
        let next = start;
        if (lastSeq.get('current') != null) {
          next = Math.max(lastSeq.get('current') + 1, start);
          const max = Math.pow(base, digits) - 1;
          if (next > max) {
            next = start;
          }

          // cycle as cron string
          if (cycle) {
            const interval = parser.parseExpression(cycle, { currentDate: <Date>lastSeq.get('lastGeneratedAt') });
            const nextTime = interval.next();
            if (recordTime.getTime() >= nextTime.getTime()) {
              next = start;
            }
          }
        }
        lastSeq.set({
          current: next,
          lastGeneratedAt: recordTime,
        });
        values[i] = next.toString(base).padStart(digits, '0');
      }
    });

    await lastSeq.save({ transaction });
  },

  async update(instance, value, options, { transaction }) {
    const recordTime = <Date>instance.get('createdAt') ?? new Date();
    const { digits = 1, start = 0, base = 10, cycle, key } = options;
    const SeqRepo = this.database.getRepository('sequences');
    const lastSeq = await SeqRepo.findOne({
      filter: {
        collection: this.collection.name,
        field: this.name,
        key,
      },
      transaction,
    });
    const current = parseBigInt(value, base);
    if (!lastSeq) {
      return SeqRepo.create({
        values: {
          collection: this.collection.name,
          field: this.name,
          key,
          current,
          lastGeneratedAt: recordTime,
        },
        transaction,
      });
    }
    if (lastSeq.get('current') == null) {
      return lastSeq.update(
        {
          current,
          lastGeneratedAt: recordTime,
        },
        { transaction },
      );
    }

    if (cycle) {
      const interval = parser.parseExpression(cycle, { currentDate: <Date>lastSeq.get('lastGeneratedAt') });
      const nextTime = interval.next();
      if (recordTime.getTime() >= nextTime.getTime()) {
        lastSeq.set({
          current,
          lastGeneratedAt: recordTime,
        });
      } else {
        if (current > lastSeq.get('current')) {
          lastSeq.set({
            current,
            lastGeneratedAt: recordTime,
          });
        }
      }
    } else {
      if (current > lastSeq.get('current')) {
        lastSeq.set({
          current,
          lastGeneratedAt: recordTime,
        });
      }
    }

    return lastSeq.save({ transaction });
  },
});

sequencePatterns.register('date', {
  generate(this: SequenceField, instance, options) {
    return dayjs(instance.get(options?.field ?? 'createdAt')).format(options?.format ?? 'YYYYMMDD');
  },
  batchGenerate(instances, values, options) {
    const { field, inputable } = options;
    instances.forEach((instance, i) => {
      if (!inputable || instance.get(field ?? 'createdAt') == null) {
        values[i] = sequencePatterns.get('date').generate.call(this, instance, options);
      }
    });
  },
  getLength(options) {
    return options.format?.length ?? 8;
  },
  getMatcher(options = {}) {
    return `.{${options?.format?.length ?? 8}}`;
  },
});

// 字符集常量定义
const CHAR_SETS = {
  number: '0123456789',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  // 符号只保留常用且安全的符号，有需要的可以自己加比如[]{}|;:,.<>放在链接或者文件名里容易出问题的字符
  symbol: '!@#$%^&*_-+',
} as const;

interface RandomCharOptions {
  length?: number;
  charsets?: Array<keyof typeof CHAR_SETS>;
}

sequencePatterns.register('randomChar', {
  validate(options?: RandomCharOptions) {
    if (!options?.length || options.length < 1) {
      return 'options.length should be configured as a positive integer';
    }
    if (!options?.charsets || options.charsets.length === 0) {
      return 'At least one character set should be selected';
    }
    if (options.charsets.some((charset) => !CHAR_SETS[charset])) {
      return 'Invalid charset selected';
    }
    return null;
  },

  generate(instance: any, options: RandomCharOptions) {
    const { length = 6, charsets = ['number'] } = options;

    const chars = [...new Set(charsets.reduce((acc, charset) => acc + CHAR_SETS[charset], ''))];

    const getRandomChar = () => {
      const randomIndex = Math.floor(Math.random() * chars.length);
      return chars[randomIndex];
    };

    return Array.from({ length }, () => getRandomChar()).join('');
  },

  batchGenerate(instances: any[], values: string[], options: RandomCharOptions) {
    instances.forEach((instance, i) => {
      values[i] = sequencePatterns.get('randomChar').generate.call(this, instance, options);
    });
  },

  getLength(options: RandomCharOptions) {
    return options.length || 6;
  },

  getMatcher(options: RandomCharOptions) {
    const pattern = [
      ...new Set(
        (options.charsets || ['number']).reduce((acc, charset) => {
          switch (charset) {
            case 'number':
              return acc + '0-9';
            case 'lowercase':
              return acc + 'a-z';
            case 'uppercase':
              return acc + 'A-Z';
            case 'symbol':
              return acc + CHAR_SETS.symbol.replace('-', '').replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&') + '-';
            default:
              return acc;
          }
        }, ''),
      ),
    ].join('');

    return `[${pattern}]{${options.length || 6}}`;
  },
});

interface PatternConfig {
  type: string;
  title?: string;
  options?: any;
}
export interface SequenceFieldOptions extends BaseColumnFieldOptions {
  type: 'sequence';
  patterns: PatternConfig[];
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
    options.patterns.forEach((pattern) => {
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

    const patterns = options.patterns.map(({ type, options }) => sequencePatterns.get(type).getMatcher(options));
    this.matcher = new RegExp(`^${patterns.map((p) => `(${p})`).join('')}$`, 'i');
  }

  validate = (instance: Model) => {
    const { name, inputable, match } = this.options;
    const value = instance.get(name);
    if (value != null && inputable && match && !this.match(value)) {
      throw new ValidationError('sequence pattern not match', [
        new ValidationErrorItem(
          `input value of ${name} field not match the sequence pattern (${this.matcher.toString()}) which is required`,
          'validation error', // NOTE: type should only be this which in sequelize enum set
          name,
          value,
          instance,
          'sequence_pattern_not_match',
          name,
          [],
        ),
      ]);
    }
  };

  setValue = async (instance: Model, options) => {
    if (options.skipIndividualHooks?.has(`${this.collection.name}.beforeCreate.${this.name}`)) {
      return;
    }
    const { name, patterns, inputable } = this.options;
    const value = instance.get(name);
    if (value != null && inputable) {
      return this.update(instance, options);
    }

    const results = await patterns.reduce(
      (promise, p) =>
        promise.then(async (result) => {
          const item = await sequencePatterns.get(p.type).generate.call(this, instance, p.options, options);
          return result.concat(item);
        }),
      Promise.resolve([]),
    );
    instance.set(name, results.join(''));
  };

  setGroupValue = async (instances: Model[], options) => {
    if (!instances.length) {
      return;
    }
    if (!options.skipIndividualHooks) {
      options.skipIndividualHooks = new Set();
    }
    options.skipIndividualHooks.add(`${this.collection.name}.beforeCreate.${this.name}`);

    const { name, patterns, inputable } = this.options;
    const array = Array(patterns.length)
      .fill(null)
      .map(() => Array(instances.length));

    await patterns.reduce(
      (promise, p, i) =>
        promise.then(() =>
          sequencePatterns.get(p.type).batchGenerate.call(this, instances, array[i], p.options ?? {}, options),
        ),
      Promise.resolve(),
    );

    instances.forEach((instance, i) => {
      const value = instance.get(name);
      if (!inputable || value == null) {
        instance.set(this.name, array.map((a) => a[i]).join(''));
      }
    });
  };

  cleanHook = (_, options) => {
    options.skipIndividualHooks.delete(`${this.collection.name}.beforeCreate.${this.name}`);
  };

  match(value) {
    return typeof value === 'string' ? value.match(this.matcher) : null;
  }

  async update(instance: Model, options) {
    const { name, patterns } = this.options;
    const matched = this.match(instance.get(name));
    if (matched) {
      await matched
        .slice(1)
        .map((_, i) => sequencePatterns.get(patterns[i].type).update)
        .reduce(
          (promise, update, i) =>
            promise.then(() => {
              if (!update) {
                return;
              }
              return update.call(this, instance, matched[i + 1], patterns[i].options, options);
            }),
          Promise.resolve(),
        );
    }
  }

  bind() {
    super.bind();
    this.on('beforeValidate', this.validate);
    this.on('beforeCreate', this.setValue);
    this.on('beforeBulkCreate', this.setGroupValue);
    this.on('afterBulkCreate', this.cleanHook);
  }

  unbind() {
    super.unbind();
    this.off('beforeValidate', this.validate);
    this.off('beforeCreate', this.setValue);
    this.off('beforeBulkCreate', this.setGroupValue);
    this.off('afterBulkCreate', this.cleanHook);
  }
}
