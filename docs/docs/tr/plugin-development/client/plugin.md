:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Eklenti

NocoBase'de, **istemci eklentisi** (Client Plugin), ön uç işlevselliğini genişletmenin ve özelleştirmenin ana yoludur. `@nocobase/client` tarafından sağlanan `Plugin` temel sınıfını miras alarak, geliştiriciler farklı yaşam döngüsü aşamalarında mantık kaydedebilir, sayfa bileşenleri ekleyebilir, menüleri genişletebilir veya üçüncü taraf işlevselliğini entegre edebilirler.

## Eklenti Sınıf Yapısı

Temel bir istemci eklentisi yapısı aşağıdaki gibidir:

```ts
import { Plugin } from '@nocobase/client';

export class PluginHelloClient extends Plugin {
  async afterAdd() {
    // Eklenti eklendikten sonra çalışır
    console.log('Plugin added');
  }

  async beforeLoad() {
    // Eklenti yüklenmeden önce çalışır
    console.log('Before plugin load');
  }

  async load() {
    // Eklenti yüklendiğinde çalışır; rotaları, UI bileşenlerini vb. kaydeder
    console.log('Plugin loaded');
  }
}

export default PluginHelloClient;
```

## Yaşam Döngüsü Açıklaması

Her eklenti, tarayıcı yenilendiğinde veya uygulama başlatıldığında sırasıyla aşağıdaki yaşam döngüsü aşamalarından geçer:

| Yaşam Döngüsü Metodu | Çalışma Zamanı | Açıklama |
|--------------------|----------------|----------|
| **afterAdd()**     | Eklenti, eklenti yöneticisine eklendikten hemen sonra çalışır | Bu noktada eklenti örneği oluşturulmuştur, ancak tüm eklentilerin başlatılması tamamlanmamıştır. Yapılandırma okuma veya temel olayları bağlama gibi hafif başlatma işlemleri için uygundur. |
| **beforeLoad()**   | Tüm eklentilerin `load()` metodundan önce çalışır | Tüm etkin eklenti örneklerine (`this.app.pm.get()`) erişilebilir. Diğer eklentilere bağımlı hazırlık mantığını yürütmek için uygundur. |
| **load()**         | Eklenti yüklendiğinde çalışır | Tüm eklentilerin `beforeLoad()` metodu tamamlandıktan sonra bu metot çalıştırılır. Ön uç rotalarını, UI bileşenlerini ve diğer temel mantığı kaydetmek için uygundur. |

## Çalışma Sırası

Tarayıcı her yenilendiğinde, `afterAdd()` → `beforeLoad()` → `load()` sırasıyla çalıştırılır.

## Eklenti Bağlamı ve FlowEngine

NocoBase 2.0'dan itibaren, istemci tarafı genişletme API'leri ağırlıklı olarak **FlowEngine**'de yoğunlaşmıştır. Eklenti sınıfında, `this.engine` aracılığıyla motor örneğine erişebilirsiniz.

```ts
// load() metodunda motor bağlamına erişim
async load() {
  const { app, router, apiClient } = this.engine.context;
  console.log('Current app:', app);
}
```

Daha fazla bilgi için bakınız:  
- [FlowEngine](/flow-engine)  
- [Bağlam](./context.md)