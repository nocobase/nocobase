import React from 'react';

import { SchemaInitializer, createFormBlockSchema } from '@nocobase/client';
import { JOB_STATUS } from '../../constants';
import { NAMESPACE } from '../../locale';

export function FormBlockInitializer({ insert, schema, ...others }) {
  function onConfirm() {
    const result = createFormBlockSchema({
      actionInitializers: 'AddActionButton',
      actions: {
        resolve: {
          type: 'void',
          title: `{{t("Continue the process", { ns: "${NAMESPACE}" })}}`,
          'x-decorator': 'ManualActionStatusProvider',
          'x-decorator-props': {
            value: JOB_STATUS.RESOLVED,
          },
          'x-component': 'Action',
          'x-component-props': {
            type: 'primary',
            useAction: '{{ useSubmit }}',
          },
          'x-designer': 'Action.Designer',
          'x-action': `${JOB_STATUS.RESOLVED}`,
        },
      },
      ...schema,
    });
    delete result['x-acl-action-props'];
    delete result['x-acl-action'];
    const [formKey] = Object.keys(result.properties);
    result.properties[formKey].properties.actions['x-decorator'] = 'ActionBarProvider';
    insert(result);
  }

  return <SchemaInitializer.Item {...others} onClick={onConfirm} />;
}
