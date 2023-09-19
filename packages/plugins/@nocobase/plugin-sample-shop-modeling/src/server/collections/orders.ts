export default {
  name: 'orders',
  fields: [
    {
      type: 'snowflake',
      name: 'id',
      primaryKey: true,
    },
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
      type: 'belongsTo',
      name: 'user',
    },
  ],
};
