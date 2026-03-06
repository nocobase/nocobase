:::tip{title="Upozornění na AI překlad"}
Tento dokument byl přeložen pomocí AI. Pro přesné informace se podívejte na [anglickou verzi](/runjs/context/t).
:::

# ctx.t()

Zkratková funkce i18n používaná v RunJS k překladu textů na základě nastavení jazyka v aktuálním kontextu. Je vhodná pro internacionalizaci vložených textů, jako jsou tlačítka, nadpisy a výzvy.

## Scénáře použití

`ctx.t()` lze použít ve všech prostředích pro spouštění RunJS.

## Definice typu

```ts
t(key: string, options?: Record<string, any>): string
```

## Parametry

| Parametr | Typ | Popis |
|----------|-----|-------|
| `key` | `string` | Klíč překladu nebo šablona se zástupnými symboly (např. `Hello {{name}}`, `{{count}} rows`). |
| `options` | `object` | Volitelné. Proměnné pro interpolaci (např. `{ name: 'Jan', count: 5 }`) nebo možnosti i18n (např. `defaultValue`, `ns`). |

## Návratová hodnota

- Vrací přeložený řetězec. Pokud pro daný klíč neexistuje žádný překlad a není poskytnuta hodnota `defaultValue`, může vrátit samotný klíč nebo řetězec s provedenou interpolací.

## Jmenný prostor (ns)

**Výchozí jmenný prostor pro prostředí RunJS je `runjs`**. Pokud není `ns` specifikováno, `ctx.t(key)` bude hledat klíč ve jmenném prostoru `runjs`.

```ts
// Ve výchozím nastavení hledá klíč ve jmenném prostoru 'runjs'
ctx.t('Submit'); // Ekvivalent k ctx.t('Submit', { ns: 'runjs' })

// Hledá klíč v konkrétním jmenném prostoru
ctx.t('Submit', { ns: 'myModule' });

// Hledá v několika jmenných prostorech postupně (nejprve 'runjs', poté 'common')
ctx.t('Save', { ns: ['runjs', 'common'] });
```

## Příklady

### Jednoduchý klíč

```ts
ctx.t('Submit');
ctx.t('No data');
```

### S proměnnými pro interpolaci

```ts
const text = ctx.t('Hello {{name}}', { name: ctx.user?.nickname || 'Guest' });
ctx.render(`<div>${text}</div>`);
```

```ts
ctx.message.success(ctx.t('Processed {{count}} rows', { count: rows.length }));
```

### Dynamické texty (např. relativní čas)

```ts
if (minutes < 60) return ctx.t('{{count}} minutes ago', { count: minutes });
if (hours < 24) return ctx.t('{{count}} hours ago', { count: hours });
```

### Určení jmenného prostoru

```ts
ctx.t('Hello {{name}}', { name: 'Guest', ns: 'myModule' });
```

## Poznámky

- **Plugin Localization**: Pro překlad textů musí být aktivován plugin Localization. Chybějící klíče překladu budou automaticky extrahovány do seznamu správy lokalizace pro jednotnou údržbu a překlad.
- Podporuje interpolaci ve stylu i18next: V klíči použijte `{{názevProměnné}}` a v `options` předejte odpovídající proměnnou pro její nahrazení.
- Jazyk je určen aktuálním kontextem (např. `ctx.i18n.language`, národní prostředí uživatele).

## Související

- [ctx.i18n](./i18n.md): Čtení nebo přepínání jazyků