import { SchemaInitializerContext } from '@nocobase/client';
import { useContext } from 'react';

export const ExportInitializerProvider = (props: any) => {
  const initializes = useContext<any>(SchemaInitializerContext);
  const hasExportAction = initializes.TableActionInitializers.items[0].children.some(
    (initialize) => initialize.component === 'ExportActionInitializer',
  );
  !hasExportAction &&
    initializes.TableActionInitializers.items[0].children.push({
      type: 'item',
      title: "{{t('Export')}}",
      component: 'ExportActionInitializer',
      schema: {
        'x-align': 'right',
        'x-decorator': 'ACLActionProvider',
        'x-acl-action-props': {
          skipScopeCheck: true,
        },
      },
    });
  return props.children;
};
