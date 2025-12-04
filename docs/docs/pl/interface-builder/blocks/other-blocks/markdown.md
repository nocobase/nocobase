:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Blok Markdown

## Wprowadzenie

Blok Markdown nie wymaga powiązania ze źródłem danych. Pozwala definiować treści tekstowe za pomocą składni Markdown i jest przeznaczony do wyświetlania sformatowanego tekstu.

## Dodawanie bloku

Mogą Państwo dodać blok Markdown do strony lub wyskakującego okienka.

![20251026230916](https://static-docs.nocobase.com/20251026230916.png)

Mogą Państwo również dodać liniowy (inline-block) blok Markdown w blokach formularzy i szczegółów.

![20251026231002](https://static-docs.nocobase.com/20251026231002.png)

## Silnik szablonów

Wykorzystuje **[silnik szablonów Liquid](https://liquidjs.com/tags/overview.html)**, który zapewnia potężne i elastyczne możliwości renderowania szablonów, co pozwala na dynamiczne generowanie i dostosowywanie wyświetlanej treści. Dzięki silnikowi szablonów mogą Państwo:

- **Dynamiczna interpolacja**: Mogą Państwo używać symboli zastępczych w szablonie do odwoływania się do zmiennych, na przykład `{{ ctx.user.userName }}` jest automatycznie zastępowane odpowiednią nazwą użytkownika.
- **Renderowanie warunkowe**: Obsługuje instrukcje warunkowe (`{% if %}...{% else %}`), wyświetlając różne treści w zależności od stanu danych.
- **Iteracja (pętle)**: Użyj `{% for item in list %}...{% endfor %}`, aby iterować po tablicach lub kolekcjach i generować listy, tabele lub powtarzające się moduły.
- **Wbudowane filtry**: Zapewnia bogaty zestaw filtrów (takich jak `upcase`, `downcase`, `date`, `truncate` itp.) do formatowania i przetwarzania danych.
- **Rozszerzalność**: Obsługuje niestandardowe zmienne i funkcje, dzięki czemu logika szablonów jest wielokrotnego użytku i łatwa w utrzymaniu.
- **Bezpieczeństwo i izolacja**: Renderowanie szablonów odbywa się w środowisku piaskownicy (sandbox), co zapobiega bezpośredniemu wykonywaniu niebezpiecznego kodu i zwiększa bezpieczeństwo.

Dzięki silnikowi szablonów Liquid, deweloperzy i twórcy treści mogą **łatwo osiągnąć dynamiczne wyświetlanie treści, spersonalizowane generowanie dokumentów oraz renderowanie szablonów dla złożonych struktur danych**, co znacząco zwiększa wydajność i elastyczność.

## Używanie zmiennych

Markdown na stronie obsługuje wspólne zmienne systemowe (takie jak bieżący użytkownik, bieżąca rola itp.).

![20251029203252](https://static-docs.nocobase.com/20251029203252.png)

Natomiast Markdown w wyskakującym okienku akcji w wierszu bloku (lub na podstronie) obsługuje więcej zmiennych kontekstu danych (takich jak bieżący rekord, bieżący rekord wyskakującego okienka itp.).

![20251029203400](https://static-docs.nocobase.com/20251029203400.png)

## Kod QR

W Markdownie można konfigurować kody QR.

![20251026230019](https://static-docs.nocobase.com/20251026230019.png)

```html
<qr-code value="https://www.nocobase.com/" type="svg"></qr-code>
```