:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# FlowModel: Akış ve Yapılandırma

FlowModel, bileşenlerin yapılandırma mantığını uygulamak için "Akış (Flow)" tabanlı bir yaklaşım sunar. Bu sayede bileşenlerin davranışı ve yapılandırması daha genişletilebilir ve görsel hale gelir.

## Özel Model Oluşturma

`FlowModel` sınıfını miras alarak özel bir bileşen modeli oluşturabilirsiniz. Modelin, bileşenin render (oluşturma) mantığını tanımlamak için `render()` metodunu uygulaması gerekir.

```ts
class MyModel extends FlowModel {
  render() {
    return <Button {...this.props} />;
  }
}
```

## Akış (Flow) Kaydetme

Her model, bileşenin yapılandırma mantığını ve etkileşim adımlarını tanımlamak için bir veya daha fazla **Akış (Flow)** kaydedebilir.

```ts
MyModel.registerFlow({
  key: 'buttonSettings',
  title: 'Düğme Ayarları',
  steps: {
    general: {
      title: 'Genel Yapılandırma',
      uiSchema: {
        title: {
          type: 'string',
          title: 'Düğme Başlığı',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
        },
      },
      defaultParams: {
        type: 'primary',
      },
      handler(ctx, params) {
        ctx.model.setProps('children', params.title);
        ctx.model.setProps('type', params.type);
      },
    },
  },
});
```

Açıklama

-   `key`: Akış'ın benzersiz tanımlayıcısı.
-   `title`: Akış'ın adı, kullanıcı arayüzünde (UI) gösterilir.
-   `steps`: Yapılandırma adımlarını (Step) tanımlar. Her adım şunları içerir:
    -   `title`: Adımın başlığı.
    -   `uiSchema`: Yapılandırma formu yapısı (Formily Schema ile uyumludur).
    -   `defaultParams`: Varsayılan parametreler.
    -   `handler(ctx, params)`: Kaydedildiğinde tetiklenir ve modelin durumunu güncellemek için kullanılır.

## Modeli Render Etme

Bir bileşen modelini render ederken, yapılandırma özelliğini etkinleştirip etkinleştirmeyeceğinizi `showFlowSettings` parametresiyle kontrol edebilirsiniz. Eğer `showFlowSettings` etkinleştirilirse, bileşenin sağ üst köşesinde otomatik olarak bir yapılandırma girişi (örneğin, ayarlar simgesi veya düğmesi) görünür.

```ts
<FlowModelRenderer model={model} showFlowSettings />
```

## openFlowSettings ile Yapılandırma Formunu Manuel Olarak Açma

Yapılandırma formunu yerleşik etkileşim girişleri aracılığıyla açmanın yanı sıra, kod içinde `openFlowSettings()` metodunu manuel olarak da çağırabilirsiniz.

``` ts
flowSettings.open(options: FlowSettingsOpenOptions): Promise<boolean>;
model.openFlowSettings(options?: Omit<FlowSettingsOpenOptions, 'model'>): Promise<boolean>;
```

### Parametre Tanımları

``` ts
interface FlowSettingsOpenOptions {
  model: FlowModel;               // Zorunlu, ait olduğu model örneği
  preset?: boolean;               // Yalnızca preset=true olarak işaretlenmiş adımları render eder (varsayılan false)
  flowKey?: string;               // Tek bir Akış (Flow) belirtir
  flowKeys?: string[];            // Birden fazla Akış (Flow) belirtir (flowKey de sağlanırsa yok sayılır)
  stepKey?: string;               // Tek bir adım belirtir (genellikle flowKey ile birlikte kullanılır)
  uiMode?: 'dialog' | 'drawer';   // Formun görüntüleneceği kapsayıcı, varsayılan 'dialog'
  onCancel?: () => void;          // İptal düğmesine tıklandığında geri çağrılır
  onSaved?: () => void;           // Yapılandırma başarıyla kaydedildikten sonra geri çağrılır
}
```

### Örnek: Belirli Bir Akışın (Flow) Yapılandırma Formunu Çekmece (Drawer) Modunda Açma

``` ts
await model.openFlowSettings({
  flowKey: 'buttonSettings',
  uiMode: 'drawer',
  onSaved: () => {
    console.log('Düğme ayarları kaydedildi');
  },
});
```