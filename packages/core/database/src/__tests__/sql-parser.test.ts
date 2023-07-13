import sqlParser from '../sql-parser';

describe('sql parser', () => {
  it('should parse sql', function () {
    const sql = `select users.id as id from users`;
    const { ast } = sqlParser.parse(sql);
    const columns = ast.columns;
    const firstColumn = columns[0];

    expect(firstColumn['expr']['table']).toEqual('users');
    expect(firstColumn['expr']['column']).toEqual('id');
  });
});
