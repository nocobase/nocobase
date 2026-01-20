---
pkg: "@nocobase/plugin-ai-ee"
---
:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::


# Rozmowa multimodalna

## Obrazy

Jeśli model to obsługuje, węzeł LLM może wysyłać obrazy do modelu. Podczas korzystania z tej funkcji, należy wybrać pole załącznika lub powiązany rekord kolekcji plików za pomocą zmiennej. Przy wyborze rekordu kolekcji plików, mogą Państwo wybrać go na poziomie obiektu lub wskazać pole URL.

![](https://static-docs.nocobase.com/202503041034858.png)

Mają Państwo do wyboru dwie opcje formatu wysyłania obrazów:

- Wysyłanie za pomocą URL – Wszystkie obrazy, z wyjątkiem tych przechowywanych lokalnie, będą wysyłane jako adresy URL. Obrazy przechowywane lokalnie zostaną przekonwertowane do formatu base64 przed wysłaniem.
- Wysyłanie za pomocą base64 – Wszystkie obrazy, niezależnie od tego, czy są przechowywane lokalnie, czy w chmurze, będą wysyłane w formacie base64. Jest to przydatne w sytuacjach, gdy adres URL obrazu nie może być bezpośrednio dostępny dla internetowej usługi LLM.

![](https://static-docs.nocobase.com/202503041200638.png)