:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Integracja przepływów pracy z Webhookami

Dzięki wyzwalaczom Webhook, NocoBase może odbierać wywołania HTTP z systemów zewnętrznych i automatycznie uruchamiać przepływy pracy, co pozwala na płynną integrację z innymi platformami.

## Przegląd

Webhooki to mechanizm "odwrotnego API", który umożliwia systemom zewnętrznym aktywne wysyłanie danych do NocoBase w momencie wystąpienia określonych zdarzeń. W porównaniu do aktywnego odpytywania (pollingu), Webhooki oferują bardziej efektywny i działający w czasie rzeczywistym sposób integracji.

## Typowe scenariusze użycia

### Przesyłanie danych z formularzy

Zewnętrzne systemy ankiet, formularze rejestracyjne czy formularze opinii klientów mogą przesyłać dane do NocoBase za pośrednictwem Webhooków po ich wypełnieniu przez użytkownika. Dzięki temu automatycznie tworzone są rekordy i uruchamiane są dalsze procesy, takie jak wysyłanie e-maili z potwierdzeniem czy przydzielanie zadań.

### Powiadomienia o wiadomościach

Zdarzenia z zewnętrznych platform komunikacyjnych (takich jak WeCom, DingTalk, Slack), na przykład nowe wiadomości, wzmianki (@) czy zakończenie procesu zatwierdzania, mogą wyzwalać automatyczne procesy w NocoBase za pośrednictwem Webhooków.

### Synchronizacja danych

Gdy dane w systemach zewnętrznych (takich jak CRM, ERP) ulegają zmianie, Webhooki przesyłają aktualizacje do NocoBase w czasie rzeczywistym, co pozwala na utrzymanie synchronizacji danych.

### Integracja z usługami zewnętrznymi

- **GitHub**: Zdarzenia takie jak wypychanie kodu (code push) czy tworzenie żądań ściągnięcia (PR) wyzwalają automatyczne przepływy pracy.
- **GitLab**: Powiadomienia o statusie potoków CI/CD.
- **Przesyłanie formularzy**: Zewnętrzne systemy formularzy przesyłają dane do NocoBase.
- **Urządzenia IoT**: Zmiany statusu urządzeń, raportowanie danych z czujników.

## Cechy i funkcjonalności

### Elastyczny mechanizm wyzwalania

- Obsługa metod HTTP, takich jak GET, POST, PUT, DELETE.
- Automatyczne parsowanie popularnych formatów, takich jak JSON czy dane formularzy.
- Konfigurowalna walidacja żądań w celu zapewnienia wiarygodności źródła.

### Możliwości przetwarzania danych

- Otrzymane dane mogą być wykorzystywane jako zmienne w przepływach pracy.
- Obsługa złożonych transformacji danych i logiki przetwarzania.
- Możliwość łączenia z innymi węzłami przepływu pracy w celu implementacji złożonej logiki biznesowej.

### Zapewnienie bezpieczeństwa

- Obsługa weryfikacji podpisu w celu zapobiegania fałszywym żądaniom.
- Konfigurowalna biała lista adresów IP.
- Szyfrowana transmisja danych za pomocą HTTPS.

## Kroki użycia

### 1. Instalacja wtyczki

Proszę znaleźć i zainstalować wtyczkę **[Przepływ pracy: Webhook](/plugins/@nocobase/plugin-workflow-webhook/)** w menedżerze wtyczek.

> Uwaga: Jest to wtyczka komercyjna, która wymaga oddzielnego zakupu lub subskrypcji.

### 2. Tworzenie przepływu pracy Webhook

1. Proszę przejść do strony **Zarządzanie przepływami pracy**.
2. Proszę kliknąć **Utwórz przepływ pracy**.
3. Proszę wybrać **Wyzwalacz Webhook** jako typ wyzwalacza.

