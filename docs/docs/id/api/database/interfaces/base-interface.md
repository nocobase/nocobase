:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# BaseInterface

## Gambaran Umum

BaseInterface adalah kelas dasar untuk semua tipe Interface. Anda dapat mewarisi kelas ini untuk mengimplementasikan logika Interface kustom.

```typescript
class CustomInterface extends BaseInterface {
  async toValue(value: string, ctx?: any): Promise<any> {
    // Logika toValue kustom
  }

  toString(value: any, ctx?: any) {
    // Logika toString kustom
  }
}
// Daftarkan Interface
db.interfaceManager.registerInterfaceType('customInterface', CustomInterface)
```

## API

### toValue(value: string, ctx?: any): Promise<any>

Mengonversi string eksternal menjadi nilai aktual dari interface. Nilai ini dapat langsung diteruskan ke Repository untuk operasi tulis.

### toString(value: any, ctx?: any)

Mengonversi nilai aktual dari interface menjadi tipe string. Tipe string ini dapat digunakan untuk tujuan ekspor atau tampilan.