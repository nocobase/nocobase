:::tip{title="Upozornění na AI překlad"}
Tento dokument byl přeložen pomocí AI. Pro přesné informace se podívejte na [anglickou verzi](/runjs/context/router).
:::

# ctx.router

Instance routeru založená na React Routeru, která se používá pro programovou navigaci v rámci RunJS. Obvykle se používá ve spojení s `ctx.route` a `ctx.location`.

## Scénáře použití

| Scénář | Popis |
|------|------|
| **JSBlock / JSField** | Přechod na stránky detailu, seznamu nebo externí odkazy po kliknutí na tlačítko. |
| **Pravidla propojení / Tok událostí** | Provedení `navigate` na seznam nebo detail po úspěšném odeslání, nebo předání `state` cílové stránce. |
| **JSAction / Zpracování událostí** | Provedení navigace v rámci logiky, jako je odeslání formuláře nebo kliknutí na odkaz. |
| **Navigace zobrazení** | Aktualizace URL pomocí `navigate` během přepínání interního zásobníku zobrazení. |

> Poznámka: `ctx.router` je k dispozici pouze v prostředích RunJS s kontextem směrování (např. JSBlock v rámci stránky, stránky Flow, toky událostí atd.); v čistě backendových kontextech nebo kontextech bez směrování (např. pracovní postupy) může být null.

## Definice typu

```typescript
router: Router
```

`Router` pochází z `@remix-run/router`. V RunJS se navigační operace jako přechod, návrat zpět a obnovení provádějí pomocí `ctx.router.navigate()`.

## Metody

### ctx.router.navigate()

Přejde na cílovou cestu nebo provede akci zpět/obnovit.

**Signatura:**

```typescript
navigate(to: string | number | null, options?: RouterNavigateOptions): Promise<void>
```

**Parametry:**

- `to`: Cílová cesta (string), relativní pozice v historii (number, např. `-1` pro návrat zpět) nebo `null` (pro obnovení aktuální stránky).
- `options`: Volitelná konfigurace.
  - `replace?: boolean`: Zda nahradit aktuální záznam v historii (výchozí je `false`, což přidá nový záznam).
  - `state?: any`: Stav předávaný cílové cestě. Tato data se nezobrazují v URL a lze k nim přistupovat přes `ctx.location.state` na cílové stránce. Vhodné pro citlivé informace, dočasná data nebo informace, které by neměly být v URL.

## Příklady

### Základní navigace

```ts
// Přechod na seznam uživatelů (přidá nový záznam do historie, lze se vrátit zpět)
ctx.router.navigate('/admin/users');

// Přechod na stránku detailu
ctx.router.navigate(`/admin/users/${recordId}`);
```

### Nahrazení historie (žádný nový záznam)

```ts
// Přesměrování na domovskou stránku po přihlášení; uživatel se při návratu zpět nedostane na přihlašovací stránku
ctx.router.navigate('/admin', { replace: true });

// Nahrazení aktuální stránky stránkou detailu po úspěšném odeslání formuláře
ctx.router.navigate(`/admin/users/${newId}`, { replace: true });
```

### Předávání stavu (state)

```ts
// Předání dat během navigace; cílová stránka je získá přes ctx.location.state
ctx.router.navigate('/admin/users/123', { 
  state: { from: 'dashboard', tab: 'profile' } 
});
```

### Zpět a obnovení

```ts
// Návrat o jednu stránku zpět
ctx.router.navigate(-1);

// Návrat o dvě stránky zpět
ctx.router.navigate(-2);

// Obnovení aktuální stránky
ctx.router.navigate(null);
```

## Vztah k ctx.route a ctx.location

| Účel | Doporučené použití |
|------|----------|
| **Navigace / Přechod** | `ctx.router.navigate(path)` |
| **Čtení aktuální cesty** | `ctx.route.pathname` nebo `ctx.location.pathname` |
| **Čtení stavu předaného při navigaci** | `ctx.location.state` |
| **Čtení parametrů cesty** | `ctx.route.params` |

`ctx.router` zodpovídá za „navigační akce“, zatímco `ctx.route` a `ctx.location` zodpovídají za „aktuální stav směrování“.

## Poznámky

- `navigate(path)` standardně přidává nový záznam do historie (push), což uživatelům umožňuje vrátit se pomocí tlačítka zpět v prohlížeči.
- `replace: true` nahradí aktuální záznam v historii bez přidání nového, což je vhodné pro scénáře jako přesměrování po přihlášení nebo navigaci po úspěšném odeslání.
- **K parametru `state`**:
  - Data předávaná přes `state` se neobjevují v URL, což je vhodné pro citlivá nebo dočasná data.
  - Na cílové stránce k nim lze přistupovat přes `ctx.location.state`.
  - `state` se ukládá do historie prohlížeče a zůstává přístupný i při navigaci vpřed/vzad.
  - Po tvrdém obnovení stránky (refresh) se `state` ztratí.

## Související

- [ctx.route](./route.md): Informace o aktuální shodě cesty (pathname, params atd.).
- [ctx.location](./location.md): Aktuální umístění URL (pathname, search, hash, state); zde se po navigaci čte `state`.