/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { render } from '@nocobase/test/client';
import React from 'react';
import App1 from '../demos/demo1';
import App2 from '../demos/demo2';

import { BlockSchemaComponentPlugin } from '@nocobase/client';
import { screen, renderAppOptions, renderReadPrettyApp, userEvent, waitFor } from '@nocobase/test/client';

describe('Upload', () => {
  it('basic', () => {
    render(<App1 />);
  });

  it('uploading', () => {
    render(<App2 />);
  });

  it('upload single', async () => {
    await renderAppOptions({
      designable: true,
      enableUserListDataBlock: true,
      schema: {
        version: '2.0',
        type: 'void',
        'x-acl-action-props': {
          skipScopeCheck: true,
        },
        'x-decorator': 'FormBlockProvider',
        'x-use-decorator-props': 'useCreateFormBlockDecoratorProps',
        'x-decorator-props': {
          dataSource: 'main',
          collection: 'interfaces',
        },
        'x-component': 'div',
        'x-app-version': '0.21.0-alpha.10',
        properties: {
          '28rbti2f9jx': {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'FormV2',
            'x-use-component-props': 'useCreateFormBlockProps',
            'x-app-version': '0.21.0-alpha.10',
            properties: {
              attachment: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'string',
                'x-component': 'CollectionField',
                'x-decorator': 'FormItem',
                'x-read-pretty': false,
                'x-collection-field': 'interfaces.attachment',
                'x-component-props': {
                  action: 'attachments:create',
                },
                'x-app-version': '0.21.0-alpha.10',
                'x-disabled': false,
                'x-async': false,
                'x-index': 1,
              },
            },
          },
        },
      },
      appOptions: {
        plugins: [BlockSchemaComponentPlugin],
      },
      apis: {
        'attachments:create': {
          data: {
            id: 3,
            title: '微信图片_20240131154451',
            filename: '234ead512e44bf944689069ce2b41a95.png',
            extname: '.png',
            path: '',
            size: 841380,
            url: 'https://zos.alipayobjects.com/rmsportal/jkjgkEfvpUPVyRjUImniVslZfWPnJuuZ.png',
            mimetype: 'image/png',
            meta: {},
            storageId: 1,
            updatedAt: '2024-04-21T01:26:02.961Z',
            createdAt: '2024-04-21T01:26:02.961Z',
            createdById: 1,
            updatedById: 1,
          },
        },
      },
    });

    const file = new File(['hello'], './hello.png', { type: 'image/png' });

    await waitFor(() => {
      const input = document.querySelector('input[type="file"]');
      expect(input).toBeInTheDocument();
    });

    await userEvent.click(document.querySelector('.ant-upload'));
    await userEvent.upload(document.querySelector('input[type="file"]'), file);

    await waitFor(() => {
      expect(document.querySelector('.ant-upload-list-item-image')).toBeInTheDocument();
      expect(document.querySelector('.ant-upload-list-item-image')).toHaveAttribute(
        'src',
        'https://zos.alipayobjects.com/rmsportal/jkjgkEfvpUPVyRjUImniVslZfWPnJuuZ.png',
      );
    });

    // upload another file
    await userEvent.click(document.querySelector('.ant-upload'));
    await userEvent.upload(document.querySelector('input[type="file"]'), file);

    await waitFor(() => {
      expect(document.querySelectorAll('.ant-upload-list-item-image')).toHaveLength(2);
    });
  });

  it('upload multi', async () => {
    await renderAppOptions({
      designable: true,
      enableUserListDataBlock: true,
      schema: {
        version: '2.0',
        type: 'void',
        'x-acl-action-props': {
          skipScopeCheck: true,
        },
        'x-decorator': 'FormBlockProvider',
        'x-use-decorator-props': 'useCreateFormBlockDecoratorProps',
        'x-decorator-props': {
          dataSource: 'main',
          collection: 'interfaces',
        },
        'x-component': 'div',
        'x-app-version': '0.21.0-alpha.10',
        properties: {
          '28rbti2f9jx': {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'FormV2',
            'x-use-component-props': 'useCreateFormBlockProps',
            'x-app-version': '0.21.0-alpha.10',
            properties: {
              attachment: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'string',
                'x-component': 'CollectionField',
                'x-decorator': 'FormItem',
                'x-read-pretty': false,
                'x-collection-field': 'interfaces.attachment',
                'x-component-props': {
                  action: 'attachments:create',
                },
                'x-app-version': '0.21.0-alpha.10',
                'x-disabled': false,
                'x-async': false,
                'x-index': 1,
              },
            },
          },
        },
      },
      appOptions: {
        plugins: [BlockSchemaComponentPlugin],
      },
      apis: {
        'attachments:create': {
          data: {
            id: 3,
            title: '微信图片_20240131154451',
            filename: '234ead512e44bf944689069ce2b41a95.png',
            extname: '.png',
            path: '',
            size: 841380,
            url: 'https://zos.alipayobjects.com/rmsportal/jkjgkEfvpUPVyRjUImniVslZfWPnJuuZ.png',
            mimetype: 'image/png',
            meta: {},
            storageId: 1,
            updatedAt: '2024-04-21T01:26:02.961Z',
            createdAt: '2024-04-21T01:26:02.961Z',
            createdById: 1,
            updatedById: 1,
          },
        },
      },
    });

    const files = [
      new File(['hello1'], './hello.png', { type: 'image/png' }),
      new File(['hello2'], './hello.png', { type: 'image/png' }),
    ];

    await waitFor(() => {
      const input = document.querySelector('input[type="file"]');
      expect(input).toBeInTheDocument();
    });

    await userEvent.click(document.querySelector('.ant-upload'));
    await userEvent.upload(document.querySelector('input[type="file"]'), files);

    await waitFor(() => {
      expect(document.querySelectorAll('.ant-upload-list-item-image')).toHaveLength(2);
    });
  });

  it('delete', async () => {
    await renderAppOptions({
      designable: true,
      enableUserListDataBlock: true,
      schema: {
        version: '2.0',
        type: 'void',
        'x-acl-action-props': {
          skipScopeCheck: true,
        },
        'x-decorator': 'FormBlockProvider',
        'x-use-decorator-props': 'useCreateFormBlockDecoratorProps',
        'x-decorator-props': {
          dataSource: 'main',
          collection: 'interfaces',
        },
        'x-component': 'div',
        'x-app-version': '0.21.0-alpha.10',
        properties: {
          '28rbti2f9jx': {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'FormV2',
            'x-use-component-props': 'useCreateFormBlockProps',
            'x-app-version': '0.21.0-alpha.10',
            properties: {
              attachment: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'string',
                default: [
                  {
                    id: 1,
                    title: '微信图片_20240131154451',
                    filename: '234ead512e44bf944689069ce2b41a95.png',
                    extname: '.png',
                    path: '',
                    size: 841380,
                    url: 'https://zos.alipayobjects.com/rmsportal/jkjgkEfvpUPVyRjUImniVslZfWPnJuuZ.png',
                    mimetype: 'image/png',
                    meta: {},
                    storageId: 1,
                    updatedAt: '2024-04-21T01:26:02.961Z',
                    createdAt: '2024-04-21T01:26:02.961Z',
                    createdById: 1,
                    updatedById: 1,
                  },
                ],
                'x-component': 'CollectionField',
                'x-decorator': 'FormItem',
                'x-read-pretty': false,
                'x-collection-field': 'interfaces.attachment',
                'x-component-props': {
                  action: 'attachments:create',
                },
                'x-app-version': '0.21.0-alpha.10',
                'x-disabled': false,
                'x-async': false,
                'x-index': 1,
              },
            },
          },
        },
      },
      appOptions: {
        plugins: [BlockSchemaComponentPlugin],
      },
    });

    await waitFor(() => {
      expect(document.querySelector('.ant-upload-list-item-image')).toBeInTheDocument();
      expect(document.querySelector('.ant-upload-list-item-image')).toHaveAttribute(
        'src',
        'https://zos.alipayobjects.com/rmsportal/jkjgkEfvpUPVyRjUImniVslZfWPnJuuZ.png',
      );
    });

    await userEvent.click(document.querySelector('.anticon-delete'));

    await waitFor(() => {
      expect(document.querySelector('.ant-upload-list-item-image')).not.toBeInTheDocument();
    });
  });
});
