import { getDatabase } from './';
import {
  HasMany, HasOne, Integer, BelongsTo, BelongsToMany
} from '../fields';
import { DataTypes } from 'sequelize';

describe('associations', () => {
  describe('hasOne', () => {
    it('shound be defaults', async () => {
      const db = getDatabase();
      db.table({
        name: 'foos',
      });
      db.table({
        name: 'bars',
        fields: [
          {
            type: 'hasone',
            name: 'foo',
          },
        ],
      });
      const field: HasOne = db.getTable('bars').getField('foo');
      expect(field.options.target).toBe('foos');
      expect(field.options.foreignKey).toBe('bar_id');
      expect(field.options.sourceKey).toBe('id');
    });
    it('shound be ok when the association table is defined later', async () => {
      const db = getDatabase();
      db.table({
        name: 'bars',
        fields: [
          {
            type: 'hasone',
            name: 'foo',
          },
        ],
      });
      db.table({
        name: 'foos',
      });
      const field: HasOne = db.getTable('bars').getField('foo');
      expect(field.options.target).toBe('foos');
      expect(field.options.foreignKey).toBe('bar_id');
      expect(field.options.sourceKey).toBe('id');
    });
    it('shound be custom when target is defined', () => {
      const db = getDatabase();
      db.table({
        name: 'foos',
      });
      db.table({
        name: 'bars',
        fields: [
          {
            type: 'hasone',
            name: 'foo2',
            target: 'foos',
          },
        ],
      });
      const field: HasOne = db.getTable('bars').getField('foo2');
      expect(field.options.target).toBe('foos');
      expect(field.options.foreignKey).toBe('bar_id');
      expect(field.options.sourceKey).toBe('id');
    });

    it('shound be custom when sourceKey is defined', () => {
      const db = getDatabase();
      db.table({
        name: 'foos',
      });
      db.table({
        name: 'bars',
        fields: [
          {
            type: 'hasone',
            name: 'foo',
            sourceKey: 'sid',
          },
        ],
      });
      const field: HasOne = db.getTable('bars').getField('foo');
      expect(field.options.target).toBe('foos');
      expect(field.options.foreignKey).toBe('bar_sid');
      expect(field.options.sourceKey).toBe('sid');
    });

    it('shound be integer type when the column of sourceKey does not exist', () => {
      const db = getDatabase();
      db.table({
        name: 'foos',
      });
      db.table({
        name: 'bars',
        fields: [
          {
            type: 'hasone',
            name: 'foo',
            sourceKey: 'sid',
          },
        ],
      });
      const field: HasOne = db.getTable('bars').getField('foo');
      expect(field.options.target).toBe('foos');
      expect(field.options.foreignKey).toBe('bar_sid');
      expect(field.options.sourceKey).toBe('sid');
      const sourceKeyColumn: Integer = db.getTable('bars').getField('sid');
      expect(sourceKeyColumn).toBeInstanceOf(Integer);
      expect(sourceKeyColumn.options.unique).toBe(true);
    });
  });

  describe('hasMany', () => {
    it('shound be defaults', async () => {
      const db = getDatabase();
      db.table({
        name: 'foo',
      });
      db.table({
        name: 'bar',
        fields: [
          {
            type: 'hasMany',
            name: 'foo',
          },
        ],
      });
      const field: HasMany = db.getTable('bar').getField('foo');
      expect(field.options.target).toBe('foo');
      expect(field.options.foreignKey).toBe('bar_id');
      expect(field.options.sourceKey).toBe('id');
    });
    it('shound be ok when the association table is defined later', async () => {
      const db = getDatabase();
      db.table({
        name: 'bars',
        fields: [
          {
            type: 'hasMany',
            name: 'foos',
          },
        ],
      });
      db.table({
        name: 'foos',
      });
      const field: HasMany = db.getTable('bars').getField('foos');
      expect(field.options.target).toBe('foos');
      expect(field.options.foreignKey).toBe('bar_id');
      expect(field.options.sourceKey).toBe('id');
    });
    it('shound be custom when target is defined', () => {
      const db = getDatabase();
      db.table({
        name: 'foos',
      });
      db.table({
        name: 'bars',
        fields: [
          {
            type: 'hasMany',
            name: 'foo2',
            target: 'foos',
          },
        ],
      });
      const field: HasMany = db.getTable('bars').getField('foo2');
      expect(field.options.target).toBe('foos');
      expect(field.options.foreignKey).toBe('bar_id');
      expect(field.options.sourceKey).toBe('id');
    });

    it('shound be custom when sourceKey is defined', () => {
      const db = getDatabase();
      db.table({
        name: 'foos',
      });
      db.table({
        name: 'bars',
        fields: [
          {
            type: 'hasMany',
            name: 'foos',
            sourceKey: 'sid',
          },
        ],
      });
      const field: HasMany = db.getTable('bars').getField('foos');
      expect(field.options.target).toBe('foos');
      expect(field.options.foreignKey).toBe('bar_sid');
      expect(field.options.sourceKey).toBe('sid');
    });

    it('shound be integer type when the column of sourceKey does not exist', () => {
      const db = getDatabase();
      db.table({
        name: 'foos',
      });
      db.table({
        name: 'bars',
        fields: [
          {
            type: 'hasMany',
            name: 'foos',
            sourceKey: 'sid',
          },
        ],
      });
      const field: HasMany = db.getTable('bars').getField('foos');
      expect(field.options.target).toBe('foos');
      expect(field.options.foreignKey).toBe('bar_sid');
      expect(field.options.sourceKey).toBe('sid');
      const sourceKeyColumn: Integer = db.getTable('bars').getField('sid');
      expect(sourceKeyColumn).toBeInstanceOf(Integer);
      expect(sourceKeyColumn.options.unique).toBe(true);
    });
  });

  describe('belongsTo', () => {
    it('shound be custom foreignKey', async () => {
      const db = getDatabase();
      db.table({
        name: 'bars',
        fields: [
          {
            type: 'belongsTo',
            name: 'foo',
          },
        ],
      });
      db.table({
        name: 'foos',
      });
      const field: BelongsTo = db.getTable('bars').getField('foo');
      expect(field.options.targetKey).toBe('id');
      expect(field.options.foreignKey).toBe('foo_id');
    });
    it('shound be custom foreignKey', async () => {
      const db = getDatabase();
      db.table({
        name: 'bars',
        fields: [
          {
            type: 'belongsTo',
            name: 'custom_foo',
            target: 'foos',
          },
        ],
      });
      db.table({
        name: 'foos',
      });
      const field: BelongsTo = db.getTable('bars').getField('custom_foo');
      expect(field.options.targetKey).toBe('id');
      expect(field.options.foreignKey).toBe('custom_foo_id');
    });
    it('shound be custom primaryKey', () => {
      const db = getDatabase();
      db.table({
        name: 'foos',
        fields: [
          {
            type: 'integer',
            name: 'fid',
            primaryKey: true,
            autoIncrement: true,
          }
        ],
      });
      db.table({
        name: 'bars',
        fields: [
          {
            type: 'belongsTo',
            name: 'foo',
          },
        ],
      });
      const field: BelongsTo = db.getTable('bars').getField('foo');
      expect(field.options.target).toBe('foos');
      expect(field.options.targetKey).toBe('fid');
      expect(field.options.foreignKey).toBe('foo_fid');
    });
    it('shound be custom primaryKey', () => {
      const db = getDatabase();
      db.table({
        name: 'bars',
        fields: [
          {
            type: 'belongsTo',
            name: 'foo',
          },
        ],
      });
      db.table({
        name: 'foos',
        fields: [
          {
            type: 'integer',
            name: 'fid',
            primaryKey: true,
            autoIncrement: true,
          }
        ],
      });
      const field: BelongsTo = db.getTable('bars').getField('foo');
      expect(field.options.target).toBe('foos');
      expect(field.options.targetKey).toBe('fid');
      expect(field.options.foreignKey).toBe('foo_fid');
    });
    it('shound throw error', () => {
      const db = getDatabase();
      db.table({
        name: 'foos',
      });
      expect(() => {
        db.table({
          name: 'bars',
          fields: [
            {
              type: 'belongsTo',
              name: 'foo',
              targetKey: 'fid',
            },
          ],
        });
      }).toThrow('Unknown attribute "fid" passed as targetKey, define this attribute on model "foos" first')
    });
    it('shound be ok when the association table is defined later', async () => {
      const db = getDatabase();
      db.table({
        name: 'bars',
        fields: [
          {
            type: 'belongsTo',
            name: 'foo',
            targetKey: 'fid',
          },
        ],
      });
      db.table({
        name: 'foos',
        fields: [
          {
            type: 'integer',
            name: 'fid',
          },
        ],
      });
      const field: BelongsTo = db.getTable('bars').getField('foo');
      expect(field.options.targetKey).toBe('fid');
      expect(field.options.foreignKey).toBe('foo_fid');
    });

    it('shound work', async () => {
      const db = getDatabase();
      db.table({
        name: 'rows',
        fields: [
          {
            type: 'string',
            name: 'name',
            unique: true,
          },
          {
            type: 'hasMany',
            name: 'columns',
            sourceKey: 'name',
          }
        ],
      });
      db.table({
        name: 'columns',
        fields: [
          {
            type: 'belongsTo',
            name: 'row',
            targetKey: 'name',
          },
          {
            type: 'string',
            name: 'name',
          }
        ],
      });
      const f1: BelongsTo = db.getTable('columns').getField('row');
      expect(f1.options.foreignKey).toBe('row_name');
      const f2: HasMany = db.getTable('rows').getField('columns');
      expect(f2.options.foreignKey).toBe('row_name');
    });
  });

  describe('belongsToMany', () => {
    it('shound be defaults', async () => {
      const db = getDatabase({
        logging: false,
      });
      db.table({
        name: 'foos',
        fields: [
          {
            type: 'belongsToMany',
            name: 'bars',
          },
        ],
      });
      db.table({
        name: 'bars_foos',
        fields: [
          {
            type: 'string',
            name: 'name',
          },
        ],
      });
      db.table({
        name: 'bars',
        fields: [
          {
            type: 'belongsToMany',
            name: 'foos',
          },
        ],
      });
      // console.log(db.getModel('bars_foos').rawAttributes);
      // await db.sync({
      //   force: true,
      // });
      let field: BelongsToMany;
      field = db.getTable('bars').getField('foos');
      expect(field.options.target).toBe('foos');
      expect(field.options.through).toBe('bars_foos');
      expect(field.options.sourceKey).toBe('id');
      expect(field.options.foreignKey).toBe('bar_id');
      expect(field.options.targetKey).toBe('id');
      expect(field.options.otherKey).toBe('foo_id');
      field = db.getTable('foos').getField('bars');
      expect(field.options.target).toBe('bars');
      expect(field.options.through).toBe('bars_foos');
      expect(field.options.sourceKey).toBe('id');
      expect(field.options.foreignKey).toBe('foo_id');
      expect(field.options.targetKey).toBe('id');
      expect(field.options.otherKey).toBe('bar_id');

      expect(db.getModel('foos').associations.bars).toBeDefined();
      expect(db.getModel('bars').associations.foos).toBeDefined();
    });

    it('shound be correct when use custom primary key', async () => {
      const db = getDatabase();
      db.table({
        name: 'foos',
        fields: [
          {
            type: 'integer',
            autoIncrement: true,
            name: 'fid',
            primaryKey: true,
          },
          {
            type: 'belongsToMany',
            name: 'bars',
          },
        ],
      });
      db.table({
        name: 'bars',
        fields: [
          {
            type: 'integer',
            autoIncrement: true,
            name: 'bid',
            primaryKey: true,
          },
          {
            type: 'belongsToMany',
            name: 'foos',
          },
        ],
      });
      // await db.sync({force: true});
      // await db.sequelize.close();
      let field: BelongsToMany;
      field = db.getTable('bars').getField('foos');
      expect(field.options.target).toBe('foos');
      expect(field.options.through).toBe('bars_foos');
      expect(field.options.sourceKey).toBe('bid');
      expect(field.options.foreignKey).toBe('bar_bid');
      expect(field.options.targetKey).toBe('fid');
      expect(field.options.otherKey).toBe('foo_fid');
      field = db.getTable('foos').getField('bars');
      expect(field.options.target).toBe('bars');
      expect(field.options.through).toBe('bars_foos');
      expect(field.options.sourceKey).toBe('fid');
      expect(field.options.foreignKey).toBe('foo_fid');
      expect(field.options.targetKey).toBe('bid');
      expect(field.options.otherKey).toBe('bar_bid');
      expect(db.getModel('foos').associations.bars).toBeDefined();
      expect(db.getModel('bars').associations.foos).toBeDefined();
      const { foos: barAssociation } = db.getModel('bars').associations as any;
      expect(barAssociation.target.name).toBe('foos');
      expect(barAssociation.through.model.name).toBe('bars_foos');
      expect(barAssociation.sourceKey).toBe('bid');
      expect(barAssociation.foreignKey).toBe('bar_bid');
      expect(barAssociation.targetKey).toBe('fid');
      expect(barAssociation.otherKey).toBe('foo_fid');
      const { bars: fooAssociation } = db.getModel('foos').associations as any;
      expect(fooAssociation.target.name).toBe('bars');
      expect(fooAssociation.through.model.name).toBe('bars_foos');
      expect(fooAssociation.sourceKey).toBe('fid');
      expect(fooAssociation.foreignKey).toBe('foo_fid');
      expect(fooAssociation.targetKey).toBe('bid');
      expect(fooAssociation.otherKey).toBe('bar_bid');
    });

    it('through be defined after source and target', async () => {
      const db = getDatabase({
        logging: false,
      });
      db.table({
        name: 'foos',
        fields: [
          {
            type: 'belongsToMany',
            name: 'bars',
          },
        ],
      });
      db.table({
        name: 'bars',
        fields: [
          {
            type: 'belongsToMany',
            name: 'foos',
          },
        ],
      });
      db.table({
        name: 'bars_foos',
        fields: [
          {
            type: 'string',
            name: 'name',
          },
        ],
      });
      // await db.sync({
      //   force: true,
      // });
      const Through = db.getModel('bars_foos');
      expect(Through.rawAttributes.name).toBeDefined();
      expect(Through.rawAttributes.foo_id).toBeDefined();
      expect(Through.rawAttributes.bar_id).toBeDefined();
    });

    it('through be defined after source', async () => {
      const db = getDatabase({
        logging: false,
      });
      db.table({
        name: 'foos',
        fields: [
          {
            type: 'belongsToMany',
            name: 'bars',
          },
        ],
      });
      db.table({
        name: 'bars_foos',
        fields: [
          {
            type: 'string',
            name: 'name',
          },
        ],
      });
      db.table({
        name: 'bars',
        fields: [
          {
            type: 'belongsToMany',
            name: 'foos',
          },
        ],
      });
      
      // await db.sync({
      //   force: true,
      // });
      const Through = db.getModel('bars_foos');
      expect(Through.rawAttributes.name).toBeDefined();
      expect(Through.rawAttributes.foo_id).toBeDefined();
      expect(Through.rawAttributes.bar_id).toBeDefined();
    });

    it('#', () => {
      const db = getDatabase({
        logging: false,
      });
      db.table({
        name: 'posts',
        fields: [
          {
            type: 'string',
            name: 'slug',
            unique: true,
          },
          {
            type: 'belongsToMany',
            name: 'tags',
            sourceKey: 'slug',
            targetKey: 'name',
          },
        ],
      });
      db.table({
        name: 'tags',
        fields: [
          {
            type: 'string',
            name: 'name',
            unique: true,
          },
          {
            type: 'belongsToMany',
            name: 'posts',
            sourceKey: 'name',
            targetKey: 'slug',
          },
        ],
      });

      const f1: BelongsToMany = db.getTable('posts').getField('tags');
      expect(f1.options).toEqual({
        target: 'tags',
        through: 'posts_tags',
        sourceKey: 'slug',
        foreignKey: 'post_slug',
        type: 'BELONGSTOMANY',
        name: 'tags',
        targetKey: 'name',
        otherKey: 'tag_name'
      });
      const f2: BelongsToMany = db.getTable('tags').getField('posts');
      expect(f2.options).toEqual({
        target: 'posts',
        through: 'posts_tags',
        sourceKey: 'name',
        foreignKey: 'tag_name',
        type: 'BELONGSTOMANY',
        name: 'posts',
        targetKey: 'slug',
        otherKey: 'post_slug'
      });
    });
  });

  it('shound be defined', () => {
    const db = getDatabase();
    db.table({
      name: 'bars',
      fields: [
        {
          type: 'string',
          name: 'foo_name',
        },
        {
          type: 'belongsTo',
          name: 'foo',
          foreignKey: 'foo_name',
          targetKey: 'name',
        }
      ],
    })
    db.table({
      name: 'foos',
      fields: [
        {
          type: 'string',
          name: 'name',
          unique: true,
        },
        {
          type: 'hasMany',
          name: 'bars',
          sourceKey: 'name',
          foreignKey: 'foo_name'
        },
      ],
    });
  });
});
