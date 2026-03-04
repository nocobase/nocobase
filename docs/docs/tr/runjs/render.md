:::tip{title="AI Çeviri Bildirimi"}
Bu belge yapay zeka tarafından çevrilmiştir. Doğru bilgi için [İngilizce sürüme](/runjs/render) bakın.
:::

# Konteyner İçinde Render Etme

İçeriği mevcut konteynere (`ctx.element`) render etmek için `ctx.render()` işlevini kullanın. Aşağıdaki üç biçimi destekler:

## `ctx.render()`

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

## JSX Açıklaması

RunJS, JSX'i doğrudan render edebilir. Yerleşik React/bileşen kütüphanelerini kullanabilir veya harici bağımlılıkları isteğe bağlı olarak yükleyebilirsiniz.

### Yerleşik React ve Bileşen Kütüphanelerini Kullanma

```jsx
const { Button } = ctx.libs.antd;

ctx.render(<Button>Click</Button>);
```

### Harici React ve Bileşen Kütüphanelerini Kullanma

`ctx.importAsync()` aracılığıyla belirli sürümleri isteğe bağlı olarak yükleyin:

```jsx
const React = await ctx.importAsync('react@19.2.4');
const { Button } = await ctx.importAsync('antd@6.2.2?bundle');

ctx.render(<Button>Click</Button>);
```

Belirli sürümlerin veya üçüncü taraf bileşenlerin gerekli olduğu senaryolar için uygundur.

## ctx.element

Önerilmeyen kullanım (kullanımdan kaldırıldı):

```js
ctx.element.innerHTML = '<h1>Hello World</h1>';
```

Önerilen yöntem:

```js
ctx.render(<h1>Hello World</h1>);
```