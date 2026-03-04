:::tip{title="Upozornění na AI překlad"}
Tento dokument byl přeložen pomocí AI. Pro přesné informace se podívejte na [anglickou verzi](/runjs/context/location).
:::

# ctx.location

Informace o aktuálním umístění trasy, ekvivalentní objektu `location` z React Routeru. Obvykle se používá ve spojení s `ctx.router` a `ctx.route` ke čtení aktuální cesty, dotazovacího řetězce (query string), hashe a stavu (state) předaného skrze trasu.

## Scénáře použití

| Scénář | Popis |
|------|------|
| **JSBlock / JSField** | Provádění podmíněného vykreslování nebo logického větvení na základě aktuální cesty, parametrů dotazu nebo hashe. |
| **Pravidla propojení / Tok událostí** | Čtení parametrů dotazu URL pro filtrování vazeb nebo určení zdroje na základě `location.state`. |
| **Zpracování po navigaci** | Příjem dat předaných z předchozí stránky přes `ctx.router.navigate` pomocí `ctx.location.state` na cílové stránce. |

> Poznámka: `ctx.location` je k dispozici pouze v prostředích RunJS s kontextem směrování (např. JSBlock v rámci stránky, toky událostí atd.); v čistě backendových kontextech nebo kontextech bez směrování (např. pracovní postupy) může být prázdný.

## Definice typu

```ts
location: Location;
```

`Location` pochází z `react-router-dom` a odpovídá návratové hodnotě `useLocation()` z React Routeru.

## Častá pole

| Pole | Typ | Popis |
|------|------|------|
| `pathname` | `string` | Aktuální cesta, začínající `/` (např. `/admin/users`). |
| `search` | `string` | Dotazovací řetězec, začínající `?` (např. `?page=1&status=active`). |
| `hash` | `string` | Fragment hash, začínající `#` (např. `#section-1`). |
| `state` | `any` | Libovolná data předaná přes `ctx.router.navigate(path, { state })`, která se nepromítají do URL. |
| `key` | `string` | Unikátní identifikátor pro toto umístění; výchozí stránka je `"default"`. |

## Vztah k ctx.router a ctx.urlSearchParams

| Účel | Doporučené použití |
|------|----------|
| **Čtení cesty, hashe, stavu** | `ctx.location.pathname` / `ctx.location.hash` / `ctx.location.state` |
| **Čtení parametrů dotazu (jako objekt)** | `ctx.urlSearchParams`, který poskytuje přímo analyzovaný objekt. |
| **Analýza řetězce search** | `new URLSearchParams(ctx.location.search)` nebo použijte přímo `ctx.urlSearchParams`. |

`ctx.urlSearchParams` je analyzován z `ctx.location.search`. Pokud potřebujete pouze parametry dotazu, je použití `ctx.urlSearchParams` pohodlnější.

## Příklady

### Větvení na základě cesty

```ts
if (ctx.location.pathname.startsWith('/admin/users')) {
  ctx.message.info('Aktuálně se nacházíte na stránce správy uživatelů');
}
```

### Analýza parametrů dotazu

```ts
// Metoda 1: Použití ctx.urlSearchParams (doporučeno)
const page = ctx.urlSearchParams.page || 1;
const status = ctx.urlSearchParams.status;

// Metoda 2: Použití URLSearchParams k analýze search
const params = new URLSearchParams(ctx.location.search);
const page = params.get('page') || '1';
const status = params.get('status');
```

### Příjem stavu předaného navigací trasy

```ts
// Při navigaci z předchozí stránky: ctx.router.navigate('/users/123', { state: { from: 'dashboard' } })
const prevState = ctx.location.state;
if (prevState?.from === 'dashboard') {
  ctx.message.info('Navigováno z nástěnky (dashboard)');
}
```

### Určení kotev pomocí hashe

```ts
const hash = ctx.location.hash; // např. "#edit"
if (hash === '#edit') {
  // Posun na oblast úprav nebo provedení odpovídající logiky
}
```

## Související

- [ctx.router](./router.md): Navigace tras; `state` z `ctx.router.navigate` lze získat přes `ctx.location.state` na cílové stránce.
- [ctx.route](./route.md): Informace o shodě aktuální trasy (parametry, konfigurace atd.), často používané ve spojení s `ctx.location`.