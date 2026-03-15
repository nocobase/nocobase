:::tip{title="AI Çeviri Bildirimi"}
Bu belge yapay zeka tarafından çevrilmiştir. Doğru bilgi için [İngilizce sürüme](/runjs/jsx) bakın.
:::

# JSX

RunJS, React bileşenleri yazar gibi kod yazmanıza olanak tanıyan JSX sözdizimini destekler. JSX, çalıştırılmadan önce otomatik olarak derlenir.

## Derleme Açıklamaları

- JSX'i dönüştürmek için [sucrase](https://github.com/alangpierce/sucrase) kullanılır.
- JSX; `ctx.libs.React.createElement` ve `ctx.libs.React.Fragment` olarak derlenir.
- **React'i içe aktarmanıza (import) gerek yoktur**: JSX'i doğrudan yazabilirsiniz; derlemeden sonra otomatik olarak `ctx.libs.React` kullanılacaktır.
- `ctx.importAsync('react@x.x.x')` aracılığıyla harici bir React yüklendiğinde, JSX bu örneğin `createElement` yöntemini kullanacak şekilde değişecektir.

## Yerleşik React ve Bileşenlerin Kullanımı

RunJS, React ve yaygın UI kütüphanelerini yerleşik olarak içerir. Bunlara `import` kullanmadan doğrudan `ctx.libs` üzerinden erişebilirsiniz:

- **ctx.libs.React** — React çekirdeği
- **ctx.libs.ReactDOM** — ReactDOM (gerekirse `createRoot` ile kullanılabilir)
- **ctx.libs.antd** — Ant Design bileşenleri
- **ctx.libs.antdIcons** — Ant Design simgeleri

```tsx
const { Button } = ctx.libs.antd;

ctx.render(<Button>Tıkla</Button>);
```

Doğrudan JSX yazarken React'i destructure etmenize (ayrıştırmanıza) gerek yoktur. Sadece **Hooks** (`useState`, `useEffect` gibi) veya **Fragment** (`<>...</>`) kullanırken `ctx.libs` üzerinden ayrıştırma yapmanız gerekir:

```tsx
const { React } = ctx.libs;
const { useState } = React;

const Counter = () => {
  const [count, setCount] = useState(0);
  return <div>Sayaç: {count}</div>;
};

ctx.render(<Counter />);
```

**Not**: Yerleşik React ile `ctx.importAsync()` aracılığıyla içe aktarılan harici React **birlikte kullanılamaz**. Harici bir UI kütüphanesi kullanıyorsanız, React'in de aynı harici kaynaktan içe aktarılması gerekir.

## Harici React ve Bileşenlerin Kullanımı

`ctx.importAsync()` aracılığıyla belirli bir React sürümü ve UI kütüphaneleri yüklendiğinde, JSX bu React örneğini kullanacaktır:

```tsx
const React = await ctx.importAsync('react@19.2.4');
const { Button } = await ctx.importAsync('antd@6.2.2?bundle');

ctx.render(<Button>Tıkla</Button>);
```

Eğer antd, react/react-dom'a bağımlıysa, birden fazla örneği önlemek için `deps` aracılığıyla aynı sürümü belirtebilirsiniz:

```tsx
const React = await ctx.importAsync('react@18.2.0');
const { Button } = await ctx.importAsync('antd@5.29.3?bundle&deps=react@18.2.0,react-dom@18.2.0');

ctx.render(<Button>Düğme</Button>);
```

**Not**: Harici React kullanırken, antd gibi UI kütüphanelerinin de `ctx.importAsync()` aracılığıyla içe aktarılması gerekir. Bunları `ctx.libs.antd` ile karıştırmayın.

## JSX Sözdizimi Önemli Noktalar

- **Bileşenler ve proplar**: `<Button type="primary">Metin</Button>`
- **Fragment**: `<>...</>` veya `<React.Fragment>...</React.Fragment>` (Fragment kullanırken `const { React } = ctx.libs` şeklinde ayrıştırma yapmanız gerekir)
- **İfadeler**: JSX içinde değişkenleri veya işlemleri eklemek için `{ifade}` kullanın, örneğin `{ctx.user.name}` veya `{count + 1}`; `{{ }}` şablon sözdizimini kullanmayın.
- **Koşullu İşleme**: `{flag && <span>İçerik</span>}` veya `{flag ? <A /> : <B />}`
- **Liste İşleme**: Öğe listesi döndürmek için `array.map()` kullanın ve her öğe için sabit bir `key` belirleyin.

```tsx
const { React } = ctx.libs;
const items = ['a', 'b', 'c'];

ctx.render(
  <ul>
    {items.map((item, i) => (
      <li key={i}>{item}</li>
    ))}
  </ul>
);
```