/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

const postgres = {
  'character varying': ['string', 'uuid', 'nanoid', 'encryption', 'datetimeNoTz'],
  varchar: ['string', 'uuid', 'nanoid', 'encryption', 'datetimeNoTz'],
  char: ['string', 'uuid', 'nanoid', 'encryption', 'datetimeNoTz'],

  character: 'string',
  text: 'text',
  oid: 'string',
  name: 'string',

  smallint: ['integer', 'sort'],
  integer: ['integer', 'unixTimestamp', 'sort'],
  bigint: ['bigInt', 'unixTimestamp', 'sort'],
  decimal: 'decimal',
  numeric: 'float',
  real: 'float',
  'double precision': 'float',

  'timestamp without time zone': 'datetimeNoTz',
  'timestamp with time zone': 'datetimeTz',
  'time without time zone': 'time',

  date: 'dateOnly',
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
  smallint: ['integer', 'boolean', 'sort'],
  tinyint: ['integer', 'boolean', 'sort'],
  mediumint: ['integer', 'boolean', 'sort'],

  'smallint unsigned': ['integer', 'boolean', 'sort'],
  'tinyint unsigned': ['integer', 'boolean', 'sort'],
  'mediumint unsigned': ['integer', 'boolean', 'sort'],

  char: ['string', 'uuid', 'nanoid', 'encryption'],
  varchar: ['string', 'uuid', 'nanoid', 'encryption'],
  date: 'dateOnly',
  time: 'time',
  tinytext: 'text',
  text: 'text',
  mediumtext: 'text',
  longtext: 'text',
  int: ['integer', 'unixTimestamp', 'sort'],
  'int unsigned': ['integer', 'unixTimestamp', 'sort'],
  integer: ['integer', 'unixTimestamp', 'sort'],
  bigint: ['bigInt', 'unixTimestamp', 'sort'],
  'bigint unsigned': ['bigInt', 'unixTimestamp', 'sort'],
  float: 'float',
  double: 'float',
  boolean: 'boolean',
  decimal: 'decimal',
  year: ['string', 'integer'],
  datetime: ['datetimeNoTz', 'datetimeTz'],
  timestamp: 'datetimeTz',
  json: ['json', 'array'],
  enum: 'string',
};

const sqlite = {
  text: 'text',
  varchar: ['string', 'uuid', 'nanoid', 'encryption'],

  integer: 'integer',
  real: 'real',

  datetime: 'datetimeTz',
  date: 'date',
  time: 'time',

  boolean: 'boolean',

  numeric: 'decimal',
  json: ['json', 'array'],
};

const fieldTypeMap = { postgres, mysql, sqlite, mariadb: mysql };
export default fieldTypeMap;
