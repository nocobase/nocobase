import { oneTableBlockWithAddNewAndViewAndEditAndMediaFields, test } from '@nocobase/test/client';
import { testSupportedOptions } from './utils';

test.describe('markdown', () => {
  testSupportedOptions({
    name: 'markdown',
    options: ['Custom column title', 'Column width', 'Delete'],
    template: oneTableBlockWithAddNewAndViewAndEditAndMediaFields,
  });
});

test.describe('rich text', () => {
  testSupportedOptions({
    name: 'richText',
    options: ['Custom column title', 'Column width', 'Delete'],
    template: oneTableBlockWithAddNewAndViewAndEditAndMediaFields,
  });
});

test.describe('attachment', () => {
  testSupportedOptions({
    name: 'attachment',
    options: ['Custom column title', 'Column width', 'Delete'],
    template: oneTableBlockWithAddNewAndViewAndEditAndMediaFields,
  });
});
