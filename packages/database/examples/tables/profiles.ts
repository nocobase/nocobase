import { TableOptions } from '../../src';

export default {
  name: 'profiles',
  fields: [
    {
      type: 'string',
      name: 'realname',
    },
    {
      type: 'string',
      name: 'email',
    },
    {
      type: 'string',
      name: 'gender',
    },
    {
      type: 'date',
      name: 'birthday',
    },
  ],
} as TableOptions;