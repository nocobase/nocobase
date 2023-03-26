const postgres = {
  'character varying': 'string',
  varchar: 'string',
  text: 'text',
  char: 'string',

  smallint: 'integer',
  integer: 'integer',
  bigint: 'bigInt',
  decimal: 'float',
  numeric: 'float',
  'double precision': 'float',

  'timestamp without time zone': 'date',
  'timestamp with time zone': 'date',
  date: 'date',

  json: ['json', 'array'],
  jsonb: ['jsonb', 'array'],
};

const mysql = {
  varchar: 'string',
  text: 'text',
  int: 'integer',
  integer: 'integer',
  bigint: 'bigInt',
  float: 'float',
  double: 'float',
  boolean: 'boolean',

  tinyint: 'integer',
  datetime: 'date',
  timestamp: 'date',
  json: 'json',
};

const sqlite = {};

export default { postgres, mysql, sqlite };
