/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

const postgres = {
  'character varying': ['string', 'uuid', 'nanoid', 'encryption', 'dataMasking'],
  varchar: ['string', 'uuid', 'nanoid', 'encryption', 'dataMasking'],
  char: ['string', 'uuid', 'nanoid', 'encryption', 'dataMasking'],

  character: 'string',
  text: 'text',
  oid: 'string',
  name: 'string',

  smallint: ['integer', 'sort', 'dataMasking'],
  integer: ['integer', 'sort', 'dataMasking'],
  bigint: ['bigInt', 'sort', 'dataMasking'],
  decimal: 'decimal',
  numeric: 'float',
  real: 'float',
  'double precision': 'float',

  'timestamp without time zone': 'date',
  'timestamp with time zone': 'date',
  'time without time zone': 'time',

  date: 'date',
  boolean: 'boolean',

  json: ['json', 'array'],
  jsonb: ['json', 'array', 'jsonb'],

  point: 'json',
  path: 'json',
  polygon: 'json',
  circle: 'json',
  uuid: 'uuid',
  set: 'set',
  array: 'array',
};

const mysql = {
  smallint: ['integer', 'boolean', 'sort', 'dataMasking'],
  tinyint: ['integer', 'boolean', 'sort', 'dataMasking'],
  mediumint: ['integer', 'boolean', 'sort', 'dataMasking'],

  'smallint unsigned': ['integer', 'boolean', 'sort', 'dataMasking'],
  'tinyint unsigned': ['integer', 'boolean', 'sort', 'dataMasking'],
  'mediumint unsigned': ['integer', 'boolean', 'sort', 'dataMasking'],

  char: ['string', 'uuid', 'nanoid', 'encryption', 'dataMasking'],
  varchar: ['string', 'uuid', 'nanoid', 'encryption', 'dataMasking'],
  date: 'date',
  time: 'time',
  tinytext: 'text',
  text: 'text',
  mediumtext: 'text',
  longtext: 'text',
  int: ['integer', 'sort'],
  'int unsigned': ['integer', 'sort', 'dataMasking'],
  integer: ['integer', 'sort', 'dataMasking'],
  bigint: ['bigInt', 'sort', 'dataMasking'],
  'bigint unsigned': ['bigInt', 'sort', 'dataMasking'],
  float: 'float',
  double: 'float',
  boolean: 'boolean',
  decimal: 'decimal',

  datetime: 'date',
  timestamp: 'date',
  json: ['json', 'array'],
  enum: 'string',
};

const sqlite = {
  text: 'text',
  varchar: ['string', 'uuid', 'nanoid', 'encryption', 'dataMasking'],

  integer: 'integer',
  real: 'real',

  datetime: 'date',
  date: 'date',
  time: 'time',

  boolean: 'boolean',

  numeric: 'decimal',
  json: ['json', 'array'],
};

const fieldTypeMap = { postgres, mysql, sqlite, mariadb: mysql };
export default fieldTypeMap;
