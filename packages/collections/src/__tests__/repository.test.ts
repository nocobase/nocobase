import { Collection } from '../collection';
import { Database } from '../database';
import { updateAssociation, updateAssociations } from '../update-associations';
import { mockDatabase } from './';

describe('repository', () => {
  let db: Database;
  let User: Collection;
  let Post: Collection;
  let Comment: Collection;

  beforeEach(async () => {
    db = mockDatabase();
    User = db.collection({
      name: 'users',
      schema: [
        { type: 'string', name: 'name' },
        { type: 'hasMany', name: 'posts' },
      ],
    });
    Post = db.collection({
      name: 'posts',
      schema: [
        { type: 'string', name: 'name' },
        { type: 'hasMany', name: 'comments' },
      ],
    });
    Comment = db.collection({
      name: 'comments',
      schema: [{ type: 'string', name: 'name' }],
    });
    await db.sync();
    await User.repository.bulkCreate([
      {
        name: 'user1',
        posts: [
          {
            name: 'post11',
            comments: [
              { name: 'comment111' },
              { name: 'comment112' },
              { name: 'comment113' },
            ],
          },
          {
            name: 'post12',
            comments: [
              { name: 'comment121' },
              { name: 'comment122' },
              { name: 'comment123' },
            ],
          },
          {
            name: 'post13',
            comments: [
              { name: 'comment131' },
              { name: 'comment132' },
              { name: 'comment133' },
            ],
          },
          {
            name: 'post14',
            comments: [
              { name: 'comment141' },
              { name: 'comment142' },
              { name: 'comment143' },
            ],
          },
        ],
      },
      {
        name: 'user2',
        posts: [
          {
            name: 'post21',
            comments: [
              { name: 'comment211' },
              { name: 'comment212' },
              { name: 'comment213' },
            ],
          },
          {
            name: 'post22',
            comments: [
              { name: 'comment221' },
              { name: 'comment222' },
              { name: 'comment223' },
            ],
          },
          {
            name: 'post23',
            comments: [
              { name: 'comment231' },
              { name: 'comment232' },
              { name: 'comment233' },
            ],
          },
          { name: 'post24' },
        ],
      },
      {
        name: 'user3',
        posts: [
          {
            name: 'post31',
            comments: [
              { name: 'comment311' },
              { name: 'comment312' },
              { name: 'comment313' },
            ],
          },
          { name: 'post32' },
          {
            name: 'post33',
            comments: [
              { name: 'comment331' },
              { name: 'comment332' },
              { name: 'comment333' },
            ],
          },
          { name: 'post34' },
        ],
      },
    ]);
  });

  afterEach(async () => {
    await db.close();
  });

  it.only('findAll', async () => {
    const data = await User.repository.findAll({
      filter: {
        'posts.comments.id': null,
      },
      page: 1,
      pageSize: 1,
    });
    console.log(data.count, JSON.stringify(data.rows.map(row => row.toJSON()), null, 2));
    // expect(data.toJSON()).toMatchObject({
    //   name: 'user3',
    // });
  });

  it('findOne', async () => {
    const data = await User.repository.findOne({
      filter: {
        'posts.comments.name': 'comment331',
      },
    });
    // expect(data.toJSON()).toMatchObject({
    //   name: 'user3',
    // });
  });

});
