---
pkg: "@nocobase/plugin-data-source-rest-api"
---
:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::



pkg: "@nocobase/plugin-data-source-rest-api"
---

# Źródło danych REST API

## Wprowadzenie

Ten plugin pozwala na integrację danych pochodzących ze źródeł REST API.

## Instalacja

Ta wtyczka jest komercyjna, dlatego wymaga przesłania i aktywacji za pośrednictwem menedżera wtyczek.

![20240323162741](https://static-docs.nocobase.com/20240323162741.png)

## Dodawanie źródła danych REST API

Po aktywacji wtyczki mogą Państwo dodać źródło danych REST API, wybierając je z rozwijanego menu „Add new” w sekcji zarządzania źródłami danych.

![20240721171420](https://static-docs.nocobase.com/20240721171420.png)

Proszę skonfigurować źródło danych REST API.

![20240721171507](https://static-docs.nocobase.com/20240721171507.png)

## Dodawanie kolekcji

W NocoBase zasób RESTful jest mapowany na kolekcję, na przykład zasób Użytkownicy.

```bash
GET /users
POST /users
GET /users/1
PUT /users/1
DELETE /users/1
```

Te punkty końcowe API są mapowane w NocoBase w następujący sposób:

```bash
GET /users:list
POST /users:create
POST /users:get?filterByTk=1
POST /users:update?filterByTk=1
POST /users:destroy?filterByTk=1
```

Aby uzyskać kompleksowy przewodnik po specyfikacjach projektowania API NocoBase, proszę zapoznać się z dokumentacją API.

![20240716213344](https://static-docs.nocobase.com/20240716213344.png)

Szczegółowe informacje znajdą Państwo w rozdziale „NocoBase API - Core”.

![20240716213258](https://static-docs.nocobase.com/20240716213258.png)

Konfiguracja kolekcji dla źródła danych REST API obejmuje następujące elementy:

### Lista

Proszę zmapować interfejs do przeglądania listy zasobów.

![20240716211351](https://static-docs.nocobase.com/20240716211351.png)

### Pobierz

Proszę zmapować interfejs do przeglądania szczegółów zasobu.

![20240716211532](https://static-docs.nocobase.com/20240716211532.png)

### Utwórz

Proszę zmapować interfejs do tworzenia zasobu.

![20240716211634](https://static-docs.nocobase.com/20240716211634.png)

### Zaktualizuj

Proszę zmapować interfejs do aktualizacji zasobu.
![20240716211733](https://static-docs.nocobase.com/20240716211733.png)

### Usuń

Proszę zmapować interfejs do usuwania zasobu.

![20240716211808](https://static-docs.nocobase.com/20240716211808.png)

Interfejsy Lista i Pobierz są obowiązkowe do skonfigurowania.

## Debugowanie API

### Integracja parametrów żądania

Przykład: Proszę skonfigurować parametry stronicowania dla interfejsu API Listy. Jeśli zewnętrzne API nie obsługuje stronicowania natywnie, NocoBase będzie stronicować na podstawie pobranych danych listy.

![20241121205229](https://static-docs.nocobase.com/20241121205229.png)

Proszę pamiętać, że tylko zmienne dodane w interfejsie będą aktywne.

| Nazwa parametru API zewnętrznego | Parametr NocoBase           |
| -------------------------------- | --------------------------- |
| page                             | {{request.params.page}}     |
| limit                            | {{request.params.pageSize}} |

Mogą Państwo kliknąć „Try it out”, aby debugować i wyświetlić odpowiedź.

![20241121210320](https://static-docs.nocobase.com/20241121210320.png)

<video width="100%" height="440" controls>
      <source src="https://static-docs.nocobase.com/20241121211034.mp4" type="video/mp4">
</video>

### Transformacja formatu odpowiedzi

Format odpowiedzi zewnętrznego API może nie być zgodny ze standardem NocoBase, dlatego wymaga transformacji, aby mógł być poprawnie wyświetlony w interfejsie użytkownika.

![20241121214638](https://static-docs.nocobase.com/20241121214638.png)

Proszę dostosować reguły konwersji na podstawie formatu odpowiedzi zewnętrznego API, aby upewnić się, że wynik jest zgodny ze standardem wyjściowym NocoBase.

![20241121215100](https://static-docs.nocobase.com/20241121215100.png)

Opis procesu debugowania

![20240717110051](https://static-docs.nocobase.com/20240717110051.png)

## Zmienne

Źródło danych REST API udostępnia trzy typy zmiennych do integracji z interfejsami API:

- Niestandardowe zmienne źródła danych
- Zmienne żądania NocoBase
- Zmienne odpowiedzi zewnętrznych API

### Niestandardowe zmienne źródła danych

![20240716221937](https://static-docs.nocobase.com/20240716221937.png)

![20240716221858](https://static-docs.nocobase.com/20240716221858.png)

### Żądanie NocoBase

- Params: Parametry zapytania URL (Search Params), które różnią się w zależności od interfejsu;
- Headers: Niestandardowe nagłówki żądania, głównie dostarczające specyficzne informacje X- od NocoBase;
- Body: Treść żądania;
- Token: Token API dla bieżącego żądania NocoBase.

![20240716222042](https://static-docs.nocobase.com/20240716222042.png)

### Odpowiedzi zewnętrznych API

Obecnie dostępna jest tylko treść odpowiedzi.

![20240716222303](https://static-docs.nocobase.com/20240716222303.png)

Poniżej przedstawiono zmienne dostępne dla każdego interfejsu:

### Lista

| Parametr                | Opis                                                       |
| ----------------------- | ---------------------------------------------------------- |
| request.params.page     | Bieżąca strona                                             |
| request.params.pageSize | Liczba elementów na stronę                                 |
| request.params.filter   | Kryteria filtrowania (muszą być zgodne z formatem filtra NocoBase) |
| request.params.sort     | Kryteria sortowania (muszą być zgodne z formatem sortowania NocoBase) |
| request.params.appends  | Pola do ładowania na żądanie, zazwyczaj dla pól powiązań   |
| request.params.fields   | Pola do uwzględnienia (biała lista)                       |
| request.params.except   | Pola do wykluczenia (czarna lista)                         |

### Pobierz

| Parametr                  | Opis                                                       |
| ------------------------- | ---------------------------------------------------------- |
| request.params.filterByTk | Wymagane, zazwyczaj ID bieżącego rekordu                   |
| request.params.filter     | Kryteria filtrowania (muszą być zgodne z formatem filtra NocoBase) |
| request.params.appends    | Pola do ładowania na żądanie, zazwyczaj dla pól powiązań   |
| request.params.fields     | Pola do uwzględnienia (biała lista)                       |
| request.params.except     | Pola do wykluczenia (czarna lista)                         |

### Utwórz

| Parametr                 | Opis                      |
| ------------------------ | ------------------------- |
| request.params.whiteList | Biała lista               |
| request.params.blacklist | Czarna lista              |
| request.body             | Początkowe dane do utworzenia |

### Zaktualizuj

| Parametr                  | Opis                                               |
| ------------------------- | -------------------------------------------------- |
| request.params.filterByTk | Wymagane, zazwyczaj ID bieżącego rekordu           |
| request.params.filter     | Kryteria filtrowania (muszą być zgodne z formatem filtra NocoBase) |
| request.params.whiteList  | Biała lista                                        |
| request.params.blacklist  | Czarna lista                                       |
| request.body              | Dane do aktualizacji                               |

### Usuń

| Parametr                  | Opis                                               |
| ------------------------- | -------------------------------------------------- |
| request.params.filterByTk | Wymagane, zazwyczaj ID bieżącego rekordu           |
| request.params.filter     | Kryteria filtrowania (muszą być zgodne z formatem filtra NocoBase) |

## Konfiguracja pól

Metadane pól (Fields) są wyodrębniane z danych interfejsu CRUD dostosowanego zasobu i służą jako pola kolekcji.

![20240716223636](https://static-docs.nocobase.com/20240716223636.png)

Wyodrębnianie metadanych pól.

![20241121230436](https://static-docs.nocobase.com/20241121230436.png)

Pola i podgląd.

![20240716224403](https://static-docs.nocobase.com/20240716224403.png)

Edycja pól (podobnie jak w przypadku innych źródeł danych).

![20240716224704](https://static-docs.nocobase.com/20240716224704.png)

## Dodawanie bloków źródła danych REST API

Po skonfigurowaniu kolekcji mogą Państwo dodać bloki do interfejsu.

![20240716225120](https://static-docs.nocobase.com/20240716225120.png)