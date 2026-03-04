:::tip{title="AI Çeviri Bildirimi"}
Bu belge yapay zeka tarafından çevrilmiştir. Doğru bilgi için [İngilizce sürüme](/runjs/context/model) bakın.
:::

# ctx.model

Mevcut RunJS yürütme bağlamının (execution context) bulunduğu `FlowModel` örneğidir; JSBlock, JSField, JSAction gibi senaryolar için varsayılan giriş noktasıdır. Belirli tür, bağlama göre değişir: `BlockModel`, `ActionModel`, `JSEditableFieldModel` gibi alt sınıflar olabilir.

## Uygulama Senaryoları

| Senaryo | Açıklama |
|------|------|
| **JSBlock** | `ctx.model` mevcut blok modelidir; `resource`, `collection`, `setProps` vb. öğelere erişebilir. |
| **JSField / JSItem / JSColumn** | `ctx.model` alan modelidir; `setProps`, `dispatchEvent` vb. öğelere erişebilir. |
| **İşlem Olayları / ActionModel** | `ctx.model` işlem modelidir; adım parametrelerini okuyup yazabilir, olayları tetikleyebilir (dispatch) vb. |

> İpucu: Mevcut JS'yi barındıran **üst bloğa** (örneğin Form veya Tablo bloğu) erişmeniz gerekiyorsa `ctx.blockModel` kullanın; **diğer modellere** erişmeniz gerekiyorsa `ctx.getModel(uid)` kullanın.

## Tür Tanımı

```ts
model: FlowModel;
```

`FlowModel` temel sınıftır; çalışma zamanında çeşitli alt sınıfların (örneğin `BlockModel`, `FormBlockModel`, `TableBlockModel`, `JSEditableFieldModel`, `ActionModel` vb.) bir örneğidir. Kullanılabilir özellikler ve yöntemler türe göre değişiklik gösterir.

## Yaygın Özellikler

| Özellik | Tür | Açıklama |
|------|------|------|
| `uid` | `string` | Modelin benzersiz kimliği; `ctx.getModel(uid)` veya açılır pencere (popup) UID bağlama için kullanılabilir. |
| `collection` | `Collection` | Mevcut modele bağlı koleksiyon (blok veya alan veriye bağlı olduğunda mevcuttur). |
| `resource` | `Resource` | Yenileme, seçili satırları alma vb. işlemler için kullanılan ilişkili kaynak örneği. |
| `props` | `object` | Modelin kullanıcı arayüzü (UI) veya davranış yapılandırması; `setProps` ile güncellenebilir. |
| `subModels` | `Record<string, FlowModel>` | Alt model koleksiyonu (örneğin form içindeki alanlar, tablo içindeki sütunlar). |
| `parent` | `FlowModel` | Üst model (varsa). |

## Yaygın Yöntemler

| Yöntem | Açıklama |
|------|------|
| `setProps(partialProps: any): void` | Model yapılandırmasını günceller ve yeniden oluşturmayı (re-rendering) tetikler (örneğin `ctx.model.setProps({ loading: true })`). |
| `dispatchEvent(eventName: string, payload?: any, options?: any): Promise<any[]>` | Modele bir olay gönderir ve bu model üzerinde yapılandırılmış, bu olay adını dinleyen iş akışlarını tetikler. İsteğe bağlı `payload` iş akışı işleyicisine (handler) iletilir; `options.debounce` ile anti-bounce (titreşim engelleme) etkinleştirilebilir. |
| `getStepParams?.(flowKey, stepKey)` | Yapılandırma akışı adım parametrelerini okur (ayarlar paneli, özel işlemler vb. senaryolarda). |
| `setStepParams?.(flowKey, stepKey, params)` | Yapılandırma akışı adım parametrelerini yazar. |

## ctx.blockModel ve ctx.getModel ile İlişkisi

| İhtiyaç | Önerilen Kullanım |
|------|----------|
| **Mevcut yürütme bağlamındaki model** | `ctx.model` |
| **Mevcut JS'nin bulunduğu üst blok** | `ctx.blockModel`; genellikle `resource`, `form` veya `collection` erişimi için kullanılır. |
| **UID ile herhangi bir modeli alma** | `ctx.getModel(uid)` veya `ctx.getModel(uid, true)` (görünüm yığınları arasında arama yapar). |

Bir JSField içinde `ctx.model` alan modelidir, `ctx.blockModel` ise bu alanı barındıran Form veya Tablo bloğudur.

## Örnekler

### Blok veya İşlem Durumunu Güncelleme

```ts
ctx.model.setProps({ loading: true });
await doSomething();
ctx.model.setProps({ loading: false });
```

### Model Olaylarını Tetikleme (Dispatching)

```ts
// Bir olay göndererek, bu model üzerinde yapılandırılmış ve bu olay adını dinleyen iş akışını tetikler
await ctx.model.dispatchEvent('remove');

// Bir payload sağlandığında, bu veri iş akışı işleyicisinin ctx.inputArgs kısmına iletilir
await ctx.model.dispatchEvent('customEvent', { id: 123 });
```

### Açılır Pencere Bağlama veya Modeller Arası Erişim için UID Kullanımı

```ts
const myUid = ctx.model.uid;
// Açılır pencere yapılandırmasında, ilişkilendirme için openerUid: myUid iletilebilir
const other = ctx.getModel('other-block-uid');
if (other) other.rerender?.();
```

## İlgili

- [ctx.blockModel](./block-model.md): Mevcut JS'nin bulunduğu üst blok modeli
- [ctx.getModel()](./get-model.md): UID ile diğer modelleri alma