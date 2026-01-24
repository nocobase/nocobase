:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Pole załącznika

## Wprowadzenie

System posiada wbudowane pole typu „Załącznik”, które umożliwia użytkownikom przesyłanie plików do niestandardowych kolekcji.

Pole załącznika jest w swojej istocie polem relacji wiele-do-wielu, które wskazuje na wbudowaną kolekcję plików „Załączniki” (`attachments`). Po utworzeniu pola załącznika w dowolnej kolekcji, automatycznie generowana jest tabela pośrednicząca dla relacji wiele-do-wielu. Metadane przesłanych plików są przechowywane w kolekcji „Załączniki”, a informacje o plikach, do których odwołuje się dana kolekcja, są powiązane za pośrednictwem tej tabeli pośredniczącej.

## Konfiguracja pola

![20240512180916](https://static-docs.nocobase.com/20251031000729.png)

### Ograniczenia typów MIME

Służy do ograniczania typów plików, które można przesyłać, za pomocą formatu składni [MIME](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types). Na przykład: `image/*` reprezentuje pliki graficzne. Wiele typów można oddzielić przecinkiem, na przykład: `image/*,application/pdf` zezwala zarówno na pliki graficzne, jak i pliki PDF.

### Silnik przechowywania danych

Proszę wybrać silnik przechowywania danych do przechowywania przesłanych plików. Jeśli pole pozostanie puste, zostanie użyty domyślny silnik przechowywania danych systemu.