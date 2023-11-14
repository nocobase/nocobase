import { getPath } from '../../utils/getPath';

test('{{ $user.name }} => $user.name', () => {
  expect(getPath('{{ $user.name }}')).toBe('$user.name');
});
