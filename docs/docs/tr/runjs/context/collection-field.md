:::tip{title="AI Çeviri Bildirimi"}
Bu belge yapay zeka tarafından çevrilmiştir. Doğru bilgi için [İngilizce sürüme](/runjs/context/collection-field) bakın.
:::

# ctx.collectionField

Mevcut RunJS yürütme bağlamıyla ilişkili `CollectionField` (koleksiyon alanı) örneğidir; alan meta verilerine, türlerine, doğrulama kurallarına ve ilişki bilgilerine erişmek için kullanılır. Yalnızca alan bir koleksiyon tanımına bağlı olduğunda mevcuttur; özel/sanal alanlar `null` olabilir.

## Uygulama Senaryoları

| Senaryo | Açıklama |
|------|------|
| **JSField** | `interface`, `enum`, `targetCollection` vb. bilgilere dayanarak form alanlarında etkileşim veya doğrulama gerçekleştirme. |
| **JSItem** | Alt tablo öğelerinde mevcut sütuna karşılık gelen alanın meta verilerine erişme. |
| **JSColumn** | Tablo sütunlarında `collectionField.interface` değerine göre işleme (rendering) yöntemlerini seçme veya `targetCollection`'a erişme. |

> Not: `ctx.collectionField` yalnızca alan bir koleksiyon (Collection) tanımına bağlı olduğunda kullanılabilir; JSBlock bağımsız blokları veya alan bağlaması olmayan işlem olayları gibi senaryolarda genellikle `undefined` olur. Kullanmadan önce boş değer kontrolü yapılması önerilir.

## Tür Tanımı

```ts
collectionField: CollectionField | null | undefined;
```

## Yaygın Özellikler

| Özellik | Tür | Açıklama |
|------|------|------|
| `name` | `string` | Alan adı (örn. `status`, `userId`) |
| `title` | `string` | Alan başlığı (uluslararasılaştırma dahil) |
| `type` | `string` | Alan veri türü (`string`, `integer`, `belongsTo` vb.) |
| `interface` | `string` | Alan arayüz türü (`input`, `select`, `m2o`, `o2m`, `m2m` vb.) |
| `collection` | `Collection` | Alanın ait olduğu koleksiyon |
| `targetCollection` | `Collection` | İlişki alanının hedef koleksiyonu (yalnızca ilişki türleri için) |
| `target` | `string` | Hedef koleksiyon adı (ilişki alanları için) |
| `enum` | `array` | Numaralandırma seçenekleri (select, radio vb.) |
| `defaultValue` | `any` | Varsayılan değer |
| `collectionName` | `string` | Ait olduğu koleksiyonun adı |
| `foreignKey` | `string` | Yabancı anahtar alan adı (belongsTo vb.) |
| `sourceKey` | `string` | İlişki kaynak anahtarı (hasMany vb.) |
| `targetKey` | `string` | İlişki hedef anahtarı |
| `fullpath` | `string` | API veya değişken referansları için kullanılan tam yol (örn. `main.users.status`) |
| `resourceName` | `string` | Kaynak adı (örn. `users.status`) |
| `readonly` | `boolean` | Salt okunur olup olmadığı |
| `titleable` | `boolean` | Başlık olarak görüntülenip görüntülenemeyeceği |
| `validation` | `object` | Doğrulama kuralı yapılandırması |
| `uiSchema` | `object` | UI yapılandırması |
| `targetCollectionTitleField` | `CollectionField` | Hedef koleksiyonun başlık alanı (ilişki alanları için) |

## Yaygın Yöntemler

| Yöntem | Açıklama |
|------|------|
| `isAssociationField(): boolean` | Bir ilişki alanı (belongsTo, hasMany, hasOne, belongsToMany vb.) olup olmadığı. |
| `isRelationshipField(): boolean` | Bir ilişkisel alan (o2o, m2o, o2m, m2m vb. dahil) olup olmadığı. |
| `getComponentProps(): object` | Alan bileşeninin varsayılan proplarını (props) alır. |
| `getFields(): CollectionField[]` | Hedef koleksiyonun alan listesini alır (yalnızca ilişki alanları). |
| `getFilterOperators(): object[]` | Bu alan tarafından desteklenen filtre operatörlerini alır (örn. `$eq`, `$ne` vb.). |

