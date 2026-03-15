:::tip{title="AI-vertaalmelding"}
Dit document is vertaald door AI. Raadpleeg de [Engelse versie](/runjs/context/location) voor nauwkeurige informatie.
:::

# ctx.location

Informatie over de huidige route-locatie, gelijkwaardig aan het `location`-object van React Router. Wordt doorgaans gebruikt in combinatie met `ctx.router` en `ctx.route` om het huidige pad, de query string, de hash en de via de route doorgegeven state te lezen.

## Toepassingsscenario's

| Scenario | Beschrijving |
|------|------|
| **JSBlock / JSField** | Voorwaardelijke rendering of logische vertakkingen uitvoeren op basis van het huidige pad, queryparameters of hash. |
| **Koppelingsregels / Event flow** | URL-queryparameters lezen voor koppelingsfiltering, of de bron bepalen op basis van `location.state`. |
| **Verwerking na navigatie** | Gegevens ontvangen die vanaf de vorige pagina zijn doorgegeven via `ctx.router.navigate` met behulp van `ctx.location.state` op de doelpagina. |

> Let op: `ctx.location` is alleen beschikbaar in RunJS-omgevingen met een routeringscontext (zoals JSBlock binnen een pagina, event flows, enz.); het kan leeg zijn in pure backend- of niet-routeringscontexten (zoals workflows).

## Type-definitie

```ts
location: Location;
```

`Location` is afkomstig van `react-router-dom` en komt overeen met de retourwaarde van `useLocation()` van React Router.

## Veelgebruikte velden

| Veld | Type | Beschrijving |
|------|------|------|
| `pathname` | `string` | Het huidige pad, beginnend met `/` (bijv. `/admin/users`). |
| `search` | `string` | De query string, beginnend met `?` (bijv. `?page=1&status=active`). |
| `hash` | `string` | Het hash-fragment, beginnend met `#` (bijv. `#section-1`). |
| `state` | `any` | Willekeurige gegevens doorgegeven via `ctx.router.navigate(path, { state })`, niet zichtbaar in de URL. |
| `key` | `string` | Een unieke identificatie voor deze locatie; de initiële pagina is `"default"`. |

## Relatie met ctx.router en ctx.urlSearchParams

| Doel | Aanbevolen gebruik |
|------|----------|
| **Pad, hash, state lezen** | `ctx.location.pathname` / `ctx.location.hash` / `ctx.location.state` |
| **Queryparameters lezen (als object)** | `ctx.urlSearchParams`, hiermee krijgt u direct het geparste object. |
| **Search-string parsen** | `new URLSearchParams(ctx.location.search)` of gebruik direct `ctx.urlSearchParams`. |

`ctx.urlSearchParams` wordt afgeleid van `ctx.location.search`. Als u alleen queryparameters nodig heeft, is het gebruik van `ctx.urlSearchParams` handiger.

## Voorbeelden

### Vertakking op basis van pad

```ts
if (ctx.location.pathname.startsWith('/admin/users')) {
  ctx.message.info('U bevindt zich momenteel op de gebruikersbeheerpagina');
}
```

### Queryparameters parsen

```ts
// Methode 1: Gebruik ctx.urlSearchParams (aanbevolen)
const page = ctx.urlSearchParams.page || 1;
const status = ctx.urlSearchParams.status;

// Methode 2: Gebruik URLSearchParams om search te parsen
const params = new URLSearchParams(ctx.location.search);
const page = params.get('page') || '1';
const status = params.get('status');
```

### State ontvangen die via route-navigatie is doorgegeven

```ts
// Bij navigatie vanaf de vorige pagina: ctx.router.navigate('/users/123', { state: { from: 'dashboard' } })
const prevState = ctx.location.state;
if (prevState?.from === 'dashboard') {
  ctx.message.info('Genavigeerd vanaf het dashboard');
}
```

### Ankers lokaliseren via hash

```ts
const hash = ctx.location.hash; // bijv. "#edit"
if (hash === '#edit') {
  // Scroll naar het bewerkingsgebied of voer de bijbehorende logica uit
}
```

## Gerelateerd

- [ctx.router](./router.md): Route-navigatie; de `state` van `ctx.router.navigate` kan worden opgehaald via `ctx.location.state` op de doelpagina.
- [ctx.route](./route.md): Informatie over de huidige route-match (parameters, configuratie, enz.), vaak gebruikt in combinatie met `ctx.location`.