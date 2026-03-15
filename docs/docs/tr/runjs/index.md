:::tip{title="AI Çeviri Bildirimi"}
Bu belge yapay zeka tarafından çevrilmiştir. Doğru bilgi için [İngilizce sürüme](/runjs/index) bakın.
:::

# RunJS Genel Bakış

RunJS; **JS Blokları**, **JS Alanları** ve **JS İşlemleri** gibi senaryolar için NocoBase'de kullanılan JavaScript yürütme ortamıdır. Kod, kısıtlı bir korumalı alanda (sandbox) çalışır, `ctx` (Bağlam API'si) öğesine güvenli erişim sağlar ve aşağıdaki yeteneklere sahiptir:

- Üst düzey `await` (Top-level `await`)
- Harici modülleri içe aktarma
- Konteynır içinde render etme
- Küresel değişkenler

## Üst düzey await (Top-level await)

RunJS, üst düzey `await` kullanımını destekler; kodun bir IIFE içine sarılmasına gerek yoktur.

**Önerilmez**

```jsx
async function test() {}
(async () => {
  await test();
})();
```

**Önerilir**

```js
async function test() {}
await test();
```

## Harici Modülleri İçe Aktarma

- ESM modülleri için `ctx.importAsync()` kullanın (Önerilir)
- UMD/AMD modülleri için `ctx.requireAsync()` kullanın

## Konteynır İçinde Render Etme

İçeriği mevcut konteynıra (`ctx.element`) render etmek için `ctx.render()` işlevini kullanın. Aşağıdaki üç formatı destekler:

### JSX Render Etme

```jsx
ctx.render(<button>Button</button>);
```

### DOM Düğümlerini Render Etme

```js
const div = document.createElement('div');
div.innerHTML = 'Hello World';

ctx.render(div);
```

### HTML Dizelerini Render Etme

```js
ctx.render('<h1>Hello World</h1>');
```

## Küresel Değişkenler

- `window`
- `document`
- `navigator`
- `ctx`