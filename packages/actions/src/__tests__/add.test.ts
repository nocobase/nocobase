import { initDatabase, agent } from './index';

describe('add', () => {
  let db;
  
  beforeEach(async () => {
    db = await initDatabase();
  });
  
  afterAll(() => db.close());

  it('belongsToMany1', async () => {
    const [Post, Tag] = db.getModels(['posts', 'tags']);
    let post = await Post.create();
    let tag1 = await Tag.create({name: 'tag1'});
    let tag2 = await Tag.create({name: 'tag2'});
    await agent.post(`/posts/${post.id}/tags:add/${tag1.id}`);
    await agent.post(`/posts/${post.id}/tags:add/${tag2.id}`);
    let [tag01, tag02] = await post.getTags();
    expect(tag01.id).toBe(tag1.id);
    expect(tag02.id).toBe(tag2.id);
  });
});
