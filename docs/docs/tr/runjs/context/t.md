:::tip{title="AI Çeviri Bildirimi"}
Bu belge yapay zeka tarafından çevrilmiştir. Doğru bilgi için [İngilizce sürüme](/runjs/context/t) bakın.
:::

# ctx.t()

RunJS'de, geçerli bağlamın dil ayarlarına göre metinleri çevirmek için kullanılan bir i18n kısayol fonksiyonudur. Butonlar, başlıklar ve ipuçları gibi satır içi metinlerin uluslararasılaştırılması için uygundur.

## Kullanım Senaryoları

`ctx.t()` tüm RunJS yürütme ortamlarında kullanılabilir.

## Tip Tanımı

```ts
t(key: string, options?: Record<string, any>): string
```

## Parametreler

| Parametre | Tip | Açıklama |
|-----------|------|-------------|
| `key` | `string` | Çeviri anahtarı veya yer tutucu içeren şablon (örneğin `Merhaba {{name}}`, `{{count}} satır`). |
| `options` | `object` | İsteğe bağlı. İnterpolasyon değişkenleri (örneğin `{ name: 'Ahmet', count: 5 }`) veya i18n seçenekleri (örneğin `defaultValue`, `ns`). |

## Dönüş Değeri

- Çevrilmiş dizeyi döndürür. Anahtar için bir çeviri mevcut değilse ve `defaultValue` sağlanmamışsa, anahtarın kendisini veya interpolasyon uygulanmış dizeyi döndürebilir.

## Ad Alanı (ns)

RunJS ortamı için **varsayılan ad alanı `runjs`'dir**. Bir `ns` belirtilmediğinde, `ctx.t(key)` anahtarı `runjs` ad alanında arar.

```ts
// Varsayılan olarak 'runjs' ad alanından anahtarı arar
ctx.t('Submit'); // ctx.t('Submit', { ns: 'runjs' }) ile eşdeğerdir

// Belirli bir ad alanından anahtarı arar
ctx.t('Submit', { ns: 'myModule' });

// Birden fazla ad alanını sırayla arar (önce 'runjs', sonra 'common')
ctx.t('Save', { ns: ['runjs', 'common'] });
```

## Örnekler

### Basit Anahtar

```ts
ctx.t('Submit');
ctx.t('No data');
```

### İnterpolasyon Değişkenleri ile

```ts
const text = ctx.t('Hello {{name}}', { name: ctx.user?.nickname || 'Guest' });
ctx.render(`<div>${text}</div>`);
```

```ts
ctx.message.success(ctx.t('Processed {{count}} rows', { count: rows.length }));
```

### Dinamik Metinler (örneğin Göreceli Zaman)

```ts
if (minutes < 60) return ctx.t('{{count}} minutes ago', { count: minutes });
if (hours < 24) return ctx.t('{{count}} hours ago', { count: hours });
```

### Ad Alanı Belirtme

```ts
ctx.t('Hello {{name}}', { name: 'Guest', ns: 'myModule' });
```

## Notlar

- **Yerelleştirme Eklentisi**: Metinleri çevirmek için önce Yerelleştirme eklentisinin etkinleştirilmesi gerekir. Eksik çeviri anahtarları, merkezi yönetim ve çeviri kolaylığı için otomatik olarak yerelleştirme yönetim listesine aktarılacaktır.
- i18next tarzı interpolasyonu destekler: Anahtar içinde `{{degiskenAdi}}` kullanın ve değiştirmek için `options` içinde ilgili değişkeni gönderin.
- Dil, geçerli bağlam (örneğin `ctx.i18n.language`, kullanıcı yerel ayarı) tarafından belirlenir.

## İlgili

- [ctx.i18n](./i18n.md): Dili okuyun veya değiştirin