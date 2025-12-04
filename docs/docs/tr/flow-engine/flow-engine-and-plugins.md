:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# FlowEngine ve Eklentiler Arasındaki İlişki

**FlowEngine** bir eklenti değildir; **çekirdek API** olarak eklentilerin kullanımına sunulur ve çekirdek yeteneklerle iş uzantılarını birbirine bağlar.
NocoBase 2.0'da tüm API'ler FlowEngine'de toplanmıştır ve eklentiler `this.engine` aracılığıyla FlowEngine'e erişebilir.

```ts
class PluginHello extends Plugin {
  async load() {
    this.engine.registerModels({ ... });
  }
}
```

## Context: Merkezi Olarak Yönetilen Global Yetenekler

FlowEngine, çeşitli senaryolar için gerekli API'leri bir araya getiren merkezi bir **Context** sağlar, örneğin:

```ts
class PluginHello extends Plugin {
  async load() {
    // Yönlendirici (router) uzantısı
    this.engine.context.router;

    // İstek gönderme
    this.engine.context.api.request();

    // Uluslararasılaştırma (i18n) ile ilgili
    this.engine.context.i18n;
    this.engine.context.t('Hello');
  }
}
```

> **Not**:
> Context, 2.0 sürümünde 1.x'ten gelen şu sorunları çözmüştür:
>
> * Dağınık context yapısı, tutarsız çağrılar
> * Farklı React render ağaçları arasında context kaybı
> * Yalnızca React bileşenleri içinde kullanılabilme
>
> Daha fazla ayrıntı için **FlowContext bölümüne** bakınız.

---

## Eklentilerdeki Kısayol Takma Adları

Çağrıları basitleştirmek için FlowEngine, eklenti örnekleri üzerinde bazı takma adlar sağlar:

* `this.context` → `this.engine.context` ile eşdeğerdir
* `this.router` → `this.engine.context.router` ile eşdeğerdir

## Örnek: Yönlendiriciyi Genişletme

```tsx pure
import { createMockClient, Plugin } from '@nocobase/client';

class PluginHelloModel extends Plugin {
  async afterAdd() {}
  async beforeLoad() {}
  async load() {
    this.router.add('root', {
      path: '/',
      element: <div>Hello</div>,
    });
  }
}

// Örnek ve test senaryoları için
const app = createMockClient({
  plugins: [PluginHelloModel],
});

export default app.getRootComponent();
```

Bu örnekte:

* Eklenti, `this.router.add` metodunu kullanarak `/` yolu için yönlendiriciyi genişletir;
* `createMockClient`, kolay gösterim ve test için temiz bir mock uygulama sağlar;
* `app.getRootComponent()` kök bileşeni döndürür ve doğrudan sayfaya monte edilebilir.