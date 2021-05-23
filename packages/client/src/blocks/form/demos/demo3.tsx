import React from 'react';
import { FormBlock, Drawer } from '@nocobase/client';

export default () => {
  const items = [
    { id: 1, username: '文本一' },
    { id: 2, username: '文本二' },
  ];
  return (
    <ul>
      {items.map((item) => (
        <li>
          <a
            onClick={() => {
              Drawer.open({
                title: 'Form',
                content: ({ resolve, closeWithConfirm }) => (
                  <FormBlock
                    initialValues={item}
                    resource={{
                      resourceName: 'users',
                      resourceKey: item.id,
                    }}
                    fields={[
                      {
                        interface: 'string',
                        type: 'string',
                        title: `单行文本`,
                        name: 'username',
                        required: true,
                        default: 'aa',
                        'x-decorator': 'FormItem',
                        'x-component': 'Input',
                        'x-component-props': {},
                      },
                    ]}
                    effects={{
                      onFormValuesChange(form) {
                        if (form.modified && closeWithConfirm) {
                          closeWithConfirm(true);
                        }
                        console.log('aaaa', form);
                      },
                    }}
                    onSuccess={() => {
                      return new Promise((r) => {
                        setTimeout(() => {
                          r(null);
                          resolve();
                        }, 2000);
                      });
                    }}
                  />
                ),
              });
            }}
          >
            {item.username}
          </a>
        </li>
      ))}
    </ul>
  );
};
