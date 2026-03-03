:::tip{title="AI Çeviri Bildirimi"}
Bu belge yapay zeka tarafından çevrilmiştir. Doğru bilgi için [İngilizce sürüme](/runjs/context/render) bakın.
:::

# ctx.render()

React öğelerini, HTML dizelerini veya DOM düğümlerini belirtilen bir kapsayıcıya (container) işler. `container` sağlanmazsa, varsayılan olarak `ctx.element` içine işleme yapar ve uygulamanın ConfigProvider, temalar gibi bağlamlarını (context) otomatik olarak devralır.

## Uygulama Senaryoları

| Senaryo | Açıklama |
|------|------|
| **JSBlock** | Blok özel içeriğini işleme (grafikler, listeler, kartlar vb.) |
| **JSField / JSItem / JSColumn** | Düzenlenebilir alanlar veya tablo sütunları için özel görünümler işleme |
| **Detay Bloğu** | Detay sayfalarındaki alanların görüntüleme biçimini özelleştirme |

> Not: `ctx.render()` bir işleme kapsayıcısı gerektirir. Eğer `container` iletilmezse ve `ctx.element` mevcut değilse (örneğin, kullanıcı arayüzü olmayan saf mantık senaryolarında), bir hata fırlatılır.

## Tür Tanımı

```ts
render(
  vnode: React.ReactElement | Node | DocumentFragment | string,
  container?: Element | DocumentFragment
): ReactDOMClient.Root | null;
```

| Parametre | Tür | Açıklama |
|------|------|------|
| `vnode` | `React.ReactElement` \| `Node` \| `DocumentFragment` \| `string` | İşlenecek içerik |
| `container` | `Element` \| `DocumentFragment` (Opsiyonel) | Hedef işleme kapsayıcısı, varsayılan `ctx.element` |

**Dönüş Değeri**:

- Bir **React öğesi** işlenirken: Sonraki güncellemeler için `root.render()` çağrısını kolaylaştırmak amacıyla `ReactDOMClient.Root` döndürür.
- Bir **HTML dizesi** veya **DOM düğümü** işlenirken: `null` döndürür.

## vnode Türü Açıklaması

| Tür | Davranış |
|------|------|
| `React.ReactElement` (JSX) | React'in `createRoot` yöntemi kullanılarak işlenir; tam React yetenekleri sağlar ve uygulama bağlamını otomatik olarak devralır. |
| `string` | DOMPurify ile temizlendikten sonra kapsayıcının `innerHTML` değerini ayarlar; mevcut herhangi bir React kökü önce kaldırılır (unmount). |
| `Node` (Element, Text vb.) | Kapsayıcı temizlendikten sonra `appendChild` ile eklenir; mevcut herhangi bir React kökü önce kaldırılır. |
| `DocumentFragment` | Parça alt düğümlerini kapsayıcıya ekler; mevcut herhangi bir React kökü önce kaldırılır. |

## Örnekler

### React Öğelerini İşleme (JSX)

```tsx
const { Button, Card } = ctx.libs.antd;

ctx.render(
  <Card title={ctx.t('Başlık')}>
    <Button type="primary" onClick={() => ctx.message.success(ctx.t('Tıklandı'))}>
      {ctx.t('Buton')}
    </Button>
  </Card>
);
```

### HTML Dizelerini İşleme

```ts
ctx.render('<h1>Merhaba Dünya</h1>');

// Uluslararasılaştırma için ctx.t ile birleştirme
ctx.render('<div style="padding:16px">' + ctx.t('İçerik') + '</div>');

// Koşullu işleme
ctx.render(hasData ? `<ul>${items.map(i => `<li>${i}</li>`).join('')}</ul>` : '<span style="color:#999">' + ctx.t('Veri yok') + '</span>');
```

### DOM Düğümlerini İşleme

```ts
const div = document.createElement('div');
div.textContent = 'Merhaba Dünya';
ctx.render(div);

// Önce boş bir kapsayıcı işleyip, ardından başlatma için üçüncü taraf bir kütüphaneye (örneğin ECharts) devretme
const container = document.createElement('div');
container.style.width = '100%';
container.style.height = '400px';
ctx.render(container);
const chart = echarts.init(container);
chart.setOption({ ... });
```

### Özel Bir Kapsayıcı Belirtme

```ts
// Belirli bir DOM öğesine işleme
const customEl = document.getElementById('my-container');
ctx.render(<div>İçerik</div>, customEl);
```

### Çoklu Çağrılar İçeriği Değiştirir

```ts
// İkinci çağrı, kapsayıcıdaki mevcut içeriğin yerini alacaktır
ctx.render(<div>Birinci</div>);
ctx.render(<div>İkinci</div>);  // Sadece "İkinci" görüntülenecektir
```

## Dikkat Edilmesi Gerekenler

- **Çoklu çağrılar içeriği değiştirir**: Her `ctx.render()` çağrısı, kapsayıcıdaki mevcut içeriği eklemek yerine onunla değiştirir.
- **HTML dizesi güvenliği**: İletilen HTML, XSS risklerini azaltmak için DOMPurify aracılığıyla temizlenir; ancak yine de güvenilmeyen kullanıcı girişlerini birleştirmekten kaçınmanız önerilir.
- **ctx.element'i doğrudan değiştirmeyin**: `ctx.element.innerHTML` kullanımı artık önerilmemektedir (deprecated); bunun yerine tutarlı bir şekilde `ctx.render()` kullanılmalıdır.
- **Varsayılan olmadığında kapsayıcıyı iletin**: `ctx.element` değerinin `undefined` olduğu senaryolarda (örneğin, `ctx.importAsync` ile yüklenen modüllerde), bir `container` açıkça sağlanmalıdır.

## İlgili Konular

- [ctx.element](./element.md) - Varsayılan işleme kapsayıcısı, `ctx.render()`'a kapsayıcı iletilmediğinde kullanılır.
- [ctx.libs](./libs.md) - JSX işleme için kullanılan React ve Ant Design gibi yerleşik kütüphaneler.
- [ctx.importAsync()](./import-async.md) - Harici React/bileşen kütüphanelerini isteğe bağlı olarak yükledikten sonra `ctx.render()` ile birlikte kullanılır.