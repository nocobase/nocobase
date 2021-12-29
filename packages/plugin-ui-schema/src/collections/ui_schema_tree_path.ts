export default {
  name: 'ui_schema_tree_path',
  autoGenId: false,
  timestamps: false,
  fields: [
    {
      type: 'string',
      name: 'ancestor',
      primaryKey: true,
    },
    {
      type: 'string',
      name: 'descendant',
      primaryKey: true,
    },
    {
      type: 'integer',
      name: 'depth',
    },
    {
      type: 'boolean',
      name: 'async',
    },
    {
      type: 'string',
      name: 'type',
      comment: 'type of node',
    },
  ],
};
