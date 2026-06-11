---
pkg: "@nocobase/plugin-data-source-main"
title: "Collection Umum"
description: "Collection umum memiliki field sistem umum (pembuat, modifikator, waktu pembuatan, waktu modifikasi, dan lainnya), cocok untuk pemodelan data bisnis reguler."
keywords: "collection umum,General Collection,field sistem,collection,NocoBase"
---
# Collection Umum

## Pengantar

Digunakan untuk sebagian besar skenario. Kecuali Anda memerlukan template Collection khusus, Anda dapat menggunakan Collection Umum.

## Panduan Penggunaan

![20240324085739](https://static-docs.nocobase.com/20240324085739.png)

### Atur Field Primary Key

Collection perlu menentukan field Primary Key. Saat membuat Collection baru, disarankan untuk mencentang field preset ID. Tipe Primary Key default field ID adalah `Snowflake ID (53-bit)`

![20251209210153](https://static-docs.nocobase.com/20251209210153.png)

Arahkan mouse ke Interface field ID untuk memilih tipe Primary Key lainnya.

![20251209210517](https://static-docs.nocobase.com/20251209210517.png)

Tipe Primary Key yang dapat dipilih:
- [Teks](/data-sources/data-modeling/collection-fields/basic/input)
- [Integer](/data-sources/data-modeling/collection-fields/basic/integer)
- [Snowflake ID (53-bit)](/data-sources/data-modeling/collection-fields/advanced/snowflake-id)
- [UUID](/data-sources/data-modeling/collection-fields/advanced/uuid)
- [Nano ID](/data-sources/data-modeling/collection-fields/advanced/nano-id)
