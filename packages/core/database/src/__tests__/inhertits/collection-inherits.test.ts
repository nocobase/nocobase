import Database from '../../database';
import { InheritedCollection } from '../../inherited-collection';
import { mockDatabase } from '../index';
import pgOnly from './helper';

pgOnly()('collection inherits', () => {
  let db: Database;

  beforeEach(async () => {
    db = mockDatabase();
    await db.clean({ drop: true });
  });

  afterEach(async () => {
    await db.close();
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

    const b1 = await B.repository.find({
      appends: ['bs'],
      filter: {
        af: 'a1',
      },
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
        { type: 'integer', name: 'id', autoIncrement: true },
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
        { type: 'hasOne', name: 'profile' },
      ],
    });

    db.collection({
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
      name: 'teachers',
      inherits: 'person',
      fields: [{ name: 'salary', type: 'integer' }],
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

  it('should inherit association field', async () => {
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

    expect(studentTableInfo.score).toBeDefined();
    expect(studentTableInfo.name).toBeDefined();
    expect(studentTableInfo.id).toBeDefined();
    expect(studentTableInfo.createdAt).toBeDefined();
    expect(studentTableInfo.updatedAt).toBeDefined();
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
});
