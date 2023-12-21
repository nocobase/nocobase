import { oneTableBlockWithAddNewAndViewAndEditAndAdvancedFields, test } from '@nocobase/test/e2e';
import { testSupportedOptions } from './utils';

test.describe('collection', () => {
  testSupportedOptions({
    name: 'collection',
    options: ['Custom column title', 'Column width', 'Sortable', 'Delete'],
    template: oneTableBlockWithAddNewAndViewAndEditAndAdvancedFields,
  });
});

test.describe('JSON', () => {
  testSupportedOptions({
    name: 'JSON',
    options: ['Custom column title', 'Column width', 'Sortable', 'Delete'],
    template: oneTableBlockWithAddNewAndViewAndEditAndAdvancedFields,
  });
});

test.describe('formula', () => {
  testSupportedOptions({
    name: 'formula',
    options: ['Custom column title', 'Column width', 'Sortable', 'Delete'],
    template: oneTableBlockWithAddNewAndViewAndEditAndAdvancedFields,
  });
});

test.describe('sequence', () => {
  testSupportedOptions({
    name: 'sequence',
    options: ['Custom column title', 'Column width', 'Sortable', 'Delete'],
    template: oneTableBlockWithAddNewAndViewAndEditAndAdvancedFields,
  });
});
