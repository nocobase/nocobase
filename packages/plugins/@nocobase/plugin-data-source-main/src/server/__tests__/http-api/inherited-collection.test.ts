/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { isPg, MockServer } from '@nocobase/test';
import { createApp } from '..';

const pgOnly = () => (isPg() ? describe : describe.skip);

pgOnly()('Inherited Collection', () => {
  let app: MockServer;
  let agent;

  beforeEach(async () => {
    app = await createApp();
    agent = app.agent();
    await agent.resource('collections').create({
      values: {
        name: 'person',
        fields: [
          {
            name: 'name',
            type: 'string',
          },
        ],
      },
    });
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should not replace field with difference type when add field', async () => {
    let response = await agent.resource('collections').create({
      values: {
        name: 'students',
        inherits: 'person',
        fields: [],
      },
    });

    expect(response.statusCode).toBe(200);

    response = await agent.resource('fields').create({
      values: {
        collectionName: 'students',
        name: 'name',
        type: 'integer',
      },
    });

    expect(response.statusCode).not.toBe(200);
  });

  it('should not replace field with difference type when create collection', async () => {
    const response = await agent.resource('collections').create({
      context: {},
      values: {
        name: 'students',
        inherits: ['person'],
        fields: [
          {
            name: 'name',
            type: 'integer',
          },
        ],
      },
    });
    expect(response.statusCode).toBe(500);
  });

  it('can create relation with child table', async () => {
    await agent.resource('collections').create({
      values: {
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
      },
    });

    await agent.resource('collections').create({
      values: {
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
      },
    });

    const collectionB = app.db.getCollection('b');

    const res = await agent.resource('b').create({
      values: {
        af: 'a1',
        bs: [{ bf: 'b1' }, { bf: 'b2' }],
      },
    });

    expect(res.statusCode).toEqual(200);

    const a1 = await agent.resource('b').list({
      filter: {
        af: 'a1',
      },
      appends: 'bs',
    });

    expect(a1.body.data[0].bs.length).toEqual(2);
  });

  it('can drop child replaced field', async () => {
    await agent.resource('collections').create({
      values: {
        name: 'students',
        inherits: 'person',
        fields: [
          {
            name: 'name',
            type: 'string',
          },
        ],
      },
    });

    const response = await agent.resource('collections.fields', 'students').destroy({
      filter: {
        name: 'name',
      },
    });

    expect(response.status).toBe(200);
  });

  it('should reload collection when parent fields change', async () => {
    await agent.resource('collections').create({
      values: {
        name: 'employee',
        inherits: 'person',
        fields: [
          {
            name: 'salary',
            type: 'integer',
          },
        ],
      },
    });

    await agent.resource('collections').create({
      values: {
        name: 'instructor',
        inherits: 'employee',
        fields: [
          {
            name: 'rank',
            type: 'integer',
          },
        ],
      },
    });

    const createInstructorResponse = await agent.resource('instructor').create({
      values: {
        name: 'foo',
        salary: 1000,
        rank: 100,
      },
    });

    expect(createInstructorResponse.statusCode).toBe(200);

    const employeeCollection = app.db.getCollection('employee');
    expect(employeeCollection.fields.get('new-field')).not.toBeDefined();

    // add new field to root collection
    await agent.resource('fields').create({
      values: {
        collectionName: 'person',
        name: 'age',
        type: 'integer',
      },
    });

    expect(employeeCollection.fields.get('age')).toBeDefined();

    let listResponse = await agent.resource('employee').list();
    expect(listResponse.statusCode).toBe(200);

    expect(listResponse.body.data[0].age).toBeDefined();

    listResponse = await agent.resource('instructor').list();
    expect(listResponse.statusCode).toBe(200);

    expect(listResponse.body.data[0].age).toBeDefined();
  });

  it('should create inherited collection', async () => {
    const response = await agent.resource('collections').create({
      values: {
        name: 'students',
        inherits: 'person',
        fields: [
          {
            name: 'score',
            type: 'integer',
          },
        ],
      },
    });

    expect(response.statusCode).toBe(200);

    const studentCollection = app.db.getCollection('students');
    expect(studentCollection).toBeDefined();

    const studentFieldsResponse = await agent.resource('fields').list({
      filter: {
        collectionName: 'students',
      },
    });

    expect(studentFieldsResponse.statusCode).toBe(200);

    const studentFields = studentFieldsResponse.body.data;
    expect(studentFields.length).toBe(1);

    const createStudentResponse = await agent.resource('students').create({
      values: {
        name: 'foo',
        score: 100,
      },
    });

    expect(createStudentResponse.statusCode).toBe(200);

    const fooStudent = createStudentResponse.body.data;

    expect(fooStudent.name).toBe('foo');

    const studentList = await agent.resource('students').list();
    expect(studentList.statusCode).toBe(200);
  });

  it('should know which child table row it is', async () => {
    await agent.resource('collections').create({
      values: {
        name: 'students',
        inherits: 'person',
        fields: [
          {
            name: 'score',
            type: 'integer',
          },
        ],
      },
    });

    await agent.resource('students').create({
      values: {
        name: 'foo',
        score: 100,
      },
    });

    const personList = await agent.resource('person').list();

    const person = personList.body.data[0];

    expect(person['__collection']).toBe('students');
  });
});
