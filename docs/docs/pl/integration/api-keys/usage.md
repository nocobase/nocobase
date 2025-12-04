:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Używanie kluczy API w NocoBase

Ten przewodnik pokazuje, jak używać kluczy API w NocoBase do pobierania danych, wykorzystując praktyczny przykład "Listy zadań". Proszę postępować zgodnie z poniższymi instrukcjami krok po kroku, aby zrozumieć cały przepływ pracy.

![202503032004-todo1](https://static-docs.nocobase.com/202503032004-todo1.gif)

## 1 Zrozumienie kluczy API

Klucz API to bezpieczny token, który uwierzytelnia żądania API pochodzące od autoryzowanych użytkowników. Działa jako poświadczenie, które weryfikuje tożsamość osoby wysyłającej żądanie podczas uzyskiwania dostępu do systemu NocoBase za pośrednictwem aplikacji internetowych, mobilnych lub skryptów backendowych.

W nagłówku żądania HTTP format wygląda następująco:

```txt
Authorization: Bearer {API klucz}
```

Prefiks "Bearer" wskazuje, że następujący po nim ciąg znaków to uwierzytelniony klucz API, używany do weryfikacji uprawnień osoby wysyłającej żądanie.

### Częste przypadki użycia

Klucze API są zazwyczaj używane w następujących scenariuszach:

1.  **Dostęp do aplikacji klienckich**: Przeglądarki internetowe i aplikacje mobilne używają kluczy API do uwierzytelniania tożsamości użytkownika, zapewniając, że tylko autoryzowani użytkownicy mogą uzyskać dostęp do danych.
2.  **Automatyzacja zadań**: Procesy działające w tle i zadania cykliczne używają kluczy API do bezpiecznego wykonywania aktualizacji, synchronizacji danych i operacji logowania.
3.  **Rozwój i testowanie**: Deweloperzy używają kluczy API podczas debugowania i testowania, aby symulować uwierzytelnione żądania i weryfikować odpowiedzi API.

Klucze API zapewniają wiele korzyści w zakresie bezpieczeństwa: weryfikację tożsamości, monitorowanie użycia, ograniczanie szybkości żądań i zapobieganie zagrożeniom, co gwarantuje stabilne i bezpieczne działanie NocoBase.

## 2 Tworzenie kluczy API w NocoBase

### 2.1 Aktywacja wtyczki Uwierzytelnianie: Klucze API

Proszę upewnić się, że wbudowana wtyczka [Uwierzytelnianie: Klucze API](/plugins/@nocobase/plugin-api-keys/) jest aktywna. Po jej włączeniu w ustawieniach systemu pojawi się nowa strona konfiguracji kluczy API.

![20250301003106](https://static-docs.nocobase.com/20250301003106.png)

### 2.2 Tworzenie testowej kolekcji

W celach demonstracyjnych proszę utworzyć kolekcję o nazwie `todos` z następującymi polami:

-   `id`
-   `tytuł (title)`
-   `czy ukończono (completed)`

![20250303175632](https://static-docs.nocobase.com/20250303175632.png)

Proszę dodać kilka przykładowych rekordów do kolekcji:

-   jeść
-   spać
-   grać w gry

![20250303180044](https://static-docs.nocobase.com/20250303180044.png)

### 2.3 Tworzenie i przypisywanie roli

Klucze API są powiązane z rolami użytkowników, a system określa uprawnienia do żądań na podstawie przypisanej roli. Przed utworzeniem klucza API należy utworzyć rolę i skonfigurować odpowiednie uprawnienia. Proszę utworzyć rolę o nazwie "Rola API zadań" i nadać jej pełny dostęp do kolekcji `todos`.

![20250303180247](https://static-docs.nocobase.com/20250303180247.png)

Jeśli "Rola API zadań" nie jest dostępna podczas tworzenia klucza API, proszę upewnić się, że bieżący użytkownik ma przypisaną tę rolę:

![20250303180638](https://static-docs.nocobase.com/20250303180638.png)

Po przypisaniu roli proszę odświeżyć stronę i przejść do strony zarządzania kluczami API. Proszę kliknąć "Dodaj klucz API", aby sprawdzić, czy "Rola API zadań" pojawia się w wyborze ról.

![20250303180612](https://static-docs.nocobase.com/20250303180612.png)
![20250303180936](https://static-docs.nocobase.com/20250303180936.png)

Dla lepszej kontroli dostępu, proszę rozważyć utworzenie dedykowanego konta użytkownika (np. "Użytkownik API zadań") specjalnie do zarządzania i testowania kluczy API. Proszę przypisać "Rolę API zadań" temu użytkownikowi.
![20250304134443](https://static-docs.nocobase.com/20250304134443.png)
![20250304134713](https://static-docs.nocobase.com/20250304134713.png)
![20250304134734](https://static-docs.nocobase.com/20250304134734.png)

### 2.4 Generowanie i zapisywanie klucza API

Po przesłaniu formularza system wyświetli komunikat potwierdzający wraz z nowo wygenerowanym kluczem API. **Ważne**: Proszę natychmiast skopiować i bezpiecznie przechowywać ten klucz, ponieważ ze względów bezpieczeństwa nie zostanie on ponownie wyświetlony.

![20250303181130](https://static-docs.nocobase.com/20250303181130.png)

Przykładowy klucz API:

```txt
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVOYW1lIjoidG9kb3MiLCJpYXQiOjE3NDA5OTY1ODAsImV4cCI6MzMyOTg1OTY1ODB9.tXF2FCAzFNgZFPXqSBbWAfEvWkQwz0-mtKnmOTZT-5M
```

### 2.5 Ważne uwagi

-   Okres ważności klucza API jest określany przez ustawienia wygaśnięcia skonfigurowane podczas jego tworzenia.
-   Generowanie i weryfikacja klucza API zależą od zmiennej środowiskowej `APP_KEY`. **Proszę nie modyfikować tej zmiennej**, ponieważ spowoduje to unieważnienie wszystkich istniejących kluczy API w systemie.

## 3 Testowanie uwierzytelniania kluczem API

### 3.1 Używanie wtyczki Dokumentacja API

Proszę otworzyć wtyczkę [Dokumentacja API](/plugins/@nocobase/plugin-api-doc/), aby wyświetlić metody żądań, adresy URL, parametry i nagłówki żądań dla każdego punktu końcowego API.

![20250303181522](https://static-docs.nocobase.com/20250303181522.png)
![20250303181704](https://static-docs.nocobase.com/20250303181704.png)

### 3.2 Zrozumienie podstawowych operacji CRUD

NocoBase udostępnia standardowe API CRUD (Create, Read, Update, Delete) do manipulacji danymi:

-   **Pobieranie listy (interfejs list):**

    ```txt
    GET {baseURL}/{collectionName}:list
    Nagłówek żądania:
    - Authorization: Bearer <klucz API>

    ```
-   **Tworzenie rekordu (interfejs create):**

    ```txt
    POST {baseURL}/{collectionName}:create

    Nagłówek żądania:
    - Authorization: Bearer <klucz API>

    Treść żądania (w formacie JSON), na przykład:
        {
            "title": "123"
        }
    ```
-   **Modyfikacja rekordu (interfejs update):**

    ```txt
    POST {baseURL}/{collectionName}:update?filterByTk={id}
    Nagłówek żądania:
    - Authorization: Bearer <klucz API>

    Treść żądania (w formacie JSON), na przykład:
        {
            "title": "123",
            "completed": true
        }
    ```
-   **Usuwanie rekordu (interfejs delete):**

    ```txt
    POST {baseURL}/{collectionName}:destroy?filterByTk={id}
    Nagłówek żądania:
    - Authorization: Bearer <klucz API>
    ```

Gdzie:
-   `{baseURL}`: Adres URL systemu NocoBase
-   `{collectionName}`: Nazwa kolekcji

Przykład: Dla lokalnej instancji pod `localhost:13000` z kolekcją o nazwie `todos`:

```txt
http://localhost:13000/api/todos:list
```

### 3.3 Testowanie za pomocą Postmana

Proszę utworzyć żądanie GET w Postmanie z następującą konfiguracją:
-   **URL**: Punkt końcowy żądania (np. `http://localhost:13000/api/todos:list`)
-   **Nagłówki**: Proszę dodać nagłówek `Authorization` z wartością:

```txt
Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVOYW1lIjoidG9kb3MiLCJpYXQiOjE3NDA5OTY1ODAsImV4cCI6MzMyOTg1OTY1ODB9.tXF2FCAzFNgZFPXqSBbWAfEvWkQwz0-mtKnmOTZT-5M
```

![20250303182744](https://static-docs.nocobase.com/20250303182744.png)

**Pomyślna odpowiedź:**

```json
{
    "data": [
        {
            "createdAt": "2025-03-03T09:57:36.728Z",
            "updatedAt": "2025-03-03T09:57:36.728Z",
            "completed": null,
            "createdById": 1,
            "id": 1,
            "title": "eat food",
            "updatedById": 1
        }
    ],
    "meta": {
        "count": 1,
        "page": 1,
        "pageSize": 20,
        "totalPage": 1
    }
}
```

**Odpowiedź o błędzie (nieprawidłowy/wygasły klucz API):**

```json
{
    "errors": [
        {
            "message": "Your session has expired. Please sign in again.",
            "code": "INVALID_TOKEN"
        }
    ]
}
```

**Rozwiązywanie problemów**: Jeśli uwierzytelnianie zakończy się niepowodzeniem, proszę zweryfikować uprawnienia roli, powiązanie klucza API i format tokena.

### 3.4 Eksportowanie kodu żądania

Postman umożliwia eksportowanie żądania w różnych formatach. Przykład polecenia cURL:

```txt
curl --location 'http://localhost:13000/api/todos:list' \
--header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVOYW1lIjoidG9kb3MiLCJpYXQiOjE3NDA5OTY1ODAsImV4cCI6MzMyOTg1OTY1ODB9.tXF2FCAzFNgZFPXqSBbWAfEvWkQwz0-mtKnmOTZT-5M'
```

![20250303184912](https://static-docs.nocobase.com/20250303184912.png)
![20250303184953](https://static-docs.nocobase.com/20250303184953.png)

## 4 Używanie kluczy API w bloku JS

NocoBase 2.0 umożliwia pisanie natywnego kodu JavaScript bezpośrednio na stronach za pomocą bloków JS. Ten przykład pokazuje, jak pobierać dane z zewnętrznego API za pomocą kluczy API.

### Tworzenie bloku JS

Na stronie NocoBase proszę dodać blok JS i użyć poniższego kodu do pobrania danych listy zadań:

```javascript
// Pobieranie danych listy zadań za pomocą klucza API
async function fetchTodos() {
  try {
    // Wyświetlanie komunikatu ładowania
    ctx.message.loading('Pobieranie danych...');

    // Ładowanie biblioteki axios do żądań HTTP
    const axios = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js');

    if (!axios) {
      ctx.message.error('Nie udało się załadować biblioteki HTTP');
      return;
    }

    // Klucz API (proszę zastąpić swoim rzeczywistym kluczem API)
    const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVOYW1lIjoidG9kb3MiLCJpYXQiOjE3NDA5OTY1ODAsImV4cCI6MzMyOTg1OTY1ODB9.tXF2FCAzFNgZFPXqSBbWAfEvWkQwz0-mtKnmOTZT-5M';

    // Wysyłanie żądania API
    const response = await axios.get('http://localhost:13000/api/todos:list', {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    // Wyświetlanie wyników
    console.log('Lista zadań:', response.data);
    ctx.message.success(`Pomyślnie pobrano ${response.data.data.length} elementów`);

    // Tutaj można przetwarzać dane
    // Na przykład: wyświetlić w tabeli, zaktualizować pola formularza itp.

  } catch (error) {
    console.error('Błąd podczas pobierania danych:', error);
    ctx.message.error('Nie udało się pobrać danych: ' + error.message);
  }
}

// Wykonanie funkcji
fetchTodos();
```

### Kluczowe punkty

-   **ctx.requireAsync()**: Dynamicznie ładuje zewnętrzne biblioteki (takie jak axios) do obsługi żądań HTTP.
-   **ctx.message**: Wyświetla powiadomienia dla użytkownika (ładowanie, sukces, komunikaty o błędach).
-   **Uwierzytelnianie kluczem API**: Przekazywanie klucza API w nagłówku żądania `Authorization` z prefiksem `Bearer`.
-   **Obsługa odpowiedzi**: Przetwarzanie zwróconych danych zgodnie z potrzebami (wyświetlanie, transformacja itp.).

## 5 Podsumowanie

Ten przewodnik omówił kompletny przepływ pracy związany z używaniem kluczy API w NocoBase:

1.  **Konfiguracja początkowa**: Aktywacja wtyczki Klucze API i tworzenie testowej kolekcji.
2.  **Konfiguracja**: Tworzenie ról z odpowiednimi uprawnieniami i generowanie kluczy API.
3.  **Testowanie**: Walidacja uwierzytelniania kluczem API za pomocą Postmana i wtyczki Dokumentacja API.
4.  **Integracja**: Używanie kluczy API w blokach JS.

![202503031942-todo](https://static-docs.nocobase.com/202503031942-todo.gif)

**Dodatkowe zasoby:**
-   [Dokumentacja wtyczki Klucze API](/plugins/@nocobase/plugin-api-keys/)
-   [Wtyczka Dokumentacja API](/plugins/@nocobase/plugin-api-doc/)