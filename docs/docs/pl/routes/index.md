---
pkg: "@nocobase/plugin-client"
---
:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::



# Menedżer tras

## Wprowadzenie

Menedżer tras to narzędzie służące do zarządzania trasami głównych stron systemu. Obsługuje zarówno urządzenia `stacjonarne`, jak i `mobilne`. Trasy utworzone za pomocą menedżera tras są automatycznie synchronizowane z menu (można je skonfigurować tak, aby nie były wyświetlane w menu). Analogicznie, pozycje menu dodane w menu strony również pojawią się na liście menedżera tras.

![20250107115449](https://static-docs.nocobase.com/20250107115449.png)

## Instrukcja obsługi

### Typy tras

System obsługuje cztery typy tras:

- Grupa (`group`): Służy do grupowania tras i może zawierać trasy podrzędne.
- Strona (`page`): Wewnętrzna strona systemu.
- Zakładka (`tab`): Typ trasy używany do przełączania między zakładkami wewnątrz strony.
- Link (`link`): Link wewnętrzny lub zewnętrzny, który umożliwia bezpośrednie przejście do skonfigurowanego adresu URL.

### Dodawanie tras

Aby utworzyć nową trasę, proszę kliknąć przycisk „Add new” w prawym górnym rogu:

1. Wybierz typ trasy (`Type`).
2. Wprowadź tytuł trasy (`Title`).
3. Wybierz ikonę trasy (`Icon`).
4. Ustaw, czy trasa ma być wyświetlana w menu (`Show in menu`).
5. Ustaw, czy włączyć zakładki strony (`Enable page tabs`).
6. W przypadku typu strony system automatycznie wygeneruje unikalną ścieżkę trasy (`Path`).

![20250124131803](https://static-docs.nocobase.com/20250124131803.png)

### Operacje na trasach

Każdy wpis trasy obsługuje następujące operacje:

- Add child: Dodaj trasę podrzędną.
- Edit: Edytuj konfigurację trasy.
- View: Wyświetl stronę trasy.
- Delete: Usuń trasę.

### Operacje zbiorcze

Górny pasek narzędzi oferuje następujące funkcje operacji zbiorczych:

- Refresh: Odśwież listę tras.
- Delete: Usuń wybrane trasy.
- Hide in menu: Ukryj wybrane trasy w menu.
- Show in menu: Pokaż wybrane trasy w menu.

### Filtrowanie tras

Funkcja „Filter” na górze umożliwia filtrowanie listy tras zgodnie z Państwa potrzebami.

:::info{title=Wskazówka}
Modyfikacja konfiguracji tras bezpośrednio wpływa na strukturę menu nawigacyjnego systemu. Proszę postępować ostrożnie i upewnić się, że konfiguracja tras jest poprawna.
:::