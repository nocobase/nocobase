import { oneTableBlockWithAddNewAndViewAndEditAndSystemInfoFields, test } from '@nocobase/test/client';
import { testSupportedOptions } from './utils';

test.describe('created at', () => {
  testSupportedOptions({
    name: 'Created at',
    options: ['Custom column title', 'Column width', 'Sortable', 'Date display format', 'Delete'],
    template: oneTableBlockWithAddNewAndViewAndEditAndSystemInfoFields,
  });
});

test.describe('created by', () => {
  testSupportedOptions({
    name: 'Created by',
    options: ['Custom column title', 'Column width', 'Enable link', 'Delete'],
    template: oneTableBlockWithAddNewAndViewAndEditAndSystemInfoFields,
  });
});

test.describe('id', () => {
  testSupportedOptions({
    name: 'ID',
    options: ['Custom column title', 'Column width', 'Sortable', 'Delete'],
    template: oneTableBlockWithAddNewAndViewAndEditAndSystemInfoFields,
  });
});

test.describe('table oid', () => {
  testSupportedOptions({
    name: 'Table OID',
    options: ['Custom column title', 'Column width', 'Sortable', 'Delete'],
    template: oneTableBlockWithAddNewAndViewAndEditAndSystemInfoFields,
  });
});

test.describe('last updated at', () => {
  testSupportedOptions({
    name: 'Last updated at',
    options: ['Custom column title', 'Column width', 'Sortable', 'Date display format', 'Delete'],
    template: oneTableBlockWithAddNewAndViewAndEditAndSystemInfoFields,
  });
});

test.describe('last updated by', () => {
  testSupportedOptions({
    name: 'Last updated by',
    options: ['Custom column title', 'Column width', 'Enable link', 'Delete'],
    template: oneTableBlockWithAddNewAndViewAndEditAndSystemInfoFields,
  });
});
