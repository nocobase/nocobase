import {
  buildField,
  Column,
  BOOLEAN as Boolean,
  INTEGER as Integer,
  STRING as String,
  TEXT as Text,
  HASONE as HasOne,
  HASMANY as HasMany,
  BELONGSTO as BelongsTo,
  BELONGSTOMANY as BelongsToMany,
  FLOAT as Float,
  DOUBLE as Double,
  REAL as Real,
  DECIMAL as Decimal,
  TIME as Time,
  DATE as Date,
  DATEONLY as DateOnly,
  ARRAY as Array,
  JSON as Json,
  JSONB as Jsonb,
  PASSWORD as Password,
} from '../../fields';
import { DataTypes } from 'sequelize';
import { ABSTRACT } from 'sequelize/lib/data-types';
import { getDatabase } from '..';
import Database from '../..';

describe('field types', () => {
  const assertTypeInstanceOf = (expected, actual) => {
    const db: Database = getDatabase();
    const table = db.table({
      name: 'test',
    });
    const field = buildField({
      type: actual,
      name: 'test',
    }, {
      sourceTable: table,
      database: db,
    });
    expect(field).toBeInstanceOf(expected);
    if (field instanceof Column) {
      const { type } = field.getAttributeOptions() as any;
      if (actual instanceof ABSTRACT) {
        expect(type).toBeInstanceOf(field.getDataType());
        // postgres 的 text 不限制长度，无需参数
        if (db.sequelize.getDialect() !== 'postgres' || field.getType() !== 'TEXT') {
          // 非严谨比较，undefined == null
          expect(type).toEqual(actual);
        }
      } else if (typeof actual === 'function') {
        expect(type).toBe(field.getDataType());
        expect(type).toBe(actual);
      } else if (typeof actual === 'string') {
        expect(type).toBe(field.getDataType());
      }
    }
    db.close();
  }

  it('shound be boolean', () => {
    assertTypeInstanceOf(Boolean, 'boolean');
    assertTypeInstanceOf(Boolean, DataTypes.BOOLEAN);
  });

  it('shound be integer', () => {
    assertTypeInstanceOf(Integer, 'int');
    assertTypeInstanceOf(Integer, 'integer');
    assertTypeInstanceOf(Integer, DataTypes.INTEGER);
    assertTypeInstanceOf(Integer, DataTypes.INTEGER({
      length: 5,
    }));
  });

  it('shound be tiny integer', () => {
    assertTypeInstanceOf(Integer, 'tinyint');
    assertTypeInstanceOf(Integer, 'tinyInt');
    assertTypeInstanceOf(Integer, 'tinyinteger');
    assertTypeInstanceOf(Integer, 'tinyInteger');
    assertTypeInstanceOf(Integer, DataTypes.TINYINT);
    assertTypeInstanceOf(Integer, DataTypes.TINYINT({
      length: 5,
    }));
  });

  it('shound be small integer', () => {
    assertTypeInstanceOf(Integer, 'smallint');
    assertTypeInstanceOf(Integer, 'smallInt');
    assertTypeInstanceOf(Integer, 'smallinteger');
    assertTypeInstanceOf(Integer, 'smallInteger');
    assertTypeInstanceOf(Integer, DataTypes.SMALLINT);
    assertTypeInstanceOf(Integer, DataTypes.SMALLINT({
      length: 5,
    }));
  });

  it('shound be medium integer', () => {
    assertTypeInstanceOf(Integer, 'mediumInt');
    assertTypeInstanceOf(Integer, 'MediumInt');
    assertTypeInstanceOf(Integer, 'MediumInteger');
    assertTypeInstanceOf(Integer, 'MediumInteger');
    assertTypeInstanceOf(Integer, DataTypes.MEDIUMINT);
    assertTypeInstanceOf(Integer, DataTypes.MEDIUMINT({
      length: 5,
    }));
  });

  it('shound be big integer', () => {
    assertTypeInstanceOf(Integer, 'bigint');
    assertTypeInstanceOf(Integer, 'bigInt');
    assertTypeInstanceOf(Integer, 'biginteger');
    assertTypeInstanceOf(Integer, 'bigInteger');
    assertTypeInstanceOf(Integer, DataTypes.BIGINT);
    assertTypeInstanceOf(Integer, DataTypes.BIGINT({
      length: 5,
    }));
  });

  it('shound be float', () => {
    assertTypeInstanceOf(Float, 'float');
    assertTypeInstanceOf(Float, DataTypes.FLOAT({
      length: 5,
    }));
  });

  it('shound be double', () => {
    assertTypeInstanceOf(Double, 'double');
    assertTypeInstanceOf(Double, DataTypes.DOUBLE(10));
  });

  it('shound be real', () => {
    assertTypeInstanceOf(Real, 'real');
    assertTypeInstanceOf(Real, DataTypes.REAL({
      length: 5,
    }));
  });

  it('shound be decimal', () => {
    assertTypeInstanceOf(Decimal, 'decimal');
    assertTypeInstanceOf(Decimal, DataTypes.DECIMAL(5));
  });

  it('shound be string', () => {
    assertTypeInstanceOf(String, 'string');
    assertTypeInstanceOf(String, DataTypes.STRING);
    assertTypeInstanceOf(String, DataTypes.STRING(100));
  });

  it('shound be text', () => {
    assertTypeInstanceOf(Text, 'text');
    assertTypeInstanceOf(Text, DataTypes.TEXT);
    assertTypeInstanceOf(Text, DataTypes.TEXT({
      length: 'long',
    }));
  });

  it('shound be time', () => {
    assertTypeInstanceOf(Time, 'time');
    assertTypeInstanceOf(Time, DataTypes.TIME);
  });

  it('shound be date', () => {
    assertTypeInstanceOf(Date, 'date');
    assertTypeInstanceOf(Date, 'timestamp');
    assertTypeInstanceOf(Date, DataTypes.DATE);
    assertTypeInstanceOf(Date, DataTypes.DATE(2));
  });

  it('shound be dateonly', () => {
    assertTypeInstanceOf(DateOnly, 'dateOnly');
    assertTypeInstanceOf(DateOnly, 'dateonly');
    assertTypeInstanceOf(DateOnly, DataTypes.DATEONLY);
  });

  it('shound be array', () => {
    assertTypeInstanceOf(Array, 'array');
  });

  it('shound be json', () => {
    assertTypeInstanceOf(Json, 'json');
    assertTypeInstanceOf(Json, DataTypes.JSON);
  });

  it('shound be jsonb', () => {
    assertTypeInstanceOf(Jsonb, 'jsonb');
    assertTypeInstanceOf(Jsonb, DataTypes.JSONB);
  });

  it('shound be HasOne relationship', () => {
    assertTypeInstanceOf(HasOne, 'hasone');
    assertTypeInstanceOf(HasOne, 'hasOne');
    assertTypeInstanceOf(HasOne, 'HasOne');
  });

  it('shound be HasMany relationship', () => {
    assertTypeInstanceOf(HasMany, 'hasmany');
    assertTypeInstanceOf(HasMany, 'hasMany');
    assertTypeInstanceOf(HasMany, 'HasMany');
  });

  it('shound be BelongsTo relationship', () => {
    assertTypeInstanceOf(BelongsTo, 'belongsto');
    assertTypeInstanceOf(BelongsTo, 'belongsTo');
    assertTypeInstanceOf(BelongsTo, 'BelongsTo');
  });

  it('shound be BelongsToMany relationship', () => {
    assertTypeInstanceOf(BelongsToMany, 'belongstomany');
    assertTypeInstanceOf(BelongsToMany, 'belongsToMany');
    assertTypeInstanceOf(BelongsToMany, 'BelongsToMany');
  });

  describe('virtual', () => {
    let db: Database;
    beforeEach(async () => {
      db = getDatabase();
      db.table({
        name: 'formula_tests',
        fields: [
          {
            type: 'string',
            name: 'title',
          },
          {
            type: 'integer',
            name: 'number1',
          },
          {
            type: 'integer',
            name: 'number2',
          },
          {
            type: 'json',
            name: 'meta',
          },
          {
            type: 'formula',
            name: 'formula1',
            format: 'number',
            formula: '{{ number1 + number2 }}',
          },
          {
            type: 'formula',
            name: 'formula2',
            formula: '1{{ title }}2',
          },
          {
            type: 'reference',
            name: 'reference1',
            dataIndex: 'key1',
            source: 'meta',
          },
          {
            type: 'reference',
            name: 'reference2',
            dataIndex: 'col2',
            source: 'bar',
          },
          {
            type: 'belongsTo',
            name: 'bar',
          },
        ],
      });
      db.table({
        name: 'password_table',
        fields: [
          {
            type: 'password',
            name: 'password',
          },
        ],
      })
      db.table({
        name: 'bars',
        tableName: 'formula_bars',
        fields: [
          {
            type: 'string',
            name: 'col2',
          }
        ],
      })
      await db.sync({force: true});
    });
    afterEach(async () => {
      await db.close();
    });
    it('pwd', async () => {
      const Pwd = db.getModel('password_table');
      const pwd = await Pwd.create({
        password: '123456',
      });
      expect(Password.verify('123456', pwd.password)).toBeTruthy();
    });
    it('formula', async () => {
      const [ Formula ] = db.getModels(['formula_tests']);
      const formula = await Formula.create({
        title: 'title1',
        number1: 1,
        number2: 2,
      });
      expect(formula.formula1).toBe(3);
      expect(formula.formula2).toBe('1title12');
    });
    it('formula', async () => {
      const [ Formula ] = db.getModels(['formula_tests']);
      const formula = await Formula.create({
        meta: {
          key1: 'val1',
        },
      });
      await formula.updateAssociations({
        bar: {
          col2: 'val2',
        }
      });
      const f = await Formula.findOne({
        where: {
          id: formula.id,
        },
        include: {
          association: 'bar',
        }
      });
      expect(f.reference1).toBe('val1');
      expect(f.reference2).toBe('val2');
    });
  });
});
