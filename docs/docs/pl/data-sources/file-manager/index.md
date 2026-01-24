---
pkg: "@nocobase/plugin-file-manager"
---
:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::


# Menedżer plików

## Wprowadzenie

Wtyczka Menedżera plików zapewnia kolekcję plików, pole załącznika oraz silniki przechowywania plików do efektywnego zarządzania plikami. Pliki to rekordy w specjalnym typie kolekcji, znanej jako kolekcja plików, która przechowuje metadane plików i może być zarządzana za pomocą Menedżera plików. Pola załączników to specyficzne pola relacji powiązane z kolekcją plików. Wtyczka obsługuje wiele metod przechowywania, w tym przechowywanie lokalne, Alibaba Cloud OSS, Amazon S3 oraz Tencent Cloud COS.

## Instrukcja obsługi

### Kolekcja plików

Wbudowana jest kolekcja `attachments`, służąca do przechowywania wszystkich plików powiązanych z polami załączników. Dodatkowo, można tworzyć nowe kolekcje plików do przechowywania konkretnych plików.

[Więcej informacji znajdą Państwo w dokumentacji Kolekcji plików](/data-sources/file-manager/file-collection)

### Pole załącznika

Pola załączników to specyficzne pola relacji powiązane z kolekcją plików, które można utworzyć za pomocą typu pola „Załącznik” lub skonfigurować za pomocą pola „Relacja”.

[Więcej informacji znajdą Państwo w dokumentacji Pola załącznika](/data-sources/file-manager/field-attachment)

### Silnik przechowywania plików

Silnik przechowywania plików służy do zapisywania plików w określonych usługach, w tym przechowywania lokalnego (zapisywanie na dysku twardym serwera), przechowywania w chmurze itp.

[Więcej informacji znajdą Państwo w dokumentacji Silnika przechowywania plików](./storage/index.md)

### HTTP API

Przesyłanie plików może być obsługiwane za pośrednictwem HTTP API, proszę zapoznać się z [HTTP API](./http-api.md).

## Rozwój

*