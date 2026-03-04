:::tip{title="Powiadomienie o tłumaczeniu AI"}
Ten dokument został przetłumaczony przez AI. Aby uzyskać dokładne informacje, zapoznaj się z [wersją angielską](/runjs/context/t).
:::

# ctx.t()

Skrócona funkcja i18n używana w RunJS do tłumaczenia tekstów w oparciu o ustawienia językowe bieżącego kontekstu. Jest ona odpowiednia do internacjonalizacji treści liniowych, takich jak przyciski, tytuły i komunikaty.

## Przypadki użycia

Funkcja `ctx.t()` może być używana we wszystkich środowiskach wykonawczych RunJS.

## Definicja typu

```ts
t(key: string, options?: Record<string, any>): string
```

## Parametry

| Parametr | Typ | Opis |
|-----------|------|-------------|
| `key` | `string` | Klucz tłumaczenia lub szablon z symbolami zastępczymi (np. `Hello {{name}}`, `{{count}} rows`). |
| `options` | `object` | Opcjonalne. Zmienne interpolacji (np. `{ name: 'Jan', count: 5 }`) lub opcje i18n (np. `defaultValue`, `ns`). |

## Wartość zwracana

- Zwraca przetłumaczony ciąg znaków. Jeśli tłumaczenie dla danego klucza nie istnieje i nie podano `defaultValue`, może zostać zwrócony sam klucz lub ciąg zinterpolowany.

## Przestrzeń nazw (ns)

**Domyślną przestrzenią nazw dla środowiska RunJS jest `runjs`**. Gdy `ns` nie zostanie określone, `ctx.t(key)` będzie szukać klucza w przestrzeni nazw `runjs`.

```ts
// Domyślnie szuka klucza w przestrzeni nazw 'runjs'
ctx.t('Submit'); // Odpowiednik ctx.t('Submit', { ns: 'runjs' })

// Szuka klucza w określonej przestrzeni nazw
ctx.t('Submit', { ns: 'myModule' });

// Przeszukuje wiele przestrzeni nazw sekwencyjnie (najpierw 'runjs', potem 'common')
ctx.t('Save', { ns: ['runjs', 'common'] });
```

## Przykłady

### Prosty klucz

```ts
ctx.t('Submit');
ctx.t('No data');
```

### Ze zmiennymi interpolacji

```ts
const text = ctx.t('Hello {{name}}', { name: ctx.user?.nickname || 'Guest' });
ctx.render(`<div>${text}</div>`);
```

```ts
ctx.message.success(ctx.t('Processed {{count}} rows', { count: rows.length }));
```

### Dynamiczne treści (np. czas względny)

```ts
if (minutes < 60) return ctx.t('{{count}} minutes ago', { count: minutes });
if (hours < 24) return ctx.t('{{count}} hours ago', { count: hours });
```

### Określanie przestrzeni nazw

```ts
ctx.t('Hello {{name}}', { name: 'Guest', ns: 'myModule' });
```

## Uwagi

- **Wtyczka Localization**: Aby tłumaczyć teksty, należy najpierw aktywować wtyczkę Localization. Brakujące klucze tłumaczeń zostaną automatycznie wyodrębnione do listy zarządzania lokalizacją, co ułatwia ich wspólną konserwację i tłumaczenie.
- Obsługuje interpolację w stylu i18next: należy użyć `{{nazwaZmiennej}}` w kluczu i przekazać odpowiednią zmienną w `options`, aby ją zastąpić.
- Język jest określany przez bieżący kontekst (np. `ctx.i18n.language`, lokalizacja użytkownika).

## Powiązane

- [ctx.i18n](./i18n.md): Odczyt lub zmiana języka