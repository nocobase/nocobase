:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Tepkisellik Mekanizması: Observable

:::info
NocoBase'in Observable tepkisellik mekanizması, özünde [MobX](https://mobx.js.org/README.html) ile benzerlik gösterir. Mevcut temel uygulama [@formily/reactive](https://github.com/alibaba/formily/tree/next/packages/reactive) kullanmaktadır ve sözdizimi ile konseptleri [MobX](https://mobx.js.org/README.html) ile oldukça uyumludur. Doğrudan [MobX](https://mobx.js.org/README.html) kullanılmamasının nedeni ise tarihsel sebeplerdir.
:::

NocoBase 2.0'da, `Observable` tepkisel nesneler her yerdedir. Temel veri akışının ve kullanıcı arayüzü (UI) tepkiselliğinin çekirdeğini oluşturur ve FlowContext, FlowModel, FlowStep gibi bileşenlerde yaygın olarak kullanılır.

## Neden Observable'ı Seçmelisiniz?

NocoBase'in Redux, Recoil, Zustand ve Jotai gibi diğer durum yönetimi çözümleri yerine Observable'ı tercih etmesinin başlıca nedenleri şunlardır:

- **Son Derece Esnek**: Observable, herhangi bir nesneyi, diziyi, Map'i, Set'i vb. tepkisel hale getirebilir. Derin iç içe geçmeyi ve dinamik yapıları doğal olarak destekler, bu da onu karmaşık iş modelleri için çok uygun kılar.
- **Müdahalesiz**: Orijinal nesneyi doğrudan manipüle edebilirsiniz; action'lar, reducer'lar veya ek store'lar tanımlamanıza gerek kalmaz, bu da mükemmel bir geliştirme deneyimi sunar.
- **Otomatik Bağımlılık Takibi**: Bir bileşeni `observer` ile sarmaladığınızda, bileşen kullandığı Observable özelliklerini otomatik olarak takip eder. Veri değiştiğinde, UI otomatik olarak yenilenir ve bağımlılıkları manuel olarak yönetmenize gerek kalmaz.
- **React Dışı Senaryolar İçin Uygun**: Observable tepkisellik mekanizması sadece React için değil, aynı zamanda diğer framework'lerle de birleştirilerek daha geniş bir tepkisel veri ihtiyacını karşılayabilir.

## Neden observer Kullanmalısınız?

`observer`, Observable nesnelerindeki değişiklikleri dinler ve veri değiştiğinde React bileşenlerinin güncellenmesini otomatik olarak tetikler. Bu sayede kullanıcı arayüzünüz (UI) verilerinizle senkronize kalır, `setState` veya diğer güncelleme yöntemlerini manuel olarak çağırmanıza gerek kalmaz.

## Temel Kullanım

```tsx
import React from 'react';
import { Input } from 'antd';
import { observer, observable } from '@nocobase/flow-engine';

const obs = observable.deep({
  value: 'aa'
});

const MyComponent = observer(() => {
  return (
    <div>
      <Input
        defaultValue={obs.value}
        onChange={(e) => {
          obs.value = e.target.value;
        }}
      />
      <div>{obs.value}</div>
    </div>
  );
});

export default MyComponent;
```

Tepkisel kullanımla ilgili daha fazla bilgi için lütfen [@formily/reactive](https://reactive.formilyjs.org/) belgelerine başvurunuz.