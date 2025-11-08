import path from 'path';
import { faker } from '@faker-js/faker';
import { createMockServer } from '@nocobase/test';
import { uid } from '@nocobase/utils';
import { CollectionRepository } from '@nocobase/plugin-data-source-main';

const CATEGORIES_COUNT = 100;
const TAGS_COUNT = 1000;
const POSTS_COUNT = 1000000;
const COMMENTS_COUNT = 10000000;
const BATCH_SIZE = 100000;

export default async function main() {
  const app = await createMockServer({
    plugins: ['nocobase'],
  });

  const db = app.db;
  await db.import({ directory: path.resolve(__dirname, 'collections') });
  await db.sync();
  const CollectionRepo = db.getRepository('collections') as CollectionRepository;
  await CollectionRepo.db2cm('categories');
  await CollectionRepo.db2cm('posts');
  await CollectionRepo.db2cm('tags');
  await CollectionRepo.db2cm('comments');

  const CategoriesModel = db.getModel('categories');
  const PostsModel = db.getModel('posts');
  const TagsModel = db.getModel('tags');
  const CommentsModel = db.getModel('comments');
  const PostTagsModel = db.getModel('postTags');

  console.log('Destroying existing data...');
  await PostTagsModel.destroy({ truncate: true, cascade: true });
  await CommentsModel.destroy({ truncate: true, cascade: true });
  await PostsModel.destroy({ truncate: true, cascade: true });
  await TagsModel.destroy({ truncate: true, cascade: true });
  await CategoriesModel.destroy({ truncate: true, cascade: true });
  console.log('Existing data destroyed.');

  console.log(`Creating ${CATEGORIES_COUNT} categories...`);
  const categories = [];
  const categorySlugsSet = new Set<string>();
  while (categorySlugsSet.size < CATEGORIES_COUNT) {
    categorySlugsSet.add(uid());
  }
  const categorySlugs = Array.from(categorySlugsSet);
  for (let i = 0; i < CATEGORIES_COUNT; i++) {
    categories.push({
      title: faker.lorem.words(3),
      subTitle: faker.lorem.sentence(),
      description: faker.lorem.paragraph(),
      slug: categorySlugs[i],
      sort: i,
      coverImageUrl: faker.image.url(),
      url: faker.internet.url(),
      followerCount: faker.number.int({ min: 0, max: 10000 }),
      articleCount: 0,
      hidden: faker.datatype.boolean(),
      themeColor: faker.internet.color(),
      icon: faker.internet.emoji(),
      allowComments: faker.datatype.boolean(),
      createdById: 1,
      updatedById: 1,
    });
  }
  const createdCategories = await CategoriesModel.bulkCreate(categories);
  console.log('Categories created.');

  console.log(`Creating ${TAGS_COUNT} tags...`);
  const tags = [];
  const tagSlugsSet = new Set<string>();
  while (tagSlugsSet.size < TAGS_COUNT) {
    tagSlugsSet.add(uid());
  }
  const tagSlugs = Array.from(tagSlugsSet);
  const tagNamesSet = new Set<string>();
  while (tagNamesSet.size < TAGS_COUNT) {
    tagNamesSet.add(uid());
  }
  const tagNames = Array.from(tagNamesSet);
  for (let i = 0; i < TAGS_COUNT; i++) {
    tags.push({
      name: tagNames[i],
      description: faker.lorem.sentence(),
      color: faker.internet.color(),
      icon: faker.internet.emoji(),
      slug: tagSlugs[i],
      isFeatured: faker.datatype.boolean(),
      usageCount: 0,
      followerCount: faker.number.int({ min: 0, max: 5000 }),
      isOfficial: faker.datatype.boolean(),
      moderationStatus: 'approved',
      group: faker.lorem.word(),
      seoTitle: faker.lorem.sentence(),
      seoDescription: faker.lorem.paragraph(),
      createdById: 1,
      updatedById: 1,
    });
  }
  const createdTags = await TagsModel.bulkCreate(tags);
  console.log('Tags created.');

  console.log(`Creating ${POSTS_COUNT} posts in batches of ${BATCH_SIZE}...`);

  for (let i = 0; i < POSTS_COUNT; i += BATCH_SIZE) {
    const posts = [];
    const postSlugsSet = new Set<string>();

    console.time('mock posts data in a batch');
    while (postSlugsSet.size < BATCH_SIZE) {
      postSlugsSet.add(uid());
    }
    const postSlugs = Array.from(postSlugsSet);
    for (let j = 0; j < BATCH_SIZE; j++) {
      const post = {
        title: uid(),
        subTitle: uid(),
        content: uid(),
        slug: postSlugs[j],
        musicUrl: uid(),
        excerpt: uid(),
        coverImage: uid(),
        status: 'published',
        allowComments: faker.datatype.boolean(),
        featured: faker.datatype.boolean(),
        publishedAt: faker.date.past(),
        viewCount: faker.number.int({ min: 0, max: 100000 }),
        read: faker.number.int({ min: 0, max: 100000 }),
        score: faker.number.float({ min: 0, max: 5, precision: 0.1 }),
        categoryId: createdCategories[faker.number.int({ min: 0, max: CATEGORIES_COUNT - 1 })].id,
        createdById: 1,
        updatedById: 1,
      };
      posts.push(post);
    }
    console.timeEnd('mock posts data in a batch');

    console.time('insert posts data in a batch');
    const createdPosts = await PostsModel.bulkCreate(posts);
    console.timeEnd('insert posts data in a batch');

    console.time('mock post-tags relations in a batch');
    const postTags = new Map();
    for (const post of createdPosts) {
      const numTags = faker.number.int({ min: 1, max: 5 });
      for (let k = 0; k < numTags; k++) {
        const postId = post.id;
        const tagId = createdTags[faker.number.int({ min: 0, max: TAGS_COUNT - 1 })].id;
        postTags.set(`${postId}-${tagId}`, { postId, tagId });
      }
    }
    console.timeEnd('mock post-tags relations in a batch');

    console.time(`insert post-tags relations in a batch (${postTags.size})`);
    await PostTagsModel.bulkCreate(Array.from(postTags.values()));
    console.timeEnd(`insert post-tags relations in a batch (${postTags.size})`);

    console.log(`Created posts ${i + 1}-${i + BATCH_SIZE}`);
  }
  console.log('Posts created.');

  console.log(`Creating ${COMMENTS_COUNT} comments in batches of ${BATCH_SIZE}...`);
  const allPosts = await PostsModel.findAll({ attributes: ['id'] });
  for (let i = 0; i < COMMENTS_COUNT; i += BATCH_SIZE) {
    const comments = [];
    for (let j = 0; j < BATCH_SIZE; j++) {
      comments.push({
        content: uid,
        authorName: uid,
        authorEmail: uid,
        authorUrl: uid,
        ipAddress: faker.internet.ip(),
        userAgent: uid,
        status: 'approved',
        likeCount: faker.number.int({ min: 0, max: 1000 }),
        dislikeCount: faker.number.int({ min: 0, max: 200 }),
        rating: faker.number.int({ min: 1, max: 5 }),
        isApproved: true,
        isFeatured: faker.datatype.boolean(),
        isSticky: faker.datatype.boolean(),
        postId: allPosts[faker.number.int({ min: 0, max: allPosts.length - 1 })].id,
        createdById: 1,
        updatedById: 1,
      });
    }
    await CommentsModel.bulkCreate(comments);
    console.log(`Created comments ${i + 1}-${i + BATCH_SIZE}`);
  }
  console.log('Comments created.');

  await app.destroy();
}

main()
  .then(() => {
    console.log('Data generation completed.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error during data generation:', error);
    process.exit(1);
  });
