:::tip
यह दस्तावेज़ AI द्वारा अनुवादित किया गया है। किसी भी अशुद्धि के लिए, कृपया [अंग्रेजी संस्करण](/en) देखें
:::

# Context (संदर्भ)

NocoBase में, हर अनुरोध (request) एक `ctx` ऑब्जेक्ट बनाता है, जो Context का एक इंस्टेंस (instance) होता है। Context अनुरोध और प्रतिक्रिया (response) की जानकारी को समाहित करता है, साथ ही NocoBase की खास सुविधाएँ भी प्रदान करता है, जैसे डेटाबेस एक्सेस, कैश (cache) ऑपरेशन, अनुमति प्रबंधन (permission management), अंतर्राष्ट्रीयकरण (internationalization) और लॉगिंग (logging)।

NocoBase का `Application` Koa पर आधारित है, इसलिए `ctx` मूल रूप से एक Koa Context ही है। लेकिन NocoBase ने इसमें कई उपयोगी API जोड़कर इसे और भी बेहतर बनाया है, जिससे डेवलपर्स Middleware और Action में व्यावसायिक तर्क (business logic) को आसानी से संभाल सकें। हर अनुरोध का अपना एक अलग `ctx` होता है, जो अनुरोधों के बीच डेटा अलगाव (data isolation) और सुरक्षा सुनिश्चित करता है।

## ctx.action

`ctx.action` आपको वर्तमान अनुरोध के लिए निष्पादित (execute) हो रहे Action तक पहुँच प्रदान करता है। इसमें शामिल हैं:

- ctx.action.params
- ctx.action.actionName
- ctx.action.resourceName

```ts
resourceManager.use(async (ctx) => {
  console.log(ctx.action.actionName); // वर्तमान Action का नाम आउटपुट करता है
  ctx.body = `Action: ${ctx.action.actionName}`;
});
```

## ctx.i18n और ctx.t()

अंतर्राष्ट्रीयकरण (i18n) के लिए समर्थन।

- `ctx.i18n` भाषा और क्षेत्र (locale) से संबंधित जानकारी प्रदान करता है।
- `ctx.t()` का उपयोग अनुरोध की भाषा के आधार पर स्ट्रिंग का अनुवाद करने के लिए किया जाता है।

```ts
resourceManager.use(async (ctx) => {
  const msg = ctx.t('Hello World'); // अनुरोध की भाषा के आधार पर अनुवाद लौटाता है
  ctx.body = msg;
});
```

## ctx.db

`ctx.db` डेटाबेस तक पहुँचने के लिए एक इंटरफ़ेस प्रदान करता है, जिससे आप सीधे मॉडल पर ऑपरेशन कर सकते हैं और क्वेरी (query) चला सकते हैं।

```ts
resourceManager.use(async (ctx) => {
  const users = await ctx.db.getRepository('users').find();
  ctx.body = users;
});
```

## ctx.cache

`ctx.cache` कैश (cache) ऑपरेशन प्रदान करता है। यह कैश से डेटा पढ़ने और उसमें लिखने का समर्थन करता है। इसका उपयोग अक्सर डेटा एक्सेस को तेज़ करने या अस्थायी स्थिति (temporary state) को सहेजने के लिए किया जाता है।

```ts
resourceManager.use(async (ctx) => {
  await ctx.cache.set('key', 'value', 60); // 60 सेकंड के लिए कैश करें
  const val = await ctx.cache.get('key');
  ctx.body = val;
});
```

## ctx.app

`ctx.app` NocoBase एप्लीकेशन का इंस्टेंस है। यह आपको वैश्विक कॉन्फ़िगरेशन (global configuration), प्लगइन (plugin) और सेवाओं (services) तक पहुँचने की सुविधा देता है।

```ts
resourceManager.use(async (ctx) => {
  console.log(ctx.app);
  ctx.body = 'Check console for app'; // कंसोल में ऐप देखें
});
```

## ctx.auth.user

`ctx.auth.user` वर्तमान में प्रमाणित (authenticated) उपयोगकर्ता की जानकारी प्राप्त करता है। यह अनुमति जाँच (permission checks) या व्यावसायिक तर्क (business logic) में उपयोग के लिए उपयुक्त है।

```ts
resourceManager.use(async (ctx) => {
  if (!ctx.auth.user) {
    ctx.throw(401, 'Unauthorized');
  }
  ctx.body = `Hello ${ctx.auth.user.username}`;
});
```

## ctx.state.currentRoles

`ctx.state` का उपयोग मिडलवेयर (middleware) चेन में डेटा साझा करने के लिए किया जाता है।

```ts
resourceManager.use(async (ctx) => {
  ctx.body = `Current User: ${ctx.state.currentRoles.join(',')}`;
});
```

## ctx.logger

`ctx.logger` लॉगिंग (logging) क्षमताएँ प्रदान करता है। यह कई स्तरों पर लॉग आउटपुट का समर्थन करता है।

```ts
resourceManager.use(async (ctx) => {
  ctx.logger.info('Processing request for:', ctx.path);
  ctx.body = 'Logged successfully';
});
```

## ctx.permission और ctx.can()

`ctx.permission` का उपयोग अनुमति प्रबंधन (permission management) के लिए किया जाता है। `ctx.can()` का उपयोग यह जाँचने के लिए किया जाता है कि क्या वर्तमान उपयोगकर्ता को किसी विशेष ऑपरेशन को निष्पादित करने की अनुमति है।

```ts
resourceManager.use(async (ctx) => {
  const canEdit = await ctx.can('edit', 'posts');
  if (!canEdit) {
    ctx.throw(403, 'Forbidden');
  }
  ctx.body = 'You have permission to edit posts';
});
```

## सारांश

- हर अनुरोध का अपना एक अलग `ctx` ऑब्जेक्ट होता है।
- `ctx` Koa Context का एक विस्तार है, जो NocoBase की कार्यक्षमताओं को एकीकृत (integrate) करता है।
- सामान्य गुणों में शामिल हैं: `ctx.db`, `ctx.cache`, `ctx.auth`, `ctx.state`, `ctx.logger`, `ctx.can()`, `ctx.t()` आदि।
- Middleware और Action में `ctx` का उपयोग करके आप अनुरोधों, प्रतिक्रियाओं, अनुमतियों, लॉग और डेटाबेस को आसानी से संभाल सकते हैं।