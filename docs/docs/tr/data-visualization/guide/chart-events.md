:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Özel Etkileşim Olayları

Olay düzenleyicide JavaScript yazarak, ECharts `chart` örneği aracılığıyla etkileşim davranışlarını kaydedebilir ve bağlantı kurabilirsiniz. Örneğin, yeni bir sayfaya yönlendirme veya detaylı analiz için bir açılır pencere açma gibi işlemleri gerçekleştirebilirsiniz.

![clipboard-image-1761489617](https://static-docs.nocobase.com/clipboard-image-1761489617.png)

## Olay Kaydı ve Kayıt Silme
- Kayıt: `chart.on(eventName, handler)`
- Kayıt Silme: `chart.off(eventName, handler)` veya aynı isimdeki olayları temizlemek için `chart.off(eventName)` kullanabilirsiniz.

**Not:**
Güvenlik nedeniyle, bir olayı kaydetmeden önce kaydını silmeniz şiddetle tavsiye edilir!

## `handler` Fonksiyonu `params` Parametresinin Veri Yapısı

![20251026222859](https://static-docs.nocobase.com/20251026222859.png)

Sık kullanılan alanlar arasında `params.data` ve `params.name` gibi değerler bulunur.

## Örnek: Tıklayarak Seçimi Vurgulama
```js
chart.off('click');
chart.on('click', (params) => {
  const { seriesIndex, dataIndex } = params;
  // Mevcut veri noktasını vurgula
  chart.dispatchAction({ type: 'highlight', seriesIndex, dataIndex });
  // Diğer vurgulamaları kaldır
  chart.dispatchAction({ type: 'downplay', seriesIndex });
});
```

## Örnek: Tıklayarak Sayfaya Yönlendirme
```js
chart.off('click');
chart.on('click', (params) => {
  const order_date = params.data[0]
  
  // Yöntem 1: Uygulama içi yönlendirme, sayfayı yenilemez, daha iyi bir kullanıcı deneyimi sunar (önerilir), sadece göreceli yol yeterlidir.
  ctx.router.navigate(`/new-path/orders?order_date=${order_date}`)

  // Yöntem 2: Harici sayfaya yönlendirme, tam URL gereklidir.
  window.location.href = `https://www.host.com/new-path/orders?order_date=${order_date}`

  // Yöntem 3: Harici sayfayı yeni bir sekmede açma, tam URL gereklidir.
  window.open(`https://www.host.com/new-path/orders?order_date=${order_date}`)
});
```

## Örnek: Tıklayarak Detay Penceresini Açma (Detaylı Analiz)
```js
chart.off('click');
chart.on('click', (params) => {
  ctx.openView(ctx.model.uid + '-1', {
    mode: 'dialog',
    size: 'large',
    defineProperties: {}, // Yeni açılır pencere için bağlam değişkenlerini kaydet
  });
});
```

![clipboard-image-1761490321](https://static-docs.nocobase.com/clipboard-image-1761490321.png)

Yeni açılan pencerede, grafik tarafından tanımlanan bağlam değişkenlerini `ctx.view.inputArgs.XXX` aracılığıyla kullanabilirsiniz.

## Önizleme ve Kaydetme
- Olay kodunu yüklemek ve çalıştırmak için "Önizle"ye tıklayın.
- Mevcut olay yapılandırmasını kaydetmek için "Kaydet"e tıklayın.
- Son kaydedilen duruma geri dönmek için "İptal"e tıklayın.

**Öneriler:**
- Tekrarlayan yürütmeleri veya artan bellek kullanımını önlemek için her bağlamadan önce `chart.off('event')` kullanın.
- Oluşturma sürecini engellememek adına olay işleyicilerinde mümkün olduğunca hafif işlemler (`dispatchAction`, `setOption` gibi) kullanmaya özen gösterin.
- Olayda işlenen alanların mevcut verilerle tutarlı olduğundan emin olmak için grafik seçenekleri ve veri sorgularıyla birlikte doğrulama yapın.