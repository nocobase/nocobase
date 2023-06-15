import { getQueryWithAlias } from '../utils';

describe('utils', () => {
  test('getQueryWithAlias', () => {
    const result = getQueryWithAlias(
      [
        {
          key: 'name',
          name: 'name',
          label: 'Name',
          value: 'Name',
        },
        {
          key: 'email',
          name: 'email',
          label: 'Email',
          value: 'Email',
        },
      ],
      {
        measures: [
          {
            field: 'name',
          },
          {
            field: 'email',
            alias: 'Email Alias',
          },
        ],
      },
    );
    expect(result.measures).toEqual([
      {
        field: 'name',
        alias: 'Name',
      },
      {
        field: 'email',
        alias: 'Email Alias',
      },
    ]);
  });
});
