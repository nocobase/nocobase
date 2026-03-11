:::tip{title="AI Çeviri Bildirimi"}
Bu belge yapay zeka tarafından çevrilmiştir. Doğru bilgi için [İngilizce sürüme](/runjs/context/libs) bakın.
:::

# ctx.libs

`ctx.libs`, RunJS içindeki yerleşik kütüphaneler için birleştirilmiş ad alanıdır (namespace); React, Ant Design, dayjs ve lodash gibi yaygın kullanılan kütüphaneleri içerir. **`import` veya asenkron yükleme gerekmez**; doğrudan `ctx.libs.xxx` üzerinden kullanılabilirler.

## Kullanım Senaryoları

| Senaryo | Açıklama |
|------|------|
| **JSBlock / JSField / JSItem / JSColumn** | UI oluşturmak için React + Ant Design, tarih işleme için dayjs ve veri işleme için lodash kullanın. |
| **Formül / Hesaplama** | Excel benzeri formüller ve matematiksel ifade işlemleri için formula veya math kullanın. |
| **İş Akışı / Bağlantı Kuralları** | Saf mantık senaryolarında lodash, dayjs ve formula gibi yardımcı kütüphaneleri çağırın. |

## Yerleşik Kütüphanelere Genel Bakış

| Özellik | Açıklama | Dokümantasyon |
|------|------|------|
| `ctx.libs.React` | React çekirdeği, JSX ve Hook'lar için kullanılır | [React](https://react.dev/) |
| `ctx.libs.ReactDOM` | ReactDOM istemci API'si (`createRoot` dahil), oluşturma için React ile birlikte kullanılır | [React DOM](https://react.dev/reference/react-dom) |
| `ctx.libs.antd` | Ant Design bileşen kütüphanesi (Button, Card, Table, Form, Input, Modal vb.) | [Ant Design](https://ant.design/components/overview/) |
| `ctx.libs.antdIcons` | Ant Design ikon kütüphanesi (örneğin PlusOutlined, UserOutlined) | [@ant-design/icons](https://ant.design/components/icon/) |
| `ctx.libs.dayjs` | Tarih ve saat yardımcı kütüphanesi | [dayjs](https://day.js.org/) |
| `ctx.libs.lodash` | Yardımcı kütüphane (get, set, debounce vb.) | [Lodash](https://lodash.com/docs/) |
| `ctx.libs.formula` | Excel benzeri formül fonksiyon kütüphanesi (SUM, AVERAGE, IF vb.) | [Formula.js](https://formulajs.info/functions/) |
| `ctx.libs.math` | Matematiksel ifade ve hesaplama kütüphanesi | [Math.js](https://mathjs.org/docs/) |

## Üst Düzey Takma Adlar (Aliases)

Eski kodlarla uyumluluk için bazı kütüphaneler üst düzeyde de sunulmaktadır: `ctx.React`, `ctx.ReactDOM`, `ctx.antd` ve `ctx.dayjs`. Bakım kolaylığı ve dokümantasyon araması için **tutarlı bir şekilde `ctx.libs.xxx` kullanılması önerilir**.

## Tembel Yükleme (Lazy Loading)

`lodash`, `formula` ve `math` **tembel yükleme (lazy loading)** kullanır: Dinamik içe aktarma (import) yalnızca `ctx.libs.lodash` öğesine ilk kez erişildiğinde tetiklenir ve sonrasında önbellek (cache) yeniden kullanılır. `React`, `antd`, `dayjs` ve `antdIcons` bağlam tarafından önceden yapılandırılmıştır ve anında kullanılabilir durumdadır.

## Örnekler

### React ve Ant Design ile Oluşturma

```tsx
const { Button, Card } = ctx.libs.antd;

ctx.render(
  <Card title="Başlık">
    <Button type="primary">Tıkla</Button>
  </Card>
);
```

### Hook Kullanımı

```tsx
const { React } = ctx.libs;
const { useState } = React;
const { Button } = ctx.libs.antd;

const App = () => {
  const [count, setCount] = useState(0);
  return <Button onClick={() => setCount((c) => c + 1)}>{count}</Button>;
};
ctx.render(<App />);
```

### İkon Kullanımı

```tsx
const { Button } = ctx.libs.antd;
const { UserOutlined, HeartOutlined } = ctx.libs.antdIcons;

ctx.render(<Button icon={<UserOutlined />}>Kullanıcı</Button>);
```

### dayjs ile Tarih İşleme

```ts
const now = ctx.libs.dayjs();
const formatted = now.format('YYYY-MM-DD HH:mm:ss');
ctx.message.info(formatted);
```

### lodash Yardımcı Fonksiyonları

```ts
const user = { profile: { name: 'Alice' } };
const name = ctx.libs.lodash.get(user, 'profile.name', 'Unknown');
```

### Formül Hesaplamaları

```ts
const values = [1, 2, 3, 4];
const sum = ctx.libs.formula.SUM(values);
const avg = ctx.libs.formula.AVERAGE(values);
```

### math.js ile Matematiksel İfadeler

```ts
const result = ctx.libs.math.evaluate('2 + 3 * 4');
// result === 14
```

## Dikkat Edilmesi Gerekenler

- **ctx.importAsync ile Karıştırma**: Eğer `ctx.importAsync('react@19')` aracılığıyla harici bir React yüklendiyse, JSX bu örneği kullanacaktır. Bu durumda, bunu `ctx.libs.antd` ile **karıştırmayın**. Ant Design, o React sürümüyle eşleşecek şekilde yüklenmelidir (örneğin `ctx.importAsync('antd@5.x')`, `ctx.importAsync('@ant-design/icons@5.x')`).
- **Birden Fazla React Örneği**: "Invalid hook call" hatası oluşursa veya hook dispatcher null ise, bu genellikle birden fazla React örneğinden kaynaklanır. `ctx.libs.React` okumadan veya Hook'ları çağırmadan önce, sayfa ile aynı React örneğinin paylaşıldığından emin olmak için önce `await ctx.importAsync('react@sürüm')` komutunu çalıştırın.

## İlgili

- [ctx.importAsync()](./import-async.md) - İsteğe bağlı harici ESM modüllerini yükleyin (örneğin React veya Vue'nun belirli sürümleri)
- [ctx.render()](./render.md) - İçeriği bir kapsayıcıya aktarın