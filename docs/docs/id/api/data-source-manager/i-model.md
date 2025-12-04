:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# IModel

Antarmuka `IModel` mendefinisikan properti dan metode dasar dari objek model.

```typescript
export interface IModel {
  toJSON: () => any;
}
```

## API

### toJSON()

Mengonversi objek model ke format JSON.