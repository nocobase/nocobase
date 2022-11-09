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
    expect(studentFields.length).toBe(2);

    const createStudentResponse = await agent.resource('students').create({
      values: {
        name: 'foo',
        score: 100,
      },
    });

    expect(createStudentResponse.statusCode).toBe(200);

    const fooStudent = createStudentResponse.body.data;

    expect(fooStudent.name).toBe('foo');
  });
});
