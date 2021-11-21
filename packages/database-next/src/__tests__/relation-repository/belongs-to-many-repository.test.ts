import { mockDatabase } from '../index';
import { BelongsToManyRepository } from '../../relation-repository/belongs-to-many-repository';

describe('belongs to many', () => {
  let db;
  let Post;
  let Tag;
  let PostTag;

  beforeEach(async () => {
    db = mockDatabase();
    PostTag = db.collection({
      name: 'posts_tags',
      fields: [{ type: 'string', name: 'tagged_at' }],
    });

    Post = db.collection({
      name: 'posts',
      fields: [
        { type: 'belongsToMany', name: 'tags', through: 'posts_tags' },
        { type: 'string', name: 'title' },
      ],
    });

    Tag = db.collection({
      name: 'tags',
      fields: [
        { type: 'belongsToMany', name: 'posts', through: 'posts_tags' },
        { type: 'string', name: 'name' },
      ],
    });

    await db.sync({ force: true });
  });

  afterEach(async () => {
    await db.close();
  });

  test('create with through values', async () => {
    const p1 = await Post.repository.create({
      values: {
        title: 'p1',
      },
    });

    const PostTagRepository = new BelongsToManyRepository(Post, 'tags', p1.id);

    await PostTagRepository.create({
      values: {
        name: 't1',
        posts_tags: {
          tagged_at: '123',
        },
      },
    });

    const t1 = await PostTagRepository.findOne();
    expect(t1.posts_tags.tagged_at).toEqual('123');
  });

  test('create', async () => {
    const p1 = await Post.repository.create({
      values: {
        title: 'p1',
      },
    });

    const PostTagRepository = new BelongsToManyRepository(Post, 'tags', p1.id);

    const t1 = await PostTagRepository.create({
      values: {
        name: 't1',
      },
    });

    expect(t1).toBeDefined();

    const t2 = await Tag.repository.create({
      values: {
        name: 't2',
      },
    });

    await PostTagRepository.add(t2.id);

    const findResult = await PostTagRepository.find();
    expect(findResult.length).toEqual(2);

    const findFilterResult = await PostTagRepository.find({
      filter: { name: 't2' },
    });

    expect(findFilterResult.length).toEqual(1);
    expect(findFilterResult[0].name).toEqual('t2');
  });

  test('find and count', async () => {
    const p1 = await Post.repository.create({
      values: {
        title: 'p1',
        tags: [{ name: 't1' }, { name: 't2' }],
      },
    });

    const PostTagRepository = new BelongsToManyRepository(Post, 'tags', p1.id);
    let [findResult, count] = await PostTagRepository.findAndCount();

    expect(count).toEqual(2);

    [findResult, count] = await PostTagRepository.findAndCount({
      filter: {
        name: 't1',
      },
    });

    expect(count).toEqual(1);
    expect(findResult[0].name).toEqual('t1');
  });

  test('find one', async () => {
    const p1 = await Post.repository.create({
      values: { title: 'p1', tags: [{ name: 't1' }, { name: 't2' }] },
    });

    const PostTagRepository = new BelongsToManyRepository(Post, 'tags', p1.id);
    let t1 = await PostTagRepository.findOne({
      filter: {
        name: 't1',
      },
    });

    expect(t1.name).toEqual('t1');

    t1 = await PostTagRepository.findOne({
      filter: {
        name: 'tabcaa',
      },
    });
    expect(t1).toBeNull();
  });

  test('update raw attribute', async () => {
    const otherTag = await Tag.repository.create({
      values: { name: 'other_tag' },
    });

    const p1 = await Post.repository.create({
      values: {
        title: 'p1',
        tags: [{ name: 't1' }, { name: 't2' }],
      },
    });

    const PostTagRepository = new BelongsToManyRepository(Post, 'tags', p1.id);

    // rename t1 to t3
    await PostTagRepository.update({
      filter: {
        name: 't1',
      },
      values: {
        name: 't3',
      },
    });

    const t1 = await PostTagRepository.findOne({
      filter: {
        name: 't1',
      },
    });

    expect(t1).toBeNull();

    const t3 = await PostTagRepository.findOne({
      filter: {
        name: 't3',
      },
    });

    expect(t3.name).toEqual('t3');

    await PostTagRepository.update({
      values: {
        name: 'updated',
      },
    });

    await otherTag.reload();
    expect(otherTag.name).toEqual('other_tag');
  });

  test('update through table attribute', async () => {
    const p1 = await Post.repository.create({
      values: {
        title: 'p1',
        tags: [
          {
            name: 't1',
            posts_tags: {
              tagged_at: '123',
            },
          },
          { name: 't2' },
        ],
      },
    });

    const PostTagRepository = new BelongsToManyRepository(Post, 'tags', p1.id);

    let t1 = await PostTagRepository.findOne({
      filter: {
        name: 't1',
      },
    });

    expect(t1.posts_tags.tagged_at).toEqual('123');

    const p2 = await Post.repository.create({
      values: {
        title: 'p2',
        tags: [t1.id],
      },
    });

    const Post2TagRepository = new BelongsToManyRepository(Post, 'tags', p2.id);
    const p2Tag = await Post2TagRepository.findOne();
    expect(p2Tag.posts_tags.tagged_at).toBeNull();

    // 设置p1与t1关联的tagged_at
    await PostTagRepository.update({
      filter: {
        name: 't1',
      },
      values: {
        posts_tags: {
          tagged_at: '456',
        },
      },
    });

    await t1.reload();

    expect(t1.posts_tags.tagged_at).toEqual('456');

    await p2Tag.reload();
    // p2-tag1 still not change
    expect(p2Tag.posts_tags.tagged_at).toBeNull();
  });

  test('add', async () => {
    let t1 = await Tag.repository.create({
      values: { name: 't1' },
    });

    const p1 = await Post.repository.create({
      values: { title: 'p1' },
    });

    const PostTagRepository = new BelongsToManyRepository(Post, 'tags', p1.id);
    await PostTagRepository.add([[t1.id, { tagged_at: '123' }]]);

    let p1Tag = await PostTagRepository.findOne();
    expect(p1Tag.posts_tags.tagged_at).toEqual('123');
  });

  test('set', async () => {
    let t1 = await Tag.repository.create({
      values: { name: 't1' },
    });

    const t2 = await Tag.repository.create({
      values: { name: 't2' },
    });

    const p1 = await Post.repository.create({
      values: { title: 'p1' },
    });

    const PostTagRepository = new BelongsToManyRepository(Post, 'tags', p1.id);

    await PostTagRepository.set([t1.id]);

    let p1Tags = await PostTagRepository.find();
    expect(p1Tags.length).toEqual(1);

    await PostTagRepository.set([[t1.id, { tagged_at: '999' }]]);

    t1 = await PostTagRepository.findOne({
      filter: {
        name: 't1',
      },
    });

    expect(t1.posts_tags.tagged_at).toEqual('999');
  });

  test('find by pk', async () => {
    let t1 = await Tag.repository.create({
      values: {
        name: 't1',
      },
    });

    const t2 = await Tag.repository.create({
      values: {
        name: 't2',
      },
    });

    const p1 = await Post.repository.create({
      values: { title: 'p1' },
    });

    const PostTagRepository = new BelongsToManyRepository(Post, 'tags', p1.id);

    await PostTagRepository.set([t1.id, t2.id]);

    const findByPkResult = await PostTagRepository.findOne({
      filterByPk: t2.id,
    });

    expect(findByPkResult.name).toEqual('t2');
  });

  test('toggle', async () => {
    let t1 = await Tag.repository.create({
      values: { name: 't1' },
    });

    const p1 = await Post.repository.create({
      values: { title: 'p1' },
    });

    const PostTagRepository = new BelongsToManyRepository(Post, 'tags', p1.id);

    await PostTagRepository.toggle(t1.id);
    expect(await PostTagRepository.findOne()).not.toBeNull();

    await PostTagRepository.toggle(t1.id);
    expect(await PostTagRepository.findOne()).toBeNull();
  });

  test('remove', async () => {
    let t1 = await Tag.repository.create({
      values: { name: 't1' },
    });

    const p1 = await Post.repository.create({
      values: { title: 'p1' },
    });

    const PostTagRepository = new BelongsToManyRepository(Post, 'tags', p1.id);

    await PostTagRepository.add(t1.id);
    expect(await PostTagRepository.findOne()).not.toBeNull();

    await PostTagRepository.remove(t1.id);
    expect(await PostTagRepository.findOne()).toBeNull();
  });

  test('destroy all', async () => {
    let t1 = await Tag.repository.create({
      values: {
        name: 't1',
      },
    });

    const t2 = await Tag.repository.create({
      values: {
        name: 't2',
      },
    });

    const p1 = await Post.repository.create({
      values: { title: 'p1' },
    });

    const PostTagRepository = new BelongsToManyRepository(Post, 'tags', p1.id);

    await PostTagRepository.set([t1.id, t2.id]);

    await PostTagRepository.destroy();

    const [_, count] = await PostTagRepository.findAndCount();
    expect(count).toEqual(0);
  });

  test('destroy with id', async () => {
    let t1 = await Tag.repository.create({
      values: {
        name: 't1',
      },
    });

    const t2 = await Tag.repository.create({
      values: {
        name: 't2',
      },
    });

    const p1 = await Post.repository.create({
      values: { title: 'p1' },
    });

    const PostTagRepository = new BelongsToManyRepository(Post, 'tags', p1.id);

    await PostTagRepository.set([t1.id, t2.id]);

    await PostTagRepository.destroy(t2.id);

    const result = await PostTagRepository.findAndCount();
    expect(result[1]).toEqual(1);
  });

  test('transaction', async () => {
    let t1 = await Tag.repository.create({
      values: {
        name: 't1',
      },
    });

    const t2 = await Tag.repository.create({
      values: {
        name: 't2',
      },
    });

    const p1 = await Post.repository.create({
      values: { title: 'p1' },
    });

    const transaction = await Tag.model.sequelize.transaction();

    const PostTagRepository = new BelongsToManyRepository(Post, 'tags', p1.id);

    await PostTagRepository.set({
      pk: [t1.id, t2.id],
      transaction,
    });

    await transaction.commit();
  });
});
