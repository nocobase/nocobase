/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ISchema } from '@formily/react';
import { CollectionFieldInterface, interfacesProperties } from '@nocobase/client';
import { generateNTemplate } from '../locale';

const { defaultProps, operators } = interfacesProperties;

export const defaultToolbar = [
  'headings',
  'bold',
  'italic',
  'strike',
  'link',
  'list',
  'ordered-list',
  'check',
  'quote',
  'line',
  'code',
  'inline-code',
  'upload',
  'fullscreen',
];

export class MarkdownVditorFieldInterface extends CollectionFieldInterface {
  name = 'vditor';
  type = 'object';
  group = 'media';
  order = 1;
  title = generateNTemplate('Vditor');
  sortable = true;
  default = {
    type: 'text',
    length: 'long',
    uiSchema: {
      type: 'string',
      'x-component': 'MarkdownVditor',
    },
  };
  availableTypes = ['text', 'json', 'string'];
  properties = {
    ...defaultProps,
    'uiSchema.x-component-props.fileCollection': {
      type: 'string',
      title: generateNTemplate('File collection'),
      'x-component': 'CollectionSelect',
      'x-component-props': { filter: (collection) => collection?.options?.template === 'file' },
      'x-decorator': 'FormItem',
      default: '',
      'x-reactions': {
        fulfill: {
          schema: {
            description: generateNTemplate(
              'Used to store files uploaded in the Markdown editor (default: attachments)',
            ),
          },
        },
      },
    },
    'uiSchema.x-component-props.toolbar': {
      type: 'array',
      title: generateNTemplate('Toolbar'),
      'x-component': 'Select',
      'x-component-props': {
        mode: 'multiple',
      },
      'x-decorator': 'FormItem',
      default: defaultToolbar,
      enum: [
        { value: 'emoji', label: generateNTemplate('Emoji') },
        { value: 'headings', label: generateNTemplate('Headings') },
        { value: 'bold', label: generateNTemplate('Bold') },
        { value: 'italic', label: generateNTemplate('Italic') },
        { value: 'strike', label: generateNTemplate('Strike') },
        { value: 'line', label: generateNTemplate('Line') },
        { value: 'quote', label: generateNTemplate('Quote') },
        { value: 'list', label: generateNTemplate('List') },
        { value: 'ordered-list', label: generateNTemplate('OrderedList') },
        { value: 'check', label: generateNTemplate('Check') },
        { value: 'outdent', label: generateNTemplate('Outdent') },
        { value: 'indent', label: generateNTemplate('Indent') },
        { value: 'code', label: generateNTemplate('Code') },
        { value: 'inline-code', label: generateNTemplate('InlineCode') },
        { value: 'insert-after', label: generateNTemplate('InsertAfter') },
        { value: 'insert-before', label: generateNTemplate('InsertBefore') },
        { value: 'undo', label: generateNTemplate('Undo') },
        { value: 'redo', label: generateNTemplate('Redo') },
        { value: 'upload', label: generateNTemplate('Upload') },
        { value: 'link', label: generateNTemplate('Link') },
        { value: 'record', label: generateNTemplate('Record') },
        { value: 'table', label: generateNTemplate('Table') },
        { value: 'edit-mode', label: generateNTemplate('EditMode') },
        { value: 'both', label: generateNTemplate('Both') },
        { value: 'preview', label: generateNTemplate('Preview') },
        { value: 'fullscreen', label: generateNTemplate('Fullscreen') },
        { value: 'outline', label: generateNTemplate('Outline') },
      ],
    },
  };
  schemaInitialize(schema: ISchema, { block }) {
    if (['Table', 'Kanban'].includes(block)) {
      schema['x-component-props'] = schema['x-component-props'] || {};
      schema['x-component-props']['ellipsis'] = true;
    }
  }
  filterable = {
    operators: operators.bigField,
  };
  titleUsable = true;
}
