:::tip{title="AI Çeviri Bildirimi"}
Bu belge yapay zeka tarafından çevrilmiştir. Doğru bilgi için [İngilizce sürüme](/runjs/context/element) bakın.
:::

# ctx.element

`ctx.render()` için varsayılan işleme hedefi olarak hizmet eden ve sandbox DOM kapsayıcısını işaret eden bir `ElementProxy` örneğidir. `JSBlock`, `JSField`, `JSItem` ve `JSColumn` gibi bir işleme kapsayıcısının bulunduğu senaryolarda kullanılabilir.

## Uygulama Senaryoları

| Senaryo | Açıklama |
|------|------|
| **JSBlock** | Bloğun DOM kapsayıcısıdır; özel blok içeriğini işlemek için kullanılır. |
| **JSField / JSItem / FormJSFieldItem** | Bir alanın veya form öğesinin işleme kapsayıcısıdır (genellikle bir `<span>`). |
| **JSColumn** | Bir tablo hücresinin DOM kapsayıcısıdır; özel sütun içeriğini işlemek için kullanılır. |

> Not: `ctx.element` yalnızca bir işleme kapsayıcısına sahip RunJS bağlamlarında kullanılabilir. UI içermeyen bağlamlarda (saf arka uç mantığı gibi) `undefined` olabilir. Kullanmadan önce boş değer kontrolü yapılması önerilir.

## Tür Tanımı

```typescript
element: ElementProxy | undefined;

// ElementProxy, ham HTMLElement için güvenli bir API sunan bir vekildir (proxy)
class ElementProxy {
  __el: HTMLElement;  // Dahili ham DOM öğesi (yalnızca belirli senaryolarda erişilebilir)
  innerHTML: string;  // Okuma/yazma sırasında DOMPurify aracılığıyla temizlenir
  outerHTML: string; // Yukarıdakiyle aynı
  appendChild(child: HTMLElement | string): void;
  // Diğer HTMLElement yöntemleri doğrudan aktarılır (doğrudan kullanım önerilmez)
}
```

## Güvenlik Gereksinimleri

**Önerilen: Tüm işleme (rendering) işlemleri `ctx.render()` üzerinden gerçekleştirilmelidir.** `ctx.element`'in DOM API'lerini (örneğin `innerHTML`, `appendChild`, `querySelector` vb.) doğrudan kullanmaktan kaçının.

### Neden ctx.render() Önerilir?

| Avantaj | Açıklama |
|------|------|
| **Güvenlik** | XSS ve uygunsuz DOM işlemlerini önlemek için merkezi güvenlik kontrolü sağlar. |
| **React Desteği** | JSX, React bileşenleri ve yaşam döngüleri için tam destek sunar. |
| **Bağlam Kalıtımı** | Uygulamanın `ConfigProvider`, temaları vb. özelliklerini otomatik olarak devralır. |
| **Çakışma Yönetimi** | Çoklu örnek çakışmalarını önlemek için React kök (root) oluşturma/kaldırma işlemlerini otomatik olarak yönetir. |

### ❌ Önerilmez: ctx.element'in Doğrudan Manipülasyonu

```ts
// ❌ Önerilmez: ctx.element API'lerini doğrudan kullanmak
ctx.element.innerHTML = '<div>İçerik</div>';
ctx.element.appendChild(node);
ctx.element.querySelector('.class');
```

> `ctx.element.innerHTML` kullanımı artık desteklenmemektedir. Lütfen bunun yerine `ctx.render()` kullanın.

### ✅ Önerilen: ctx.render() Kullanımı

```ts
// ✅ Bir React bileşenini işleme
const { Button, Card } = ctx.libs.antd;
ctx.render(
  <Card title={ctx.t('Hoş Geldiniz')}>
    <Button type="primary">Tıkla</Button>
  </Card>
);

// ✅ Bir HTML dizesini işleme
ctx.render('<div style="padding:16px;">' + ctx.t('İçerik') + '</div>');

// ✅ Bir DOM düğümünü işleme
const div = document.createElement('div');
div.textContent = ctx.t('Merhaba');
ctx.render(div);
```

## Özel Durum: Popover Çıpası Olarak Kullanım

Mevcut öğeyi bir çıpa (anchor) olarak kullanarak bir Popover açmanız gerektiğinde, ham DOM'u `target` olarak almak için `ctx.element?.__el` özelliğine erişebilirsiniz:

```ts
// ctx.viewer.popover, hedef (target) olarak ham bir DOM öğesi gerektirir
await ctx.viewer.popover({
  target: ctx.element?.__el,
  content: <div>Açılır İçerik</div>,
});
```

> `__el` özelliğini yalnızca "mevcut kapsayıcıyı bir çıpa olarak kullanma" gibi senaryolarda kullanın; diğer durumlarda DOM'u doğrudan manipüle etmeyin.

## ctx.render ile İlişkisi

- `ctx.render(vnode)` bir `container` bağımsız değişkeni olmadan çağrılırsa, varsayılan olarak `ctx.element` kapsayıcısına işlenir.
- Hem `ctx.element` eksikse hem de bir `container` sağlanmamışsa bir hata fırlatılır.
- Açıkça bir kapsayıcı belirtebilirsiniz: `ctx.render(vnode, customContainer)`.

## Dikkat Edilmesi Gerekenler

- `ctx.element`, `ctx.render()` tarafından dahili kullanım için tasarlanmıştır. Özelliklerine veya yöntemlerine doğrudan erişilmesi veya bunların değiştirilmesi önerilmez.
- İşleme kapsayıcısı olmayan bağlamlarda `ctx.element`, `undefined` olacaktır. `ctx.render()` işlevini çağırmadan önce kapsayıcının mevcut olduğundan emin olun veya manuel olarak bir `container` geçirin.
- `ElementProxy` içindeki `innerHTML`/`outerHTML` her ne kadar `DOMPurify` ile temizlense de, birleşik işleme yönetimi için hala `ctx.render()` kullanılması önerilir.

## İlgili Konular

- [ctx.render](./render.md): İçeriği bir kapsayıcıya işleme
- [ctx.view](./view.md): Mevcut görünüm denetleyicisi
- [ctx.modal](./modal.md): Modallar için kısayol API'si