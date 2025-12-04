:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Edytor motywów

> Obecna funkcja motywów jest zaimplementowana w oparciu o Ant Design 5.x. Przed zapoznaniem się z tym dokumentem zalecamy przeczytanie o koncepcji [dostosowywania motywów](https://ant.design/docs/react/customize-theme).

## Wprowadzenie

**Wtyczka** Edytor motywów służy do modyfikowania stylów całej strony front-endowej. Obecnie obsługuje edycję globalnych [SeedToken](https://ant.design/docs/react/customize-theme#seedtoken), [MapToken](https://ant.design/docs/react/customize-theme#maptoken) i [AliasToken](https://ant.design/docs/react/customize-theme#aliastoken), a także umożliwia [przełączanie](https://ant.design/docs/react/customize-theme#use-preset-algorithms) na `tryb ciemny` i `tryb kompaktowy`. W przyszłości może zostać dodana obsługa dostosowywania motywów na [poziomie komponentów](https://ant.design/docs/react/customize-theme#component-level-customization).

## Instrukcja użytkowania

### Włączanie **wtyczki** Edytor motywów

Najpierw zaktualizuj NocoBase do najnowszej wersji (v0.11.1 lub nowszej). Następnie, na stronie zarządzania **wtyczkami**, wyszukaj kartę `Edytor motywów`. Kliknij przycisk `Włącz` w prawym dolnym rogu karty i poczekaj na odświeżenie strony.

![20240409132838](https://static-docs.nocobase.com/20240409132838.png)

### Przechodzenie do strony konfiguracji motywów

Po włączeniu **wtyczki**, kliknij przycisk ustawień w lewym dolnym rogu karty, aby przejść do strony edycji motywów. Domyślnie dostępne są cztery opcje motywów: `Motyw domyślny`, `Motyw ciemny`, `Motyw kompaktowy` i `Motyw kompaktowy ciemny`.

![20240409133020](https://static-docs.nocobase.com/20240409133020.png)

### Dodawanie nowego motywu

Kliknij przycisk `Dodaj nowy motyw` i wybierz `Utwórz zupełnie nowy motyw`. Po prawej stronie strony pojawi się edytor motywów, umożliwiający edycję opcji takich jak `Kolory`, `Rozmiary`, `Style` i inne. Po zakończeniu edycji wprowadź nazwę motywu i kliknij `Zapisz`, aby zakończyć tworzenie motywu.

![20240409133147](https://static-docs.nocobase.com/20240409133147.png)

### Stosowanie nowego motywu

Przesuń kursor myszy w prawy górny róg strony, aby zobaczyć przełącznik motywów. Kliknij go, aby przełączyć się na inne motywy, na przykład na nowo dodany motyw.

![20240409133247](https://static-docs.nocobase.com/20240409133247.png)

### Edycja istniejącego motywu

Kliknij przycisk `Edytuj` w lewym dolnym rogu karty. Po prawej stronie strony pojawi się edytor motywów (taki sam jak przy dodawaniu nowego motywu). Po zakończeniu edycji kliknij `Zapisz`, aby zakończyć modyfikację motywu.

![20240409134413](https://static-docs.nocobase.com/20240409134413.png)

### Ustawianie motywów dostępnych dla użytkowników

Nowo dodane motywy są domyślnie dostępne dla użytkowników. Jeśli nie chcą Państwo, aby użytkownicy mogli przełączać się na dany motyw, należy wyłączyć przełącznik `Dostępny dla użytkownika` w prawym dolnym rogu karty motywu. Uniemożliwi to użytkownikom przełączanie się na ten motyw.

![20240409133331](https://static-docs.nocobase.com/20240409133331.png)

### Ustawianie jako motyw domyślny

Początkowo domyślnym motywem jest `Motyw domyślny`. Aby ustawić konkretny motyw jako domyślny, należy włączyć przełącznik `Motyw domyślny` w prawym dolnym rogu karty tego motywu. Dzięki temu użytkownicy zobaczą ten motyw przy pierwszym otwarciu strony. Uwaga: Motywu domyślnego nie można usunąć.

![20240409133409](https://static-docs.nocobase.com/20240409133409.png)

### Usuwanie motywu

Kliknij przycisk `Usuń` pod kartą, a następnie potwierdź w wyskakującym oknie dialogowym, aby usunąć motyw.

![20240409133435](https://static-docs.nocobase.com/20240409133435.png)