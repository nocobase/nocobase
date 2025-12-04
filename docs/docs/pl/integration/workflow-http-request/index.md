:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Integracja przepływu pracy z żądaniami HTTP

Dzięki węzłowi żądania HTTP, przepływy pracy NocoBase mogą aktywnie wysyłać żądania do dowolnej usługi HTTP, umożliwiając wymianę danych i integrację biznesową z systemami zewnętrznymi.

## Przegląd

Węzeł żądania HTTP to kluczowy komponent integracyjny w przepływach pracy, który umożliwia wywoływanie zewnętrznych API, interfejsów usług wewnętrznych lub innych usług internetowych podczas wykonywania przepływu pracy, aby pobierać dane lub wyzwalać zewnętrzne operacje.

## Typowe scenariusze użycia

### Pobieranie danych

- **Zapytania do danych zewnętrznych**: Pobieranie danych w czasie rzeczywistym z API pogodowych, API kursów walut itp.
- **Rozwiązywanie adresów**: Wywoływanie API usług mapowych w celu analizy adresów i geokodowania.
- **Synchronizacja danych firmowych**: Pobieranie danych o klientach, zamówieniach itp. z systemów CRM i ERP.

### Wyzwalacze biznesowe

- **Wysyłanie powiadomień**: Wywoływanie usług SMS, e-mail, WeCom w celu wysyłania powiadomień.
- **Żądania płatności**: Inicjowanie płatności, zwrotów itp. za pośrednictwem bramek płatności.
- **Przetwarzanie zamówień**: Przesyłanie listów przewozowych, sprawdzanie statusu przesyłek w systemach logistycznych.

### Integracja systemów

- **Wywoływanie mikroserwisów**: Wywoływanie API innych usług w architekturach mikroserwisowych.
- **Raportowanie danych**: Przesyłanie danych biznesowych do platform analitycznych i systemów monitorowania.
- **Usługi zewnętrzne**: Integracja usług AI, rozpoznawania OCR, syntezy mowy itp.

### Automatyzacja

- **Zadania cykliczne**: Okresowe wywoływanie zewnętrznych API w celu synchronizacji danych.
- **Reagowanie na zdarzenia**: Automatyczne wywoływanie zewnętrznych API w przypadku zmian danych w celu powiadomienia powiązanych systemów.
- **Przepływy pracy zatwierdzania**: Przesyłanie żądań zatwierdzenia za pośrednictwem API systemu zatwierdzania.

## Funkcje

### Pełna obsługa HTTP

- Obsługa wszystkich metod HTTP: GET, POST, PUT, PATCH, DELETE.
- Niestandardowe nagłówki żądań (Headers).
- Wiele formatów danych: JSON, dane formularzy, XML itp.
- Różne typy parametrów: parametry URL, parametry ścieżki, treść żądania itp.

### Elastyczne przetwarzanie danych

- **Odwołania do zmiennych**: Dynamiczne konstruowanie żądań za pomocą zmiennych przepływu pracy.
- **Parsowanie odpowiedzi**: Automatyczne parsowanie odpowiedzi JSON i ekstrakcja wymaganych danych.
- **Transformacja danych**: Konwersja formatów danych żądań i odpowiedzi.
- **Obsługa błędów**: Konfiguracja strategii ponawiania, ustawień limitu czasu, logiki obsługi błędów.

### Uwierzytelnianie bezpieczeństwa

- **Basic Auth**: Podstawowe uwierzytelnianie HTTP.
- **Bearer Token**: Uwierzytelnianie tokenem.
- **API Key**: Niestandardowe uwierzytelnianie kluczem API.
- **Niestandardowe nagłówki**: Obsługa dowolnej metody uwierzytelniania.

## Kroki użycia

### 1. Sprawdź, czy wtyczka jest włączona

Węzeł żądania HTTP to wbudowana funkcja wtyczki przepływu pracy. Upewnij się, że wtyczka **[Przepływ pracy](/plugins/@nocobase/plugin-workflow/)** jest włączona.

### 2. Dodaj węzeł żądania HTTP do przepływu pracy

1. Utwórz lub edytuj przepływ pracy.
2. Dodaj węzeł **Żądanie HTTP** w wybranym miejscu.

