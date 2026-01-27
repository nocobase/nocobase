:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Middleware

NocoBase Sunucusu'nun middleware'i temelde bir **Koa middleware**'idir. Koa'da olduğu gibi `ctx` nesnesini kullanarak istekleri ve yanıtları işleyebilirsiniz. Ancak NocoBase'in farklı iş katmanlarındaki mantığı yönetmesi gerektiği için, tüm middleware'ler tek bir yerde toplandığında bakımı ve yönetimi oldukça zorlaşır.

Bu nedenle NocoBase, middleware'i **dört katmana** ayırmıştır:

1.  **Veri Kaynağı Düzeyi Middleware**: `app.dataSourceManager.use()`  
    Yalnızca **belirli bir veri kaynağı** için gelen istekleri etkiler. Genellikle o veri kaynağının veritabanı bağlantıları, alan doğrulama veya işlem yönetimi gibi mantıklar için kullanılır.

2.  **Kaynak Düzeyi Middleware**: `app.resourceManager.use()`  
    Yalnızca tanımlanmış kaynaklar (Resource) için geçerlidir. Veri izinleri, biçimlendirme vb. gibi kaynak düzeyi mantığını işlemek için uygundur.

3.  **İzin Düzeyi Middleware**: `app.acl.use()`  
    İzin kontrollerinden önce çalışır ve kullanıcı izinlerini veya rollerini doğrulamak için kullanılır.

4.  **Uygulama Düzeyi Middleware**: `app.use()`  
    Her istek için çalışır ve günlük kaydı, genel hata işleme, yanıt işleme vb. gibi durumlar için uygundur.

## Middleware Kaydı

Middleware genellikle eklentinin `load` metodunda kaydedilir, örneğin:

```ts
export class MyPlugin extends Plugin {
  load() {
    // Uygulama düzeyi middleware
    this.app.use(async (ctx, next) => {
      console.log('App middleware');
      await next();
    });

    // Veri kaynağı middleware
    this.app.dataSourceManager.use(async (ctx, next) => {
      console.log('DataSource middleware');
      await next();
    });

    // İzin middleware
    this.app.acl.use(async (ctx, next) => {
      console.log('ACL middleware');
      await next();
    });

    // Kaynak middleware
    this.app.resourceManager.use(async (ctx, next) => {
      console.log('Resource middleware');
      await next();
    });

  }
}
```

### Çalışma Sırası

Middleware çalışma sırası aşağıdaki gibidir:

1.  Önce `acl.use()` ile eklenen izin middleware'i çalışır.
2.  Ardından `resourceManager.use()` ile eklenen kaynak middleware'i çalışır.
3.  Daha sonra `dataSourceManager.use()` ile eklenen veri kaynağı middleware'i çalışır.
4.  Son olarak `app.use()` ile eklenen uygulama middleware'i çalışır.

## before / after / tag Ekleme Mekanizması

Middleware sırasını daha esnek bir şekilde kontrol etmek için NocoBase, `before`, `after` ve `tag` parametrelerini sunar:

-   **tag**: Middleware'e, sonraki middleware'ler tarafından referans alınmak üzere bir etiket atar.
-   **before**: Belirtilen `tag`'e sahip middleware'den önce ekler.
-   **after**: Belirtilen `tag`'e sahip middleware'den sonra ekler.

Örnek:

```ts
// Normal middleware
app.use(m1, { tag: 'restApi' });
app.resourceManager.use(m2, { tag: 'parseToken' });
app.resourceManager.use(m3, { tag: 'checkRole' });

// m4, m1'den önce yerleştirilecektir
app.use(m4, { before: 'restApi' });

// m5, m2 ve m3 arasına eklenecektir
app.resourceManager.use(m5, { after: 'parseToken', before: 'checkRole' });
```

:::ipucu
Eğer bir konum belirtilmezse, yeni eklenen middleware'lerin varsayılan çalışma sırası şöyledir:  
`acl.use()` -> `resourceManager.use()` -> `dataSourceManager.use()` -> `app.use()`  
:::

## Soğan Halkası Modeli Örneği

Middleware çalışma sırası, Koa'nın **soğan halkası modelini** takip eder; yani middleware yığınına önce girer ve en son çıkar.

```ts
app.use(async (ctx, next) => {
  ctx.body = ctx.body || [];
  ctx.body.push(1);
  await next();
  ctx.body.push(2);
});

app.resourceManager.use(async (ctx, next) => {
  ctx.body = ctx.body || [];
  ctx.body.push(3);
  await next();
  ctx.body.push(4);
});

app.acl.use(async (ctx, next) => {
  ctx.body = ctx.body || [];
  ctx.body.push(5);
  await next();
  ctx.body.push(6);
});

app.resourceManager.define({
  name: 'test',
  actions: {
    async list(ctx, next) {
      ctx.body = ctx.body || [];
      ctx.body.push(7);
      await next();
      ctx.body.push(8);
    },
  },
});
```

Farklı arayüzler için çıktı sırası örnekleri:

-   **Normal istek**: `/api/hello`  
    Çıktı: `[1,2]` (kaynak tanımlı değil, `resourceManager` ve `acl` middleware'leri çalışmaz)  

-   **Kaynak isteği**: `/api/test:list`  
    Çıktı: `[5,3,7,1,2,8,4,6]`  
    Middleware, katman sırasına ve soğan halkası modeline göre çalışır.

## Özet

-   NocoBase Middleware, Koa Middleware'in bir uzantısıdır.
-   Dört katman: Uygulama -> Veri Kaynağı -> Kaynak -> İzin
-   `before` / `after` / `tag` kullanarak çalışma sırasını esnek bir şekilde kontrol edebilirsiniz.
-   Koa soğan halkası modelini takip eder, bu da middleware'in birleştirilebilir ve iç içe yerleştirilebilir olmasını sağlar.
-   Veri kaynağı düzeyi middleware'i yalnızca belirtilen veri kaynağı isteklerini etkilerken, kaynak düzeyi middleware'i yalnızca tanımlanmış kaynak isteklerini etkiler.