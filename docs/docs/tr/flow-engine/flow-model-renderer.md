:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# FlowModel'i Render Etme

`FlowModelRenderer`, bir `FlowModel`'i render etmek için kullanılan temel React bileşenidir. Bir `FlowModel` örneğini görsel bir React bileşenine dönüştürmekten sorumludur.

## Temel Kullanım

### FlowModelRenderer

```tsx pure
import { FlowModelRenderer } from '@nocobase/flow-engine';

// Temel kullanım
<FlowModelRenderer model={myModel} />
```

### FieldModelRenderer

Kontrollü alan modelleri için `FieldModelRenderer` kullanarak render edebilirsiniz:

```tsx pure
import { FieldModelRenderer } from '@nocobase/flow-engine';

// Kontrollü alan render etme
<FieldModelRenderer model={fieldModel} />
```

## Prop Parametreleri

### FlowModelRendererProps

| Parametre | Tip | Varsayılan | Açıklama |
|------|------|--------|------|
| `model` | `FlowModel` | - | Render edilecek FlowModel örneği |
| `uid` | `string` | - | iş akışı modelinin benzersiz tanımlayıcısı |
| `fallback` | `React.ReactNode` | `<Skeleton.Button size="small" />` | Render etme hatasında gösterilecek yedek içerik |
| `showFlowSettings` | `boolean \| object` | `false` | iş akışı ayarları girişini gösterip göstermeyeceği |
| `flowSettingsVariant` | `'dropdown' \| 'contextMenu' \| 'modal' \| 'drawer'` | `'dropdown'` | iş akışı ayarları için etkileşim stili |
| `hideRemoveInSettings` | `boolean` | `false` | Ayarlarda kaldırma düğmesini gizleyip gizlemeyeceği |
| `showTitle` | `boolean` | `false` | Model başlığını çerçevenin sol üst köşesinde gösterip göstermeyeceği |
| `skipApplyAutoFlows` | `boolean` | `false` | Otomatik iş akışlarını uygulamayı atlayıp atlamayacağı |
| `inputArgs` | `Record<string, any>` | - | `useApplyAutoFlows`'a iletilen ek bağlam |
| `showErrorFallback` | `boolean` | `true` | En dış katmanı `FlowErrorFallback` bileşeniyle sarıp sarmayacağı |
| `settingsMenuLevel` | `number` | - | Ayarlar menüsü seviyesi: 1=yalnızca mevcut model, 2=alt modelleri dahil et |
| `extraToolbarItems` | `ToolbarItemConfig[]` | - | Ek araç çubuğu öğeleri |

### `showFlowSettings` Detaylı Yapılandırma

`showFlowSettings` bir nesne olduğunda, aşağıdaki yapılandırmalar desteklenir:

```tsx pure
showFlowSettings={{
  showBackground: true,    // Arka planı göster
  showBorder: true,        // Kenarlığı göster
  showDragHandle: true,    // Sürükleme tutamacını göster
  style: {},              // Özel araç çubuğu stili
  toolbarPosition: 'inside' // Araç çubuğu konumu: 'inside' | 'above' | 'below'
}}
```

## Render Etme Yaşam Döngüsü

Tüm render etme döngüsü, aşağıdaki yöntemleri sırasıyla çağırır:

1.  **model.dispatchEvent('beforeRender')** - Render öncesi olay
2.  **model.render()** - Modelin render etme yöntemini yürütür
3.  **model.onMount()** - Bileşen bağlama (mount) kancası
4.  **model.onUnmount()** - Bileşen ayırma (unmount) kancası

## Kullanım Örnekleri

### Temel Render Etme

```tsx pure
import { FlowModelRenderer } from '@nocobase/flow-engine';

function MyComponent() {
  const model = useFlowModel();
  
  return (
    <FlowModelRenderer 
      model={model}
      fallback={<div>Yükleniyor...</div>}
    />
  );
}
```

### iş akışı Ayarlarıyla Render Etme

```tsx pure
// Ayarları göster ama silme düğmesini gizle
<FlowModelRenderer
  model={myModel}
  showFlowSettings={true}
  hideRemoveInSettings={true}
/>

// Ayarları ve başlığı göster
<FlowModelRenderer
  model={myModel}
  showFlowSettings={true}
  showTitle={true}
/>

// Bağlam menüsü modunu kullan
<FlowModelRenderer
  model={myModel}
  showFlowSettings={true}
  flowSettingsVariant="contextMenu"
  hideRemoveInSettings={true}
/>
```

### Özel Araç Çubuğu

```tsx pure
<FlowModelRenderer
  model={myModel}
  showFlowSettings={true}
  extraToolbarItems={[
    {
      key: 'custom-action',
      title: 'Özel Eylem',
      icon: 'SettingOutlined',
      onClick: () => {
        console.log('Özel eylem');
      }
    }
  ]}
/>
```

### Otomatik iş akışlarını Atlamak

```tsx pure
<FlowModelRenderer
  model={myModel}
  skipApplyAutoFlows={true}
  showErrorFallback={false}
/>
```

### Alan Modeli Render Etme

```tsx pure
import { FieldModelRenderer } from '@nocobase/flow-engine';

function FormField({ model, onChange, ...props }) {
  return (
    <FieldModelRenderer
      model={model}
      onChange={onChange}
      {...props}
    />
  );
}
```

## Hata Yönetimi

`FlowModelRenderer`, kapsamlı bir yerleşik hata yönetimi mekanizmasına sahiptir:

-   **Otomatik Hata Sınırı**: `showErrorFallback={true}` varsayılan olarak etkindir.
-   **Otomatik iş akışı Hataları**: Otomatik iş akışlarının yürütülmesi sırasındaki hataları yakalar ve işler.
-   **Render Etme Hataları**: Model render etme başarısız olduğunda yedek içeriği gösterir.

```tsx pure
<FlowModelRenderer
  model={myModel}
  showErrorFallback={true}
  fallback={<div>Render etme başarısız oldu, lütfen tekrar deneyin</div>}
/>
```

## Performans Optimizasyonu

### Otomatik iş akışlarını Atlamak

Otomatik iş akışlarına ihtiyaç duyulmayan senaryolarda, performansı artırmak için bunları atlayabilirsiniz:

```tsx pure
<FlowModelRenderer
  model={myModel}
  skipApplyAutoFlows={true}
/>
```

### Reaktif Güncellemeler

`FlowModelRenderer`, reaktif güncellemeler için `@formily/reactive-react`'ten `observer`'ı kullanır ve modelin durumu değiştiğinde bileşenin otomatik olarak yeniden render edilmesini sağlar.

## Notlar

1.  **Model Doğrulama**: İletilen `model`'in geçerli bir `render` yöntemine sahip olduğundan emin olun.
2.  **Yaşam Döngüsü Yönetimi**: Modelin yaşam döngüsü kancaları uygun zamanlarda çağrılacaktır.
3.  **Hata Sınırı**: Daha iyi bir kullanıcı deneyimi sağlamak için üretim ortamında hata sınırını etkinleştirmeniz önerilir.
4.  **Performans Değerlendirmesi**: Çok sayıda modelin render edildiği senaryolar için `skipApplyAutoFlows` seçeneğini kullanmayı düşünün.