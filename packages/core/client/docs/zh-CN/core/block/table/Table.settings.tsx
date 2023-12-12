import { SchemaSettings, useBlockSettingsV2 } from '@nocobase/client';

export const tableSettings = new SchemaSettings({
  name: 'tableSettings',
  items: [
    {
      name: 'bordered',
      type: 'switch',
      useComponentProps() {
        const { dn, props } = useBlockSettingsV2<{ bordered?: boolean }>();
        return {
          title: 'Bordered',
          checked: !!props.bordered,
          onChange(v) {
            dn.deepMerge({
              'x-decorator-props': {
                bordered: v,
              },
            });
          },
        };
      },
    },
    {
      name: 'remove',
      type: 'remove',
      componentProps: {
        removeParentsIfNoChildren: true,
        breakRemoveOn: {
          'x-component': 'Grid',
        },
      },
    },
  ],
});
