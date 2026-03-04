:::tip{title="Upozornění na AI překlad"}
Tento dokument byl přeložen pomocí AI. Pro přesné informace se podívejte na [anglickou verzi](/runjs/context/route).
:::

# ctx.route

Informace o aktuální shodě trasy, které odpovídají konceptu `route` v React Routeru. Slouží k získání aktuální konfigurace odpovídající trasy, parametrů a dalších údajů. Obvykle se používá ve spojení s `ctx.router` a `ctx.location`.

## Scénáře použití

| Scénář | Popis |
|------|------|
| **JSBlock / JSField** | Provádění podmíněného vykreslování nebo zobrazení identifikátoru aktuální stránky na základě `route.pathname` nebo `route.params`. |
| **Pravidla propojení / Události** | Čtení parametrů trasy (např. `params.name`) pro logické větvení nebo jejich předávání podřízeným komponentám. |
| **Navigace zobrazení** | Interní porovnání `ctx.route.pathname` s cílovou cestou pro rozhodnutí, zda se má spustit `ctx.router.navigate`. |

> Poznámka: `ctx.route` je k dispozici pouze v prostředích RunJS, která obsahují kontext směrování (například JSBlock v rámci stránky, stránky pracovního postupu atd.). V čistě backendovém prostředí nebo v kontextech bez směrování (například pracovní postupy na pozadí) může být tato hodnota prázdná.

## Definice typu

```ts
type RouteOptions = {
  name?: string;   // Unikátní identifikátor trasy
  path?: string;   // Šablona trasy (např. /admin/:name)
  params?: Record<string, any>;  // Parametry trasy (např. { name: 'users' })
  pathname?: string;  // Úplná cesta aktuální trasy (např. /admin/users)
};
```

## Běžná pole

| Pole | Typ | Popis |
|------|------|------|
| `pathname` | `string` | Úplná cesta aktuální trasy, shodná s `ctx.location.pathname`. |
| `params` | `Record<string, any>` | Dynamické parametry analyzované ze šablony trasy, například `{ name: 'users' }`. |
| `path` | `string` | Šablona trasy, například `/admin/:name`. |
| `name` | `string` | Unikátní identifikátor trasy, běžně používaný v situacích s více kartami (Tab) nebo více zobrazeními. |

## Vztah k ctx.router a ctx.location

| Účel | Doporučené použití |
|------|----------|
| **Čtení aktuální cesty** | `ctx.route.pathname` nebo `ctx.location.pathname`; obě hodnoty jsou při shodě identické. |
| **Čtení parametrů trasy** | `ctx.route.params`, např. `params.name` představující UID aktuální stránky. |
| **Navigace a přesměrování** | `ctx.router.navigate(path)` |
| **Čtení parametrů dotazu (query), state** | `ctx.location.search`, `ctx.location.state` |

`ctx.route` se zaměřuje na „konfiguraci nalezené trasy“, zatímco `ctx.location` se zaměřuje na „aktuální umístění URL“. Společně poskytují úplný popis aktuálního stavu směrování.

## Příklady

### Čtení pathname

```ts
// Zobrazení aktuální cesty
ctx.message.info('Aktuální stránka: ' + ctx.route.pathname);
```

### Větvení na základě params

```ts
// params.name je obvykle UID aktuální stránky (např. identifikátor stránky workflow)
if (ctx.route.params?.name === 'users') {
  // Provedení specifické logiky na stránce správy uživatelů
}
```

### Zobrazení na stránce pracovního postupu (Flow)

```tsx
<div>
  <h1>Aktuální stránka - {ctx.route.pathname}</h1>
  <p>Identifikátor trasy: {ctx.route.params?.name}</p>
</div>
```

## Související

- [ctx.router](./router.md): Navigace trasy. Když `ctx.router.navigate()` změní cestu, `ctx.route` se odpovídajícím způsobem aktualizuje.
- [ctx.location](./location.md): Aktuální umístění URL (pathname, search, hash, state), používá se ve spojení s `ctx.route`.