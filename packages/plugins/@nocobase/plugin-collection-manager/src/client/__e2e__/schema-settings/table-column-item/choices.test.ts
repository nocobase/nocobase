import { oneTableBlockWithAddNewAndViewAndEditAndChoicesFields, test } from '@nocobase/test/e2e';
import { testSupportedOptions } from './utils';

test.describe('checkbox', () => {
  testSupportedOptions({
    name: 'checkbox',
    options: ['Custom column title', 'Column width', 'Delete'],
    template: oneTableBlockWithAddNewAndViewAndEditAndChoicesFields,
  });
});

test.describe('checkbox group', () => {
  testSupportedOptions({
    name: 'checkboxGroup',
    options: ['Custom column title', 'Column width', 'Delete'],
    template: oneTableBlockWithAddNewAndViewAndEditAndChoicesFields,
  });
});

test.describe('china region', () => {
  testSupportedOptions({
    name: 'chinaRegion',
    options: ['Custom column title', 'Column width', 'Delete'],
    template: oneTableBlockWithAddNewAndViewAndEditAndChoicesFields,
  });
});

test.describe('multiple select', () => {
  testSupportedOptions({
    name: 'multipleSelect',
    options: ['Custom column title', 'Column width', 'Delete'],
    template: oneTableBlockWithAddNewAndViewAndEditAndChoicesFields,
  });
});

test.describe('radio group', () => {
  testSupportedOptions({
    name: 'radioGroup',
    options: ['Custom column title', 'Column width', 'Sortable', 'Delete'],
    template: oneTableBlockWithAddNewAndViewAndEditAndChoicesFields,
  });
});

test.describe('single select', () => {
  testSupportedOptions({
    name: 'singleSelect',
    options: ['Custom column title', 'Column width', 'Sortable', 'Delete'],
    template: oneTableBlockWithAddNewAndViewAndEditAndChoicesFields,
  });
});
