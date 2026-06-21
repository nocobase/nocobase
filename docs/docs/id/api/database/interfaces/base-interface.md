---
title: "BaseInterface"
description: "Interface dasar Database NocoBase: definisi tipe BaseInterface."
keywords: "BaseInterface,interface dasar Database,definisi tipe,NocoBase"
---

# BaseInterface

## Ikhtisar

BaseInterface adalah class dasar untuk semua tipe Interface, pengguna dapat meng-extend class ini sendiri untuk mengimplementasikan logika Interface kustom.

```typescript
class CustomInterface extends BaseInterface {
  async toValue(value: string, ctx?: any): Promise<any> {
    // Logika toValue kustom
  }

  toString(value: any, ctx?: any) {
    // Logika toString kustom
  }
}
// Mendaftarkan Interface
db.interfaceManager.registerInterfaceType('customInterface', CustomInterface)
```

## Antarmuka

### toValue(value: string, ctx?: any): Promise<any>

Mengkonversi string eksternal ke nilai aktual dari interface, nilai dapat langsung diteruskan ke Repository untuk operasi penulisan

### toString(value: any, ctx?: any)

Mengkonversi nilai aktual dari interface ke tipe string, tipe string dapat digunakan untuk export atau ditampilkan
