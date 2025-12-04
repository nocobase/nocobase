:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Logger

NocoBase oferuje wysokowydajny system logowania oparty na [pino](https://github.com/pinojs/pino). W każdym miejscu, w którym mają Państwo dostęp do `context`, mogą Państwo uzyskać instancję loggera poprzez `ctx.logger`, aby rejestrować kluczowe zdarzenia podczas działania wtyczki lub systemu.

## Podstawowe użycie

```ts
// Rejestrowanie błędów krytycznych (np. niepowodzenie inicjalizacji)
ctx.logger.fatal('Application initialization failed', { error });

// Rejestrowanie ogólnych błędów (np. błędy żądań API)
ctx.logger.error('Data loading failed', { status, message });

// Rejestrowanie ostrzeżeń (np. ryzyko wydajnościowe lub nietypowe działania użytkownika)
ctx.logger.warn('Current form contains unsaved changes');

// Rejestrowanie ogólnych informacji o działaniu (np. załadowanie komponentu)
ctx.logger.info('User profile component loaded');

// Rejestrowanie informacji debugowania (np. zmiany stanu)
ctx.logger.debug('Current user state', { user });

// Rejestrowanie szczegółowych informacji śledzenia (np. przebieg renderowania)
ctx.logger.trace('Component rendered', { component: 'UserProfile' });
```

Metody te odpowiadają różnym poziomom logowania (od najwyższego do najniższego):

| Poziom | Metoda | Opis |
|------|------|------|
| `fatal` | `ctx.logger.fatal()` | Błędy krytyczne, zazwyczaj powodujące zakończenie działania programu |
| `error` | `ctx.logger.error()` | Błędy, wskazujące na niepowodzenie żądania lub operacji |
| `warn` | `ctx.logger.warn()` | Ostrzeżenia, sygnalizujące potencjalne ryzyka lub nieoczekiwane sytuacje |
| `info` | `ctx.logger.info()` | Standardowe informacje o działaniu |
| `debug` | `ctx.logger.debug()` | Informacje debugowania, przeznaczone dla środowiska deweloperskiego |
| `trace` | `ctx.logger.trace()` | Szczegółowe informacje śledzenia, zazwyczaj do głębokiej diagnostyki |

## Format logów

Każdy wpis logu jest w ustrukturyzowanym formacie JSON i domyślnie zawiera następujące pola:

| Pole | Typ | Opis |
|------|------|------|
| `level` | number | Poziom logu |
| `time` | number | Sygnatura czasowa (milisekundy) |
| `pid` | number | ID procesu |
| `hostname` | string | Nazwa hosta |
| `msg` | string | Wiadomość logu |
| Inne | object | Niestandardowe informacje kontekstowe |

Przykład wyjścia:

```json
{
  "level": 30,
  "time": 1730540153064,
  "pid": 12765,
  "hostname": "nocobase.local",
  "msg": "HelloModel rendered",
  "a": "a"
}
```

## Wiązanie kontekstu

`ctx.logger` automatycznie wstrzykuje informacje kontekstowe, takie jak bieżąca wtyczka, moduł lub źródło żądania, co pozwala na dokładniejsze śledzenie pochodzenia logów.

```ts
plugin.context.logger.info('Plugin initialized');
model.context.logger.error('Model validation failed', { model: 'User' });
```

Przykład wyjścia (z kontekstem):

```json
{
  "level": 30,
  "msg": "Plugin initialized",
  "plugin": "plugin-audit-trail"
}
```

## Niestandardowy logger

Mogą Państwo tworzyć niestandardowe instancje loggera we wtyczkach, dziedzicząc lub rozszerzając domyślne konfiguracje:

```ts
const logger = ctx.logger.child({ module: 'MyPlugin' });
logger.info('Submodule started');
```

Loggerzy potomni dziedziczą konfigurację głównego loggera i automatycznie dołączają kontekst.

## Hierarchia poziomów logowania

Poziomy logowania Pino są zdefiniowane numerycznie od najwyższego do najniższego, gdzie mniejsze liczby oznaczają niższy priorytet.
Poniżej przedstawiono pełną hierarchię poziomów logowania:

| Nazwa poziomu | Wartość | Nazwa metody | Opis |
|-----------|--------|----------|------|
| `fatal` | 60 | `logger.fatal()` | Błędy krytyczne, zazwyczaj uniemożliwiające dalsze działanie programu |
| `error` | 50 | `logger.error()` | Ogólne błędy, wskazujące na niepowodzenie żądania lub wyjątki operacji |
| `warn` | 40 | `logger.warn()` | Ostrzeżenia, sygnalizujące potencjalne ryzyka lub nieoczekiwane sytuacje |
| `info` | 30 | `logger.info()` | Ogólne informacje, rejestrujące status systemu lub normalne operacje |
| `debug` | 20 | `logger.debug()` | Informacje debugowania, do analizy problemów na etapie rozwoju |
| `trace` | 10 | `logger.trace()` | Szczegółowe informacje śledzenia, do dogłębnej diagnostyki |
| `silent` | -Infinity | (brak odpowiadającej metody) | Wyłącza wszystkie wyjścia logów |

Pino wyświetla tylko logi o poziomie większym lub równym bieżącej konfiguracji `level`. Na przykład, gdy poziom logowania jest ustawiony na `info`, logi `debug` i `trace` zostaną zignorowane.

## Najlepsze praktyki w tworzeniu wtyczek

1.  **Używanie loggera kontekstowego**
    W kontekście wtyczki, modelu lub aplikacji proszę używać `ctx.logger`, aby automatycznie dołączać informacje o źródle.

2.  **Rozróżnianie poziomów logowania**
    -   Proszę używać `error` do rejestrowania wyjątków biznesowych
    -   Proszę używać `info` do rejestrowania zmian statusu
    -   Proszę używać `debug` do rejestrowania informacji debugowania deweloperskiego

3.  **Unikanie nadmiernego logowania**
    Zwłaszcza na poziomach `debug` i `trace` zaleca się włączanie ich tylko w środowiskach deweloperskich.

4.  **Używanie danych strukturalnych**
    Proszę przekazywać parametry jako obiekty zamiast łączyć ciągi znaków, co ułatwia analizę i filtrowanie logów.

Stosując się do tych praktyk, deweloperzy mogą efektywniej śledzić wykonanie wtyczek, rozwiązywać problemy oraz utrzymywać ustrukturyzowany i rozszerzalny system logowania.