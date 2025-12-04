:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Przegląd

## Wprowadzenie

Silniki przechowywania służą do zapisywania plików w określonych usługach, takich jak przechowywanie lokalne (na dysku twardym serwera) czy przechowywanie w chmurze.

Zanim Państwo prześlą jakiekolwiek pliki, należy skonfigurować silnik przechowywania. Podczas instalacji system automatycznie dodaje lokalny silnik przechowywania, który można od razu używać. Mogą Państwo również dodawać nowe silniki lub edytować parametry istniejących.

## Typy silników przechowywania

Obecnie NocoBase oferuje wbudowane wsparcie dla następujących typów silników:

- [Lokalne przechowywanie](./local)
- [Amazon S3](./amazon-s3)
- [Aliyun OSS](./aliyun-oss)
- [Tencent COS](./tencent-cos)
- [S3 Pro](./s3-pro)

Podczas instalacji system automatycznie dodaje lokalny silnik przechowywania, który można od razu używać. Mogą Państwo również dodawać nowe silniki lub edytować parametry istniejących.

## Parametry ogólne

Oprócz parametrów specyficznych dla poszczególnych typów silników, poniżej przedstawiono parametry ogólne (na przykładzie lokalnego przechowywania):

![Przykład konfiguracji silnika przechowywania plików](https://static-docs.nocobase.com/20240529115151.png)

### Tytuł

Nazwa silnika przechowywania, służąca do identyfikacji przez użytkownika.

### Nazwa systemowa

Nazwa systemowa silnika przechowywania, używana do identyfikacji przez system. Musi być unikalna w całym systemie. Jeśli pole zostanie pozostawione puste, system automatycznie wygeneruje losową nazwę.

### Prefiks publicznego adresu URL

Część prefiksu publicznie dostępnego adresu URL dla pliku. Może to być podstawowy adres URL sieci CDN, na przykład: „`https://cdn.nocobase.com/app`” (bez końcowego „`/`”).

### Ścieżka

Ścieżka względna używana podczas przechowywania plików. Ta część zostanie również automatycznie dołączona do końcowego adresu URL podczas dostępu. Na przykład: „`user/avatar`” (bez początkowego ani końcowego „`/`”).

### Limit rozmiaru pliku

Limit rozmiaru plików przesyłanych do tego silnika przechowywania. Pliki przekraczające ten limit nie zostaną przesłane. Domyślny limit systemowy wynosi 20 MB i można go zwiększyć do maksymalnie 1 GB.

### Typy plików

Mogą Państwo ograniczyć typy przesyłanych plików, używając formatu opisanego składnią [MIME](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types). Na przykład: `image/*` oznacza pliki graficzne. Wiele typów można oddzielić przecinkami, np.: `image/*, application/pdf` oznacza, że dozwolone są pliki graficzne i pliki PDF.

### Domyślny silnik przechowywania

Po zaznaczeniu, ten silnik zostanie ustawiony jako domyślny silnik przechowywania w systemie. Gdy pole załącznika lub **kolekcja** plików nie określa silnika przechowywania, przesłane pliki zostaną zapisane w domyślnym silniku przechowywania. Domyślnego silnika przechowywania nie można usunąć.

### Zachowaj plik po usunięciu rekordu

Po zaznaczeniu, przesłany plik w silniku przechowywania zostanie zachowany nawet po usunięciu rekordu danych z załącznika lub **kolekcji** plików. Domyślnie opcja ta jest niezaznaczona, co oznacza, że plik w silniku przechowywania zostanie usunięty wraz z rekordem.

:::info{title=Wskazówka}
Po przesłaniu pliku, ostateczna ścieżka dostępu jest konstruowana poprzez połączenie kilku części:

```
<Prefiks publicznego adresu URL>/<Ścieżka>/<Nazwa pliku><Rozszerzenie>
```

Na przykład: `https://cdn.nocobase.com/app/user/avatar/20240529115151.png`.
:::