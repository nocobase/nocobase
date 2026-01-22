:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

**Tipe**

```typescript
type FindOneOptions = Omit<FindOptions, 'limit'>;
```

**Parameter**

Sebagian besar parameter sama dengan `find()`. Perbedaannya adalah `findOne()` hanya mengembalikan satu data, sehingga parameter `limit` tidak diperlukan, dan selalu `1` selama kueri.