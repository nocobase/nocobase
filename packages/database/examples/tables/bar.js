module.exports = {
  name: 'bar',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
    {
      type: 'text',
      length: 'long',
      name: 'content',
    },
    {
      type: 'belongsTo',
      name: 'user',
    },
    {
      type: 'belongsToMany',
      name: 'tags',
    },
    {
      type: 'hasMany',
      name: 'comments'
    },
  ],
};