## Örnekler

### Alan türüne göre dallanmış işleme (rendering)

```ts
if (!ctx.collectionField) return null;
const { interface: iface } = ctx.collectionField;
if (['m2o', 'o2m', 'm2m'].includes(iface)) {
  // İlişki alanı: ilişkili kayıtları göster
  const target = ctx.collectionField.targetCollection;
  // ...
} else if (iface === 'select' || iface === 'radioGroup') {
  const options = ctx.collectionField.enum || [];
  // ...
}
```

### İlişki alanı olup olmadığını belirleme ve hedef koleksiyona erişme

```ts
if (ctx.collectionField?.isAssociationField()) {
  const targetCol = ctx.collectionField.targetCollection;
  const titleField = targetCol?.titleCollectionField?.name;
  // Hedef koleksiyon yapısına göre işle
}
```

### Numaralandırma seçeneklerini alma

```ts
const options = ctx.collectionField?.enum ?? [];
const labels = options.map((o) => (typeof o === 'object' ? o.label : o));
```

### Salt okunur/görüntüleme moduna göre koşullu işleme

```ts
const { Input } = ctx.libs.antd;
if (ctx.collectionField?.readonly) {
  ctx.render(<span>{ctx.getValue?.() ?? '-'}</span>);
} else {
  ctx.render(<Input onChange={(e) => ctx.setValue?.(e.target.value)} />);
}
```

### Hedef koleksiyonun başlık alanını alma

```ts
// Bir ilişki alanı görüntülendiğinde, başlık alanı adını almak için targetCollectionTitleField kullanılabilir
const titleField = ctx.collectionField?.targetCollectionTitleField;
const titleKey = titleField?.name ?? 'title';
const assocValue = ctx.getValue?.() ?? ctx.record?.[ctx.collectionField?.name];
const label = assocValue?.[titleKey];
```

## ctx.collection ile İlişkisi

| İhtiyaç | Önerilen Kullanım |
|------|----------|
| **Mevcut alanın ait olduğu koleksiyon** | `ctx.collectionField?.collection` veya `ctx.collection` |
| **Alan meta verileri (ad, tür, arayüz, enum vb.)** | `ctx.collectionField` |
| **İlişki hedef koleksiyonu** | `ctx.collectionField?.targetCollection` |

`ctx.collection` genellikle mevcut bloğa bağlı koleksiyonu temsil eder; `ctx.collectionField` ise alanın koleksiyon içindeki tanımını temsil eder. Alt tablolar veya ilişki alanları gibi senaryolarda bu ikisi farklılık gösterebilir.

## Dikkat Edilmesi Gerekenler

- **JSBlock** veya **JSAction (alan bağlaması olmayan)** gibi senaryolarda `ctx.collectionField` genellikle `undefined` olur. Erişmeden önce isteğe bağlı zincirleme (optional chaining) kullanılması önerilir.
- Özel bir JS alanı bir koleksiyon alanına bağlı değilse, `ctx.collectionField` değeri `null` olabilir.
- `targetCollection` yalnızca ilişki türü alanlarda (örn. m2o, o2m, m2m) mevcuttur; `enum` yalnızca select veya radioGroup gibi seçenekleri olan alanlarda mevcuttur.

## İlgili Sayfalar

- [ctx.collection](./collection.md): Mevcut bağlamla ilişkili koleksiyon
- [ctx.model](./model.md): Mevcut yürütme bağlamının bulunduğu model
- [ctx.blockModel](./block-model.md): Mevcut JS'yi barındıran üst blok
- [ctx.getValue()](./get-value.md), [ctx.setValue()](./set-value.md): Mevcut alan değerini okuma ve yazma