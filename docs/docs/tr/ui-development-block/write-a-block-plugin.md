:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# İlk Blok Eklentinizi Yazın

Başlamadan önce, temel bir eklentiyi nasıl hızlıca oluşturacağınızı öğrenmek için "[İlk Eklentinizi Yazın](../plugin-development/write-your-first-plugin.md)" belgesini okumanızı öneririz. Ardından, bu temeli basit bir Blok özelliği ekleyerek genişleteceğiz.

## Adım 1: Blok Model Dosyasını Oluşturun

Eklenti dizininde bir dosya oluşturun: `client/models/SimpleBlockModel.tsx`

## Adım 2: Model İçeriğini Yazın

Dosyada, oluşturma (render) mantığı da dahil olmak üzere temel bir blok modeli tanımlayın ve uygulayın:

```tsx
import { BlockModel } from '@nocobase/client';
import React from 'react';
import { tExpr } from '../utils';

export class SimpleBlockModel extends BlockModel {
  renderComponent() {
    return (
      <div>
        <h1>Hello, NocoBase!</h1>
        <p>This is a simple block rendered by SimpleBlockModel.</p>
      </div>
    );
  }
}

SimpleBlockModel.define({
  label: tExpr('Hello block'),
});
```

## Adım 3: Blok Modelini Kaydedin

`client/models/index.ts` dosyasında yeni oluşturulan modeli dışa aktarın:

```ts
import { ModelConstructor } from '@nocobase/flow-engine';
import { SimpleBlockModel } from './SimpleBlockModel';

export default {
  SimpleBlockModel,
} as Record<string, ModelConstructor>;
```

## Adım 4: Bloğu Etkinleştirin ve Deneyimleyin

Eklentiyi etkinleştirdikten sonra, "Blok Ekle" açılır menüsünde yeni eklenen **Hello block** blok seçeneğini göreceksiniz.

Örnek gösterim:

![20251102223200_rec_](https://static-docs.nocobase.com/20251102223200_rec_.gif)

## Adım 5: Bloğa Yapılandırma Yeteneği Ekleyin

Ardından, **Flow** aracılığıyla bloğa yapılandırılabilir işlevsellik ekleyerek kullanıcıların arayüzde blok içeriğini düzenlemesini sağlayacağız.

`SimpleBlockModel.tsx` dosyasını düzenlemeye devam edin:

```tsx
import { BlockModel } from '@nocobase/client';
import React from 'react';
import { tExpr } from '../locale';

export class SimpleBlockModel extends BlockModel {
  renderComponent() {
    return <div dangerouslySetInnerHTML={{ __html: this.props.html }} />;
  }
}

SimpleBlockModel.define({
  label: tExpr('Simple block'),
});

SimpleBlockModel.registerFlow({
  key: 'flow1',
  title: tExpr('Simple Block Flow'),
  on: 'beforeRender',
  steps: {
    editHtml: {
      title: tExpr('Edit HTML Content'),
      uiSchema: {
        html: {
          type: 'string',
          title: tExpr('HTML Content'),
          'x-decorator': 'FormItem',
          'x-component': 'Input.TextArea',
        },
      },
      defaultParams: {
        html: `<h3>This is a simple block</h3>
<p>You can edit the HTML content.</p>`,
      },
      handler(ctx, params) {
        ctx.model.props.html = params.html;
      },
    },
  },
});
```

Örnek gösterim:

![20251102222856_rec_](https://static-docs.nocobase.com/20251102222856_rec_.gif)

## Özet

Bu makale, basit bir blok eklentisi oluşturmayı tanıttı. İçerdiği konular:

- Bir blok modelini nasıl tanımlayacağınız ve uygulayacağınız
- Bir blok modelini nasıl kaydedeceğiniz
- Flow aracılığıyla bloğa nasıl yapılandırılabilir işlevsellik ekleyeceğiniz

Tam kaynak kodu referansı: [Basit Blok Örneği](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-simple-block)