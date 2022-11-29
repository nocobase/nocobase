import { getConfigurableProperties, ICollectionTemplate, registerTemplate } from '@nocobase/client';
import React from 'react';

const myCollectionTemplate: ICollectionTemplate = {
  name: 'myCollection',
  title: '{{t("Custom template")}}',
  order: 6,
  color: 'blue',
  default: {
    fields: [
      {
        name: 'uuid',
        type: 'string',
        primaryKey: true,
        allowNull: false,
        uiSchema: { type: 'number', title: '{{t("UUID")}}', 'x-component': 'Input', 'x-read-pretty': true },
        interface: 'input',
      },
    ],
  },
  configurableProperties: getConfigurableProperties('name', 'title', 'inherits', 'createdAt', 'updatedAt'),
  availableFieldInterfaces: {
    exclude: ['linkTo', 'o2o'],
  },
};

registerTemplate('myCollection', myCollectionTemplate);

export default React.memo((props) => {
  return <>{props.children}</>;
});
