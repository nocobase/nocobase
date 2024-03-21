import { BelongsToManyRepository } from '@nocobase/database';
import Database from '../../database';
import { InheritedCollection } from '../../inherited-collection';
import { mockDatabase } from '../index';
import { isPg } from '@nocobase/test';

describe.runIf(isPg())('collection inherits', () => {
  let db: Database;

  beforeEach(async () => {
    db = mockDatabase();
    await db.clean({ drop: true });
  });

  afterEach(async () => {
    await db.close();
  });

  it('should append __collection with eager load', async () => {
    const Root = db.collection({
      name: 'root',
      fields: [
        { name: 'name', type: 'string' },
        {
          name: 'bs',
          type: 'hasMany',
          target: 'b',
          foreignKey: 'root_id',
        },
      ],
    });

    const Child = db.collection({
      name: 'child',
      inherits: ['root'],
    });

    const B = db.collection({
      name: 'b',
      fields: [{ name: 'name', type: 'string' }],
    });

    await db.sync();

    await Child.repository.create({
      values: {
        name: 'child1',
        bs: [
          {
            name: 'b1',
          },
        ],
      },
    });

    const data = await Root.repository.findOne({
      fields: ['bs.name'],
    });

    expect(data.get('__collection')).toEqual('child');
    expect(data.get('bs')[0].get('name')).toEqual('b1');
  });

  it('should not remove parent field reference map after child rewrite field', async () => {
    const through = db.collection({
      name: 'through',
      fields: [{ name: 'name', type: 'string' }],
    });

    const rootCollection = db.collection({
      name: 'root',
      fields: [
        { name: 'name', type: 'string' },
        {
          name: 'targets',
          type: 'belongsToMany',
          target: 'root-target',
          through: 'through',
          foreignKey: 'rootId',
          otherKey: 'targetId',
        },
      ],
    });

    const rootTarget = db.collection({
      name: 'root-target',
      fields: [{ name: 'name', type: 'string' }],
    });

    await db.sync({ force: true });

    expect(db.referenceMap.getReferences('root-target')).toHaveLength(1);

    const child = db.collection({
      name: 'child',
      inherits: ['root'],
    });

    const childTarget = db.collection({
      name: 'child-target',
      inherits: ['root-target'],
    });

    await child.setField('targets', {
      name: 'targets',
      type: 'belongsToMany',
      target: 'child-target',
      through: 'through',
      foreignKey: 'rootId',
      otherKey: 'targetId',
    });

    await db.sync();

    expect(db.referenceMap.getReferences('root-target')).toHaveLength(1);
  });

  it('should append collection name in eager load', async () => {
    const rootCollection = db.collection({
      name: 'assoc',
      fields: [
        { name: 'name', type: 'string' },
        { type: 'belongsToMany', name: 'other-assocs' },
      ],
    });

    const childCollection = db.collection({
      name: 'child',
      inherits: ['assoc'],
    });

    const otherAssoc = db.collection({
      name: 'other-assocs',
      fields: [{ name: 'name', type: 'string' }],
    });

    const User = db.collection({
      name: 'users',
      fields: [
        {
          name: 'name',
          type: 'string',
        },
        {
          name: 'assocs',
          type: 'hasMany',
          target: 'assoc',
        },
      ],
    });

    await db.sync();

    const child = await childCollection.repository.create({
      values: {
        name: 'child1',
      },
    });

    await User.repository.create({
      values: {
        name: 'user1',
        assocs: [
          {
            id: child.get('id'),
          },
        ],
      },
    });

    const users = await User.repository.find({
      appends: ['assocs.other-assocs'],
    });

    const user = users[0];

    const assoc = user.get('assocs')[0];
    expect(assoc.get('__tableName')).toEqual(childCollection.model.tableName);
    expect(assoc.get('__schemaName')).toEqual(childCollection.collectionSchema());

    expect(user.get('assocs')[0].get('__collection')).toBe('child');
  });

  it('should list data filtered by child type', async () => {
    const assocs = db.collection({
      name: 'assocs',
      fields: [{ name: 'name', type: 'string' }],
    });

    const rootCollection = db.collection({
      name: 'root',
      fields: [
        { name: 'name', type: 'string' },
        { name: 'assocs', type: 'hasMany', target: 'assocs' },
      ],
    });

    const child1Collection = db.collection({
      name: 'child1',
      inherits: ['root'],
    });

    const child2Collection = db.collection({
      name: 'child2',
      inherits: ['root'],
    });

    await db.sync();

    await rootCollection.repository.create({
      values: {
        name: 'root1',
        assocs: [
          {
            name: 'assoc1',
          },
        ],
      },
    });

    await child1Collection.repository.create({
      values: [
        {
          name: 'child1-1',
          assocs: [
            {
              name: 'child-assoc1-1',
            },
          ],
        },
        {
          name: 'child1-2',
          assocs: [{ name: 'child-assoc1-2' }],
        },
      ],
    });

    await child2Collection.repository.create({
      values: [{ name: 'child2-1' }, { name: 'child2-2' }],
    });

    const records = await rootCollection.repository.find({
      filter: {
        '__collection.$childIn': [child1Collection.name],
      },
      appends: ['assocs'],
    });

    expect(records.every((r) => r.get('__collection') === child1Collection.name)).toBe(true);

    const records2 = await rootCollection.repository.find({
      filter: {
        '__collection.$childNotIn': [child1Collection.name],
      },
    });
    expect(records2.every((r) => r.get('__collection') !== child1Collection.name)).toBe(true);

    const recordsWithFilter = await rootCollection.repository.find({
      filter: {
        '__collection.$childIn': [child1Collection.name],
        assocs: {
          name: 'child-assoc1-1',
        },
      },
    });

    expect(recordsWithFilter.every((r) => r.get('__collection') == child1Collection.name)).toBe(true);

    const filterWithUndefined = await rootCollection.repository.find({
      filter: {
        '__collection.$childIn': 'undefined',
      },
    });

    expect(filterWithUndefined).toHaveLength(0);
  });

  it('should list collection name in relation repository', async () => {
    const personTagCollection = db.collection({
      name: 'personTags',
      fields: [{ name: 'name', type: 'string' }],
    });

    const studentTagCollection = db.collection({
      name: 'studentTags',
      inherits: ['personTags'],
      fields: [{ name: 'school', type: 'string' }],
    });

    const personCollection = db.collection({
      name: 'person',
      fields: [{ name: 'tags', type: 'belongsToMany', target: 'personTags' }],
    });

    const studentCollection = db.collection({
      name: 'student',
      inherits: ['person'],
      fields: [],
    });

    await db.sync();

    const studentTag1 = await studentTagCollection.repository.create({
      values: {
        name: 'studentTag',
        school: 'school1',
      },
    });

    const personTag1 = await personTagCollection.repository.create({
      values: {
        name: 'personTag',
      },
    });

    await studentCollection.repository.create({
      values: {
        tags: [
          {
            id: studentTag1.get('id'),
          },
          {
            id: personTag1.get('id'),
          },
        ],
      },
    });

    const person1 = await personCollection.repository.findOne({});

    const tags = await personCollection.repository
      .relation<BelongsToManyRepository>('tags')
      .of(person1.get('id'))
      .find({});

    const personTag = tags.find((tag) => tag.get('name') === 'personTag');
    const studentTag = tags.find((tag) => tag.get('name') === 'studentTag');

    expect(personTag.get('__collection')).toEqual(personTagCollection.name);
    expect(studentTag.get('__collection')).toEqual(studentTagCollection.name);
  });

  it('should create inherits with table name contains upperCase', async () => {
    db.collection({
      name: 'parent',
      fields: [{ name: 'field1', type: 'date' }],
    });
    await db.sync({
      force: false,
      alter: {
        drop: false,
      },
    });
    db.collection({
      name: 'abcABC',
      inherits: ['parent'],
      fields: [{ type: 'string', name: 'name' }],
    });
    await db.sync({
      force: false,
      alter: {
        drop: false,
      },
    });
  });

  it('should throw error when create inherits from empty table', async () => {
    const empty = db.collection({
      name: 'empty',
      timestamps: false,
      autoGenId: false,
      fields: [],
    });

    await db.sync({
      force: false,
      alter: {
        drop: false,
      },
    });

    const parent2 = db.collection({
      name: 'parent2',
    });

    const inherits = db.collection({
      name: 'inherits',
      inherits: ['empty', 'parent2'],
      fields: [{ type: 'string', name: 'name' }],
    });

    let error;
    try {
      await db.sync({
        force: false,
        alter: {
          drop: false,
        },
      });
    } catch (e) {
      error = e;
    }

    expect(error).toBeTruthy();
    expect(error.message.includes("can't inherit from")).toBeTruthy();
  });

  it('should not throw error when fields have same type with parent', async () => {
    db.collection({
      name: 'parent',
      fields: [{ name: 'field1', type: 'date' }],
    });

    expect(() => {
      db.collection({
        name: 'child',
        inherits: ['parent'],
        fields: [
          {
            name: 'field1',
            type: 'date',
            otherOptions: true,
          },
        ],
      });
    }).not.toThrowError();
  });

  it('should throw error when fields conflict with parent ', async () => {
    db.collection({
      name: 'parent',
      fields: [{ name: 'field1', type: 'string' }],
    });

    expect(() => {
      db.collection({
        name: 'child',
        inherits: ['parent'],
        fields: [{ name: 'field1', type: 'integer' }],
      });
    }).toThrowError();

    await db.sync();
  });

  it.skip('should not conflict when fields have same DateType', async () => {
    db.collection({
      name: 'parent',
      fields: [{ name: 'field1', type: 'string' }],
    });

    expect(() => {
      db.collection({
        name: 'child',
        inherits: ['parent'],
        fields: [
          {
            name: 'field1',
            type: 'sequence',
            patterns: [
              {
                type: 'integer',
              },
            ],
          },
        ],
      });
    }).not.toThrowError();
  });

  it('should create inherits with lazy parents', async () => {
    const child = db.collection({
      name: 'child',
      inherits: ['delay-parents'],
    });

    expect(child.getField('parent-field')).toBeFalsy();

    db.collection({
      name: 'delay-parents',
      fields: [
        {
          type: 'string',
          name: 'parent-field',
        },
      ],
    });

    expect(child.getField('parent-field')).toBeTruthy();
  });

  it('should create inherits with multiple lazy parents', async () => {
    const child = db.collection({
      name: 'child',
      inherits: ['parent1', 'parent2'],
    });

    expect(child.getField('parent1-field')).toBeFalsy();

    db.collection({
      name: 'parent1',
      fields: [
        {
          type: 'string',
          name: 'parent1-field',
        },
      ],
    });

    expect(child.getField('parent1-field')).toBeFalsy();

    db.collection({
      name: 'parent2',
      fields: [
        {
          type: 'string',
          name: 'parent2-field',
        },
      ],
    });

    expect(child.getField('parent1-field')).toBeTruthy();
  });

  it('should inherit from no id table', async () => {
    const interfaceCollection = db.collection({
      name: 'a',
      fields: [
        {
          type: 'string',
          name: 'name',
        },
      ],
      timestamps: false,
    });

    interfaceCollection.model.removeAttribute('id');
    const child = db.collection({
      name: 'b',
      inherits: ['a'],
    });

    await db.sync();

    const childInstance = await child.repository.create({
      values: {
        name: 'test',
      },
    });

    expect(childInstance.get('name')).toBe('test');
  });

  it('should pass empty inherits params', async () => {
    const table1 = db.collection({
      name: 'table1',
      fields: [{ type: 'string', name: 'name' }],
    });

    const table2 = db.collection({
      name: 'table2',
      inherits: [],
    });

    expect(table2).not.toBeInstanceOf(InheritedCollection);
  });

  it('should remove Node after collection destroy', async () => {
    const table1 = db.collection({
      name: 'table1',
      fields: [{ type: 'string', name: 'name' }],
    });

    db.collection({
      name: 'table2',
      fields: [{ type: 'string', name: 'integer' }],
    });

    const collection3 = db.collection({
      name: 'table3',
      inherits: ['table1', 'table2'],
    });

    await db.removeCollection(collection3.name);

    expect(db.inheritanceMap.getNode('table3')).toBeUndefined();
    expect(table1.isParent()).toBeFalsy();
  });

  it('can update relation with child table', async () => {
    const A = db.collection({
      name: 'a',
      fields: [
        {
          name: 'a-field',
          type: 'string',
        },
        {
          name: 'a1s',
          type: 'hasMany',
          target: 'a1',
          foreignKey: 'aId',
        },
      ],
    });

    const A1 = db.collection({
      name: 'a1',
      inherits: ['a'],
      fields: [
        {
          name: 'a1-field',
          type: 'string',
        },
      ],
    });

    await db.sync();

    await A.repository.create({
      values: {
        'a-field': 'a-1',
      },
    });

    let a11 = await A1.repository.create({
      values: {
        'a1-field': 'a1-1',
        'a-field': 'a1-1',
      },
    });

    const a12 = await A1.repository.create({
      values: {
        'a1-field': 'a1-2',
        'a-field': 'a1-2',
      },
    });

    await A1.repository.update({
      filterByTk: a11.get('id'),
      values: {
        a1s: [{ id: a12.get('id') }],
      },
    });

    a11 = await A1.repository.findOne({
      filter: {
        'a1-field': 'a1-1',
      },
      appends: ['a1s'],
    });

    const a11a1s = a11.get('a1s');
    expect(a11a1s[0].get('id')).toBe(a12.get('id'));
  });

  it('can create relation with child table', async () => {
    const A = db.collection({
      name: 'a',
      fields: [
        {
          name: 'af',
          type: 'string',
        },
        {
          name: 'bs',
          type: 'hasMany',
          target: 'b',
        },
      ],
    });

    const B = db.collection({
      name: 'b',
      inherits: ['a'],
      fields: [
        {
          name: 'bf',
          type: 'string',
        },
        {
          name: 'a',
          type: 'belongsTo',
          target: 'a',
        },
      ],
    });

    await db.sync();

    const a1 = await B.repository.create({
      values: {
        af: 'a1',
        bs: [{ bf: 'b1' }, { bf: 'b2' }],
      },
    });

    expect(a1.get('bs').length).toBe(2);

    const b1 = await B.repository.findOne({
      filter: {
        af: 'a1',
      },
      appends: ['bs'],
    });

    expect(b1.get('bs').length).toBe(2);
  });

  it('should inherit belongsToMany field', async () => {
    db.collection({
      name: 'person',
      fields: [
        {
          name: 'name',
          type: 'string',
        },
        {
          name: 'tags',
          type: 'belongsToMany',
        },
      ],
    });

    db.collection({
      name: 'tags',
      fields: [
        {
          name: 'name',
          type: 'string',
        },
        {
          name: 'person',
          type: 'belongsToMany',
        },
      ],
    });

    db.collection({
      name: 'students',
      inherits: 'person',
      fields: [
        {
          name: 'score',
          type: 'integer',
        },
      ],
    });

    await db.sync();

    await db.getCollection('students').repository.create({
      values: {
        name: 'John',
        score: 100,
        tags: [
          {
            name: 't1',
          },
          {
            name: 't2',
          },
          {
            name: 't3',
          },
        ],
      },
    });

    await db.getCollection('person').repository.create({
      values: {
        name: 'Max',
        tags: [
          {
            name: 't2',
          },
          {
            name: 't4',
          },
        ],
      },
    });

    const john = await db.getCollection('students').repository.findOne({
      appends: ['tags'],
    });

    expect(john.get('name')).toBe('John');
    expect(john.get('tags')).toHaveLength(3);

    const max = await db.getCollection('person').repository.findOne({
      appends: ['tags'],
      filter: {
        name: 'Max',
      },
    });

    expect(max.get('name')).toBe('Max');
    expect(max.get('tags')).toHaveLength(2);
  });

  it('should inherit hasMany field', async () => {
    db.collection({
      name: 'person',
      fields: [
        {
          name: 'name',
          type: 'string',
        },
        {
          name: 'pets',
          type: 'hasMany',
        },
      ],
    });

    db.collection({
      name: 'pets',
      fields: [
        {
          name: 'name',
          type: 'string',
        },
      ],
    });

    db.collection({
      name: 'students',
      inherits: 'person',
      fields: [
        {
          name: 'score',
          type: 'integer',
        },
      ],
    });

    await db.sync();

    await db.getCollection('person').repository.create({
      values: {
        name: 'Max',
        pets: [
          {
            name: 'doge1',
          },
          {
            name: 'kitty1',
          },
        ],
      },
    });

    await db.getCollection('students').repository.create({
      values: {
        name: 'John',
        score: 100,
        pets: [
          {
            name: 'doge',
          },
          {
            name: 'kitty',
          },
          {
            name: 'doge2',
          },
        ],
      },
    });

    const john = await db.getCollection('students').repository.findOne({
      appends: ['pets'],
    });

    expect(john.get('name')).toBe('John');
    expect(john.get('pets')).toHaveLength(3);
  });

  it('can inherit from multiple collections', async () => {
    const a = db.collection({
      name: 'a',
      fields: [{ type: 'string', name: 'a1' }],
    });

    const b = db.collection({
      name: 'b',
      fields: [{ type: 'string', name: 'b1' }],
    });

    const c = db.collection({
      name: 'c',
      inherits: ['a', 'b'],
      fields: [
        { type: 'bigInt', name: 'id', autoIncrement: true },
        { type: 'string', name: 'c1' },
      ],
    });

    await db.sync();

    expect(c.getField('a1')).toBeTruthy();
    expect(c.getField('b1')).toBeTruthy();
    expect(c.getField('c1')).toBeTruthy();

    const c1 = await c.repository.create({
      values: {
        a1: 'a1',
        b1: 'b1',
        c1: 'c1',
      },
    });

    expect(c1.get('a1')).toBe('a1');
    expect(c1.get('b1')).toBe('b1');
    expect(c1.get('c1')).toBe('c1');

    const a2 = await a.repository.create({
      values: {
        a1: 'a2',
      },
    });

    expect(a2.get('id')).toEqual(2);

    db.collection({
      name: 'd',
      inherits: ['c'],
    });

    await db.sync();
  });

  it('should update inherit field when parent field update', async () => {
    db.collection({
      name: 'person',
      fields: [{ name: 'name', type: 'string', title: 'parent-name' }],
    });

    db.collection({
      name: 'students',
      inherits: 'person',
    });

    expect(db.getCollection('students').getField('name').get('title')).toBe('parent-name');

    db.getCollection('person').setField('name', { type: 'string', title: 'new-name' });

    expect(db.getCollection('person').getField('name').get('title')).toBe('new-name');
    expect(db.getCollection('students').getField('name').get('title')).toBe('new-name');
  });

  it('should not replace child field when parent field update', async () => {
    db.collection({
      name: 'person',
      fields: [{ name: 'name', type: 'string', title: 'parent-name' }],
    });

    db.collection({
      name: 'students',
      inherits: 'person',
      fields: [{ name: 'name', type: 'string', title: 'student-name' }],
    });

    expect(db.getCollection('students').getField('name').get('title')).toBe('student-name');

    db.getCollection('person').setField('name', { type: 'string', title: 'new-name' });

    expect(db.getCollection('person').getField('name').get('title')).toBe('new-name');
    expect(db.getCollection('students').getField('name').get('title')).toBe('student-name');
  });

  it('should replace child association target', async () => {
    db.collection({
      name: 'person',
      fields: [
        { name: 'name', type: 'string' },
        { type: 'hasOne', name: 'profile', foreignKey: 'personId' },
      ],
    });

    const Profile = db.collection({
      name: 'profiles',
      fields: [
        { name: 'age', type: 'integer' },
        {
          type: 'belongsTo',
          name: 'person',
          foreignKey: 'personId',
        },
      ],
    });

    db.collection({
      name: 'students',
      inherits: 'person',
      fields: [
        { name: 'score', type: 'integer' },
        {
          type: 'hasOne',
          name: 'profile',
          target: 'studentProfiles',
        },
      ],
    });

    db.collection({
      name: 'teachers',
      inherits: 'person',
      fields: [{ name: 'salary', type: 'integer' }],
    });

    db.collection({
      name: 'studentProfiles',
      fields: [{ name: 'grade', type: 'string' }],
    });

    await db.sync();

    const student = await db.getCollection('students').repository.create({
      values: {
        name: 'foo',
        score: 100,
        profile: {
          grade: 'A',
        },
      },
    });

    expect(student.get('profile').get('grade')).toBe('A');

    const teacher = await db.getCollection('teachers').repository.create({
      values: {
        name: 'bar',
        salary: 1000,
        profile: {
          age: 30,
        },
      },
    });

    expect(teacher.get('profile').get('age')).toBe(30);
  });

  it('should replace hasOne association field', async () => {
    const person = db.collection({
      name: 'person',
      fields: [
        { name: 'name', type: 'string' },
        { type: 'hasOne', name: 'profile', target: 'profiles', foreignKey: 'person_id' },
      ],
    });

    const profile = db.collection({
      name: 'profiles',
      fields: [
        { name: 'age', type: 'integer' },
        {
          type: 'belongsTo',
          name: 'person',
        },
      ],
    });

    const student = db.collection({
      name: 'students',
      inherits: 'person',
      fields: [{ name: 'profile', type: 'hasOne', target: 'studentProfiles', foreignKey: 'student_id' }],
    });

    const studentProfile = db.collection({
      name: 'studentProfiles',
      fields: [{ name: 'score', type: 'integer' }],
    });

    await db.sync();

    const student1 = await student.repository.create({
      values: {
        name: 'student-1',
        profile: {
          score: '100',
        },
      },
    });

    let person1 = await person.repository.findOne();
    await person.repository
      .relation('profile')
      .of(person1.get('id'))
      .create({
        values: {
          age: 30,
        },
      });

    person1 = await person.repository.findOne({
      appends: ['profile'],
    });

    expect(person1.get('profile').get('age')).toBe(30);

    expect(student1.get('profile').get('score')).toBe(100);
  });

  it('should inherit hasOne association field', async () => {
    const person = db.collection({
      name: 'person',
      fields: [
        { name: 'name', type: 'string' },
        { type: 'hasOne', name: 'profile' },
      ],
    });

    const profile = db.collection({
      name: 'profiles',
      fields: [
        { name: 'age', type: 'integer' },
        {
          type: 'belongsTo',
          name: 'person',
        },
      ],
    });

    db.collection({
      name: 'students',
      inherits: 'person',
      fields: [{ name: 'score', type: 'integer' }],
    });

    db.collection({
      name: 'teachers',
      inherits: 'person',
      fields: [{ name: 'salary', type: 'integer' }],
    });

    await db.sync();

    await db.getCollection('students').repository.create({
      values: {
        name: 'foo',
        score: 100,
        profile: {
          age: 18,
        },
      },
    });

    await db.getCollection('teachers').repository.create({
      values: {
        name: 'bar',
        salary: 1000,
        profile: {
          age: 30,
        },
      },
    });

    const studentFoo = await db.getCollection('students').repository.findOne({
      appends: ['profile'],
    });

    const teacherBar = await db.getCollection('teachers').repository.findOne({
      appends: ['profile'],
    });

    expect(studentFoo.get('profile').age).toBe(18);
    expect(teacherBar.get('profile').age).toBe(30);
  });

  it('should inherit from Collection', async () => {
    const person = db.collection({
      name: 'person',
      fields: [{ name: 'name', type: 'string' }],
    });

    const student = db.collection({
      name: 'student',
      inherits: 'person',
      fields: [{ name: 'score', type: 'integer' }],
    });

    await db.sync();

    const StudentRepository = student.repository;

    await StudentRepository.create({
      values: { name: 'student1' },
    });

    expect(await person.repository.count()).toBe(1);
  });

  it('should create inherited table', async () => {
    const person = db.collection({
      name: 'person',
      fields: [{ name: 'name', type: 'string' }],
    });

    const student = db.collection({
      name: 'student',
      inherits: 'person',
      fields: [{ name: 'score', type: 'integer' }],
    });

    await db.sync();

    const studentTableInfo = await db.sequelize.getQueryInterface().describeTable(student.model.tableName);

    const getField = (name) => student.model.rawAttributes[name].field;

    expect(studentTableInfo[getField('score')]).toBeDefined();
    expect(studentTableInfo[getField('name')]).toBeDefined();
    expect(studentTableInfo[getField('id')]).toBeDefined();
    expect(studentTableInfo[getField('createdAt')]).toBeDefined();
    expect(studentTableInfo[getField('updatedAt')]).toBeDefined();
  });

  it('should get parent fields', async () => {
    const root = db.collection({
      name: 'root',
      fields: [{ name: 'rootField', type: 'string' }],
    });

    const parent1 = db.collection({
      name: 'parent1',
      inherits: 'root',
      fields: [{ name: 'parent1Field', type: 'string' }],
    });

    const parent2 = db.collection({
      name: 'parent2',
      inherits: 'parent1',
      fields: [{ name: 'parent2Field', type: 'string' }],
    });

    const parent21 = db.collection({
      name: 'parent21',
      fields: [{ name: 'parent21Field', type: 'string' }],
    });

    const child: InheritedCollection = db.collection({
      name: 'child',
      inherits: ['parent2', 'parent21'],
      fields: [{ name: 'childField', type: 'string' }],
    }) as InheritedCollection;

    const parentFields = child.parentFields();
    expect(parentFields.size).toBe(4);
  });

  it('should sync parent fields', async () => {
    const person = db.collection({
      name: 'person',
      fields: [{ name: 'name', type: 'string' }],
    });

    const student = db.collection({
      name: 'student',
      inherits: 'person',
      fields: [{ name: 'score', type: 'integer' }],
    });

    await db.sync();

    expect(student.fields.get('name')).toBeDefined();

    // add new field to parent
    person.setField('age', { type: 'integer' });

    await db.sync();

    expect(student.fields.get('age')).toBeDefined();

    const student1 = await db.getCollection('student').repository.create({
      values: {
        name: 'student1',
        age: 10,
        score: 100,
      },
    });

    expect(student1.get('name')).toBe('student1');
    expect(student1.get('age')).toBe(10);
  });

  it('should destroy fields on parents table', async () => {
    const profile = db.collection({
      name: 'profiles',
      fields: [{ type: 'string', name: 'name' }],
    });

    const person = db.collection({
      name: 'person',
      fields: [
        { name: 'name', type: 'string' },
        {
          type: 'hasOne',
          name: 'profile',
        },
      ],
    });

    const student = db.collection({
      name: 'student',
      inherits: 'person',
    });

    await db.sync();

    person.removeField('profile');

    person.setField('profile', { type: 'belongsTo' });

    await db.sync();
  });
});
