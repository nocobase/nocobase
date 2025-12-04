:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# JS Kolonu

## Giriş

JS Kolonu, tablolardaki "özel kolonlar" için kullanılır ve her satırın hücre içeriğini JavaScript aracılığıyla oluşturur. Belirli bir alana bağlı değildir; türetilmiş kolonlar, alanlar arası birleşik gösterimler, durum rozetleri, eylem butonları ve uzaktan veri toplama gibi senaryolar için idealdir.

![jscolumn-add-20251029](https://static-docs.nocobase.com/jscolumn-add-20251029.png)

## Çalışma Zamanı Bağlam API'si

JS Kolonu'nun her hücresi oluşturulurken aşağıdaki bağlam yeteneklerini kullanabilirsiniz:

-   `ctx.element`: Mevcut hücrenin DOM kapsayıcısı (ElementProxy); `innerHTML`, `querySelector`, `addEventListener` gibi özellikleri destekler.
-   `ctx.record`: Mevcut satırın kayıt nesnesi (salt okunur).
-   `ctx.recordIndex`: Mevcut sayfa içindeki satır indeksi (0'dan başlar, sayfalama tarafından etkilenebilir).
-   `ctx.collection`: Tabloya bağlı koleksiyonun meta bilgileri (salt okunur).
-   `ctx.requireAsync(url)`: URL ile bir AMD/UMD kütüphanesini eşzamansız olarak yükler.
-   `ctx.importAsync(url)`: URL ile bir ESM modülünü dinamik olarak içe aktarır.
-   `ctx.openView(options)`: Yapılandırılmış bir görünümü açar (modal/çekmece/sayfa).
-   `ctx.i18n.t()` / `ctx.t()`: Uluslararasılaştırma.
-   `ctx.onRefReady(ctx.ref, cb)`: Kapsayıcı hazır olduktan sonra oluşturur.
-   `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs`: JSX oluşturma ve zaman işleme için yerleşik React, ReactDOM, Ant Design, Ant Design ikonları ve dayjs gibi genel kütüphaneler. (`ctx.React` / `ctx.ReactDOM` / `ctx.antd` uyumluluk için hala korunmaktadır.)
-   `ctx.render(vnode)`: React öğesini/HTML'yi/DOM'u varsayılan kapsayıcı `ctx.element`'e (mevcut hücre) oluşturur. Birden fazla oluşturma işlemi Root'u yeniden kullanır ve kapsayıcının mevcut içeriğini üzerine yazar.

## Düzenleyici ve Kod Parçacıkları

JS Kolonu'nun betik düzenleyicisi sözdizimi vurgulama, hata ipuçları ve yerleşik kod parçacıklarını (Snippets) destekler.

-   `Snippets`: Yerleşik kod parçacıkları listesini açar, arama yapabilir ve tek tıklamayla mevcut imleç konumuna ekleyebilirsiniz.
-   `Run`: Mevcut kodu doğrudan çalıştırır. Çalışma günlükleri alttaki `Logs` paneline çıktı olarak verilir, `console.log/info/warn/error` ve hata vurgulama konumlandırmayı destekler.

![jscolumn-toolbars-20251029](https://static-docs.nocobase.com/jscolumn-toolbars-20251029.png)

Kod oluşturmak için bir yapay zeka çalışanını da kullanabilirsiniz:

-   [Yapay Zeka Çalışanı · Nathan: Ön Uç Mühendisi](/ai-employees/built-in/ai-coding)

## Yaygın Kullanım Senaryoları

### 1) Temel Oluşturma (Mevcut satır kaydını okuma)

```js
ctx.render(<span className="nb-js-col-name">{ctx.record?.name ?? '-'}</span>);
```

### 2) JSX Kullanarak React Bileşenleri Oluşturma

```js
const { Tag } = ctx.libs.antd;
const status = ctx.record?.status ?? 'unknown';
const color = status === 'active' ? 'green' : status === 'blocked' ? 'red' : 'default';
ctx.render(
  <div style={{ padding: 4 }}>
    <Tag color={color}>{String(status)}</Tag>
  </div>
);
```

### 3) Bir Hücreden Modal/Çekmece Açma (Görüntüleme/Düzenleme)

```js
const tk = ctx.collection?.getFilterByTK?.(ctx.record);
ctx.render(
  <a onClick={async () => {
    await ctx.openView('target-view-uid', {
      navigation: false,
      mode: 'drawer',
      dataSourceKey: ctx.collection?.dataSourceKey,
      collectionName: ctx.collection?.name,
      filterByTk: tk,
    });
  }}>Görüntüle</a>
);
```

### 4) Üçüncü Taraf Kütüphaneleri Yükleme (AMD/UMD veya ESM)

```js
// AMD/UMD
const _ = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/lodash@4/lodash.min.js');
const items = _.take(Object.keys(ctx.record || {}), 3);
ctx.render(<code>{items.join(', ')}</code>);

// ESM
const { default: dayjs } = await ctx.importAsync('https://cdn.jsdelivr.net/npm/dayjs/+esm');
ctx.render(<span>{dayjs().format('YYYY-MM-DD')}</span>);
```

## Dikkat Edilmesi Gerekenler

-   Harici kütüphaneleri yüklemek için güvenilir bir CDN kullanmanız ve başarısızlık senaryoları için bir yedekleme (örneğin `if (!lib) return;`) sağlamanız önerilir.
-   Birden fazla blok veya modalda yinelenen `id`'leri önlemek için sabit `id`'ler yerine `class` veya `[name=...]` seçicilerini kullanmanız önerilir.
-   **Olay Temizliği:** Tablo satırları sayfalama veya yenileme ile dinamik olarak değişebilir ve hücreler birden çok kez oluşturulabilir. Tekrarlanan tetiklemeleri önlemek için olay dinleyicilerini bağlamadan önce temizlemeli veya tekilleştirmelisiniz.
-   **Performans İpucu:** Her hücrede büyük kütüphaneleri tekrar tekrar yüklemekten kaçının. Bunun yerine, kütüphaneyi üst düzeyde (örneğin genel bir değişken veya tablo düzeyinde bir değişken aracılığıyla) önbelleğe alıp yeniden kullanmalısınız.