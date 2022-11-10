import { Collection } from '../../collection';
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

    expect(student.get('profile').get('age')).toBe(30);
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
