:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# İlk Eklentinizi Yazın

Bu kılavuz, NocoBase eklentilerinin temel yapısını ve geliştirme iş akışını anlamanıza yardımcı olmak için, sıfırdan başlayarak sayfalarda kullanılabilecek bir blok eklentisi oluşturma sürecinde size yol gösterecektir.

## Ön Koşullar

Başlamadan önce NocoBase'i başarıyla kurduğunuzdan emin olun. Henüz kurmadıysanız, aşağıdaki kurulum kılavuzlarına başvurabilirsiniz:

- [create-nocobase-app kullanarak kurun](/get-started/installation/create-nocobase-app)
- [Git kaynak kodundan kurun](/get-started/installation/git)

Kurulum tamamlandıktan sonra, eklenti geliştirme yolculuğunuza resmi olarak başlayabilirsiniz.

## 1. Adım: CLI Aracılığıyla Eklenti İskeleti Oluşturun

Boş bir eklentiyi hızla oluşturmak için depo kök dizininde aşağıdaki komutu çalıştırın:

```bash
yarn pm create @my-project/plugin-hello
```

Komut başarıyla çalıştıktan sonra, `packages/plugins/@my-project/plugin-hello` dizininde temel dosyalar oluşturulacaktır. Varsayılan yapı aşağıdaki gibidir:

```bash
├─ /packages/plugins/@my-project/plugin-hello
  ├─ package.json
  ├─ README.md
  ├─ client.d.ts
  ├─ client.js
  ├─ server.d.ts
  ├─ server.js
  └─ src
     ├─ index.ts                 # Varsayılan olarak sunucu tarafı eklentisini dışa aktarır
     ├─ client                   # İstemci tarafı kod konumu
     │  ├─ index.tsx             # Varsayılan olarak dışa aktarılan istemci tarafı eklenti sınıfı
     │  ├─ plugin.tsx            # Eklenti girişi (@nocobase/client Plugin'den miras alır)
     │  ├─ models                # İsteğe bağlı: Ön uç modelleri (örn. iş akışı düğümleri)
     │  │  └─ index.ts
     │  └─ utils
     │     ├─ index.ts
     │     └─ useT.ts
     ├─ server                   # Sunucu tarafı kod konumu
     │  ├─ index.ts              # Varsayılan olarak dışa aktarılan sunucu tarafı eklenti sınıfı
     │  ├─ plugin.ts             # Eklenti girişi (@nocobase/server Plugin'den miras alır)
     │  ├─ collections           # İsteğe bağlı: Sunucu tarafı koleksiyonlar
     │  ├─ migrations            # İsteğe bağlı: Veri geçişleri
     │  └─ utils
     │     └─ index.ts
     ├─ utils
     │  ├─ index.ts
     │  └─ tExpr.ts
     └─ locale                   # İsteğe bağlı: Çoklu dil
        ├─ en-US.json
        └─ zh-CN.json
```

Oluşturma işlemi tamamlandıktan sonra, eklentinin listede görünüp görünmediğini doğrulamak için tarayıcınızda eklenti yöneticisi sayfasına (varsayılan adres: http://localhost:13000/admin/settings/plugin-manager) erişebilirsiniz.

## 2. Adım: Basit Bir İstemci Bloğu Uygulayın

Şimdi, eklentiye bir karşılama metni gösterecek özel bir blok modeli ekleyeceğiz.

1. **Yeni bir blok modeli dosyası oluşturun**: `client/models/HelloBlockModel.tsx`

```tsx pure
import { BlockModel } from '@nocobase/client';
import React from 'react';
import { tExpr } from '../utils';

export class HelloBlockModel extends BlockModel {
  renderComponent() {
    return (
      <div>
        <h1>Hello, NocoBase!</h1>
        <p>This is a simple block rendered by HelloBlockModel.</p>
      </div>
    );
  }
}

HelloBlockModel.define({
  label: tExpr('Hello block'),
});
```

2. **Blok modelini kaydedin**. Yeni modeli ön uç çalışma zamanı yüklemesi için dışa aktarmak üzere `client/models/index.ts` dosyasını düzenleyin:

```ts
import { ModelConstructor } from '@nocobase/flow-engine';
import { HelloBlockModel } from './HelloBlockModel';

export default {
  HelloBlockModel,
} as Record<string, ModelConstructor>;
```

Kodu kaydettikten sonra, bir geliştirme betiği çalıştırıyorsanız, terminal çıktısında anlık yeniden yükleme (hot-reload) günlüklerini görmelisiniz.

## 3. Adım: Eklentiyi Etkinleştirin ve Deneyin

Eklentiyi komut satırı veya arayüz aracılığıyla etkinleştirebilirsiniz:

- **Komut Satırı**

  ```bash
  yarn pm enable @my-project/plugin-hello
  ```

- **Yönetim Arayüzü**: Eklenti yöneticisine erişin, `@my-project/plugin-hello` öğesini bulun ve "Etkinleştir"e tıklayın.

Etkinleştirdikten sonra, yeni bir "Modern sayfa (v2)" oluşturun. Blok eklerken "Hello block" öğesini göreceksiniz. Bu bloğu sayfaya ekleyerek az önce yazdığınız karşılama içeriğini görüntüleyebilirsiniz.

![20250928174529](https://static-docs.nocobase.com/20250928174529.png)

## 4. Adım: Oluşturma ve Paketleme

Eklentiyi başka ortamlara dağıtmaya hazırlandığınızda, önce oluşturmanız (build) ve ardından paketlemeniz gerekir:

```bash
yarn build @my-project/plugin-hello --tar
# Veya iki adımda çalıştırın
yarn build @my-project/plugin-hello
yarn nocobase tar @my-project/plugin-hello
```

> İpucu: Eklenti kaynak kod deposunda oluşturulduysa, ilk oluşturma işlemi tüm deponun tip kontrolünü tetikleyecek ve bu da uzun sürebilir. Bağımlılıkların yüklü olduğundan ve deponun oluşturulabilir durumda olduğundan emin olmanız önerilir.

Oluşturma işlemi tamamlandıktan sonra, paket dosyası varsayılan olarak `storage/tar/@my-project/plugin-hello.tar.gz` konumunda bulunur.

## 5. Adım: Başka Bir NocoBase Uygulamasına Yükleyin

Hedef uygulamanın `./storage/plugins` dizinine yükleyin ve paketi açın. Ayrıntılar için [Eklentileri Kurma ve Yükseltme](../get-started/install-upgrade-plugins.mdx) bölümüne bakın.