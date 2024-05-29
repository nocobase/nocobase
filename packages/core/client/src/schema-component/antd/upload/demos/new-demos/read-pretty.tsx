import React from 'react';
import { mockApp } from '@nocobase/client/demo-utils';
import { SchemaComponent, Plugin, ISchema } from '@nocobase/client';

const schema: ISchema = {
  type: 'void',
  name: 'root',
  'x-decorator': 'FormV2',
  'x-component': 'ShowFormData',
  'x-pattern': 'readPretty',
  properties: {
    test: {
      type: 'boolean',
      title: 'Test',
      default: [
        {
          id: 45,
          title: 'img',
          name: 's33766399',
          filename: 'cd48dc833ab01aa3959ac39309fc39de.jpg',
          extname: '.jpg',
          size: null,
          mimetype: 'image/jpeg',
          path: '',
          meta: {},
          url: 'https://zos.alipayobjects.com/rmsportal/jkjgkEfvpUPVyRjUImniVslZfWPnJuuZ.png',
          created_at: '2021-08-13T15:00:17.423Z',
          updated_at: '2021-08-13T15:00:17.423Z',
          created_by_id: null,
          updated_by_id: null,
          storage_id: 2,
        },
        {
          id: 7,
          title: 'doc',
          filename: 'd9f6ad6669902a9a8a1229d9f362235a.docx',
          extname: '.docx',
          size: null,
          mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          path: '',
          meta: {},
          url: 'https://zos.alipayobjects.com/rmsportal/jkjgkEfvpUPVyRjUImniVslZfWPnJuuZ.png',
          created_at: '2021-09-12T01:22:06.229Z',
          updated_at: '2021-09-12T01:22:06.229Z',
          created_by_id: null,
          updated_by_id: 1,
          storage_id: 2,
          t_jh7a28dsfzi: {
            createdAt: '2021-09-12T01:22:07.886Z',
            updatedAt: '2021-09-12T01:22:07.886Z',
            f_xg3mysbjfra: 1,
            f_gc7ppj0b7n1: 7,
          },
        },
      ],
      'x-decorator': 'FormItem',
      'x-component': 'Upload.Attachment',
      'x-component-props': {
        action: 'attachments:create',
        multiple: true,
      },
    },
  },
};
const Demo = () => {
  return <SchemaComponent schema={schema} />;
};

class DemoPlugin extends Plugin {
  async load() {
    this.app.router.add('root', { path: '/', Component: Demo });
  }
}

const app = mockApp({
  plugins: [DemoPlugin],
});

export default app.getRootComponent();
