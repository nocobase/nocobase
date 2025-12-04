:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Logger

NocoBase poskytuje vysoce výkonný systém pro logování založený na [pino](https://github.com/pinojs/pino). Kdekoli máte přístup ke `contextu`, můžete získat instanci loggeru prostřednictvím `ctx.logger` pro zaznamenávání klíčových logů během běhu pluginu nebo systému.

## Základní použití

```ts
// Zaznamenání fatálních chyb (např. selhání inicializace)
ctx.logger.fatal('Application initialization failed', { error });

// Zaznamenání obecných chyb (např. chyby při požadavcích na API)
ctx.logger.error('Data loading failed', { status, message });

// Zaznamenání varování (např. rizika výkonu nebo neočekávané uživatelské operace)
ctx.logger.warn('Current form contains unsaved changes');

// Zaznamenání obecných informací o běhu (např. načtení komponenty)
ctx.logger.info('User profile component loaded');

// Zaznamenání informací pro ladění (např. změny stavu)
ctx.logger.debug('Current user state', { user });

// Zaznamenání podrobných trasovacích informací (např. průběh vykreslování)
ctx.logger.trace('Component rendered', { component: 'UserProfile' });
```

Tyto metody odpovídají různým úrovním logování (od nejvyšší po nejnižší):

| Úroveň | Metoda | Popis |
|---|---|---|
| `fatal` | `ctx.logger.fatal()` | Fatální chyby, které obvykle způsobují ukončení programu |
| `error` | `ctx.logger.error()` | Chybové logy, indikující selhání požadavku nebo operace |
| `warn` | `ctx.logger.warn()` | Varovné informace, upozorňující na potenciální rizika nebo neočekávané situace |
| `info` | `ctx.logger.info()` | Běžné informace o běhu |
| `debug` | `ctx.logger.debug()` | Informace pro ladění, určené pro vývojové prostředí |
| `trace` | `ctx.logger.trace()` | Podrobné trasovací informace, obvykle pro hlubokou diagnostiku |

## Formát logu

Každý výstup logu je ve strukturovaném formátu JSON a standardně obsahuje následující pole:

| Pole | Typ | Popis |
|---|---|---|
| `level` | number | Úroveň logu |
| `time` | number | Časová značka (milisekundy) |
| `pid` | number | ID procesu |
| `hostname` | string | Název hostitele |
| `msg` | string | Zpráva logu |
| Ostatní | object | Vlastní kontextové informace |

Příklad výstupu:

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

## Vázání kontextu

`ctx.logger` automaticky vkládá kontextové informace, jako je aktuální plugin, modul nebo zdroj požadavku, což umožňuje přesnější sledování původu logů.

```ts
plugin.context.logger.info('Plugin initialized');
model.context.logger.error('Model validation failed', { model: 'User' });
```

Příklad výstupu (s kontextem):

```json
{
  "level": 30,
  "msg": "Plugin initialized",
  "plugin": "plugin-audit-trail"
}
```

## Vlastní logger

V pluginech si můžete vytvořit vlastní instance loggeru, které dědí nebo rozšiřují výchozí konfiguraci:

```ts
const logger = ctx.logger.child({ module: 'MyPlugin' });
logger.info('Submodule started');
```

Dceřiné loggery dědí konfiguraci hlavního loggeru a automaticky připojují kontext.

## Hierarchie úrovní logování

Úrovně logování Pino se řídí číselnou definicí od nejvyšší po nejnižší, kde menší čísla označují nižší prioritu.
Níže je uvedena kompletní tabulka hierarchie úrovní logování:

| Název úrovně | Hodnota | Název metody | Popis |
|---|---|---|---|
| `fatal` | 60 | `logger.fatal()` | Fatální chyby, které obvykle způsobují, že program nemůže pokračovat v běhu |
| `error` | 50 | `logger.error()` | Obecné chyby, indikující selhání požadavku nebo výjimky v operaci |
| `warn` | 40 | `logger.warn()` | Varovné informace, upozorňující na potenciální rizika nebo neočekávané situace |
| `info` | 30 | `logger.info()` | Běžné informace, zaznamenávající stav systému nebo běžné operace |
| `debug` | 20 | `logger.debug()` | Informace pro ladění, určené pro analýzu problémů ve fázi vývoje |
| `trace` | 10 | `logger.trace()` | Podrobné trasovací informace, určené pro hloubkovou diagnostiku |
| `silent` | -Infinity | (bez odpovídající metody) | Vypne veškerý výstup logů |

Pino vypisuje pouze logy, které jsou větší nebo rovny aktuální konfiguraci `level`. Například, když je úroveň logování `info`, logy `debug` a `trace` budou ignorovány.

## Doporučené postupy při vývoji pluginů

1.  **Používejte kontextový logger**
    V kontextu pluginu, modelu nebo aplikace používejte `ctx.logger`, který automaticky ponese informace o zdroji.

2.  **Rozlišujte úrovně logování**
    -   Použijte `error` pro zaznamenání obchodních výjimek
    -   Použijte `info` pro zaznamenání změn stavu
    -   Použijte `debug` pro zaznamenání informací pro ladění ve vývoji

3.  **Vyhněte se nadměrnému logování**
    Zejména na úrovních `debug` a `trace` doporučujeme je zapínat pouze ve vývojových prostředích.

4.  **Používejte strukturovaná data**
    Předávejte parametry jako objekty namísto zřetězování řetězců, což pomáhá s analýzou a filtrováním logů.

Dodržováním těchto postupů mohou vývojáři efektivněji sledovat provádění pluginů, řešit problémy a udržovat systém logování strukturovaný a rozšiřitelný.