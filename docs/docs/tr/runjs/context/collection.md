:::tip{title="AI Çeviri Bildirimi"}
Bu belge yapay zeka tarafından çevrilmiştir. Doğru bilgi için [İngilizce sürüme](/runjs/context/collection) bakın.
:::

# ctx.collection

Mevcut RunJS yürütme bağlamıyla ilişkili koleksiyon (Collection) örneğidir; koleksiyon meta verilerine, alan tanımlarına, birincil anahtarlara ve diğer yapılandırmalara erişmek için kullanılır. Genellikle `ctx.blockModel.collection` veya `ctx.collectionField?.collection` üzerinden gelir.

## Uygulama Senaryoları

| Senaryo | Açıklama |
|------|------|
| **JSBlock** | Bloğa bağlı koleksiyon; `name`, `getFields`, `filterTargetKey` vb. özelliklere erişebilir. |
| **JSField / JSItem / JSColumn** | Mevcut alanın ait olduğu koleksiyon (veya üst blok koleksiyonu); alan listelerini, birincil anahtarları vb. almak için kullanılır. |
| **Tablo Sütunu / Detay Bloğu** | Koleksiyon yapısına göre işleme (rendering) yapmak veya açılır pencereleri açarken `filterByTk` parametresini iletmek için kullanılır. |

> Not: `ctx.collection`, bir veri bloğu, form bloğu veya tablo bloğunun bir koleksiyona bağlı olduğu senaryolarda kullanılabilir. Bir koleksiyona bağlı olmayan bağımsız bir JSBlock içinde `null` olabilir; kullanmadan önce boş değer kontrolü yapmanız önerilir.

## Tür Tanımı

```ts
collection: Collection | null | undefined;
```

## Yaygın Özellikler

| Özellik | Tür | Açıklama |
|------|------|------|
| `name` | `string` | Koleksiyon adı (ör. `users`, `orders`) |
| `title` | `string` | Koleksiyon başlığı (uluslararasılaştırma dahil) |
| `filterTargetKey` | `string \| string[]` | Birincil anahtar alan adı, `filterByTk` ve `getFilterByTK` için kullanılır |
| `dataSourceKey` | `string` | Veri kaynağı anahtarı (ör. `main`) |
| `dataSource` | `DataSource` | Ait olduğu veri kaynağı örneği |
| `template` | `string` | Koleksiyon şablonu (ör. `general`, `file`, `tree`) |
| `titleableFields` | `CollectionField[]` | Başlık olarak görüntülenebilen alanların listesi |
| `titleCollectionField` | `CollectionField` | Başlık alanı örneği |

## Yaygın Yöntemler

| Yöntem | Açıklama |
|------|------|
| `getFields(): CollectionField[]` | Tüm alanları getirir (kalıtım yoluyla alınanlar dahil) |
| `getField(name: string): CollectionField \| undefined` | Alan adına göre tek bir alan getirir |
| `getFieldByPath(path: string): CollectionField \| undefined` | Yola göre alan getirir (ilişkileri destekler, ör. `user.name`) |
| `getAssociationFields(types?): CollectionField[]` | İlişki alanlarını getirir; `types` parametresi `['one']`, `['many']` vb. olabilir |
| `getFilterByTK(record): any` | Bir kayıttan birincil anahtar değerini ayıklar, API'nin `filterByTk` parametresi için kullanılır |

## ctx.collectionField ve ctx.blockModel ile İlişkisi

| Gereksinim | Önerilen Kullanım |
|------|----------|
| **Mevcut bağlamla ilişkili koleksiyon** | `ctx.collection` (`ctx.blockModel?.collection` veya `ctx.collectionField?.collection` ile eşdeğerdir) |
| **Mevcut alanın koleksiyon tanımı** | `ctx.collectionField?.collection` (alanın ait olduğu koleksiyon) |
| **İlişkili hedef koleksiyon** | `ctx.collectionField?.targetCollection` (bir ilişki alanının hedef koleksiyonu) |

Alt tablolar gibi senaryolarda `ctx.collection`, ilişkili hedef koleksiyon olabilir; standart formlarda veya tablolarda ise genellikle bloğa bağlı koleksiyondur.

## Örnekler

### Birincil Anahtarı Alın ve Açılır Pencereyi Açın

```ts
const primaryKey = ctx.collection?.filterTargetKey ?? 'id';
await ctx.openView(popupUid, {
  mode: 'dialog',
  params: {
    filterByTk: ctx.record?.[primaryKey],
    record: ctx.record,
  },
});
```

### Doğrulama veya Etkileşim İçin Alanları Döngüye Alın

```ts
const fields = ctx.collection?.getFields() ?? [];
const requiredFields = fields.filter((f) => f.options?.required);
for (const f of requiredFields) {
  const v = ctx.form?.getFieldValue(f.name);
  if (v == null || v === '') {
    ctx.message.warning(`${f.title} gerekli`);
    return;
  }
}
```

### İlişki Alanlarını Alın

```ts
const oneToMany = ctx.collection?.getAssociationFields(['many']) ?? [];
// Alt tablolar, ilişkili kaynaklar vb. oluşturmak için kullanılır
```

## Dikkat Edilmesi Gerekenler

- `filterTargetKey`, koleksiyonun birincil anahtar alan adıdır; bazı koleksiyonlar bileşik birincil anahtarlar için `string[]` kullanabilir. Yapılandırılmadığında genellikle varsayılan olarak `'id'` kullanılır.
- **Alt tablolar veya ilişki alanları** gibi senaryolarda `ctx.collection`, `ctx.blockModel.collection`'dan farklı olarak ilişkili hedef koleksiyonu işaret edebilir.
- `getFields()`, kalıtım alınan koleksiyonlardaki alanları birleştirir; yerel alanlar, aynı ada sahip kalıtım alınan alanların üzerine yazar.

## İlgili Konular

- [ctx.collectionField](./collection-field.md): Mevcut alanın koleksiyon alanı tanımı
- [ctx.blockModel](./block-model.md): `collection` içeren, mevcut JS'yi barındıran üst blok
- [ctx.model](./model.md): `collection` içerebilen mevcut model