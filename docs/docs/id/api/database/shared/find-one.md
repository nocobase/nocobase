:::tip Pemberitahuan Terjemahan AI
Dokumentasi ini telah diterjemahkan secara otomatis oleh AI.
:::

**Tipe**

```typescript
type FindOneOptions = Omit<FindOptions, 'limit'>;
```

**Parameter**

Sebagian besar parameter sama dengan `find()`. Perbedaannya adalah `findOne()` hanya mengembalikan satu data, sehingga parameter `limit` tidak diperlukan, dan selalu `1` selama kueri.