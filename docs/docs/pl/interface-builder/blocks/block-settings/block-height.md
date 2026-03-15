:::tip{title="Powiadomienie o tłumaczeniu AI"}
Ten dokument został przetłumaczony przez AI. Aby uzyskać dokładne informacje, zapoznaj się z [wersją angielską](/interface-builder/blocks/block-settings/block-height).
:::

# Wysokość bloku

## Wprowadzenie

Wysokość bloku obsługuje trzy tryby: **Wysokość domyślna**, **Określona wysokość** oraz **Pełna wysokość**. Większość bloków obsługuje ustawienia wysokości.

![20260211153947](https://static-docs.nocobase.com/20260211153947.png)

![20260211154020](https://static-docs.nocobase.com/20260211154020.png)

## Tryby wysokości

### Wysokość domyślna

Strategia domyślnej wysokości różni się w zależności od typu bloku. Na przykład bloki tabeli i formularza automatycznie dostosowują swoją wysokość do zawartości, a wewnątrz bloku nie pojawiają się paski przewijania.

### Określona wysokość

Mogą Państwo ręcznie określić całkowitą wysokość zewnętrznej ramy bloku. Blok automatycznie obliczy i przydzieli dostępną wysokość wewnętrznie.

![20260211154043](https://static-docs.nocobase.com/20260211154043.gif)

### Pełna wysokość

Tryb pełnej wysokości jest podobny do określonej wysokości, ale wysokość bloku jest obliczana na podstawie bieżącego **obszaru roboczego** (viewport) przeglądarki, aby uzyskać maksymalną wysokość pełnoekranową. Paski przewijania nie pojawią się na stronie przeglądarki; paski przewijania pojawią się wyłącznie wewnątrz bloku.

Obsługa wewnętrznego przewijania w trybie pełnej wysokości różni się nieco w zależności od bloku:

- **Tabela**: Wewnętrzne przewijanie w obrębie `tbody`;
- **Formularz / Szczegóły**: Wewnętrzne przewijanie w obrębie siatki (przewijanie zawartości z wyłączeniem obszaru akcji);
- **Lista / Karta siatki**: Wewnętrzne przewijanie w obrębie siatki (przewijanie zawartości z wyłączeniem obszaru akcji i paska paginacji);
- **Mapa / Kalendarz**: Ogólna wysokość adaptacyjna, brak pasków przewijania;
- **Iframe / Markdown**: Ogranicza całkowitą wysokość ramy bloku, a paski przewijania pojawiają się wewnątrz bloku.

#### Tabela o pełnej wysokości

![20260211154204](https://static-docs.nocobase.com/20260211154204.gif)

#### Formularz o pełnej wysokości

![20260211154335](https://static-docs.nocobase.com/20260211154335.gif)