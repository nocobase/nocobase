/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CollectionFieldInterface } from '@nocobase/client-v2';
import { tExpr } from './locale';

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
  title = tExpr('Vditor');
  sortable = true;
  default = {
    interface: 'vditor',
    type: 'text',
    length: 'long',
    uiSchema: {
      type: 'string',
      'x-component': 'Input.TextArea',
    },
  };
  availableTypes = ['text', 'json', 'string'];
  configure = {
    properties: {
      'uiSchema.x-component-props.fileCollection': {
        type: 'string',
        title: tExpr('File collection'),
        'x-component': 'Select',
        enum: '{{fileCollections}}',
        'x-decorator': 'FormItem',
        default: 'attachments',
        'x-reactions': {
          fulfill: {
            schema: {
              description: tExpr('Used to store files uploaded in the Markdown editor (default: attachments)'),
            },
          },
        },
      },
      'uiSchema.x-component-props.toolbar': {
        type: 'array',
        title: tExpr('Toolbar'),
        'x-component': 'Select',
        'x-component-props': {
          mode: 'multiple',
        },
        'x-decorator': 'FormItem',
        default: defaultToolbar,
        enum: [
          { value: 'emoji', label: tExpr('Emoji') },
          { value: 'headings', label: tExpr('Headings') },
          { value: 'bold', label: tExpr('Bold') },
          { value: 'italic', label: tExpr('Italic') },
          { value: 'strike', label: tExpr('Strike') },
          { value: 'line', label: tExpr('Line') },
          { value: 'quote', label: tExpr('Quote') },
          { value: 'list', label: tExpr('List') },
          { value: 'ordered-list', label: tExpr('OrderedList') },
          { value: 'check', label: tExpr('Check') },
          { value: 'outdent', label: tExpr('Outdent') },
          { value: 'indent', label: tExpr('Indent') },
          { value: 'code', label: tExpr('Code') },
          { value: 'inline-code', label: tExpr('InlineCode') },
          { value: 'insert-after', label: tExpr('InsertAfter') },
          { value: 'insert-before', label: tExpr('InsertBefore') },
          { value: 'undo', label: tExpr('Undo') },
          { value: 'redo', label: tExpr('Redo') },
          { value: 'upload', label: tExpr('Upload') },
          { value: 'link', label: tExpr('Link') },
          { value: 'record', label: tExpr('Record') },
          { value: 'table', label: tExpr('Table') },
          { value: 'edit-mode', label: tExpr('EditMode') },
          { value: 'both', label: tExpr('Both') },
          { value: 'preview', label: tExpr('Preview') },
          { value: 'fullscreen', label: tExpr('Fullscreen') },
          { value: 'outline', label: tExpr('Outline') },
        ],
      },
    },
  };

  filterable = {
    operators: 'bigField',
  };
  titleUsable = true;
}
