export default {
  name: 'deliveries',
  fields: [
    {
      type: 'belongsTo',
      name: 'order',
    },
    {
      type: 'string',
      name: 'provider',
    },
    {
      type: 'string',
      name: 'trackingNumber',
    },
    {
      type: 'integer',
      name: 'status',
      defaultValue: 0,
    },
  ],
};
