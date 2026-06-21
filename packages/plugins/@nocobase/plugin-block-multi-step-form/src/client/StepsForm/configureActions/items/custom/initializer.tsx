import {
  ActionProps,
  SchemaInitializerItem,
  SchemaInitializerItemType,
  useSchemaInitializer,
  useSchemaInitializerItem,
  useAPIClient,
  useCustomizeRequestActionProps,
} from '@nocobase/client';
import { useStepsFormContext } from '../../../schemaComponents/context';
import React from 'react';
import { tStr } from '../../../../locale';
import { merge, uid } from '@formily/shared';

const useCustomRequestsResource = () => {
  const apiClient = useAPIClient();
  return apiClient.resource('customRequests');
};

const getNewSchema = () => {
  return {
    title: '{{ t("Custom request") }}',
    'x-component': 'CustomRequestAction', // CustomRequestAction
    'x-action': 'customize:stepsform:request',
    'x-toolbar': 'ActionSchemaToolbar',
    'x-settings': 'actionSettings:customRequest',
    'x-decorator': 'CustomRequestAction.Decorator',
    'x-uid': uid(),
    'x-action-settings': {
      onSuccess: {
        manualClose: false,
        redirecting: false,
        successMessage: '{{t("Request success")}}',
      },
    },
    'x-use-component-props': 'useStepsFormCustomActionProps',
  };
};

const CustomRequestInitializer: React.FC<any> = (props) => {
  const customRequestsResource = useCustomRequestsResource();
  const itemConfig = useSchemaInitializerItem();
  const { insert } = useSchemaInitializer();
  const schema = getNewSchema();

  return (
    <SchemaInitializerItem
      {...itemConfig}
      onClick={async () => {
        const s = merge(schema || {}, itemConfig.schema || {});
        itemConfig?.schemaInitialize?.(s);
        insert(s);
        // create a custom request
        await customRequestsResource.create({
          values: {
            key: s['x-uid'],
          },
        });
      }}
    />
  );
};

export const useStepsFormCustomActionProps = (props): ActionProps => {
  const context = useStepsFormContext();
  const otherProps = useCustomizeRequestActionProps();
  return {
    ...props,
    ...otherProps,
    disabled: context.currentStep !== context.stepsCount - 1,
  };
};

export const customActionInitializerItem: SchemaInitializerItemType = {
  name: 'customRequest',
  title: tStr('Custom request'),
  Component: CustomRequestInitializer,
};
