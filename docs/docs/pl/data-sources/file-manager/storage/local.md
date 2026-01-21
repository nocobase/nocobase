:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Lokalna pamięć masowa

Przesłane pliki będą zapisywane w lokalnym katalogu na serwerze. Jest to odpowiednie dla scenariuszy, w których całkowita liczba plików zarządzanych przez system jest stosunkowo niewielka, lub dla celów eksperymentalnych.

## Opcje

![Przykład opcji silnika pamięci masowej plików](https://static-docs.nocobase.com/20240529115151.png)

:::info{title=Uwaga}
W tej sekcji omówiono wyłącznie specyficzne opcje dla silnika lokalnej pamięci masowej. W przypadku parametrów ogólnych proszę zapoznać się z [Ogólnymi parametrami silnika](./index.md#general-engine-parameters).
:::

### Ścieżka

Ścieżka reprezentuje zarówno względną ścieżkę pliku przechowywanego na serwerze, jak i ścieżkę dostępu URL. Na przykład, „`user/avatar`” (bez początkowego i końcowego „`/`”) oznacza:

1. Względna ścieżka przesłanego pliku przechowywanego na serwerze: `/path/to/nocobase-app/storage/uploads/user/avatar`.
2. Prefiks URL do dostępu do pliku: `http://localhost:13000/storage/uploads/user/avatar`.