![Tworzenie przepływu pracy Webhook](https://static-docs.nocobase.com/20241210105049.png)

4. Proszę skonfigurować parametry Webhooka.

![Konfiguracja wyzwalacza Webhook](https://static-docs.nocobase.com/20241210105441.png)
   - **Ścieżka żądania**: Niestandardowa ścieżka URL Webhooka.
   - **Metoda żądania**: Proszę wybrać dozwolone metody HTTP (GET/POST/PUT/DELETE).
   - **Synchroniczny/Asynchroniczny**: Proszę wybrać, czy czekać na zakończenie wykonania przepływu pracy przed zwróceniem wyników.
   - **Walidacja**: Proszę skonfigurować weryfikację podpisu lub inne mechanizmy bezpieczeństwa.

### 3. Konfiguracja węzłów przepływu pracy

Proszę dodać węzły przepływu pracy zgodnie z potrzebami biznesowymi, na przykład:

- **Operacje na kolekcjach**: Tworzenie, aktualizowanie, usuwanie rekordów.
- **Logika warunkowa**: Rozgałęzianie przepływu pracy na podstawie otrzymanych danych.
- **Żądanie HTTP**: Wywoływanie innych API.
- **Powiadomienia**: Wysyłanie e-maili, SMS-ów itp.
- **Niestandardowy kod**: Wykonywanie kodu JavaScript.

### 4. Uzyskiwanie adresu URL Webhooka

Po utworzeniu przepływu pracy system generuje unikalny adres URL Webhooka, zazwyczaj w formacie:

```
https://your-nocobase-domain.com/api/webhooks/your-workflow-key
```

### 5. Konfiguracja w systemie zewnętrznym

Proszę skonfigurować wygenerowany adres URL Webhooka w systemie zewnętrznym:

- W systemach formularzy proszę ustawić adres zwrotny dla przesyłania danych.
- Proszę skonfigurować Webhook w GitHub/GitLab.
- Proszę skonfigurować adres do przesyłania zdarzeń w WeCom/DingTalk.

### 6. Testowanie Webhooka

Proszę przetestować Webhooka za pomocą narzędzi takich jak Postman lub cURL:

```bash
curl -X POST https://your-nocobase-domain.com/api/webhooks/your-workflow-key \
  -H "Content-Type: application/json" \
  -d '{"event":"test","data":{"message":"Hello NocoBase"}}'
```

## Dostęp do danych żądania

W przepływach pracy można uzyskać dostęp do danych odebranych przez Webhook za pomocą zmiennych:

- `{{$context.data}}`: Dane z treści żądania.
- `{{$context.headers}}`: Nagłówki żądania.
- `{{$context.query}}`: Parametry zapytania URL.
- `{{$context.params}}`: Parametry ścieżki.

![Parsowanie parametrów żądania](https://static-docs.nocobase.com/20241210111155.png)

![Parsowanie treści żądania](https://static-docs.nocobase.com/20241210112529.png)

## Konfiguracja odpowiedzi

![Ustawienia odpowiedzi](https://static-docs.nocobase.com/20241210114312.png)

### Tryb synchroniczny

Wyniki są zwracane po zakończeniu wykonania przepływu pracy. Można skonfigurować:

- **Kod statusu odpowiedzi**: 200, 201 itp.
- **Dane odpowiedzi**: Niestandardowe dane JSON zwracane w odpowiedzi.
- **Nagłówki odpowiedzi**: Niestandardowe nagłówki HTTP.

### Tryb asynchroniczny

Natychmiast zwraca potwierdzenie, a przepływ pracy jest wykonywany w tle. Jest to odpowiednie dla:

- Długo trwających przepływów pracy.
- Scenariuszy, które nie wymagają zwracania wyników wykonania.
- Scenariuszy o wysokiej współbieżności.

## Najlepsze praktyki bezpieczeństwa

### 1. Włączenie weryfikacji podpisu

Większość usług zewnętrznych obsługuje mechanizmy podpisu:

```javascript
// Przykład: Weryfikacja podpisu Webhooka GitHub
const crypto = require('crypto');
const signature = context.headers['x-hub-signature-256'];
const payload = JSON.stringify(context.data);
const secret = 'your-webhook-secret';
const expectedSignature = 'sha256=' + crypto
  .createHmac('sha256', secret)
  .update(payload)
  .digest('hex');

if (signature !== expectedSignature) {
  throw new Error('Invalid signature');
}
```

### 2. Używanie HTTPS

Proszę upewnić się, że NocoBase jest wdrożony w środowisku HTTPS, aby chronić bezpieczeństwo transmisji danych.

### 3. Ograniczenie źródeł żądań

Proszę skonfigurować białą listę adresów IP, aby zezwalać tylko na żądania z zaufanych źródeł.

### 4. Walidacja danych

Proszę dodać logikę walidacji danych do przepływów pracy, aby upewnić się, że otrzymane dane mają prawidłowy format i legalną zawartość.

### 5. Audyt logów

Proszę rejestrować wszystkie żądania Webhook, co ułatwia śledzenie i rozwiązywanie problemów.

## Rozwiązywanie problemów

### Webhook się nie uruchamia?

1. Proszę sprawdzić, czy adres URL Webhooka jest poprawny.
2. Proszę potwierdzić, że status przepływu pracy to "Włączony".
3. Proszę sprawdzić logi wysyłania w systemie zewnętrznym.
4. Proszę przejrzeć konfigurację zapory sieciowej i sieci.

### Jak debugować Webhooki?

1. Proszę sprawdzić rekordy wykonania przepływu pracy, aby uzyskać szczegółowe informacje o żądaniach i wynikach wywołań.
2. Proszę użyć narzędzi do testowania Webhooków (np. Webhook.site) w celu weryfikacji żądań.
3. Proszę sprawdzić kluczowe dane i komunikaty o błędach w rekordach wykonania.

### Jak obsługiwać ponowne próby?

Niektóre usługi zewnętrzne ponawiają wysyłanie, jeśli nie otrzymają pomyślnej odpowiedzi:

- Proszę upewnić się, że przepływ pracy jest idempotentny.
- Proszę używać unikalnych identyfikatorów do deduplikacji.
- Proszę rejestrować identyfikatory przetworzonych żądań.

### Wskazówki dotyczące optymalizacji wydajności

- Proszę używać trybu asynchronicznego do obsługi czasochłonnych operacji.
- Proszę dodać logikę warunkową, aby filtrować niepotrzebne żądania.
- Proszę rozważyć użycie kolejek komunikatów do obsługi scenariuszy o wysokiej współbieżności.

## Przykładowe scenariusze

### Przetwarzanie danych z zewnętrznych formularzy

```javascript
// 1. Weryfikacja źródła danych
// 2. Parsowanie danych formularza
const formData = context.data;

// 3. Tworzenie rekordu klienta
// 4. Przypisanie do odpowiedniego właściciela
// 5. Wysyłanie e-maila z potwierdzeniem do osoby przesyłającej
if (formData.email) {
  // Wysyłanie powiadomienia e-mail
}
```

### Powiadomienie o wypchnięciu kodu na GitHubie

```javascript
// 1. Parsowanie danych wypchnięcia
const commits = context.data.commits;
const branch = context.data.ref.replace('refs/heads/', '');

// 2. Jeśli to gałąź główna
if (branch === 'main') {
  // 3. Wyzwolenie procesu wdrożenia
  // 4. Powiadomienie członków zespołu
}
```

![Przykład przepływu pracy Webhook](https://static-docs.nocobase.com/20241210120655.png)

## Powiązane zasoby

- [Dokumentacja wtyczki Przepływ pracy](/plugins/@nocobase/plugin-workflow/)
- [Przepływ pracy: Wyzwalacz Webhook](/workflow/triggers/webhook)
- [Przepływ pracy: Węzeł żądania HTTP](/integration/workflow-http-request/)
- [Uwierzytelnianie za pomocą kluczy API](/integration/api-keys/)