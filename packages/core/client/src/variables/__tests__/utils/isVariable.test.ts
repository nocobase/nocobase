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

it('should return false for a string with multiple variables', () => {
  expect(isVariable('{{variable1}} some text {{variable2}}')).toBe(false);
});

it('should return false for a string with a variable containing invalid characters', () => {
  expect(isVariable('{{var-iable}}')).toBe(true);
});

it('should return true for a string with a valid variable', () => {
  expect(isVariable('{{variable}}')).toBe(true);
});

it('should return true for a string with a valid variable surrounded by text', () => {
  expect(isVariable('some text {{variable}} some more text')).toBe(false);
});

it('should return true for a string with multiple valid variables', () => {
  expect(isVariable('{{variable1}} some text {{variable2}}')).toBe(false);
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
