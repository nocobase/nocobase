/* eslint-disable */

import { ISchema } from '@formily/react';

const inputcollection = {
  name: 'smtpRequest',
  fields: [
    {
      type: 'string',
      name: 'host',
      interface: 'input',
      uiSchema: {
        title: 'Host',
        type: 'string',
        'x-component': 'Input',
        required: true,
      } as ISchema,
    },
    {
      type: 'number',
      name: 'port',
      interface: 'input',
      uiSchema: {
        title: 'Port',
        type: 'number',
        'x-component': 'Input',
        required: true,
      },
    },
    {
      type: 'string',
      name: 'username',
      interface: 'input',
      uiSchema: {
        title: 'Username',
        type: 'string',
        'x-component': 'Input',
      },
    },
    {
      type: 'password',
      name: 'password',
      interface: 'input',
      uiSchema: {
        title: 'Password',
        type: 'password',
        'x-component': 'Input',
      },
    },
    {
      type: 'boolean',
      name: 'force',
      interface: 'input',
      uiSchema: {
        title: 'force',
        type: 'boolean',
        'x-component': 'Input',
      },
    },
  ],
};

export default inputcollection;
