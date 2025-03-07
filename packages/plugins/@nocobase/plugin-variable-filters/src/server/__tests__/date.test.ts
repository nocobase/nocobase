import Database, { Repository } from '@nocobase/database';
import { createMockServer, MockServer } from '@nocobase/test';

describe('date filters', async () => {
  let app: MockServer;
  let db: Database;
  let repo: Repository;
  let agent;
  let parse;

  beforeAll(async () => {
    app = await createMockServer({
      plugins: ['field-sort', 'auth', 'variable-filters'],
    });
    db = app.db;
    repo = db.getRepository('authenticators');
    agent = app.agent();
    parse = app.jsonTemplateParser.parse;
  });
  it('date filters', async () => {
    const template = {
      now: '{{now}}',
      today: '{{now | date_format: "YYYY-MM-DD"}}',
      yesterday: '{{now | date_subtract: 1, "day" | date_format: "YYYY-MM-DD"}}',
    };

    const parsed = app.jsonTemplateParser.parse(template);
    const now = new Date('2025-01-01 12:00:00');
    const result = parsed({
      now,
    });
    expect(result).toEqual({
      now,
      today: '2025-01-01',
      yesterday: '2024-12-31',
    });
  });

  it('multiple level accessiong', async () => {
    const template = {
      user: '{{user.name}}',
      firstOfArray1: '{{array.0}}',
      firstOfArray2: '{{array[0]}}',
    };
    const result = app.jsonTemplateParser.parse(template)({
      user: { name: 'john' },
      array: ['first', 'second'],
    });
    expect(result).toEqual({
      user: 'john',
      firstOfArray1: 'first',
      firstOfArray2: 'first',
    });
  });

  it('when non-string type', async () => {
    class Form {}
    const form = new Form();
    const template = {
      form: '{{form}}',
      $form: '{{$form}}',
    };
    const result = app.jsonTemplateParser.parse(template)({
      form,
      $form: form,
    });
    expect(result).toEqual({
      form,
      $form: form,
    });
  });

  it('when key is undefined, ignore it', async () => {
    const template = {
      key1: '{{current.key1}}',
      key2: '{{current.key2}}',
    };
    const result = app.jsonTemplateParser.parse(template)({
      current: { key1: 'value1' },
    });
    expect(result).toEqual({
      key1: 'value1',
      key2: undefined,
    });
  });

  it('special character', async () => {
    const template = {
      $now: '{{$now}}',
      '@today': '{{ $nDate.today }}',
      $yesterday: '{{ $now | date_subtract: 1, "day" | date_format: "YYYY-MM-DD" }}',
    };

    const parsed = app.jsonTemplateParser.parse(template);
    const $now = new Date('2025-01-01: 12:00:00');
    const result = parsed({
      $now,
      $nDate: {
        today: '2025-01-01',
      },
    });
    expect(result).toEqual({
      $now,
      '@today': '2025-01-01',
      $yesterday: '2024-12-31',
    });
    expect(parsed.parameters).toEqual([{ key: '$now' }, { key: '$nDate.today' }]);
  });
});
