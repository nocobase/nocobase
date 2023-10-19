/* eslint-disable */

import { ISchema } from '@formily/react';

const emailcollection = {
  name: 'emailRequest',
  fields: [
    {
      type: 'string',
      name: 'to',
      interface: 'input',
      uiSchema: {
        title: 'To',
        type: 'string',
        'x-component': 'Input',
        required: true,
      } as ISchema,
    },
    {
      type: 'string',
      name: 'from',
      interface: 'input',
      uiSchema: {
        title: 'From',
        type: 'string',
        'x-component': 'Input',
        required: true,
      },
    },
    {
      type: 'string',
      name: 'subject',
      interface: 'input',
      uiSchema: {
        title: 'Subject',
        type: 'string',
        'x-component': 'Input',
      },
    },
    {
      type: 'string',
      name: 'body',
      interface: 'input',
      uiSchema: {
        title: 'Body',
        type: 'string',
        'x-component': 'Input',
      },
    },

  ],
};

export default emailcollection;
