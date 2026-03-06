:::tip{title="Powiadomienie o tłumaczeniu AI"}
Ten dokument został przetłumaczony przez AI. Aby uzyskać dokładne informacje, zapoznaj się z [wersją angielską](/system-management/localization/index).
:::

# Zarządzanie lokalizacją

## Wprowadzenie

Wtyczka Zarządzanie lokalizacją służy do zarządzania i wdrażania zasobów lokalizacyjnych NocoBase. Umożliwia tłumaczenie menu systemowych, kolekcji, pól oraz wszystkich wtyczek, aby dostosować je do języka i kultury określonych regionów.

## Instalacja

Ta wtyczka jest wbudowana i nie wymaga dodatkowej instalacji.

## Instrukcja użytkowania

### Aktywacja wtyczki

![](https://static-docs.nocobase.com/d16f6ecd6bfb8d1e8acff38f23ad37f8.png)

### Przejście do strony zarządzania lokalizacją

<img src="https://static-docs.nocobase.com/202404202134187.png"/>

### Synchronizacja haseł tłumaczeniowych

<img src="https://static-docs.nocobase.com/202404202134850.png"/>

Obecnie obsługiwana jest synchronizacja następujących treści:

- Lokalne pakiety językowe systemu i wtyczek
- Tytuły kolekcji, tytuły pól i etykiety opcji pól
- Tytuły menu

Po zakończeniu synchronizacji system wyświetli listę wszystkich haseł do przetłumaczenia dla bieżącego języka.

<img src="https://static-docs.nocobase.com/202404202136567.png"/>

:::info{title=Wskazówka}
Różne moduły mogą zawierać te same hasła źródłowe, które należy przetłumaczyć oddzielnie.
:::

### Automatyczne tworzenie haseł

Podczas edycji strony niestandardowe teksty w poszczególnych blokach automatycznie utworzą odpowiednie hasła i jednocześnie wygenerują treść tłumaczenia dla bieżącego języka.

![](https://static-docs.nocobase.com/Localization-02-12-2026_08_39_AM.png)

![](https://static-docs.nocobase.com/Localization-NocoBase-02-12-2026_08_39_AM.png)

:::info{title=Wskazówka}
Podczas definiowania tekstu w kodzie należy ręcznie określić ns (przestrzeń nazw), np.: `${ctx.i18n.t('My custom js block', { ns: 'lm-flow-engine' })}`
:::


### Edycja treści tłumaczenia

<img src="https://static-docs.nocobase.com/202404202142836.png"/>

### Publikowanie tłumaczeń

Po zakończeniu tłumaczenia należy kliknąć przycisk „Publikuj”, aby zmiany weszły w życie.

<img src="https://static-docs.nocobase.com/202404202143135.png"/>

### Tłumaczenie na inne języki

W „Ustawieniach systemowych” należy włączyć inne języki, na przykład chiński uproszczony.

![](https://static-docs.nocobase.com/618830967aaeb643c892fce355d59a73.png)

Należy przełączyć się na to środowisko językowe.

<img src="https://static-docs.nocobase.com/202404202144789.png"/>

Należy zsynchronizować hasła.

<img src="https://static-docs.nocobase.com/202404202145877.png"/>

Należy przetłumaczyć i opublikować.

<img src="https://static-docs.nocobase.com/202404202143135.png"/>