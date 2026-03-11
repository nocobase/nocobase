:::tip{title="Avviso di traduzione IA"}
Questo documento è stato tradotto dall'IA. Per informazioni accurate, consultare la [versione inglese](/runjs/context/route).
:::

# ctx.route

Informazioni sulla corrispondenza della rotta corrente, corrispondenti al concetto di `route` in React Router. Viene utilizzato per recuperare la configurazione della rotta corrispondente, i parametri e altro ancora. In genere viene utilizzato in combinazione con `ctx.router` e `ctx.location`.

## Scenari di utilizzo

| Scenario | Descrizione |
|------|------|
| **JSBlock / JSField** | Esegue il rendering condizionale o visualizza l'identificatore della pagina corrente in base a `route.pathname` o `route.params`. |
| **Regole di collegamento / Motore dei flussi** | Legge i parametri della rotta (ad esempio `params.name`) per ramificazioni logiche o per passarli ai componenti figli. |
| **Navigazione della vista** | Confronta internamente `ctx.route.pathname` con un percorso di destinazione per determinare se attivare `ctx.router.navigate`. |

> Nota: `ctx.route` è disponibile solo negli ambienti RunJS che contengono un contesto di routing (come i JSBlock all'interno di una pagina, le pagine di flusso, ecc.). Potrebbe essere nullo in contesti puramente backend o senza routing (come i flussi di lavoro).

## Definizione del tipo

```ts
type RouteOptions = {
  name?: string;   // Identificatore univoco della rotta
  path?: string;   // Modello della rotta (es. /admin/:name)
  params?: Record<string, any>;  // Parametri della rotta (es. { name: 'users' })
  pathname?: string;  // Percorso completo della rotta corrente (es. /admin/users)
};
```

## Campi comuni

| Campo | Tipo | Descrizione |
|------|------|------|
| `pathname` | `string` | Il percorso completo della rotta corrente, coerente con `ctx.location.pathname`. |
| `params` | `Record<string, any>` | Parametri dinamici analizzati dal modello della rotta, come `{ name: 'users' }`. |
| `path` | `string` | Il modello della rotta, come `/admin/:name`. |
| `name` | `string` | Identificatore univoco della rotta, comunemente usato in scenari multi-scheda o multi-vista. |

## Relazione con ctx.router e ctx.location

| Scopo | Utilizzo consigliato |
|------|----------|
| **Leggere il percorso corrente** | `ctx.route.pathname` o `ctx.location.pathname`; entrambi sono coerenti durante la corrispondenza. |
| **Leggere i parametri della rotta** | `ctx.route.params`, ad esempio `params.name` che rappresenta l'UID della pagina corrente. |
| **Navigazione** | `ctx.router.navigate(path)` |
| **Leggere parametri di query, stato** | `ctx.location.search`, `ctx.location.state` |

`ctx.route` si concentra sulla "configurazione della rotta corrispondente", mentre `ctx.location` si concentra sulla "posizione URL corrente". Insieme, forniscono una descrizione completa dello stato del routing corrente.

## Esempi

### Lettura di pathname

```ts
// Visualizza il percorso corrente
ctx.message.info('Pagina corrente: ' + ctx.route.pathname);
```

### Ramificazione basata su params

```ts
// params.name è solitamente l'UID della pagina corrente (es. un identificatore di pagina di flusso)
if (ctx.route.params?.name === 'users') {
  // Esegue una logica specifica nella pagina di gestione utenti
}
```

### Visualizzazione in una pagina di flusso (Flow)

```tsx
<div>
  <h1>Pagina corrente - {ctx.route.pathname}</h1>
  <p>Identificatore rotta: {ctx.route.params?.name}</p>
</div>
```

## Correlati

- [ctx.router](./router.md): Navigazione della rotta. Quando `ctx.router.navigate()` cambia il percorso, `ctx.route` si aggiornerà di conseguenza.
- [ctx.location](./location.md): Posizione URL corrente (pathname, search, hash, state), utilizzata in combinazione con `ctx.route`.