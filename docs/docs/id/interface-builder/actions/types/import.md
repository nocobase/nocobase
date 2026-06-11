---
pkg: "@nocobase/plugin-action-import"
title: "Action Impor"
description: "Action Impor: mengimpor data dari file seperti Excel ke Collection, mendukung download template, mapping Field."
keywords: "Action Impor, Import, impor Excel, impor data, interface builder, NocoBase"
---
# Impor

## Pengantar

Menggunakan template Excel untuk mengimpor data, dapat mengkonfigurasi Field mana yang akan diimpor, otomatis menghasilkan template.

![20251029165818](https://static-docs.nocobase.com/20251029165818.png)

## Petunjuk Impor

### Field Tipe Numerik

Mendukung angka dan persentase. Teks `N/A` atau `-` akan difilter

| Angka1 | Persentase | Angka2 | Angka3 |
| ----- | ------ | ----- | ----- |
| 123   | 25%    | N/A   | -     |

Setelah dikonversi ke JSON menjadi

```ts
{
  "Angka1": 123,
  "Persentase": 0.25,
  "Angka2": null,
  "Angka3": null,
}
```

### Field Tipe Boolean

Teks input yang didukung (Bahasa Inggris case-insensitive):

- `Yes`, `Y`, `True`, `1`, `Ya`
- `No`, `N`, `False`, `0`, `Tidak`

| Field1 | Field2 | Field3 | Field4 | Field4 |
| ----- | ----- | ----- | ----- | ----- |
| Tidak | Ya | Y | true | 0 |

Setelah dikonversi ke JSON menjadi

```ts
{
  "Field1": false,
  "Field2": true,
  "Field3": true,
  "Field4": true,
  "Field5": false,
}
```

### Field Tipe Tanggal

| DateOnly            | Local(+08:00)       | GMT                 |
| ------------------- | ------------------- | ------------------- |
| 2023-01-18 22:22:22 | 2023-01-18 22:22:22 | 2023-01-18 22:22:22 |

Setelah dikonversi ke JSON menjadi

```ts
{
  "DateOnly": "2023-01-18T00:00:00.000Z",
  "Local(+08:00)": "2023-01-18T14:22:22.000Z",
  "GMT": "2023-01-18T22:22:22.000Z",
}
```

### Field Tipe Pilihan

Nilai opsi dan label opsi dapat dijadikan teks impor. Beberapa opsi dipisahkan dengan koma (`,` `,`) atau pemisah (`、`)

Misalnya Field `Prioritas` memiliki opsi yang tersedia:

| Nilai Opsi | Label Opsi |
| ------ | -------- |
| low    | Rendah   |
| medium | Sedang   |
| high   | Tinggi   |

Nilai opsi dan label opsi dapat dijadikan teks impor

| Prioritas |
| ------ |
| Tinggi |
| low    |

Setelah dikonversi ke JSON menjadi

```ts
[{ Prioritas: 'high' }, { Prioritas: 'low' }];
```

### Field Region Administratif Tiongkok

| Region1         | Region2         |
| ------------- | ------------- |
| Beijing/Distrik Kota | Tianjin/Distrik Kota |

Setelah dikonversi ke JSON menjadi

```ts
{
  "Region1": ["11","1101"],
  "Region2": ["12","1201"]
}
```

### Field Lampiran

| Lampiran                                     |
| ---------------------------------------- |
| https://www.nocobase.com/images/logo.png |

Setelah dikonversi ke JSON menjadi

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

### Field Tipe Relasi

Beberapa data dipisahkan dengan koma (`,` `,`) atau pemisah (`、`)

| Departemen/Nama | Kategori/Judul    |
| --------- | ------------ |
| Tim Dev   | Kategori1, Kategori2 |

Setelah dikonversi ke JSON menjadi

```ts
{
  "Departemen": [1], // 1 adalah ID record dengan nama departemen "Tim Dev"
  "Kategori": [1,2], // 1,2 adalah ID record dengan judul kategori "Kategori1" dan "Kategori2"
}
```

### Field Tipe JSON

| JSON1           |
| --------------- |
| {"key":"value"} |

Setelah dikonversi ke JSON menjadi

```ts
{
  "JSON": {"key":"value"}
}
```

### Tipe Geometri Peta

| Point | Line        | Polygon           | Circle |
| ----- | ----------- | ----------------- | ------ |
| 1,2   | (1,2),(3,4) | (1,2),(3,4),(1,2) | 1,2,3  |

Setelah dikonversi ke JSON menjadi

```ts
{
  "Point": [1,2],
  "Line": [[1,2], [3,4]],
  "Polygon": [[1,2], [3,4], [1,2]],
  "Circle": [1,2,3]
}
```

## Format Impor Kustom

Mendaftarkan `ValueParser` kustom melalui metode `db.registerFieldValueParsers()`, contoh:

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

// Saat Field type=point diimpor, akan di-parse melalui PointValueParser
db.registerFieldValueParsers({
  point: PointValueParser,
});
```

Contoh impor

| Point |
| ----- |
| 1,2   |

Setelah dikonversi ke JSON menjadi

```ts
{
  "Point": [1,2]
}
```


## Konfigurasi Action

![20251029170959](https://static-docs.nocobase.com/20251029170959.png)

- Konfigurasi Field yang dapat diimpor

![20251029171036](https://static-docs.nocobase.com/20251029171036.png)

- [Aturan Linkage](/interface-builder/actions/action-settings/linkage-rule): tampilan/sembunyi tombol secara dinamis;
- [Edit Tombol](/interface-builder/actions/action-settings/edit-button): Edit judul, tipe, ikon tombol;
