:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Zaawansowane

## Wprowadzenie

Główne modele dużych języków (LLM) posiadają zdolność do korzystania z narzędzi. Wtyczka AI employee (pracownik AI) zawiera wbudowane, często używane narzędzia, z których mogą korzystać te modele.

Umiejętności skonfigurowane na stronie ustawień pracownika AI to narzędzia dostępne dla modelu dużego języka.

![20251022142348](https://static-docs.nocobase.com/20251022142348.png)

## Ustawianie umiejętności

Proszę przejść do strony konfiguracji wtyczki pracownika AI, a następnie kliknąć zakładkę `AI employees`, aby otworzyć stronę zarządzania pracownikami AI.

Proszę wybrać pracownika AI, dla którego chce Pan/Pani ustawić umiejętności, a następnie kliknąć przycisk `Edit`, aby przejść do strony edycji pracownika AI.

Na zakładce `Skills` proszę kliknąć przycisk `Add Skill`, aby dodać umiejętność dla bieżącego pracownika AI.

![20251022145748](https://static-docs.nocobase.com/20251022145748.png)

## Wprowadzenie do umiejętności

### Frontend

Grupa Frontend umożliwia pracownikowi AI interakcję z komponentami front-endowymi.

- Umiejętność `Form filler` pozwala pracownikowi AI na wypełnianie wygenerowanymi danymi formularza do formularza wskazanego przez użytkownika.

![20251022145954](https://static-docs.nocobase.com/20251022145954.png)

### Data modeling

Grupa umiejętności Data modeling (modelowanie danych) daje pracownikowi AI możliwość wywoływania wewnętrznych interfejsów API NocoBase w celu modelowania danych.

- `Intent Router` (router intencji) – kieruje intencjami, określając, czy użytkownik chce zmodyfikować strukturę **kolekcji**, czy utworzyć nową.
- `Get collection names` – pobiera nazwy wszystkich istniejących **kolekcji** w systemie.
- `Get collection metadata` – pobiera informacje o strukturze określonej **kolekcji**.
- `Define collections` – umożliwia pracownikowi AI tworzenie **kolekcji** w systemie.

![20251022150441](https://static-docs.nocobase.com/20251022150441.png)

### Workflow caller

`Workflow caller` (wywołujący **przepływ pracy**) daje pracownikowi AI możliwość wykonywania **przepływów pracy**. **Przepływy pracy** skonfigurowane we **wtyczce** **przepływów pracy** z `Trigger type` ustawionym na `AI employee event` będą dostępne tutaj jako umiejętności dla pracownika AI.

![20251022153320](https://static-docs.nocobase.com/20251022153320.png)

### Code Editor

Umiejętności w grupie Code Editor (edytor kodu) głównie umożliwiają pracownikowi AI interakcję z edytorem kodu.

- `Get code snippet list` – pobiera listę predefiniowanych fragmentów kodu.
- `Get code snippet content` – pobiera zawartość określonego fragmentu kodu.

![20251022153811](https://static-docs.nocobase.com/20251022153811.png)

### Inne

- `Chart generator` (generator wykresów) – daje pracownikowi AI możliwość generowania wykresów i bezpośredniego ich wyświetlania w konwersacji.

![20251022154141](https://static-docs.nocobase.com/20251022154141.png)