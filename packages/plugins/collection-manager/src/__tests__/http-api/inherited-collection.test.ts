import { pgOnly, MockServer } from '@nocobase/test';
import { createApp } from '..';

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
