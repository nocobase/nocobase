:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# FlowModel ve React.Component Karşılaştırması

## Temel Sorumlulukların Karşılaştırması

| Özellik/Yetenek         | `React.Component`       | `FlowModel`                            |
| ----------------------- | ----------------------- | -------------------------------------- |
| Render Etme Yeteneği    | Evet, `render()` metodu kullanıcı arayüzü (UI) oluşturur. | Evet, `render()` metodu kullanıcı arayüzü (UI) oluşturur. |
| Durum Yönetimi          | Dahili `state` ve `setState` | `props` kullanır, ancak durum yönetimi daha çok model ağacı yapısına dayanır. |
| Yaşam Döngüsü           | Evet, örneğin `componentDidMount` | Evet, örneğin `onInit`, `onMount`, `onUnmount`     |
| Kullanım Amacı          | UI bileşenleri oluşturmak                | Veri odaklı, akış tabanlı, yapılandırılmış "model ağaçları" oluşturmak                   |
| Veri Yapısı             | Bileşen ağacı                     | Model ağacı (üst-alt modelleri, çoklu örnek çatallanmayı (Fork) destekler)                   |
| Alt Bileşenler          | JSX kullanarak bileşenleri iç içe yerleştirme             | Alt modelleri açıkça `setSubModel`/`addSubModel` kullanarak ayarlama |
| Dinamik Davranış        | Olay bağlama, durum güncellemeleri UI'ı yönlendirir          | Akışları (Flow) kaydetme/gönderme, otomatik akışları işleme                      |
| Kalıcılık               | Dahili bir mekanizma yok                   | Kalıcılığı destekler (örneğin `model.save()`)                |
| Çatallanmayı (Fork) Destekler (çoklu render) | Hayır (manuel olarak yeniden kullanım gerektirir)                | Evet (`createFork` çoklu örnekleme için)                   |
| Motor Kontrolü          | Yok                       | Evet, `FlowEngine` tarafından yönetilir, kaydedilir ve yüklenir              |

## Yaşam Döngüsü Karşılaştırması

| Yaşam Döngüsü Kancası | `React.Component`                 | `FlowModel`                                  |
| -------------------- | --------------------------------- | -------------------------------------------- |
| Başlatma             | `constructor`, `componentDidMount` | `onInit`, `onMount`                           |
| Kaldırma             | `componentWillUnmount`            | `onUnmount`                                  |
| Girdiye Yanıt Verme  | `componentDidUpdate`              | `onBeforeAutoFlows`, `onAfterAutoFlows` |
| Hata Yönetimi        | `componentDidCatch`               | `onAutoFlowsError`                      |

## Yapı Oluşturma Karşılaştırması

**React:**

```tsx pure
class MyComponent extends React.Component {
  render() {
    return <div>Hello</div>;
  }
}
```

**FlowModel:**

```tsx pure
class HelloModel extends FlowModel {
  render() {
    return <div>Hello</div>;
  }
}
```

## Bileşen Ağacı ve Model Ağacı

*   **React Bileşen Ağacı**: Çalışma zamanında JSX iç içe yerleştirme ile oluşan bir UI render ağacıdır.
*   **FlowModel Model Ağacı**: FlowEngine tarafından yönetilen, kalıcı hale getirilebilen, dinamik olarak kaydedilebilen ve alt modelleri kontrol edilebilen bir mantıksal yapı ağacıdır. Sayfa blokları, işlem akışları, veri modelleri vb. oluşturmak için uygundur.

## Özel Özellikler (FlowModel'e Özgü)

| Fonksiyon                               | Açıklama                     |
| --------------------------------------- | -------------------------- |
| `registerFlow`                          | Akış kaydetme             |
| `applyFlow` / `dispatchEvent`           | Akışı yürütme/tetikleme             |
| `setSubModel` / `addSubModel`           | Alt modellerin oluşturulmasını ve bağlanmasını açıkça kontrol etme          |
| `createFork`                            | Bir modelin mantığının birden çok kez yeniden kullanılmasını destekler (örneğin, bir tablodaki her satır için) |
| `openFlowSettings`                      | Akış adımı ayarları |
| `save` / `saveStepParams()`             | Model kalıcı hale getirilebilir ve arka uç ile entegre edilebilir           |

## Özet

| Öğe          | React.Component | FlowModel              |
| ------------ | --------------- | ---------------------- |
| Uygun Senaryolar | UI katmanı bileşen organizasyonu        | Veri odaklı akış ve blok yönetimi           |
| Temel Fikir  | Bildirimsel UI          | Model odaklı yapılandırılmış akış             |
| Yönetim Şekli | React yaşam döngüsünü kontrol eder    | FlowModel modelin yaşam döngüsünü ve yapısını kontrol eder |
| Avantajlar   | Zengin ekosistem ve araç zinciri        | Güçlü yapılandırma, akışların kalıcı hale getirilebilirliği, alt modellerin kontrol edilebilirliği      |

> FlowModel, React ile tamamlayıcı bir şekilde kullanılabilir: FlowModel içinde render işlemi için React'i kullanırken, yaşam döngüsü ve yapısı FlowEngine tarafından yönetilir.