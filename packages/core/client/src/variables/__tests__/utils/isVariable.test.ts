import { isVariable } from '../../utils/isVariable';

it('should return false for a string with only one opening brace', () => {
  expect(isVariable('{variable}}')).toBe(false);
});

it('should return false for a string with only one closing brace', () => {
  expect(isVariable('{{variable}')).toBe(false);
});

it('should return false for a string with no braces', () => {
  expect(isVariable('variable')).toBe(false);
});

it('should return true for a string with a valid variable', () => {
  expect(isVariable('{{variable}}')).toBe(true);
});

it('should return true for a string with a valid variable "{{ $nRecord.cc-cc }}"', () => {
  expect(isVariable('{{ $nRecord.cc-cc }}')).toBe(true);
});

it('should return true for a string with a valid variable "{{ $nRecord._name }}"', () => {
  expect(isVariable('{{ $nRecord._name }}')).toBe(true);
});

it('should return true for a string with a valid variable " {{ $nRecord.name }} "', () => {
  expect(isVariable(' {{ $nRecord.name }} ')).toBe(true);
});
