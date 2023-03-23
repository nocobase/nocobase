const postgres = {
  'character varying': 'string',
  varchar: 'string',
  text: 'string',
  char: 'string',

  smallint: 'integer',
  integer: 'integer',
  bigint: 'bigInt',
  decimal: 'float',
  numeric: 'float',
  'double precision': 'float',
};

const mysql = {};

const sqlite = {};

export default { postgres, mysql, sqlite };
