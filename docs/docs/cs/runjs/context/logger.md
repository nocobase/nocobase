:::tip{title="Upozornění na AI překlad"}
Tento dokument byl přeložen pomocí AI. Pro přesné informace se podívejte na [anglickou verzi](/runjs/context/logger).
:::

# ctx.logger

Zapouzdření logování založené na [pino](https://github.com/pinojs/pino), které poskytuje vysoce výkonné strukturované JSON logy. Doporučujeme používat `ctx.logger` namísto `console` pro snazší sběr a analýzu logů.

## Scénáře použití

`ctx.logger` lze použít ve všech scénářích RunJS pro ladění, sledování chyb, analýzu výkonu atd.

## Definice typu

```ts
logger: pino.Logger;
```

`ctx.logger` je instancí `engine.logger.child({ module: 'flow-engine' })`, což je dceřiný logger pino s kontextem `module`.

## Úrovně logování

pino podporuje následující úrovně (od nejvyšší po nejnižší):

| Úroveň | Metoda | Popis |
|------|------|------|
| `fatal` | `ctx.logger.fatal()` | Fatální chyba, obvykle vedoucí k ukončení procesu |
| `error` | `ctx.logger.error()` | Chyba, indikující selhání požadavku nebo operace |
| `warn` | `ctx.logger.warn()` | Varování, indikující potenciální rizika nebo abnormální situace |
| `info` | `ctx.logger.info()` | Obecné informace o běhu |
| `debug` | `ctx.logger.debug()` | Ladicí informace, používané během vývoje |
| `trace` | `ctx.logger.trace()` | Detailní trasování, používané pro hloubkovou diagnostiku |

## Doporučený způsob zápisu

Doporučený formát je `level(msg, meta)`: zpráva je na prvním místě, následovaná volitelným objektem s metadaty.

```ts
ctx.logger.info('Načítání bloku dokončeno');
ctx.logger.info('Operace úspěšná', { recordId: 456 });
ctx.logger.warn('Varování výkonu', { duration: 5000 });
ctx.logger.error('Operace selhala', { userId: 123, action: 'create' });
ctx.logger.error('Požadavek selhal', { err });
```

pino také podporuje `level(meta, msg)` (objekt jako první) nebo `level({ msg, ...meta })` (jeden objekt), které lze použít podle potřeby.

## Příklady

### Základní použití

```ts
ctx.logger.info('Načítání bloku dokončeno');
ctx.logger.warn('Požadavek selhal, používám mezipaměť', { err });
ctx.logger.debug('Ukládání...', { recordId: ctx.record?.id });
```

### Vytvoření dceřiného loggeru pomocí child()

```ts
// Vytvoření dceřiného loggeru s kontextem pro aktuální logiku
const log = ctx.logger.child({ scope: 'myBlock' });
log.info('Provádění kroku 1');
log.debug('Provádění kroku 2', { step: 2 });
```

### Vztah ke console

Doporučujeme používat přímo `ctx.logger`, abyste získali strukturované JSON logy. Pokud jste zvyklí používat `console`, mapování je následující: `console.log` → `ctx.logger.info`, `console.error` → `ctx.logger.error`, `console.warn` → `ctx.logger.warn`.

## Formát logu

pino produkuje strukturovaný JSON, kde každý záznam obsahuje:

- `level`: Úroveň logování (číselná)
- `time`: Časové razítko (milisekundy)
- `msg`: Zpráva logu
- `module`: Pevně nastaveno na `flow-engine`
- Další vlastní pole (předaná prostřednictvím objektů)

## Poznámky

- Logy jsou ve formátu strukturovaného JSON, což usnadňuje jejich sběr, vyhledávání a analýzu.
- U dceřiných loggerů vytvořených pomocí `child()` se také doporučuje dodržovat zápis `level(msg, meta)`.
- Některá běhová prostředí (například pracovní postupy) mohou používat jiné způsoby výstupu logů.

## Související

- [pino](https://github.com/pinojs/pino) — Základní knihovna pro logování