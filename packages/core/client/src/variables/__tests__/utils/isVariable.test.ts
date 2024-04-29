/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

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
