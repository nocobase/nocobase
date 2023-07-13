export default {
  name: 'orders',
  fields: [
    {
      type: 'belongsTo',
      name: 'product',
    },
    {
      type: 'integer',
      name: 'quantity',
    },
    {
      type: 'integer',
      name: 'totalPrice',
    },
    {
      type: 'integer',
      name: 'status',
    },
    {
      type: 'string',
      name: 'address',
    },
    {
      type: 'belongsTo',
      name: 'user',
    },
    {
      type: 'hasOne',
      name: 'delivery',
    },
  ],
};
