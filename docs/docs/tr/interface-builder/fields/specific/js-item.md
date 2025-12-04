:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# JS Ögesi

## Giriş

JS Ögesi, bir formdaki "özel ögeler" (alanlara bağlı olmayan) için kullanılır. JavaScript/JSX kullanarak ipuçları, istatistikler, önizlemeler, düğmeler gibi herhangi bir içeriği render edebilir ve form ile kayıt bağlamıyla etkileşim kurabilirsiniz. Bu, gerçek zamanlı önizlemeler, açıklayıcı ipuçları ve küçük etkileşimli bileşenler gibi senaryolar için idealdir.

![jsitem-add-20251929](https://static-docs.nocobase.com/jsitem-add-20251929.png)

## Çalışma Zamanı Bağlam API'si (Sık Kullanılanlar)

- `ctx.element`: Mevcut ögenin DOM kapsayıcısı (ElementProxy); `innerHTML`, `querySelector`, `addEventListener` gibi özellikleri destekler.
- `ctx.form`: AntD Form örneği; `getFieldValue / getFieldsValue / setFieldsValue / validateFields` gibi işlemleri yapmanızı sağlar.
- `ctx.blockModel`: Ait olduğu form bloğu modeli; `formValuesChange` olayını dinleyerek bağlantı kurmanızı sağlar.
- `ctx.record` / `ctx.collection`: Mevcut kayıt ve koleksiyon meta bilgileri (bazı senaryolarda kullanılabilir).
- `ctx.requireAsync(url)`: URL'ye göre AMD/UMD kütüphanesini eşzamansız olarak yükler.
- `ctx.importAsync(url)`: URL'ye göre ESM modülünü dinamik olarak içe aktarır.
- `ctx.openView(viewUid, options)`: Yapılandırılmış bir görünümü (çekmece/iletişim kutusu/sayfa) açar.
- `ctx.message` / `ctx.notification`: Genel mesaj ve bildirimler.
- `ctx.t()` / `ctx.i18n.t()`: Uluslararasılaştırma.
- `ctx.onRefReady(ctx.ref, cb)`: Kapsayıcı hazır olduktan sonra render eder.
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs`: JSX render etme ve zaman işleme için yerleşik React, ReactDOM, Ant Design, Ant Design ikonları ve dayjs gibi genel kütüphaneler. (`ctx.React` / `ctx.ReactDOM` / `ctx.antd` uyumluluk için hala korunmaktadır.)
- `ctx.render(vnode)`: React öğelerini/HTML/DOM'u varsayılan `ctx.element` kapsayıcısına render eder. Birden fazla render işlemi Root'u yeniden kullanır ve kapsayıcının mevcut içeriğini üzerine yazar.

## Düzenleyici ve Kod Parçacıkları

- `Snippets`: Yerleşik kod parçacıkları listesini açar; arama yapabilir ve tek tıklamayla mevcut imleç konumuna ekleyebilirsiniz.
- `Run`: Mevcut kodu doğrudan çalıştırır ve çalışma günlüklerini alttaki `Logs` paneline çıktı olarak verir. `console.log/info/warn/error` ve hata vurgulama konumlandırmasını destekler.

![jsitem-toolbars-20251029](https://static-docs.nocobase.com/jsitem-toolbars-20251029.png)

- AI Çalışanı ile birlikte betikler oluşturabilir/değiştirebilirsiniz: [AI Çalışanı · Nathan: Ön Uç Mühendisi](/ai-employees/built-in/ai-coding)

## Yaygın Kullanım (Basitleştirilmiş Örnekler)

### 1) Gerçek Zamanlı Önizleme (Form Değerlerini Okuma)

```js
const render = () => {
  const { price = 0, quantity = 1, discount = 0 } = ctx.form.getFieldsValue();
  const total = Number(price) * Number(quantity);
  const final = total * (1 - Number(discount || 0));
  ctx.render(
    <div style={{ padding: 8, background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 6 }}>
      <div style={{ fontWeight: 600, color: '#389e0d' }}>{ctx.t('Ödenecek:')} ¥{(final || 0).toFixed(2)}</div>
    </div>
  );
};
render();
ctx.blockModel?.on?.('formValuesChange', () => render());
```

### 2) Bir Görünüm Açma (Çekmece)

```js
ctx.render(
  <a onClick={async () => {
    const popupUid = ctx.model.uid + '-preview';
    await ctx.openView(popupUid, { mode: 'drawer', title: ctx.t('Önizleme'), size: 'large' });
  }}>
    {ctx.t('Önizlemeyi aç')}
  </a>
);
```

### 3) Harici Kütüphaneleri Yükleme ve Render Etme

```js
// AMD/UMD
const dayjs = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js');
ctx.render(<span>{dayjs().format('YYYY-MM-DD HH:mm')}</span>);

// ESM
const { default: he } = await ctx.importAsync('https://cdn.jsdelivr.net/npm/he/+esm');
ctx.render(<span>{he.encode(String(ctx.form.getFieldValue('title') ?? ''))}</span>);
```

## Dikkat Edilmesi Gerekenler

- Harici kütüphaneleri yüklerken güvenilir CDN'ler kullanmanız önerilir ve başarısızlık senaryoları için bir yedekleme (örneğin `if (!lib) return;`) sağlamalısınız.
- Seçiciler için `class` veya `[name=...]` kullanmaya öncelik vermeniz, sabit `id`'ler kullanmaktan kaçınmanız önerilir. Bu, birden fazla blok/açılır pencerede `id`'lerin tekrarlanmasını önler.
- Olay temizliği: Form değerlerindeki sık değişiklikler birden fazla render işlemini tetikler. Bir olayı bağlamadan önce temizlemeli veya tekrarları önlemelisiniz (örneğin, önce `remove` sonra `add` kullanarak, `{ once: true }` ile veya `dataset` özniteliği ile tekrarı işaretleyerek).

## İlgili Belgeler

- [Değişkenler ve Bağlam](/interface-builder/variables)
- [Bağlantı Kuralları](/interface-builder/linkage-rule)
- [Görünümler ve Açılır Pencereler](/interface-builder/actions/types/view)