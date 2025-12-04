---
pkg: "@nocobase/plugin-block-iframe"
---
:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::



# Iframe Bloğu

## Giriş

Iframe bloğu, harici web sayfalarını veya içerikleri mevcut sayfaya yerleştirmenize olanak tanır. Kullanıcılar, bir URL yapılandırarak veya doğrudan HTML kodu ekleyerek harici uygulamaları sayfaya kolayca entegre edebilirler. HTML sayfaları kullanırken, kullanıcılar içeriği belirli görüntüleme ihtiyaçlarına göre esnek bir şekilde özelleştirebilirler. Bu yaklaşım, özelleştirilmiş senaryolar için idealdir; harici kaynakları yönlendirme yapmadan yükleyerek kullanıcı deneyimini ve sayfa etkileşimini artırır.

## Kurulum

Bu, yerleşik bir eklentidir, kurulum gerektirmez.

## Blok Ekleme

![20240408220259](https://static-docs.nocobase.com/20240408220259.png)

Harici uygulamayı doğrudan yerleştirmek için URL'yi veya HTML'yi yapılandırın.

![20240408220322](https://static-docs.nocobase.com/20240408220322.png)

## Şablon Motoru

### Dize Şablonu

Varsayılan şablon motorudur.

### Handlebars

![20240811205239](https://static-docs.nocobase.com/20240811205239.png)

Daha fazla bilgi için Handlebars şablon motoru belgelerine bakabilirsiniz.

## Değişkenleri Geçirme

### HTML'de Değişken Ayrıştırma Desteği

#### Mevcut Blok Bağlamındaki Değişken Seçiciden Değişken Seçme Desteği

![20240603120321](https://static-docs.nocobase.com/20240603120321.png)

![20240603120629](https://static-docs.nocobase.com/20240603120629.gif)

#### Uygulamaya Kod Aracılığıyla Değişken Enjekte Etme ve Kullanma Desteği

Ayrıca, kod aracılığıyla uygulamaya özel değişkenler enjekte edebilir ve bunları HTML'de kullanabilirsiniz. Örneğin, Vue 3 ve Element Plus kullanarak dinamik bir takvim uygulaması oluşturmak:

```html
<!doctype html>
<html lang="zh">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vue3 CDN Example</title>
    <script src="https://cdn.bootcdn.net/ajax/libs/vue/3.5.9/vue.global.prod.js"></script>
    <script src="https://unpkg.com/element-plus"></script>
    <script src="https://unpkg.com/element-plus/dist/locale/zh-cn"></script>
    <link
      rel="stylesheet"
      href="https://unpkg.com/element-plus/dist/index.css"
    />
  </head>
  <body>
    <div id="app">
      <el-container>
        <el-main>
          <el-calendar v-model="month">
            <div class="header-container">
              <div class="action-group">
                <span class="month-display">{{ month }}</span>
                <el-button-group>
                  <el-button
                    type="primary"
                    :loading="loading"
                    @click="changeMonth(-1)"
                    >Last month</el-button
                  >
                  <el-button
                    type="primary"
                    :loading="loading"
                    @click="changeMonth(1)"
                    >Next month</el-button
                  >
                </el-button-group>
              </div>
            </div>
          </el-calendar>
        </el-main>
      </el-container>
    </div>
    <script>
      const { createApp, ref, provide } = Vue;
      const app = createApp({
        setup() {
          const month = ref(new Date().toISOString().slice(0, 7));
          const loading = ref(false);

          const changeMonth = (offset) => {
            const date = new Date(month.value + '-01');
            date.setMonth(date.getMonth() + offset);
            month.value = date.toISOString().slice(0, 7);
          };
          provide('month', month);
          provide('changeMonth', changeMonth);
          return { month, loading, changeMonth };
        },
      });
      app.use(ElementPlus);
      app.mount('#app');
    </script>
  </body>
</html>
```

![20250320163250](https://static-docs.nocobase.com/20250320163250.png)

Örnek: React ve Ant Design (antd) ile oluşturulmuş, tarihleri işlemek için dayjs kullanan basit bir takvim bileşeni

```html
<!doctype html>
<html lang="zh">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>React CDN Example</title>
    <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <link
      rel="stylesheet"
      href="https://cdn.jsdelivr.net/npm/antd/dist/antd.min.css"
    />
    <script src="https://unpkg.com/dayjs/dayjs.min.js"></script>
  </head>
  <body>
    <div id="app"></div>
    <script src="https://cdn.jsdelivr.net/npm/antd/dist/antd.min.js"></script>
    <script>
      document.addEventListener('DOMContentLoaded', function () {
        const { useState } = React;
        const { Calendar, Button, Space, Typography } = window.antd;
        const { Title } = Typography;
        const CalendarComponent = () => {
          const [month, setMonth] = useState(dayjs().format('YYYY-MM'));
          const [loading, setLoading] = useState(false);
          const changeMonth = (offset) => {
            const newMonth = dayjs(month)
              .add(offset, 'month')
              .format('YYYY-MM');
            setMonth(newMonth);
          };
          return React.createElement(
            'div',
            { style: { padding: 20 } },
            React.createElement(
              'div',
              {
                style: {
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 16,
                },
              },
              React.createElement(Title, { level: 4 }, month),
              React.createElement(
                Space,
                null,
                React.createElement(
                  Button,
                  { type: 'primary', loading, onClick: () => changeMonth(-1) },
                  'Last month',
                ),
                React.createElement(
                  Button,
                  { type: 'primary', loading, onClick: () => changeMonth(1) },
                  'Next month',
                ),
              ),
            ),
            React.createElement(Calendar, {
              fullscreen: false,
              value: dayjs(month),
            }),
          );
        };
        ReactDOM.createRoot(document.getElementById('app')).render(
          React.createElement(CalendarComponent),
        );
      });
    </script>
  </body>
</html>
```

![20250320164537](https://static-docs.nocobase.com/20250320164537.png)

### URL Değişkenleri Destekler

![20240603142219](https://static-docs.nocobase.com/20240603142219.png)

Değişkenler hakkında daha fazla bilgi için değişkenler belgelerine bakabilirsiniz.

## JS Blokları ile Iframe Oluşturma (NocoBase 2.0)

NocoBase 2.0'da, iframe'leri daha fazla kontrolle dinamik olarak oluşturmak için JS bloklarını kullanabilirsiniz. Bu yaklaşım, iframe davranışını ve stilini özelleştirmek için daha iyi esneklik sağlar.

### Temel Örnek

Bir JS bloğu oluşturun ve bir iframe oluşturmak için aşağıdaki kodu kullanın:

```javascript
// Mevcut blok kapsayıcısını dolduran bir iframe oluşturun
const iframe = document.createElement('iframe');
iframe.src = 'https://example.com';
iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
iframe.style.width = '100%';
iframe.style.height = '100%';
iframe.style.border = 'none';

// Mevcut alt öğeleri değiştirerek iframe'in tek içerik olmasını sağlayın
ctx.element.replaceChildren(iframe);
```

### Önemli Noktalar

- **ctx.element**: Mevcut JS blok kapsayıcısının DOM öğesi
- **sandbox özelliği**: iframe içeriği için güvenlik kısıtlamalarını kontrol eder
  - `allow-scripts`: iframe'in komut dosyalarını çalıştırmasına izin verir
  - `allow-same-origin`: iframe'in kendi kaynağına erişmesine izin verir
- **replaceChildren()**: Kapsayıcının tüm alt öğelerini iframe ile değiştirir

### Yükleme Durumu ile Gelişmiş Örnek

iframe oluşturmayı yükleme durumları ve hata yönetimi ile geliştirebilirsiniz:

```javascript
// Yükleme mesajını göster
ctx.message.loading('Harici içerik yükleniyor...');

try {
  // Iframe oluştur
  const iframe = document.createElement('iframe');
  iframe.src = 'https://example.com';
  iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
  iframe.style.width = '100%';
  iframe.style.height = '100%';
  iframe.style.border = 'none';

  // Yükleme olay dinleyicisi ekle
  iframe.addEventListener('load', () => {
    ctx.message.success('İçerik başarıyla yüklendi');
  });

  // Hata olay dinleyicisi ekle
  iframe.addEventListener('error', () => {
    ctx.message.error('İçerik yüklenemedi');
  });

  // Iframe'i kapsayıcıya ekle
  ctx.element.replaceChildren(iframe);
} catch (error) {
  ctx.message.error('Iframe oluşturulurken hata oluştu: ' + error.message);
}
```

### Güvenlik Hususları

Iframe kullanırken aşağıdaki güvenlik en iyi uygulamalarını göz önünde bulundurun:

1. **HTTPS Kullanın**: Mümkün olduğunda iframe içeriğini her zaman HTTPS üzerinden yükleyin
2. **Sandbox İzinlerini Kısıtlayın**: Yalnızca gerekli sandbox izinlerini etkinleştirin
3. **İçerik Güvenlik Politikası**: Uygun CSP başlıklarını yapılandırın
4. **Aynı Kaynak Politikası**: Çapraz kaynak kısıtlamalarına dikkat edin
5. **Güvenilir Kaynaklar**: Yalnızca güvenilir alan adlarından içerik yükleyin