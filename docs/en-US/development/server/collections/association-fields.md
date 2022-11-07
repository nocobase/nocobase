# Association Fields

In a relational database, the standard way to build a table relationship is to add a foreign key field followed by a foreign key constraint. For example, Knex builds a table with the following example.

```ts
knex.schema.table('posts', function (table) {
  table.integer('userId').unsigned();
  table.foreign('userId').references('users.id');
});
```

This procedure creates a userId field in the posts table and sets the foreign key constraint posts.userId to refer to users.id. In NocoBase's Collection, such a relational constraint is created by configuring the relational field, e.g.

```ts
{
  name: 'posts',
  fields: [
    {
      type: 'belongsTo',
      name: 'user',
      target: 'users',
      foreignKey: 'userId',
    },
  ],
}
```

## Relationship parameters

### BelongsTo

```ts
interface BelongsTo {
  type: 'belongsTo';
  name: string;
  // defaults to name's plural
  target?: string;
  // The default value is the primary key of the target model, usually 'id'
  targetKey?: any;
  // defaults to target + 'Id'
  foreignKey?: any;
}

// The authors table's primary key id is concatenated with the books table's foreign key authorId
{
  name: 'books',
  fields: [
    {
      type: 'belongsTo',
      name: 'author',
      target: 'authors',
      targetKey: 'id', // authors table's primary key
      foreignKey: 'authorId', // foreign key in books table
    }
  ],
}
```

### HasOne

```ts
interface HasOne {
  type: 'hasOne';
  name: string;
  // defaults to name's plural
  target?: string;
  // The default value is the primary key of the source model, usually 'id'
  sourceKey?: string;
  // default value is the singular form of source collection name + 'Id'
  foreignKey?: string;
foreignKey?}

// The users table's primary key id is concatenated with the profiles' foreign key userId
{
  name: 'users',
  fields: [
    {
      type: 'hasOne',
      name: 'profile',
      target: 'profiles',
      sourceKey: 'id', // users table's primary key
      foreignKey: 'userId', // foreign key in profiles table
    }
  ],
}
```

### HasMany

```ts
interface HasMany {
  type: 'hasMany';
  name: string;
  // defaults to name
  target?: string;
  // The default value is the primary key of the source model, usually 'id'
  sourceKey?: string;
  // the default value is the singular form of the source collection name + 'Id'
  foreignKey?: string;
}

// The posts table's primary key id is concatenated with the comments table's postId
{
  name: 'posts',
  fields: [
    {
      type: 'hasMany',
      name: 'comments',
      target: 'comments',
      sourceKey: 'id', // posts table's primary key
      foreignKey: 'postId', // foreign key in the comments table
    }
  ],
}
```

### BelongsToMany

```ts
interface BelongsToMany {
  type: 'belongsToMany';
  name: string;
  // default value is name
  target?: string;
  // defaults to the source collection name and target in the natural order of the first letter of the string
  through?: string;
  // defaults to the singular form of source collection name + 'Id'
  foreignKey?: string;
  // The default value is the primary key of the source model, usually id
  sourceKey?: string;
  // the default value is the singular form of target + 'Id'
  otherKey?: string;
  // the default value is the primary key of the target model, usually id
  targetKey?: string;
}

// tags table's primary key, posts table's primary key and posts_tags two foreign keys are linked
{
  name: 'posts',
  fields: [
    {
      type: 'believesToMany',
      name: 'tags',
      target: 'tags',
      through: 'posts_tags', // intermediate table
      foreignKey: 'tagId', // foreign key 1, in posts_tags table
      otherKey: 'postId', // foreignKey2, in posts_tags table
      targetKey: 'id', // tags table's primary key
      sourceKey: 'id', // posts table's primary key
    }
  ],
}
```
