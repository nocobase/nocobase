---
pkg: "@nocobase/plugin-action-import"
---
:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Impor

## Pendahuluan

Impor data menggunakan template Excel. Anda dapat mengonfigurasi bidang mana saja yang akan diimpor, dan template akan dibuat secara otomatis.

![20251029165818](https://static-docs.nocobase.com/20251029165818.png)

## Instruksi Impor

### Bidang Tipe Angka

Mendukung angka dan persentase. Teks seperti `N/A` atau `-` akan disaring.

| Angka1 | Persentase | Angka2 | Angka3 |
| ----- | ------ | ----- | ----- |
| 123   | 25%    | N/A   | -     |

Setelah dikonversi ke JSON:

```ts
{
  "Angka1": 123,
  "Persentase": 0.25,
  "Angka2": null,
  "Angka3": null,
}
```

### Bidang Tipe Boolean

Teks input yang didukung (bahasa Inggris tidak peka huruf besar/kecil):

- `Yes`, `Y`, `True`, `1`, `Ya`
- `No`, `N`, `False`, `0`, `Tidak`

| Bidang1 | Bidang2 | Bidang3 | Bidang4 | Bidang5 |
| ----- | ----- | ----- | ----- | ----- |
| Tidak    | Ya    | Y     | true  | 0     |

Setelah dikonversi ke JSON:

```ts
{
  "Bidang1": false,
  "Bidang2": true,
  "Bidang3": true,
  "Bidang4": true,
  "Bidang5": false,
}
```

### Bidang Tipe Tanggal

| DateOnly            | Local(+08:00)       | GMT                 |
| ------------------- | ------------------- | ------------------- |
| 2023-01-18 22:22:22 | 2023-01-18 22:22:22 | 2023-01-18 22:22:22 |

Setelah dikonversi ke JSON:

```ts
{
  "DateOnly": "2023-01-18T00:00:00.000Z",
  "Local(+08:00)": "2023-01-18T14:22:22.000Z",
  "GMT": "2023-01-18T22:22:22.000Z",
}
```

### Bidang Tipe Pilihan

Baik nilai opsi maupun label opsi dapat digunakan sebagai teks impor. Beberapa opsi dipisahkan dengan koma (`,` `，`) atau tanda jeda (`、`).

Contoh, opsi untuk bidang `Prioritas` meliputi:

| Nilai Opsi | Label Opsi |
| ------ | -------- |
| low    | Rendah       |
| medium | Sedang   |
| high   | Tinggi       |

Baik nilai opsi maupun label opsi dapat digunakan sebagai teks impor.

| Prioritas |
| ------ |
| Tinggi     |
| low    |

Setelah dikonversi ke JSON:

```ts
[{ Prioritas: 'high' }, { Prioritas: 'low' }];
```

### Bidang Divisi Administratif Tiongkok

| Wilayah1         | Wilayah2         |
| ------------- | ------------- |
| 北京市/市辖区 | 天津市/市辖区 |

Setelah dikonversi ke JSON:

```ts
{
  "Wilayah1": ["11","1101"],
  "Wilayah2": ["12","1201"]
}
```

### Bidang Lampiran

| Lampiran                                     |
| ---------------------------------------- |
| https://www.nocobase.com/images/logo.png |

Setelah dikonversi ke JSON:

```ts
{
  "Lampiran": [
    {
      "filename": "logo.png",
      "title": "logo.png",
      "extname": ".png",
      "url": "https://www.nocobase.com/images/logo.png"
    }
  ]
}
```

### Bidang Tipe Relasi

Beberapa entri data dipisahkan dengan koma (`,` `，`) atau tanda jeda (`、`).

| Departemen/Nama | Kategori/Judul    |
| --------- | ------------ |
| Tim Pengembangan    | Kategori1、Kategori2 |

Setelah dikonversi ke JSON:

```ts
{
  "Departemen": [1], // 1 adalah ID catatan untuk departemen bernama "Tim Pengembangan"
  "Kategori": [1,2], // 1,2 adalah ID catatan untuk kategori berjudul "Kategori1" dan "Kategori2"
}
```

### Bidang Tipe JSON

| JSON1           |
| --------------- |
| {"key":"value"} |

Setelah dikonversi ke JSON:

```ts
{
  "JSON": {"key":"value"}
}
```

### Tipe Geometri Peta

| Point | Line        | Polygon           | Circle |
| ----- | ----------- | ----------------- | ------ |
| 1,2   | (1,2),(3,4) | (1,2),(3,4),(1,2) | 1,2,3  |

Setelah dikonversi ke JSON:

```ts
{
  "Point": [1,2],
  "Line": [[1,2], [3,4]],
  "Polygon": [[1,2], [3,4], [1,2]],
  "Circle": [1,2,3]
}
```

## Format Impor Kustom

Daftarkan `ValueParser` kustom melalui metode `db.registerFieldValueParsers()`, contohnya:

```ts
import { BaseValueParser } from '@nocobase/database';

class PointValueParser extends BaseValueParser {
  async setValue(value) {
    if (Array.isArray(value)) {
      this.value = value;
    } else if (typeof value === 'string') {
      this.value = value.split(',');
    } else {
      this.errors.push('Value invalid');
    }
  }
}

const db = new Database();

// Saat mengimpor bidang dengan type=point, data akan diurai oleh PointValueParser
db.registerFieldValueParsers({
  point: PointValueParser,
});
```

Contoh Impor

| Point |
| ----- |
| 1,2   |

Setelah dikonversi ke JSON:

```ts
{
  "Point": [1,2]
}
```

## Pengaturan Aksi

![20251029170959](https://static-docs.nocobase.com/20251029170959.png)

- Konfigurasi bidang yang dapat diimpor

![20251029171036](https://static-docs.nocobase.com/20251029171036.png)

- [Aturan Keterkaitan](/interface-builder/actions/action-settings/linkage-rule): Menampilkan/menyembunyikan tombol secara dinamis;
- [Edit Tombol](/interface-builder/actions/action-settings/edit-button): Mengedit judul, tipe, dan ikon tombol;