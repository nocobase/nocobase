:::tip{title="AI Çeviri Bildirimi"}
Bu belge yapay zeka tarafından çevrilmiştir. Doğru bilgi için [İngilizce sürüme](/runjs/context/get-model) bakın.
:::

# ctx.getModel()

Model `uid` değerine göre mevcut motor veya görünüm yığınındaki (view stack) bir model örneğini (BlockModel, PageModel, ActionModel vb.) alır. RunJS içinde bloklar, sayfalar veya açılır pencereler (popup) arasında diğer modellere erişmek için kullanılır.

Yalnızca mevcut yürütme bağlamının bulunduğu modele veya bloğa ihtiyacınız varsa, `ctx.getModel` yerine `ctx.model` veya `ctx.blockModel` kullanmaya öncelik verin.

## Kullanım Senaryoları

| Senaryo | Açıklama |
|------|------|
| **JSBlock / JSAction** | Bilinen bir `uid` değerine göre diğer blokların modellerini alarak `resource`, `form`, `setProps` vb. özelliklerini okumak veya yazmak için kullanılır. |
| **Açılır Pencerelerde (Popup) RunJS** | Açılır pencereyi açan sayfadaki bir modele erişmek gerektiğinde `searchInPreviousEngines: true` parametresi geçilir. |
| **Özel İşlemler** | Yapılandırma panelindeki formları veya alt modelleri, görünümler arası `uid` ile bularak yapılandırmalarını veya durumlarını okumak için kullanılır. |

## Tür Tanımı

```ts
getModel<T extends FlowModel = FlowModel>(
  uid: string,
  searchInPreviousEngines?: boolean
): T | undefined
```

## Parametreler

| Parametre | Tür | Açıklama |
|------|------|------|
| `uid` | `string` | Hedef model örneğinin benzersiz tanımlayıcısıdır; yapılandırma veya oluşturma sırasında belirlenir (örneğin `ctx.model.uid`). |
| `searchInPreviousEngines` | `boolean` | İsteğe bağlıdır, varsayılan değer `false`'tur. `true` olduğunda, "görünüm yığını" (view stack) içinde mevcut motordan kök dizine doğru arama yapar; bu sayede üst düzey motorlardaki (örneğin açılır pencereyi açan sayfa) modellere erişim sağlar. |

## Dönüş Değeri

- Bulunursa, ilgili `FlowModel` alt sınıf örneğini (örneğin `BlockModel`, `FormBlockModel`, `ActionModel`) döndürür.
- Bulunamazsa `undefined` döndürür.

## Arama Kapsamı

- **Varsayılan (`searchInPreviousEngines: false`)**: Yalnızca **mevcut motor** içinde `uid` değerine göre arama yapar. Açılır pencerelerde veya çok seviyeli görünümlerde her görünümün bağımsız bir motoru vardır; varsayılan olarak yalnızca mevcut görünümdeki modelleri arar.
- **`searchInPreviousEngines: true`**: Mevcut motordan başlayarak `previousEngine` zinciri boyunca yukarı doğru arama yapar ve ilk eşleşmeyi döndürür. Mevcut açılır pencereyi açan sayfadaki bir modele erişmek için kullanışlıdır.

## Örnekler

### Başka bir bloğu alma ve yenileme

```ts
const block = ctx.getModel('list-block-uid');
if (block?.resource) {
  await block.resource.refresh();
}
```

### Açılır pencereden sayfadaki bir modele erişme

```ts
// Mevcut açılır pencereyi açan sayfadaki bir bloğa erişim
const pageBlock = ctx.getModel('page-block-uid', true);
if (pageBlock) {
  pageBlock.rerender?.();
}
```

### Modeller arası okuma/yazma ve rerender tetikleme

```ts
const target = ctx.getModel('other-block-uid');
if (target) {
  target.setProps({ loading: true });
  target.rerender?.();
}
```

### Güvenlik kontrolü

```ts
const model = ctx.getModel(someUid);
if (!model) {
  ctx.message.warning('Hedef model mevcut değil');
  return;
}
```

## İlgili Konular

- [ctx.model](./model.md): Mevcut yürütme bağlamının bulunduğu model.
- [ctx.blockModel](./block-model.md): Mevcut JS'nin bulunduğu üst blok modeli; genellikle `getModel` gerekmeden erişilebilir.