![Żądanie HTTP - Dodaj węzeł](https://static-docs.nocobase.com/46f2a6fc3f6869c80f8fbd362a54e644.png)

3. Skonfiguruj parametry żądania.

### 3. Konfiguracja parametrów żądania

![Węzeł żądania HTTP - Konfiguracja](https://static-docs.nocobase.com/2fcb29af66b892fa704add52e2974a52.png)

#### Podstawowa konfiguracja

- **URL żądania**: Adres docelowego API, obsługuje zmienne.
  ```
  https://api.example.com/users/{{$context.userId}}
  ```

- **Metoda żądania**: Wybierz GET, POST, PUT, DELETE itp.

- **Nagłówki żądania**: Skonfiguruj nagłówki HTTP.
  ```json
  {
    "Content-Type": "application/json",
    "Authorization": "Bearer {{$context.apiKey}}"
  }
  ```

- **Parametry żądania**:
  - **Parametry zapytania (Query)**: Parametry zapytania URL.
  - **Parametry treści (Body)**: Dane treści żądania (POST/PUT).

#### Zaawansowana konfiguracja

- **Limit czasu**: Ustaw limit czasu żądania (domyślnie 30 sekund).
- **Ponawianie w przypadku awarii**: Skonfiguruj liczbę ponowień i interwał między ponowieniami.
- **Ignoruj awarię**: Przepływ pracy będzie kontynuowany nawet w przypadku niepowodzenia żądania.
- **Ustawienia proxy**: Skonfiguruj proxy HTTP (jeśli jest wymagane).

### 4. Użycie danych odpowiedzi

Po wykonaniu węzła żądania HTTP, dane odpowiedzi mogą być użyte w kolejnych węzłach:

- `{{$node.data.status}}`: Kod statusu HTTP.
- `{{$node.data.headers}}`: Nagłówki odpowiedzi.
- `{{$node.data.data}}`: Dane treści odpowiedzi.
- `{{$node.data.error}}`: Komunikat o błędzie (jeśli żądanie się nie powiodło).

![Węzeł żądania HTTP - Użycie odpowiedzi](https://static-docs.nocobase.com/20240529110610.png)

## Przykładowe scenariusze

### Przykład 1: Pobieranie informacji o pogodzie

```javascript
// Konfiguracja
URL: https://api.weather.com/v1/current
Method: GET
Query Parameters:
  city: {{$context.city}}
  key: your-api-key

// Użycie odpowiedzi
Temperature: {{$node.data.data.temperature}}
Weather: {{$node.data.data.condition}}
```

### Przykład 2: Wysyłanie wiadomości WeCom

```javascript
// Konfiguracja
URL: https://qyapi.weixin.qq.com/cgi-bin/message/send
Method: POST
Headers:
  Content-Type: application/json
Body:
{
  "touser": "{{$context.userId}}",
  "msgtype": "text",
  "agentid": 1000001,
  "text": {
    "content": "Zamówienie {{$context.orderId}} zostało wysłane"
  }
}
```

### Przykład 3: Sprawdzanie statusu płatności

```javascript
// Konfiguracja
URL: https://api.payment.com/v1/orders/{{$context.orderId}}/status
Method: GET
Headers:
  Authorization: Bearer {{$context.apiKey}}
  Content-Type: application/json

// Logika warunkowa
Jeśli {{$node.data.data.status}} równa się "paid"
  - Zaktualizuj status zamówienia na "Opłacone"
  - Wyślij powiadomienie o sukcesie płatności
W przeciwnym razie, jeśli {{$node.data.data.status}} równa się "pending"
  - Zachowaj status zamówienia jako "Oczekujące na płatność"
W przeciwnym razie
  - Zarejestruj błąd płatności
  - Powiadom administratora o obsłudze wyjątku
```

### Przykład 4: Synchronizacja danych z CRM

```javascript
// Konfiguracja
URL: https://api.crm.com/v1/customers
Method: POST
Headers:
  X-API-Key: {{$context.crmApiKey}}
  Content-Type: application/json
Body:
{
  "name": "{{$context.customerName}}",
  "email": "{{$context.email}}",
  "phone": "{{$context.phone}}",
  "source": "NocoBase",
  "created_at": "{{$context.createdAt}}"
}
```

## Konfiguracja uwierzytelniania

### Uwierzytelnianie Basic

```javascript
Headers:
  Authorization: Basic base64(username:password)
```

### Token Bearer

```javascript
Headers:
  Authorization: Bearer your-access-token
```

### Klucz API

```javascript
// W nagłówku
Headers:
  X-API-Key: your-api-key

// Lub w parametrach zapytania
Query Parameters:
  api_key: your-api-key
```

### OAuth 2.0

Najpierw należy uzyskać `access_token`, a następnie użyć:

```javascript
Headers:
  Authorization: Bearer {{$context.accessToken}}
```

## Obsługa błędów i debugowanie

### Typowe błędy

1. **Przekroczenie limitu czasu połączenia**: Sprawdź połączenie sieciowe, zwiększ limit czasu.
2. **401 Brak autoryzacji**: Sprawdź, czy dane uwierzytelniające są poprawne.
3. **404 Nie znaleziono**: Sprawdź, czy URL jest poprawny.
4. **500 Błąd serwera**: Sprawdź status usługi dostawcy API.

### Wskazówki dotyczące debugowania

1. **Używaj węzłów logowania**: Dodaj węzły logowania przed i po żądaniach HTTP, aby rejestrować dane żądań i odpowiedzi.

2. **Sprawdź logi wykonania**: Logi wykonania przepływu pracy zawierają szczegółowe informacje o żądaniach i odpowiedziach.

3. **Narzędzia testowe**: Najpierw przetestuj API za pomocą narzędzi takich jak Postman, cURL itp.

4. **Obsługa błędów**: Dodaj logikę warunkową do obsługi różnych statusów odpowiedzi.

```javascript
Jeśli {{$node.data.status}} >= 200 i {{$node.data.status}} < 300
  - Obsłuż logikę sukcesu
W przeciwnym razie
  - Obsłuż logikę awarii
  - Zarejestruj błąd: {{$node.data.error}}
```

## Sugestie optymalizacji wydajności

### 1. Używaj przetwarzania asynchronicznego

Dla żądań, które nie wymagają natychmiastowych wyników, rozważ użycie asynchronicznych przepływów pracy.

### 2. Skonfiguruj rozsądne limity czasu

Ustaw limity czasu na podstawie rzeczywistych czasów odpowiedzi API, aby uniknąć nadmiernego oczekiwania.

### 3. Wdrażaj strategie buforowania

Dla danych, które nie zmieniają się często (np. konfiguracje, słowniki), rozważ buforowanie odpowiedzi.

### 4. Przetwarzanie wsadowe

Jeśli wymagane jest wielokrotne wywołanie tego samego API, rozważ użycie interfejsów wsadowych API (jeśli są obsługiwane).

### 5. Ponawianie w przypadku błędu

Skonfiguruj rozsądne strategie ponawiania, ale unikaj nadmiernych ponowień, które mogą prowadzić do ograniczenia szybkości API.

## Najlepsze praktyki bezpieczeństwa

### 1. Chroń wrażliwe informacje

- Nie ujawniaj wrażliwych informacji w URL-ach.
- Używaj HTTPS do szyfrowanej transmisji.
- Klucze API i inne wrażliwe dane przechowuj w zmiennych środowiskowych lub zarządzaniu konfiguracją.

### 2. Waliduj dane odpowiedzi

```javascript
// Waliduj status odpowiedzi
if (![200, 201].includes($node.data.status)) {
  throw new Error('Żądanie API nie powiodło się');
}

// Waliduj format danych
if (!$node.data.data || !$node.data.data.id) {
  throw new Error('Nieprawidłowe dane odpowiedzi');
}
```

### 3. Ograniczanie szybkości żądań

Przestrzegaj limitów szybkości zewnętrznych API, aby uniknąć zablokowania.

### 4. Anonimizacja logów

Podczas rejestrowania logów należy zadbać o anonimizację wrażliwych informacji (haseł, kluczy itp.).

## Porównanie z Webhookiem

| Cecha | Węzeł żądania HTTP | Wyzwalacz Webhook |
|------|--------------------|-------------------|
| Kierunek | NocoBase aktywnie wywołuje zewnętrzny system | Zewnętrzny system aktywnie wywołuje NocoBase |
| Czas | Podczas wykonywania przepływu pracy | Gdy wystąpi zdarzenie zewnętrzne |
| Cel | Pobieranie danych, wyzwalanie operacji zewnętrznych | Odbieranie powiadomień, zdarzeń zewnętrznych |
| Typowe scenariusze | Wywołanie API płatności, zapytanie o pogodę | Callbacki płatności, powiadomienia o wiadomościach |

Te dwie funkcje uzupełniają się, tworząc kompletne rozwiązanie do integracji systemów.

## Powiązane zasoby

- [Dokumentacja wtyczki przepływu pracy](/plugins/@nocobase/plugin-workflow/)
- [Przepływ pracy: Węzeł żądania HTTP](/workflow/nodes/request)
- [Przepływ pracy: Wyzwalacz Webhook](/integration/workflow-webhook/)
- [Uwierzytelnianie kluczami API](/integration/api-keys/)
- [Wtyczka dokumentacji API](/plugins/@nocobase/plugin-api-doc/)