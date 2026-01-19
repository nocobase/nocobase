:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Silnik przechowywania: Pamięć lokalna

Przesłane pliki będą zapisywane w lokalnym katalogu na dysku twardym serwera. Rozwiązanie to jest odpowiednie dla scenariuszy, w których całkowita objętość przesyłanych plików zarządzanych przez system jest niewielka, lub do celów eksperymentalnych.

## Parametry konfiguracji

![Przykład konfiguracji silnika przechowywania plików](https://static-docs.nocobase.com/20240529115151.png)

:::info{title=Wskazówka}
W tej sekcji przedstawiono wyłącznie parametry specyficzne dla silnika pamięci lokalnej. Ogólne parametry znajdą Państwo w [Ogólnych parametrach silnika](./index.md#ogólne-parametry-silnika).
:::

### Ścieżka

Określa zarówno ścieżkę względną przechowywania plików na serwerze, jak i ścieżkę dostępu URL. Na przykład, „`user/avatar`” (bez początkowych i końcowych ukośników) oznacza:

1. Względną ścieżkę na serwerze, gdzie przechowywane są przesłane pliki: `/path/to/nocobase-app/storage/uploads/user/avatar`.
2. Prefiks adresu URL do dostępu do plików: `http://localhost:13000/storage/uploads/user/avatar`.