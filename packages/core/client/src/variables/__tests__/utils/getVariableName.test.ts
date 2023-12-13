import { getVariableName } from '../../utils/getVariableName';

test('{{ $user.name }} => $user', () => {
  expect(getVariableName('{{ $user.name }}')).toBe('$user');
});
