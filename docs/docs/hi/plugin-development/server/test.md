:::tip
यह दस्तावेज़ AI द्वारा अनुवादित किया गया है। किसी भी अशुद्धि के लिए, कृपया [अंग्रेजी संस्करण](/en) देखें
:::

# टेस्ट

NocoBase डेवलपर्स को प्लगइन डेवलपमेंट के दौरान डेटाबेस लॉजिक, API इंटरफेस और फ़ंक्शन इम्प्लीमेंटेशन की सटीकता को तेज़ी से वेरिफाई करने में मदद करने के लिए टेस्टिंग टूल्स का एक पूरा सेट प्रदान करता है। यह गाइड बताएगी कि इन टेस्ट्स को कैसे लिखें, चलाएं और व्यवस्थित करें।

## टेस्ट क्यों लिखें

प्लगइन डेवलपमेंट में ऑटोमेटेड टेस्ट्स लिखने के फ़ायदे:

- डेटाबेस मॉडल, API और बिज़नेस लॉजिक की सटीकता को तेज़ी से वेरिफाई करें।
- रिग्रेशन एरर्स से बचें (कोर अपग्रेड के बाद प्लगइन कम्पैटिबिलिटी का ऑटोमैटिक पता लगाएं)।
- कंटीन्यूअस इंटीग्रेशन (CI) एनवायरनमेंट में टेस्ट्स को ऑटोमैटिकली चलाने में मदद करें।
- पूरी सर्विस शुरू किए बिना प्लगइन की कार्यक्षमता का टेस्ट करने में मदद करें।

## टेस्ट एनवायरनमेंट की बुनियादी बातें

NocoBase दो मुख्य टेस्टिंग टूल्स प्रदान करता है:

| टूल | विवरण | उद्देश्य |
|------|------|------|
| `createMockDatabase` | इन-मेमोरी डेटाबेस इंस्टेंस बनाएं | डेटाबेस मॉडल और लॉजिक का टेस्ट करें |
| `createMockServer` | पूरा एप्लिकेशन इंस्टेंस बनाएं (जिसमें डेटाबेस, प्लगइन, API आदि शामिल हैं) | बिज़नेस प्रोसेस और इंटरफ़ेस बिहेवियर का टेस्ट करें |

## डेटाबेस टेस्टिंग के लिए `createMockDatabase` का उपयोग करना

`createMockDatabase` उन फ़ंक्शंस का टेस्ट करने के लिए उपयुक्त है जो सीधे डेटाबेस से संबंधित हैं, जैसे मॉडल परिभाषाएं, फ़ील्ड प्रकार, संबंध, CRUD ऑपरेशन आदि।

### बेसिक उदाहरण

```ts
import { createMockDatabase, Database } from '@nocobase/database';

describe('Database test', () => {
  let db: Database;

  beforeEach(async () => {
    db = await createMockDatabase();
    await db.clean({ drop: true });
  });

  afterEach(async () => {
    await db.close();
  });

  it('should create and query data', async () => {
    const User = db.collection({
      name: 'users',
      fields: [
        { type: 'string', name: 'username' },
        { type: 'integer', name: 'age' },
      ],
    });

    await User.sync();

    const user = await db.getRepository('users').create({
      values: { username: 'testuser', age: 25 },
    });

    const found = await db.getRepository('users').findOne({
      filter: { username: 'testuser' },
    });

    expect(found.get('age')).toBe(25);
  });
});
```

### CRUD ऑपरेशंस का टेस्ट करना

```ts
const Posts = db.collection({
  name: 'posts',
  fields: [{ type: 'string', name: 'title' }],
});
await db.sync();

// Create
const post = await db.getRepository('posts').create({ values: { title: 'Initial Title' } });
expect(post.get('title')).toBe('Initial Title');

// Update
await db.getRepository('posts').update({
  filterByTk: post.get('id'),
  values: { title: 'Updated Title' },
});
const updated = await db.getRepository('posts').findOne({ filterByTk: post.get('id') });
expect(updated.get('title')).toBe('Updated Title');
```

