:::tip{title="Powiadomienie o tłumaczeniu AI"}
Ten dokument został przetłumaczony przez AI. Aby uzyskać dokładne informacje, zapoznaj się z [wersją angielską](/runjs/context/logger).
:::

# ctx.logger

Nakładka na [pino](https://github.com/pinojs/pino) do logowania, zapewniająca wysokowydajne, strukturalne logi JSON. Zaleca się używanie `ctx.logger` zamiast `console` w celu łatwiejszego gromadzenia i analizy logów.

## Scenariusze zastosowania

`ctx.logger` może być używany we wszystkich scenariuszach RunJS do debugowania, śledzenia błędów, analizy wydajności itp.

## Definicja typu

```ts
logger: pino.Logger;
```

`ctx.logger` jest instancją `engine.logger.child({ module: 'flow-engine' })`, czyli podrzędnym loggerem pino z kontekstem `module`.

## Poziomy logowania

pino obsługuje następujące poziomy (od najwyższego do najniższego):

| Poziom | Metoda | Opis |
|------|------|------|
| `fatal` | `ctx.logger.fatal()` | Błąd krytyczny, zazwyczaj prowadzący do zakończenia procesu |
| `error` | `ctx.logger.error()` | Błąd, oznaczający niepowodzenie żądania lub operacji |
| `warn` | `ctx.logger.warn()` | Ostrzeżenie, wskazujące na potencjalne ryzyko lub nietypowe sytuacje |
| `info` | `ctx.logger.info()` | Ogólne informacje o czasie działania |
| `debug` | `ctx.logger.debug()` | Informacje debugowania, używane podczas programowania |
| `trace` | `ctx.logger.trace()` | Szczegółowe śledzenie, używane do głębokiej diagnostyki |

## Zalecany sposób zapisu

Zalecanym formatem jest `level(msg, meta)`: najpierw wiadomość, a następnie opcjonalny obiekt metadanych.

```ts
ctx.logger.info('Ładowanie bloku zakończone');
ctx.logger.info('Operacja zakończona sukcesem', { recordId: 456 });
ctx.logger.warn('Ostrzeżenie o wydajności', { duration: 5000 });
ctx.logger.error('Operacja nie powiodła się', { userId: 123, action: 'create' });
ctx.logger.error('Żądanie nie powiodło się', { err });
```

pino obsługuje również `level(meta, msg)` (obiekt na początku) lub `level({ msg, ...meta })` (pojedynczy obiekt), które mogą być używane w zależności od potrzeb.

## Przykłady

### Podstawowe użycie

```ts
ctx.logger.info('Ładowanie bloku zakończone');
ctx.logger.warn('Żądanie nie powiodło się, użycie pamięci podręcznej', { err });
ctx.logger.debug('Zapisywanie...', { recordId: ctx.record?.id });
```

### Tworzenie podrzędnego loggera za pomocą child()

```ts
// Tworzenie podrzędnego loggera z kontekstem dla bieżącej logiki
const log = ctx.logger.child({ scope: 'myBlock' });
log.info('Wykonywanie kroku 1');
log.debug('Wykonywanie kroku 2', { step: 2 });
```

### Relacja z console

Zaleca się bezpośrednie używanie `ctx.logger` w celu uzyskania strukturalnych logów JSON. Jeśli są Państwo przyzwyczajeni do używania `console`, mapowanie wygląda następująco: `console.log` → `ctx.logger.info`, `console.error` → `ctx.logger.error`, `console.warn` → `ctx.logger.warn`.

## Format logów

pino generuje strukturalny format JSON, gdzie każdy wpis zawiera:

- `level`: Poziom logowania (numeryczny)
- `time`: Znacznik czasu (milisekundy)
- `msg`: Wiadomość logu
- `module`: Stała wartość `flow-engine`
- Inne pola niestandardowe (przekazywane przez obiekty)

## Uwagi

- Logi są w formacie strukturalnym JSON, co ułatwia ich gromadzenie, wyszukiwanie i analizę.
- W przypadku podrzędnych loggerów utworzonych za pomocą `child()` również zaleca się stosowanie zapisu `level(msg, meta)`.
- Niektóre środowiska wykonawcze (takie jak przepływy pracy) mogą używać innych metod wyjściowych dla logów.

## Powiązane

- [pino](https://github.com/pinojs/pino) — Podstawowa biblioteka logowania.