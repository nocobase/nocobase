---
pkg: '@nocobase/plugin-acl'
---
:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::


# Unia ról

Unia ról to tryb zarządzania uprawnieniami. W zależności od ustawień systemu, deweloperzy mogą wybrać użycie `Ról niezależnych`, `Dopuszczenie unii ról` lub `Wyłącznie unii ról`, aby sprostać różnym wymaganiom dotyczącym uprawnień.

![20250312184651](https://static-docs.nocobase.com/20250312184651.png)

## Niezależne role

Domyślnie system korzysta z niezależnych ról. Użytkownicy muszą przełączać się pomiędzy posiadanymi rolami pojedynczo.

![20250312184729](https://static-docs.nocobase.com/20250312184729.png)
![20250312184826](https://static-docs.nocobase.com/20250312184826.png)

## Dopuszczenie unii ról

Deweloperzy systemu mogą włączyć `Dopuszczenie unii ról`, co pozwala użytkownikom jednocześnie korzystać z uprawnień wszystkich przypisanych ról, a jednocześnie nadal umożliwia im indywidualne przełączanie ról.

![20250312185006](https://static-docs.nocobase.com/20250312185006.png)

## Wyłącznie unia ról

Użytkownicy są zmuszeni do korzystania wyłącznie z unii ról i nie mogą przełączać ról indywidualnie.

![20250312185105](https://static-docs.nocobase.com/20250312185105.png)

## Zasady unii ról

Unia ról nadaje maksymalne uprawnienia ze wszystkich ról. Poniżej wyjaśniono, jak rozstrzygać konflikty uprawnień, gdy role mają różne ustawienia dla tego samego uprawnienia.

### Łączenie uprawnień operacyjnych

Przykład: Rola 1 (role1) jest skonfigurowana tak, aby `umożliwiała konfigurację interfejsu`, a Rola 2 (role2) jest skonfigurowana tak, aby `umożliwiała instalowanie, aktywowanie i wyłączanie wtyczek`.

![20250312190133](https://static-docs.nocobase.com/20250312190133.png)

![20250312190352](https://static-docs.nocobase.com/20250312190352.png)

Po zalogowaniu się z rolą posiadającą **Pełne uprawnienia**, użytkownik będzie miał jednocześnie oba te uprawnienia.

![20250312190621](https://static-docs.nocobase.com/20250312190621.png)

### Łączenie zakresu danych

#### Wiersze danych

Scenariusz 1: Wiele ról ustawia warunki dla tego samego pola

Filtr Roli A: Wiek < 30

| UserID | Name | Age |
| ------ | ---- | --- |
| 1      | Jack | 23  |
| 2      | Lily | 29  |

Filtr Roli B: Wiek > 25

| UserID | Name | Age |
| ------ | ---- | --- |
| 2      | Lily | 29  |
| 3      | Sam  | 32  |

**Po połączeniu:**

| UserID | Name | Age |
| ------ | ---- | --- |
| 1      | Jack | 23  |
| 2      | Lily | 29  |
| 3      | Sam  | 32  |

Scenariusz 2: Różne role ustawiają warunki dla różnych pól

Filtr Roli A: Wiek < 30

| UserID | Name | Age |
| ------ | ---- | --- |
| 1      | Jack | 23  |
| 2      | Lily | 29  |

Filtr Roli B: Nazwa zawiera "Ja"

| UserID | Name   | Age |
| ------ | ------ | --- |
| 1      | Jack   | 23  |
| 3      | Jasmin | 27  |

**Po połączeniu:**

| UserID | Name   | Age |
| ------ | ------ | --- |
| 1      | Jack   | 23  |
| 2      | Lily   | 29  |
| 3      | Jasmin | 27  |

#### Kolumny danych

Widoczne kolumny Roli A: Nazwa, Wiek

| UserID | Name | Age |
| ------ | ---- | --- |
| 1      | Jack | 23  |
| 2      | Lily | 29  |

Widoczne kolumny Roli B: Nazwa, Płeć

| UserID | Name | Sex   |
| ------ | ---- | ----- |
| 1      | Jack | Man   |
| 2      | Lily | Woman |

**Po połączeniu:**

| UserID | Name | Age | Sex   |
| ------ | ---- | --- | ----- |
| 1      | Jack | 23  | Man   |
| 2      | Lily | 29  | Woman |

#### Mieszane wiersze i kolumny

Filtr Roli A: Wiek < 30, kolumny Nazwa, Wiek

| UserID | Name | Age |
| ------ | ---- | --- |
| 1      | Jack | 23  |
| 2      | Lily | 29  |

Filtr Roli B: Nazwa zawiera "Ja", kolumny Nazwa, Płeć

| UserID | Name  | Sex   |
| ------ | ----- | ----- |
| 3      | Jade  | Woman |
| 4      | James | Man   |

**Po połączeniu:**

| UserID | Name  | Age                                              | Sex                                                 |
| ------ | ----- | ------------------------------------------------ | --------------------------------------------------- |
| 1      | Jack  | 23                                               | <span style="background-color:#FFDDDD">Man</span>   |
| 2      | Lily  | 29                                               | <span style="background-color:#FFDDDD">Woman</span> |
| 3      | Jade  | <span style="background-color:#FFDDDD">27</span> | Woman                                               |
| 4      | James | <span style="background-color:#FFDDDD">31</span> | Man                                                 |

**Uwaga:** Komórki oznaczone kolorem czerwonym wskazują dane niewidoczne w poszczególnych rolach, ale widoczne w połączonej roli.

#### Podsumowanie

Zasady łączenia ról w zakresie danych:

1. Pomiędzy wierszami: jeśli którykolwiek warunek jest spełniony, wiersz posiada uprawnienia.
2. Pomiędzy kolumnami: pola są łączone.
3. Gdy wiersze i kolumny są skonfigurowane jednocześnie: wiersze i kolumny są łączone oddzielnie, a nie jako kombinacje (wiersz + kolumna).