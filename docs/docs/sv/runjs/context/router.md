:::tip{title="AI-översättningsmeddelande"}
Detta dokument har översatts av AI. För korrekt information, se [den engelska versionen](/runjs/context/router).
:::

# ctx.router

En router-instans baserad på React Router, som används för navigering via kod i RunJS. Den används vanligtvis tillsammans med `ctx.route` och `ctx.location`.

## Tillämpningsområden

| Scenario | Beskrivning |
|------|------|
| **JSBlock / JSField** | Navigera till detaljsidor, listsidor eller externa länkar efter ett knapptryck. |
| **Länkningsregler / Händelseflöde** | Utför `navigate` till en lista eller detaljsida efter lyckad inskickning, eller skicka `state` till målsidan. |
| **JSAction / Händelsehantering** | Utför ruttnavigering i logik som formulärinsändningar eller länkklick. |
| **Vynavigering** | Uppdatera URL:en via `navigate` vid byte i den interna vy-stacken. |

> **Observera:** `ctx.router` är endast tillgänglig i RunJS-miljöer med en ruttkontext (t.ex. JSBlock på en sida, Flow-sidor, händelseflöden etc.); den kan vara tom i rena backend-miljöer eller kontexter utan rutter (t.ex. arbetsflöden).

## Typdefinition

```typescript
router: Router
```

`Router` kommer från `@remix-run/router`. I RunJS implementeras navigeringsåtgärder som att hoppa, gå tillbaka och uppdatera via `ctx.router.navigate()`.

## Metoder

### ctx.router.navigate()

Navigerar till en målsökväg, eller utför en bakåtnavigering/uppdatering.

**Signatur:**

```typescript
navigate(to: string | number | null, options?: RouterNavigateOptions): Promise<void>
```

**Parametrar:**

- `to`: Målsökväg (string), relativ historikposition (number, t.ex. `-1` för att gå tillbaka) eller `null` (för att uppdatera aktuell sida).
- `options`: Valfri konfiguration.
  - `replace?: boolean`: Om den aktuella historikposten ska ersättas (standard är `false`, vilket lägger till en ny post).
  - `state?: any`: State som skickas till målrutten. Denna data visas inte i URL:en och kan nås via `ctx.location.state` på målsidan. Lämpligt för känslig information, temporär data eller information som inte bör placeras i URL:en.

## Exempel

### Grundläggande navigering

```ts
// Navigera till användarlistan (lägger till en ny historikpost, tillåter att gå tillbaka)
ctx.router.navigate('/admin/users');

// Navigera till en detaljsida
ctx.router.navigate(`/admin/users/${recordId}`);
```

### Ersätta historik (ingen ny post)

```ts
// Omdirigera till startsidan efter inloggning; användaren kommer inte tillbaka till inloggningssidan vid bakåtnavigering
ctx.router.navigate('/admin', { replace: true });

// Ersätt den aktuella sidan med detaljsidan efter lyckad formulärinsändning
ctx.router.navigate(`/admin/users/${newId}`, { replace: true });
```

### Skicka med state

```ts
// Skicka med data vid navigering; målsidan hämtar den via ctx.location.state
ctx.router.navigate('/admin/users/123', { 
  state: { from: 'dashboard', tab: 'profile' } 
});
```

### Bakåt och uppdatera

```ts
// Gå tillbaka en sida
ctx.router.navigate(-1);

// Gå tillbaka två sidor
ctx.router.navigate(-2);

// Uppdatera aktuell sida
ctx.router.navigate(null);
```

## Relation till ctx.route och ctx.location

| Syfte | Rekommenderad användning |
|------|----------|
| **Navigering/Hopp** | `ctx.router.navigate(path)` |
| **Läsa aktuell sökväg** | `ctx.route.pathname` eller `ctx.location.pathname` |
| **Läsa state som skickades vid navigering** | `ctx.location.state` |
| **Läsa ruttparametrar** | `ctx.route.params` |

`ctx.router` ansvarar för "navigeringsåtgärder", medan `ctx.route` och `ctx.location` ansvarar för "aktuellt ruttillstånd".

## Observera

- `navigate(path)` lägger som standard till en ny historikpost, vilket gör att ni kan gå tillbaka via webbläsarens bakåtknapp.
- `replace: true` ersätter den aktuella historikposten utan att lägga till en ny, vilket är lämpligt för scenarier som omdirigering efter inloggning eller navigering efter lyckad inskickning.
- **Angående parametern `state`**:
  - Data som skickas via `state` visas inte i URL:en, vilket gör den lämplig för känslig eller temporär data.
  - Den kan nås via `ctx.location.state` på målsidan.
  - `state` sparas i webbläsarens historik och förblir tillgänglig vid navigering framåt/bakåt.
  - `state` går förlorad vid en hård siduppdatering.

## Relaterat

- [ctx.route](./route.md): Aktuell ruttmatchningsinformation (pathname, params etc.).
- [ctx.location](./location.md): Aktuell URL-plats (pathname, search, hash, state); `state` läses här efter navigering.