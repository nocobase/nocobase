:::tip{title="AI Çeviri Bildirimi"}
Bu belge yapay zeka tarafından çevrilmiştir. Doğru bilgi için [İngilizce sürüme](/interface-builder/fields/specific/js-item) bakın.
:::

# JS Item

## Giriş

JS Item, formlardaki "özel öğeler" (alan bağlaması olmayan) için kullanılır. JavaScript/JSX kullanarak herhangi bir içeriği (ipuçları, istatistikler, önizlemeler, düğmeler vb.) oluşturabilir ve form, kayıt bağlamıyla etkileşime girebilirsiniz; gerçek zamanlı önizleme, açıklama ipuçları, küçük etkileşimli bileşenler vb. senaryolar için uygundur.

![jsitem-add-20251929](https://static-docs.nocobase.com/jsitem-add-20251929.png)

## Çalışma Zamanı Bağlam API'si (Sık Kullanılanlar)

- `ctx.element`: Mevcut öğenin DOM kapsayıcısı (ElementProxy); `innerHTML`, `querySelector`, `addEventListener` vb. destekler;
- `ctx.form`: AntD Form örneği; `getFieldValue / getFieldsValue / setFieldsValue / validateFields` vb. yapabilir;
- `ctx.blockModel`: Bulunduğu form bloğu modeli; etkileşim sağlamak için `formValuesChange` dinleyebilir;
- `ctx.record` / `ctx.collection`: Mevcut kayıt ve koleksiyon meta bilgileri (bazı senaryolarda kullanılabilir);
- `ctx.requireAsync(url)`: URL'ye göre AMD/UMD kütüphanesini asenkron olarak yükler;
- `ctx.importAsync(url)`: URL'ye göre ESM modülünü dinamik olarak içe aktarır;
- `ctx.openView(viewUid, options)`: Yapılandırılmış bir görünümü (çekmece/iletişim kutusu/sayfa) açar;
- `ctx.message` / `ctx.notification`: Global ipuçları ve bildirimler;
- `ctx.t()` / `ctx.i18n.t()`: Uluslararasılaştırma;
- `ctx.onRefReady(ctx.ref, cb)`: Kapsayıcı hazır olduktan sonra oluşturur;
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs` / `ctx.libs.lodash` / `ctx.libs.math` / `ctx.libs.formula`: JSX oluşturma, zaman işleme, veri işlemleri ve matematiksel hesaplamalar için yerleşik React / ReactDOM / Ant Design / Ant Design İkonları / dayjs / lodash / math.js / formula.js vb. genel kütüphaneler. (`ctx.React` / `ctx.ReactDOM` / `ctx.antd` uyumluluk için hala korunmaktadır.)
- `ctx.render(vnode)`: React öğesini/HTML/DOM'u varsayılan kapsayıcı `ctx.element` içine oluşturur; birden fazla oluşturma işlemi Root'u yeniden kullanır ve kapsayıcının mevcut içeriğinin üzerine yazar.

## Düzenleyici ve Kod Parçacıkları

- `Snippets`: Yerleşik kod parçacıkları listesini açar, arama yapabilir ve tek tıklamayla mevcut imleç konumuna ekleyebilirsiniz.
- `Run`: Mevcut kodu doğrudan çalıştırır ve çalışma günlüklerini alttaki `Logs` paneline çıktı olarak verir; `console.log/info/warn/error` ve hata vurgulama konumlandırmasını destekler.

![jsitem-toolbars-20251029](https://static-docs.nocobase.com/jsitem-toolbars-20251029.png)

- AI Çalışanı ile birlikte betikler oluşturabilir/değiştirebilirsiniz: [AI Çalışanı · Nathan: Ön Uç Mühendisi](/ai-employees/features/built-in-employee)

## Yaygın Kullanım (Basitleştirilmiş Örnekler)

### 1) Gerçek Zamanlı Önizleme (Form değerlerini okuma)

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

### 2) Görünüm açma (Çekmece)

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

### 3) Harici kütüphaneleri yükleme ve oluşturma

```js
// AMD/UMD
const dayjs = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js');
ctx.render(<span>{dayjs().format('YYYY-MM-DD HH:mm')}</span>);

// ESM
const { default: he } = await ctx.importAsync('https://cdn.jsdelivr.net/npm/he/+esm');
ctx.render(<span>{he.encode(String(ctx.form.getFieldValue('title') ?? ''))}</span>);
```

## Dikkat Edilmesi Gerekenler

- Harici kütüphane yüklemeleri için güvenilir CDN kullanılması önerilir, başarısızlık senaryoları için önlem alınmalıdır (örneğin `if (!lib) return;`).
- Seçiciler için `class` veya `[name=...]` kullanılmasına öncelik verilmesi, sabit `id` kullanımından kaçınılması önerilir; bu, birden fazla blok/açılır pencerede `id` çakışmasını önler.
- Olay temizliği: Form değerlerinin sık değişmesi birden fazla oluşturma işlemini tetikler, olay bağlamadan önce temizleme veya tekilleştirme yapılmalıdır (örneğin önce `remove` sonra `add`, veya `{ once: true }`, veya tekrarı önlemek için `dataset` işareti).

## İlgili Belgeler

- [Değişkenler ve Bağlam](/interface-builder/variables)
- [Etkileşim Kuralları](/interface-builder/linkage-rule)
- [Görünümler ve Açılır Pencereler](/interface-builder/actions/types/view)