:::tip{title="AI-vertaalmelding"}
Dit document is vertaald door AI. Raadpleeg de [Engelse versie](/runjs/context/router) voor nauwkeurige informatie.
:::

# ctx.router

Een router-instantie gebaseerd op React Router, gebruikt voor programmatische navigatie binnen RunJS. Het wordt doorgaans gebruikt in combinatie met `ctx.route` en `ctx.location`.

## Toepassingsscenario's

| Scenario | Beschrijving |
|------|------|
| **JSBlock / JSField** | Navigeer naar detailpagina's, lijstpagina's of externe links na een klik op een knop. |
| **Koppelingsregels / Event Flow** | Voer `navigate` uit naar een lijst of detailpagina na een succesvolle indiening, of geef `state` door naar de doelpagina. |
| **JSAction / Gebeurtenisafhandeling** | Voer route-navigatie uit binnen logica zoals formulierinzendingen of klikken op links. |
| **Weergavenavigatie** | Werk de URL bij via `navigate` tijdens het schakelen tussen interne weergavestacks. |

> Let op: `ctx.router` is alleen beschikbaar in RunJS-omgevingen met een routeringscontext (bijv. JSBlock binnen een pagina, Flow-pagina's, event flows, enz.); het kan null zijn in pure backend- of niet-routeringscontexten (zoals workflows).

## Type-definitie

```typescript
router: Router
```

`Router` is afgeleid van `@remix-run/router`. In RunJS worden navigatie-acties zoals springen, teruggaan en vernieuwen uitgevoerd via `ctx.router.navigate()`.

## Methoden

### ctx.router.navigate()

Navigeert naar een doelpad, of voert een actie uit om terug te gaan of te vernieuwen.

**Handtekening:**

```typescript
navigate(to: string | number | null, options?: RouterNavigateOptions): Promise<void>
```

**Parameters:**

- `to`: Doelpad (string), relatieve geschiedenispositie (getal, bijv. `-1` om terug te gaan), of `null` (om de huidige pagina te vernieuwen).
- `options`: Optionele configuratie.
  - `replace?: boolean`: Of de huidige vermelding in de geschiedenis moet worden vervangen (standaard is `false`, wat een nieuwe vermelding toevoegt).
  - `state?: any`: Status die aan de doelroute moet worden doorgegeven. Deze gegevens verschijnen niet in de URL en zijn toegankelijk via `ctx.location.state` op de doelpagina. Dit is geschikt voor gevoelige informatie, tijdelijke gegevens of informatie die niet in de URL moet staan.

## Voorbeelden

### Basisnavigatie

```ts
// Navigeer naar de gebruikerslijst (voegt een nieuwe vermelding toe, teruggaan is mogelijk)
ctx.router.navigate('/admin/users');

// Navigeer naar een detailpagina
ctx.router.navigate(`/admin/users/${recordId}`);
```

### Geschiedenis vervangen (geen nieuwe vermelding)

```ts
// Redirect naar de startpagina na inloggen; de gebruiker keert niet terug naar de inlogpagina bij teruggaan
ctx.router.navigate('/admin', { replace: true });

// Vervang de huidige pagina door de detailpagina na een succesvolle formulierinzending
ctx.router.navigate(`/admin/users/${newId}`, { replace: true });
```

### State doorgeven

```ts
// Gegevens meenemen tijdens navigatie; de doelpagina haalt deze op via ctx.location.state
ctx.router.navigate('/admin/users/123', { 
  state: { from: 'dashboard', tab: 'profile' } 
});
```

### Teruggaan en vernieuwen

```ts
// Ga één pagina terug
ctx.router.navigate(-1);

// Ga twee pagina's terug
ctx.router.navigate(-2);

// Vernieuw de huidige pagina
ctx.router.navigate(null);
```

## Relatie met ctx.route en ctx.location

| Doel | Aanbevolen gebruik |
|------|----------|
| **Navigatie/Springen** | `ctx.router.navigate(path)` |
| **Huidig pad lezen** | `ctx.route.pathname` of `ctx.location.pathname` |
| **State lezen die tijdens navigatie is doorgegeven** | `ctx.location.state` |
| **Routeparameters lezen** | `ctx.route.params` |

`ctx.router` is verantwoordelijk voor "navigatie-acties", terwijl `ctx.route` en `ctx.location` verantwoordelijk zijn voor de "huidige routeringsstatus".

## Opmerkingen

- `navigate(path)` voegt standaard een nieuwe vermelding toe aan de geschiedenis, waardoor gebruikers kunnen terugkeren via de terugknop van de browser.
- `replace: true` vervangt de huidige vermelding in de geschiedenis zonder een nieuwe toe te voegen, wat geschikt is voor scenario's zoals redirect na inloggen of navigatie na een succesvolle indiening.
- **Over de `state` parameter**:
  - Gegevens die via `state` worden doorgegeven, verschijnen niet in de URL, waardoor het geschikt is voor gevoelige of tijdelijke gegevens.
  - Het is toegankelijk via `ctx.location.state` op de doelpagina.
  - `state` wordt opgeslagen in de browsergeschiedenis en blijft toegankelijk tijdens vooruit/achteruit navigatie.
  - `state` gaat verloren na een harde vernieuwing van de pagina.

## Gerelateerd

- [ctx.route](./route.md): Informatie over de huidige route-overeenkomst (pathname, params, enz.).
- [ctx.location](./location.md): Huidige URL-locatie (pathname, search, hash, state); `state` wordt hier gelezen na navigatie.