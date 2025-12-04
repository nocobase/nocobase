:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Przegląd

## Wbudowane silniki

Obecnie NocoBase obsługuje następujące typy wbudowanych silników:

- [Lokalna pamięć masowa](./local.md)
- [Alibaba Cloud OSS](./aliyun-oss.md)
- [Amazon S3](./amazon-s3.md)
- [Tencent Cloud COS](./tencent-cos.md)

Podczas instalacji systemu automatycznie dodawany jest silnik lokalnej pamięci masowej, który można od razu używać. Mogą Państwo również dodawać nowe silniki lub edytować parametry istniejących.

## Wspólne parametry silnika

Oprócz parametrów specyficznych dla poszczególnych typów silników, poniżej przedstawiono wspólne parametry (na przykładzie lokalnej pamięci masowej):

![Przykład konfiguracji silnika pamięci masowej plików](https://static-docs.nocobase.com/20240529115151.png)

### Tytuł

Nazwa silnika pamięci masowej, służąca do identyfikacji przez użytkownika.

### Nazwa systemowa

Nazwa systemowa silnika pamięci masowej, służąca do identyfikacji przez system. Musi być unikalna w całym systemie. Jeśli pole zostanie pozostawione puste, nazwa zostanie automatycznie wygenerowana losowo przez system.

### Bazowy URL dostępu

Prefiks adresu URL, pod którym plik jest dostępny zewnętrznie. Może to być bazowy URL CDN, na przykład: „`https://cdn.nocobase.com/app`” (bez końcowego „`/`”).

### Ścieżka

Ścieżka względna używana podczas przechowywania plików. Ta część zostanie również automatycznie dołączona do końcowego adresu URL podczas dostępu. Na przykład: „`user/avatar`” (bez początkowego ani końcowego „`/`”).

### Limit rozmiaru pliku

Limit rozmiaru plików przesyłanych do tego silnika pamięci masowej. Pliki przekraczające ten rozmiar nie zostaną przesłane. Domyślny limit systemowy wynosi 20 MB, a maksymalny możliwy do ustawienia limit to 1 GB.

### Typ pliku

Mogą Państwo ograniczyć typy przesyłanych plików, używając formatu opisu składni [MIME](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types). Na przykład: `image/*` oznacza pliki graficzne. Wiele typów można oddzielić przecinkami, np.: `image/*, application/pdf` oznacza, że dozwolone są pliki graficzne i pliki PDF.

### Domyślny silnik pamięci masowej

Po zaznaczeniu, ten silnik jest ustawiany jako domyślny silnik pamięci masowej systemu. Gdy pole załącznika lub **kolekcja** plików nie określa silnika pamięci masowej, przesłane pliki zostaną zapisane w domyślnym silniku pamięci masowej. Domyślnego silnika pamięci masowej nie można usunąć.

### Zachowaj pliki podczas usuwania rekordów

Po zaznaczeniu, przesłane pliki w silniku pamięci masowej zostaną zachowane nawet po usunięciu rekordów danych z tabeli załączników lub **kolekcji** plików. Domyślnie opcja jest niezaznaczona, co oznacza, że pliki w silniku pamięci masowej są usuwane wraz z rekordami.

:::info{title=Wskazówka}
Po przesłaniu pliku, ostateczna ścieżka dostępu jest tworzona przez połączenie kilku części:

```
<Bazowy URL dostępu>/<Ścieżka>/<Nazwa pliku><Rozszerzenie>
```

Na przykład: `https://cdn.nocobase.com/app/user/avatar/20240529115151.png`.
:::