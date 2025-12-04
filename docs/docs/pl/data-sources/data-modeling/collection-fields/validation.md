:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Walidacja pól
Aby zapewnić dokładność, bezpieczeństwo i spójność danych w **kolekcjach**, NocoBase oferuje funkcję walidacji pól. Funkcja ta składa się z dwóch głównych części: konfiguracji reguł oraz ich zastosowania.

## Konfiguracja reguł

![20250819181342](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819181342.png)

Pola systemowe NocoBase integrują reguły [Joi](https://joi.dev/api/), a ich obsługa przedstawia się następująco:

### Typ tekstowy (String)
Typy tekstowe (string) Joi odpowiadają w NocoBase następującym typom pól: Tekst jednowierszowy, Tekst wielowierszowy, Numer telefonu, E-mail, URL, Hasło oraz UUID.
#### Reguły ogólne
- Minimalna długość
- Maksymalna długość
- Długość
- Wzorzec (Wyrażenie regularne)
- Wymagane

#### E-mail

![20250819192011](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819192011.png)

[Zobacz więcej opcji](https://joi.dev/api/?v=17.13.3#stringemailoptions)

#### URL

![20250819192409](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819192409.png)

[Zobacz więcej opcji](https://joi.dev/api/?v=17.13.3#stringurioptions)

#### UUID

![20250819192731](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819192731.png)

[Zobacz więcej opcji](https://joi.dev/api/?v=17.13.3#stringguid---aliases-uuid)

### Typ liczbowy
Typy liczbowe Joi odpowiadają w NocoBase następującym typom pól: Liczba całkowita, Liczba oraz Procent.
#### Reguły ogólne
- Większe niż
- Mniejsze niż
- Wartość maksymalna
- Wartość minimalna
- Wielokrotność

#### Liczba całkowita
Oprócz reguł ogólnych, pola typu Liczba całkowita dodatkowo obsługują [walidację liczb całkowitych](https://joi.dev/api/?v=17.13.3#numberinteger) oraz [walidację niebezpiecznych liczb całkowitych](https://joi.dev/api/?v=17.13.3#numberunsafeenabled).

![20250819193758](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819193758.png)

#### Liczba i Procent
Oprócz reguł ogólnych, pola typu Liczba i Procent dodatkowo obsługują [walidację precyzji](https://joi.dev/api/?v=17.13.3#numberinteger).

![20250819193954](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819193954.png)

### Typ daty
Typy dat Joi odpowiadają w NocoBase następującym typom pól: Data (ze strefą czasową), Data (bez strefy czasowej), Tylko data oraz Znacznik czasu Unix.

Obsługiwane reguły walidacji:
- Większe niż
- Mniejsze niż
- Wartość maksymalna
- Wartość minimalna
- Walidacja formatu znacznika czasu
- Wymagane

### Pola powiązane
Pola powiązane obsługują jedynie walidację wymaganą. Należy pamiętać, że walidacja wymaganego pola powiązanego nie jest obecnie obsługiwana w scenariuszach podformularzy ani podtabel.

![20250819184344](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819184344.png)

## Zastosowanie reguł walidacji
Po skonfigurowaniu reguł dla pól, odpowiednie reguły walidacji zostaną uruchomione podczas dodawania lub modyfikowania danych.

![20250819201027](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819201027.png)

Reguły walidacji mają również zastosowanie do komponentów podtabel i podformularzy:

![20250819202514](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819202514.png)

![20250819202357](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819202357.png)

Należy pamiętać, że w scenariuszach podformularzy lub podtabel walidacja wymaganego pola powiązanego nie jest skuteczna.

![20250819203016](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819203016.png)

## Różnice w stosunku do walidacji pól po stronie klienta
Walidacja pól po stronie klienta i serwera ma zastosowanie w różnych scenariuszach. Istnieją znaczące różnice w sposobie ich implementacji oraz momencie uruchamiania reguł, dlatego należy nimi zarządzać oddzielnie.

### Różnice w metodzie konfiguracji
- **Walidacja po stronie klienta**: Reguły konfiguruje się w formularzach edycji (jak pokazano na poniższym rysunku).
- **Walidacja pól po stronie serwera**: Reguły pól ustawia się w konfiguracji **źródła danych** → **kolekcji**.

![20250819203836](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819203836.png)

![20250819203845](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819203845.png)

### Różnice w momencie uruchamiania walidacji
- **Walidacja po stronie klienta**: Uruchamia walidację w czasie rzeczywistym, gdy użytkownicy wypełniają pola, i natychmiast wyświetla komunikaty o błędach.
- **Walidacja pól po stronie serwera**: Po przesłaniu danych, serwer przeprowadza walidację przed ich zapisaniem, a komunikaty o błędach są zwracane w odpowiedziach API.
- **Zakres zastosowania**: Walidacja pól po stronie serwera działa nie tylko podczas przesyłania formularzy, ale także we wszystkich scenariuszach związanych z dodawaniem lub modyfikowaniem danych, takich jak **przepływy pracy** czy import danych.
- **Komunikaty o błędach**: Walidacja po stronie klienta obsługuje niestandardowe komunikaty o błędach, natomiast walidacja po stronie serwera obecnie ich nie obsługuje.