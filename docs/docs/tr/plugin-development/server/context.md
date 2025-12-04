:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Bağlam

NocoBase'de her istek, Context sınıfının bir örneği olan bir `ctx` nesnesi oluşturur. Bağlam, istek ve yanıt bilgilerini kapsarken, aynı zamanda veritabanı erişimi, önbellek işlemleri, yetki yönetimi, uluslararasılaştırma ve günlük kaydı gibi NocoBase'e özgü işlevler sunar.

NocoBase'in `Application`'ı Koa üzerine kurulduğundan, `ctx` özünde bir Koa Bağlamıdır. Ancak NocoBase, bu temeli zengin API'lerle genişleterek geliştiricilerin Middleware ve Action'larda iş mantığını kolayca yönetmesini sağlar. Her isteğin bağımsız bir `ctx`'i olması, istekler arasında veri izolasyonunu ve güvenliğini garanti eder.

## ctx.action

`ctx.action`, mevcut istek için yürütülen Action'a erişim sağlar. Şunları içerir:

- ctx.action.params
- ctx.action.actionName
- ctx.action.resourceName

```ts
resourceManager.use(async (ctx) => {
  console.log(ctx.action.actionName); // Mevcut Action adını çıktılar
  ctx.body = `Action: ${ctx.action.actionName}`;
});
```

## ctx.i18n & ctx.t()

Uluslararasılaştırma (i18n) desteği.

- `ctx.i18n` yerel ayar bilgilerini sağlar
- `ctx.t()` dizeleri dile göre çevirmek için kullanılır

```ts
resourceManager.use(async (ctx) => {
  const msg = ctx.t('Hello World'); // İstek diline göre çeviriyi döndürür
  ctx.body = msg;
});
```

## ctx.db

`ctx.db`, veritabanı erişimi için bir arayüz sunar. Bu sayede modeller üzerinde doğrudan işlem yapabilir ve sorgular çalıştırabilirsiniz.

```ts
resourceManager.use(async (ctx) => {
  const users = await ctx.db.getRepository('users').find();
  ctx.body = users;
});
```

## ctx.cache

`ctx.cache`, önbellek işlemleri sunar. Önbellekten okuma ve önbelleğe yazma işlemlerini destekler ve genellikle veri erişimini hızlandırmak veya geçici durumu kaydetmek için kullanılır.

```ts
resourceManager.use(async (ctx) => {
  await ctx.cache.set('key', 'value', 60); // 60 saniye önbelleğe alır
  const val = await ctx.cache.get('key');
  ctx.body = val;
});
```

## ctx.app

`ctx.app`, NocoBase uygulama örneğidir ve global yapılandırmaya, eklentilere ve servislere erişim sağlar.

```ts
resourceManager.use(async (ctx) => {
  console.log(ctx.app);
  ctx.body = 'Uygulama için konsolu kontrol edin';
});
```

## ctx.auth.user

`ctx.auth.user`, mevcut kimliği doğrulanmış kullanıcı bilgilerini alır. Yetki kontrollerinde veya iş mantığında kullanıma uygundur.

```ts
resourceManager.use(async (ctx) => {
  if (!ctx.auth.user) {
    ctx.throw(401, 'Yetkisiz');
  }
  ctx.body = `Merhaba ${ctx.auth.user.username}`;
});
```

## ctx.state.currentRoles

`ctx.state`, middleware zincirinde veri paylaşmak için kullanılır.

```ts
resourceManager.use(async (ctx) => {
  ctx.body = `Mevcut Kullanıcı: ${ctx.state.currentRoles.join(',')}`;
});
```

## ctx.logger

`ctx.logger`, günlük kaydı yetenekleri sunar ve çok seviyeli günlük çıktısını destekler.

```ts
resourceManager.use(async (ctx) => {
  ctx.logger.info('İstek işleniyor:', ctx.path);
  ctx.body = 'Başarıyla günlüğe kaydedildi';
});
```

## ctx.permission & ctx.can()

`ctx.permission` yetki yönetimi için kullanılırken, `ctx.can()` mevcut kullanıcının belirli bir işlemi gerçekleştirme yetkisine sahip olup olmadığını kontrol etmek için kullanılır.

```ts
resourceManager.use(async (ctx) => {
  const canEdit = await ctx.can('edit', 'posts');
  if (!canEdit) {
    ctx.throw(403, 'Yasak');
  }
  ctx.body = 'Gönderileri düzenleme yetkiniz var';
});
```

## Özet

- Her istek, bağımsız bir `ctx` nesnesine karşılık gelir.
- `ctx`, Koa Bağlamının bir uzantısıdır ve NocoBase işlevlerini entegre eder.
- Sık kullanılan özellikler şunlardır: `ctx.db`, `ctx.cache`, `ctx.auth`, `ctx.state`, `ctx.logger`, `ctx.can()`, `ctx.t()` vb.
- Middleware ve Action'larda `ctx` kullanmak, istekleri, yanıtları, yetkileri, günlükleri ve veritabanını kolayca yönetmenizi sağlar.