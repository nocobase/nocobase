/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { getVariablesFromExpression, isVariable } from '../../utils/isVariable';

describe('isVariable', () => {
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

  it('should return true for a string with a valid variable "{{$nForm.staff.age}}"', () => {
    expect(isVariable('{{$nForm.staff.age}}')).toBe(true);
  });

  it('should return false for a string with a valid variable "{{ $nRecord.name }}+1"', () => {
    expect(isVariable('{{ $nRecord.name }}+1')).toBe(false);
  });
});

describe('getVariablesFromExpression', () => {
  it('should return an empty array if there are no variables in the expression', () => {
    const expression = 'This is a test';
    const variables = getVariablesFromExpression(expression);
    expect(variables).toEqual([]);
  });

  it('should return an array of variables if there are variables in the expression', () => {
    const expression = '{{$nForm.email}}';
    const variables = getVariablesFromExpression(expression);
    expect(variables).toEqual(['{{$nForm.email}}']);
  });

  it('should return an array of variables if there are variables in the expression', () => {
    const expression = '{{$nForm.email}} + 1';
    const variables = getVariablesFromExpression(expression);
    expect(variables).toEqual(['{{$nForm.email}}']);
  });

  it('should return an array of variables even if there are duplicate variables in the expression', () => {
    const expression = 'SUM({{$nForm.staff.age}})';
    const variables = getVariablesFromExpression(expression);
    expect(variables).toEqual(['{{$nForm.staff.age}}']);
  });
});