### मॉडल एसोसिएशन का टेस्ट करना

```ts
const Users = db.collection({
  name: 'users',
  fields: [
    { type: 'string', name: 'username' },
    { type: 'hasMany', name: 'posts' },
  ],
});

const Posts = db.collection({
  name: 'posts',
  fields: [
    { type: 'string', name: 'title' },
    { type: 'belongsTo', name: 'author' },
  ],
});
await db.sync();

const user = await db.getRepository('users').create({ values: { username: 'tester' } });
await db.getRepository('posts').create({
  values: { title: 'Post 1', authorId: user.get('id') },
});

const result = await db.getRepository('users').findOne({
  filterByTk: user.get('id'),
  appends: ['posts'],
});
expect(result.get('posts')).toHaveLength(1);
```

## API टेस्टिंग के लिए `createMockServer` का उपयोग करना

`createMockServer` ऑटोमैटिकली एक पूरा एप्लिकेशन इंस्टेंस बनाता है जिसमें डेटाबेस, प्लगइन और API रूट्स शामिल होते हैं, जिससे यह प्लगइन इंटरफेस का टेस्ट करने के लिए आदर्श बन जाता है।

### बेसिक उदाहरण

```ts
import { createMockServer, MockServer } from '@nocobase/test';

describe('User API test', () => {
  let app: MockServer;

  beforeEach(async () => {
    app = await createMockServer({ plugins: ['users', 'auth'] });
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should create a user', async () => {
    const response = await app.agent()
      .post('/users:create')
      .send({ username: 'test', email: 'a@b.com', password: '123456' });

    expect(response.status).toBe(200);
    expect(response.body.username).toBe('test');
  });
});
```

### API क्वेरीज़ और अपडेट्स का टेस्ट करना

```ts
// Query user list
const list = await app.agent().get('/users:list');
expect(list.body.rows.length).toBeGreaterThan(0);

// Update user
const update = await app.agent().post(`/users:update/${id}`).send({ username: 'newname' });
expect(update.body.username).toBe('newname');
```

### लॉगिन स्टेटस या परमिशन टेस्टिंग का सिमुलेशन

आप `MockServer` बनाते समय `auth` प्लगइन को एनेबल कर सकते हैं, और फिर टोकन या सेशन प्राप्त करने के लिए लॉगिन इंटरफ़ेस का उपयोग कर सकते हैं:

```ts
const res = await app
  .agent()
  .post('/auth:signin')
  .send({ 
    username: 'admin',
    password: 'admin123',
  });

const token = res.body.data.token;

await app
  .agent()
  .set('Authorization', `Bearer ${token}`)
  .get('/protected-endpoint');
```

आप ज़्यादा आसान `login()` मेथड का भी उपयोग कर सकते हैं

```ts
await app.agent().login(userOrId);
```

## प्लगइन में टेस्ट फ़ाइलों को व्यवस्थित करना

यह सलाह दी जाती है कि सर्वर-साइड लॉजिक से संबंधित टेस्ट फ़ाइलों को प्लगइन के `./src/server/__tests__` फ़ोल्डर में स्टोर करें।

```bash
packages/plugins/@my-project/plugin-hello/
├── src/                     # सोर्स कोड डायरेक्टरी
│   └── server/              # सर्वर-साइड कोड
│       ├── __tests__/       # टेस्ट फ़ाइलें डायरेक्टरी
│       │   ├── db.test.ts   # डेटाबेस से संबंधित टेस्ट्स (createMockDatabase का उपयोग करके)
│       │   └── api.test.ts  # API से संबंधित टेस्ट्स
```

## टेस्ट्स चलाना

```bash
# डायरेक्टरी निर्दिष्ट करें
yarn test packages/plugins/@my-project/plugin-hello/src/server
# फ़ाइल निर्दिष्ट करें
yarn test packages/plugins/@my-project/plugin-hello/src/server/__tests__/db.test.ts
```