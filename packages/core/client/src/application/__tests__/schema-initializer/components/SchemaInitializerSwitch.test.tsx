import { screen, userEvent, waitFor } from '@nocobase/test/client';

import { useSchemaInitializer, useCurrentSchema, SchemaInitializerSwitch } from '@nocobase/client';
import React from 'react';
import { createAndHover } from './fixtures/createAppAndHover';

describe('SchemaInitializerSwitch', () => {
  async function valid() {
    expect(screen.getByText('A Title')).toBeInTheDocument();

    expect(screen.getByRole('switch').getAttribute('aria-checked')).toBe('false');

    await userEvent.click(screen.getByText('A Title'));

    await waitFor(() => {
      expect(screen.getByText('A-Content')).toBeInTheDocument();
      expect(screen.getByRole('switch').getAttribute('aria-checked')).toBe('true');
    });

    await userEvent.click(screen.getByText('A Title'));

    await waitFor(() => {
      expect(screen.queryByText('A-Content')).not.toBeInTheDocument();
      expect(screen.getByRole('switch').getAttribute('aria-checked')).toBe('false');
    });
  }

  const actionKey = 'x-action';

  const schema = {
    type: 'void',
    [actionKey]: 'create',
    title: "{{t('Add New')}}",
    'x-component': 'div',
    'x-content': 'A-Content',
  };

  test('component mode', async () => {
    const AddNewButton = () => {
      // 判断是否已插入
      const { exists, remove } = useCurrentSchema(schema[actionKey], actionKey);

      const { insert } = useSchemaInitializer();
      return (
        <SchemaInitializerSwitch
          checked={exists}
          title={'A Title'}
          onClick={() => {
            // 如果已插入，则移除
            if (exists) {
              return remove();
            }
            // 新插入子节点
            insert(schema);
          }}
        />
      );
    };
    await createAndHover(
      [
        {
          name: 'a',
          Component: AddNewButton,
        },
      ],
      {
        components: {
          AddNewButton,
        },
      },
    );

    await valid();
  });

  test('type mode', async () => {
    await createAndHover([
      {
        name: 'a',
        type: 'switch',
        useComponentProps() {
          const { exists, remove } = useCurrentSchema(schema[actionKey], actionKey);

          const { insert } = useSchemaInitializer();
          return {
            checked: exists,
            title: 'A Title',
            onClick() {
              // 如果已插入，则移除
              if (exists) {
                return remove();
              }
              // 新插入子节点
              insert(schema);
            },
          };
        },
      },
    ]);

    await valid();
  });
});
