:::tip{title="AI Çeviri Bildirimi"}
Bu belge yapay zeka tarafından çevrilmiştir. Doğru bilgi için [İngilizce sürüme](/runjs/context/filter-manager) bakın.
:::

# ctx.filterManager

Filtre Bağlantı Yöneticisi, filtre formları (FilterForm) ile veri blokları (tablolar, listeler, grafikler vb.) arasındaki filtreleme ilişkilerini yönetmek için kullanılır. `BlockGridModel` tarafından sağlanır ve yalnızca onun bağlamında (örneğin filtre formu blokları, veri blokları) kullanılabilir.

## Kullanım Senaryoları

| Senaryo | Açıklama |
|------|------|
| **Filtre Formu Bloğu** | Filtre öğeleri ile hedef bloklar arasındaki bağlantı yapılandırmalarını yönetir; filtreler değiştiğinde hedef verileri yeniler. |
| **Veri Bloğu (Tablo/Liste)** | Filtrelenen hedef olarak işlev görür, filtre koşullarını `bindToTarget` aracılığıyla bağlar. |
| **Etkileşim Kuralları / Özel FilterModel** | Hedef yenilemelerini tetiklemek için `doFilter` veya `doReset` içinde `refreshTargetsByFilter` yöntemini çağırır. |
| **Bağlantı Alanı Yapılandırması** | Filtreler ve hedefler arasındaki alan eşlemelerini sürdürmek için `getConnectFieldsConfig` ve `saveConnectFieldsConfig` kullanır. |

> **Not:** `ctx.filterManager` yalnızca `BlockGridModel` içeren RunJS bağlamlarında (örneğin filtre formu içeren bir sayfa içinde) kullanılabilir; normal JSBlock'larda veya bağımsız sayfalarda `undefined` değerini alır. Erişmeden önce isteğe bağlı zincirleme (optional chaining) kullanılması önerilir.

## Tip Tanımları

```ts
filterManager: FilterManager;

type FilterConfig = {
  filterId: string;   // Filtre modeli UID
  targetId: string;   // Hedef veri bloğu modeli UID
  filterPaths?: string[];  // Hedef bloğun alan yolları
  operator?: string;  // Filtre operatörü
};

type ConnectFieldsConfig = {
  targets: { targetId: string; filterPaths: string[] }[];
};
```

## Yaygın Yöntemler

| Yöntem | Açıklama |
|------|------|
| `getFilterConfigs()` | Mevcut tüm filtre bağlantı yapılandırmalarını alır. |
| `getConnectFieldsConfig(filterId)` | Belirli bir filtre için bağlantı alanı yapılandırmasını alır. |
| `saveConnectFieldsConfig(filterId, config)` | Bir filtre için bağlantı alanı yapılandırmasını kaydeder. |
| `addFilterConfig(config)` | Bir filtre yapılandırması ekler (filterId + targetId + filterPaths). |
| `removeFilterConfig({ filterId?, targetId?, persist? })` | filterId, targetId veya her ikisine göre filtre yapılandırmalarını kaldırır. |
| `bindToTarget(targetId)` | Filtre yapılandırmasını bir hedef bloğa bağlayarak, kaynağının (resource) filtreyi uygulamasını tetikler. |
| `unbindFromTarget(targetId)` | Filtrenin hedef blokla olan bağlantısını keser. |
| `refreshTargetsByFilter(filterId | filterId[])` | Filtre(ler)e dayalı olarak ilişkili hedef blok verilerini yeniler. |

## Temel Kavramlar

- **FilterModel**: Filtre koşullarını sağlayan modeldir (örneğin FilterFormItemModel); mevcut filtre değerini döndürmek için `getFilterValue()` yöntemini uygulamalıdır.
- **TargetModel**: Filtrelenen veri bloğudur; `resource` yapısı `addFilterGroup`, `removeFilterGroup` ve `refresh` işlemlerini desteklemelidir.

## Örnekler

### Filtre Yapılandırması Ekleme

```ts
await ctx.filterManager?.addFilterConfig({
  filterId: 'filter-form-item-uid',
  targetId: 'table-block-uid',
  filterPaths: ['status', 'createdAt'],
  operator: '$eq',
});
```

### Hedef Blokları Yenileme

```ts
// Bir filtre formunun doFilter / doReset yöntemi içinde
ctx.filterManager?.refreshTargetsByFilter(ctx.model.uid);

// Birden fazla filtreyle ilişkili hedefleri yenileme
ctx.filterManager?.refreshTargetsByFilter(['filter-1', 'filter-2']);
```

### Bağlantı Alanı Yapılandırması

```ts
// Bağlantı yapılandırmasını al
const config = ctx.filterManager?.getConnectFieldsConfig(ctx.model.uid);

// Bağlantı yapılandırmasını kaydet
await ctx.filterManager?.saveConnectFieldsConfig(ctx.model.uid, {
  targets: [
    { targetId: 'table-uid', filterPaths: ['status'] },
    { targetId: 'chart-uid', filterPaths: ['category'] },
  ],
});
```

### Yapılandırmayı Kaldırma

```ts
// Belirli bir filtre için tüm yapılandırmaları sil
await ctx.filterManager?.removeFilterConfig({ filterId: 'filter-uid' });

// Belirli bir hedef için tüm filtre yapılandırmalarını sil
await ctx.filterManager?.removeFilterConfig({ targetId: 'table-uid' });
```

## İlgili

- [ctx.resource](./resource.md): Hedef bloğun kaynağı (resource) filtreleme arayüzünü desteklemelidir.
- [ctx.model](./model.md): filterId / targetId için mevcut modelin UID'sini almak için kullanılır.