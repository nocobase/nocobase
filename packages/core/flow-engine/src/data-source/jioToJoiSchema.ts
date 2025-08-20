/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import Joi from 'joi';

type JioType = 'string' | 'number' | 'array' | 'boolean' | 'any';

interface JioRule {
  name: string;
  args?: any;
}

export function jioToJoiSchema<T extends JioType>(jioConfig: {
  type: T;
  rules?: JioRule[];
}): T extends 'string'
  ? Joi.StringSchema
  : T extends 'number'
    ? Joi.NumberSchema
    : T extends 'array'
      ? Joi.ArraySchema
      : T extends 'boolean'
        ? Joi.BooleanSchema
        : Joi.AnySchema {
  let schema: any;

  // 1️⃣ 创建基础 schema
  switch (jioConfig.type) {
    case 'string':
      schema = Joi.string();
      break;
    case 'number':
      schema = Joi.number();
      break;
    case 'array':
      schema = Joi.array();
      break;
    case 'boolean':
      schema = Joi.boolean();
      break;
    default:
      schema = Joi.any();
      break;
  }
  const getArgs = (ruleName: string, args: any) => {
    if (!args || Object.keys(args).length === 0) return [];

    if (Array.isArray(args)) return args;

    // email 特殊处理：自动禁用内置 TLD 列表，保留 minDomainSegments
    if (ruleName === 'email') {
      const emailArgs = { ...args };
      if (emailArgs.tlds?.allow === true) {
        emailArgs.tlds.allow = false;
      } else if (!emailArgs.tlds) {
        emailArgs.tlds = { allow: false };
      }
      return [emailArgs];
    }
    if (['length', 'min', 'max'].includes(ruleName)) {
      return [args.limit];
    }
    const values = Object.values(args);
    return values.length ? values : [];
  };

  let hasRequired = false;

  // 3️⃣ 遍历规则并动态调用 Joi 方法
  jioConfig.rules?.forEach((rule) => {
    const { name, args } = rule;
    if (name === 'required') hasRequired = true;

    if (typeof schema[name] === 'function') {
      try {
        schema = schema[name](...getArgs(name, args));
      } catch (err) {
        console.warn(`调用 Joi 方法 ${name} 失败:`, err);
      }
    } else {
      console.warn(`Joi schema 上不存在方法: ${name}`);
    }
  });

  // 4️⃣ 如果没有 required，默认可选并允许空字符串
  if (!hasRequired) {
    schema = schema.optional().allow('');
  }

  return schema;
}
