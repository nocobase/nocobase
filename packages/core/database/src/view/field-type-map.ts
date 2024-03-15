const postgres = {
  'character varying': ['string', 'uuid', 'nanoid'],
  varchar: ['string', 'uuid', 'nanoid'],
  char: ['string', 'uuid', 'nanoid'],

  character: 'string',
  text: 'text',
  oid: 'string',
  name: 'string',

  smallint: ['integer', 'sort'],
  integer: ['integer', 'sort'],
  bigint: ['bigInt', 'sort'],
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
};

const mysql = {
  smallint: ['integer', 'boolean', 'sort'],
  tinyint: ['integer', 'boolean', 'sort'],
  mediumint: ['integer', 'boolean', 'sort'],

  'smallint unsigned': ['integer', 'boolean', 'sort'],
  'tinyint unsigned': ['integer', 'boolean', 'sort'],
  'mediumint unsigned': ['integer', 'boolean', 'sort'],

  char: ['string', 'uuid', 'nanoid'],
  varchar: ['string', 'uuid', 'nanoid'],
  date: 'date',
  time: 'time',
  text: 'text',
  longtext: 'text',
  int: ['integer', 'sort'],
  'int unsigned': ['integer', 'sort'],
  integer: ['integer', 'sort'],
  bigint: ['bigInt', 'sort'],
  'bigint unsigned': ['bigInt', 'sort'],
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
  varchar: ['string', 'uuid', 'nanoid'],

  integer: 'integer',
  real: 'real',

  datetime: 'date',
  date: 'date',
  time: 'time',

  boolean: 'boolean',

  numeric: 'decimal',
  json: ['json', 'array'],
};

export default { postgres, mysql, sqlite, mariadb: mysql };
