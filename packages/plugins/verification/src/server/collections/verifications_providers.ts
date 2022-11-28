export default {
  name: 'verifications_providers',
  fields: [
    {
      type: 'string',
      name: 'id',
      primaryKey: true
    },
    {
      type: 'string',
      name: 'title',
    },
    {
      type: 'string',
      name: 'type'
    },
    {
      type: 'jsonb',
      name: 'options'
    },
    {
      type: 'radio',
      name: 'default'
    }
  ]
};
