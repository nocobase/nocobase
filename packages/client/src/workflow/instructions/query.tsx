export default {
  title: '数据查询',
  type: 'query',
  schema: {
    config: {
      type: 'object',
      properties: {
        collection: {
          type: 'string',
          name: 'collection',
          'x-decorator': 'FormItem',
          'x-component': 'CollectionField',
        }
      }
    }
  }
};
