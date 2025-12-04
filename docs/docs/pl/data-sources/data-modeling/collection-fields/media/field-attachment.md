:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Pole Załącznika

## Wprowadzenie

System posiada wbudowane pole typu „Załącznik”, które umożliwia użytkownikom przesyłanie plików do niestandardowych kolekcji.

W rzeczywistości pole załącznika to pole relacji wiele-do-wielu, które wskazuje na wbudowaną w system kolekcję „Załączniki” (`attachments`). Po utworzeniu pola załącznika w dowolnej kolekcji, automatycznie generowana jest tabela pośrednicząca (junction table) dla relacji wiele-do-wielu. Metadane przesłanych plików są przechowywane w kolekcji „Załączniki”, a informacje o plikach, do których odwołuje się Państwa kolekcja, są łączone za pośrednictwem tej tabeli pośredniczącej.

## Konfiguracja Pola

![20240512180916](https://static-docs.nocobase.com/20251031000729.png)

### Ograniczenia typów MIME

Służy do ograniczania typów plików, które można przesyłać, za pomocą składni [MIME](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types). Na przykład `image/*` oznacza pliki graficzne. Wiele typów można oddzielić przecinkami, na przykład `image/*,application/pdf`, co pozwala na przesyłanie zarówno plików graficznych, jak i PDF.

### Silnik Przechowywania

Proszę wybrać silnik przechowywania dla przesyłanych plików. Jeśli pole pozostanie puste, zostanie użyty domyślny silnik przechowywania systemu.