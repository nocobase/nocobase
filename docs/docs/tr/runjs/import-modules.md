:::tip{title="AI Çeviri Bildirimi"}
Bu belge yapay zeka tarafından çevrilmiştir. Doğru bilgi için [İngilizce sürüme](/runjs/import-modules) bakın.
:::

# Modülleri İçe Aktarma

RunJS'te iki tür modül kullanabilirsiniz: **Yerleşik modüller** (`ctx.libs` aracılığıyla doğrudan kullanılır, içe aktarma gerektirmez) ve **Harici modüller** (`ctx.importAsync()` veya `ctx.requireAsync()` aracılığıyla isteğe bağlı olarak yüklenir).

---

## Yerleşik Modüller - ctx.libs (İçe aktarma gerekmez)

RunJS, `ctx.libs` üzerinden doğrudan erişilebilen yaygın kitaplıkları içerir; bunlar için `import` veya asenkron yükleme kullanmanıza **gerek yoktur**.

| Özellik | Açıklama |
|------|------|
| **ctx.libs.React** | React çekirdeği, JSX ve Hook'lar için kullanılır |
| **ctx.libs.ReactDOM** | ReactDOM (`createRoot` vb. ile birlikte kullanılabilir) |
| **ctx.libs.antd** | Ant Design bileşen kitaplığı |
| **ctx.libs.antdIcons** | Ant Design ikonları |
| **ctx.libs.math** | [Math.js](https://mathjs.org/): Matematiksel ifadeler, matris işlemleri vb. |
| **ctx.libs.formula** | [Formula.js](https://formulajs.github.io/): Excel benzeri formüller (SUM, AVERAGE vb.) |

### Örnek: React ve antd

```tsx
const { Button } = ctx.libs.antd;

ctx.render(<Button>Tıklayın</Button>);
```

### Örnek: ctx.libs.math

```ts
const result = ctx.libs.math.evaluate('2 + 3 * 4');
// result === 14
```

### Örnek: ctx.libs.formula

```ts
const values = [1, 2, 3, 4];
const sum = ctx.libs.formula.SUM(values);
const avg = ctx.libs.formula.AVERAGE(values);
```

---

## Harici Modüller

Üçüncü taraf kitaplıklara ihtiyaç duyduğunuzda, modül formatına göre yükleme yöntemini seçin:

- **ESM Modülleri** → **`ctx.importAsync()`** kullanın
- **UMD/AMD Modülleri** → **`ctx.requireAsync()`** kullanın

---

### ESM Modüllerini İçe Aktarma

ESM modüllerini URL'ye göre dinamik olarak yüklemek için **`ctx.importAsync()`** kullanın; JS blokları, JS alanları ve JS işlemleri gibi senaryolar için uygundur.

```ts
importAsync<T = any>(url: string): Promise<T>;
```

- **url**: ESM modül adresi. `<paket>@<sürüm>` veya `<paket>@<sürüm>/<dosya-yolu>` (örneğin `vue@3.4.0`, `lodash@4/lodash.js`) gibi kısa yazım formatlarını destekler; bunlar yapılandırılmış CDN ön ekiyle birleştirilir. Tam URL'ler de desteklenir.
- **Döndürür**: Çözümlenmiş modül ad alanı (namespace) nesnesi.

#### Varsayılan: https://esm.sh

Yapılandırılmadığında, kısa yazım formları CDN ön eki olarak **https://esm.sh** adresini kullanır. Örneğin:

```ts
const Vue = await ctx.importAsync('vue@3.4.0');
// https://esm.sh/vue@3.4.0 adresinden yüklemeye eşdeğerdir
```

#### Kendi esm.sh Servisinizi Barındırma

Dahili bir ağa veya kendi oluşturduğunuz bir CDN'e ihtiyacınız varsa, esm.sh protokolüyle uyumlu bir servis dağıtabilir ve bunu ortam değişkenleri aracılığıyla belirtebilirsiniz:

- **ESM_CDN_BASE_URL**: ESM CDN temel adresi (varsayılan `https://esm.sh`)
- **ESM_CDN_SUFFIX**: İsteğe bağlı son ek (örneğin jsDelivr için `/+esm`)

Kendi servisinizi barındırmak için şuraya bakabilirsiniz: [https://github.com/nocobase/esm-server](https://github.com/nocobase/esm-server)

---

### UMD/AMD Modüllerini İçe Aktarma

UMD/AMD modüllerini veya küresel nesneye bağlanan betikleri URL'ye göre asenkron olarak yüklemek için **`ctx.requireAsync()`** kullanın.

```ts
requireAsync<T = any>(url: string): Promise<T>;
```

- **url**: İki formu destekler:
  - **Kısa yazım yolu**: `<paket>@<sürüm>/<dosya-yolu>`, `ctx.importAsync()` ile aynıdır ve mevcut ESM CDN yapılandırmasına göre çözümlenir. Çözümleme sırasında, dosyanın ham halini (genellikle UMD yapısı) doğrudan istemek için sonuna `?raw` eklenir. Örneğin, `echarts@5/dist/echarts.min.js` aslında `https://esm.sh/echarts@5/dist/echarts.min.js?raw` adresini ister (varsayılan olarak esm.sh kullanıldığında).
  - **Tam URL**: Herhangi bir CDN'in tam adresi (örneğin `https://cdn.jsdelivr.net/npm/xxx`).
- **Döndürür**: Yüklenen kitaplık nesnesi (biçim, kitaplığın içeriği nasıl dışa aktardığına bağlıdır).

Yüklemeden sonra, birçok UMD kitaplığı kendisini küresel nesneye (örneğin `window.xxx`) bağlar. Kullanırken ilgili kitaplığın belgelerini takip edebilirsiniz.

**Örnek**

```ts
// Kısa yazım yolu (esm.sh aracılığıyla ...?raw olarak çözümlenir)
const echarts = await ctx.requireAsync('echarts@5/dist/echarts.min.js');

// Tam URL
const dayjs = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js');
```

**Not**: Bir kitaplık aynı zamanda ESM sürümü sunuyorsa, daha iyi modül semantiği ve Tree-shaking (gereksiz kodun ayıklanması) için `ctx.importAsync()` kullanmayı tercih edin.