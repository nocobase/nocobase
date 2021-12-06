import { Database } from './database';
import FilterParser from './filter-parser';

const db = new Database({
  dialect: 'sqlite',
  dialectModule: require('sqlite3'),
  storage: ':memory:',
});

(async () => {
  const User = db.collection({
    name: 'users',
    fields: [{ type: 'string', name: 'name' }],
  });

  const Post = db.collection({
    name: 'posts',
    fields: [
      { type: 'string', name: 'title' },
      {
        type: 'belongsTo',
        name: 'user',
      },
    ],
  });

  await db.sync();

  const repository = User.repository;

  await repository.createMany({
    records: [
      { name: 'u1', posts: [{ title: 'u1t1' }] },
      { name: 'u2', posts: [{ title: 'u2t1' }] },
      { name: 'u3', posts: [{ title: 'u3t1' }] },
    ],
  });

  const Model = User.model;
  const user = await Model.findOne({
    subQuery: false,
    where: {
      '$posts.title$': 'u1t1',
    },
    include: { association: 'posts', attributes: [] },
    attributes: {
      include: [],
    },
  });

  console.log(user.toJSON());
})();
