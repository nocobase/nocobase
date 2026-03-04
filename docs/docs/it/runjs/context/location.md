:::tip{title="Avviso di traduzione IA"}
Questo documento è stato tradotto dall'IA. Per informazioni accurate, consultare la [versione inglese](/runjs/context/location).
:::

# ctx.location

Informazioni sulla posizione della rotta corrente, equivalente all'oggetto `location` di React Router. Viene solitamente utilizzato in combinazione con `ctx.router` e `ctx.route` per leggere il percorso corrente, la stringa di query, l'hash e lo stato (state) passato attraverso la rotta.

## Scenari di utilizzo

| Scenario | Descrizione |
|------|------|
| **JSBlock / JSField** | Eseguire il rendering condizionale o ramificazioni logiche in base al percorso corrente, ai parametri di query o all'hash. |
| **Regole di collegamento / Flusso di eventi** | Leggere i parametri di query dell'URL per il filtraggio dei collegamenti o determinare l'origine in base a `location.state`. |
| **Elaborazione post-navigazione** | Ricevere i dati passati dalla pagina precedente tramite `ctx.router.navigate` utilizzando `ctx.location.state` nella pagina di destinazione. |

> Nota: `ctx.location` è disponibile solo negli ambienti RunJS con un contesto di routing (ad esempio, JSBlock all'interno di una pagina, flussi di eventi, ecc.); potrebbe essere nullo in contesti puramente backend o senza routing (come i flussi di lavoro).

## Definizione del tipo

```ts
location: Location;
```

`Location` proviene da `react-router-dom`, coerente con il valore restituito da `useLocation()` di React Router.

## Campi comuni

| Campo | Tipo | Descrizione |
|------|------|------|
| `pathname` | `string` | Il percorso corrente, che inizia con `/` (es. `/admin/users`). |
| `search` | `string` | La stringa di query, che inizia con `?` (es. `?page=1&status=active`). |
| `hash` | `string` | Il frammento hash, che inizia con `#` (es. `#section-1`). |
| `state` | `any` | Dati arbitrari passati tramite `ctx.router.navigate(path, { state })`, non riflessi nell'URL. |
| `key` | `string` | Un identificatore univoco per questa posizione; la pagina iniziale è `"default"`. |

## Relazione con ctx.router e ctx.urlSearchParams

| Scopo | Utilizzo consigliato |
|------|----------|
| **Leggere percorso, hash, stato** | `ctx.location.pathname` / `ctx.location.hash` / `ctx.location.state` |
| **Leggere i parametri di query (come oggetto)** | `ctx.urlSearchParams`, che fornisce direttamente l'oggetto analizzato. |
| **Analizzare la stringa search** | `new URLSearchParams(ctx.location.search)` o utilizzare direttamente `ctx.urlSearchParams`. |

`ctx.urlSearchParams` è derivato dall'analisi di `ctx.location.search`. Se ha bisogno solo dei parametri di query, l'uso di `ctx.urlSearchParams` è più conveniente.

## Esempi

### Ramificazione in base al percorso

```ts
if (ctx.location.pathname.startsWith('/admin/users')) {
  ctx.message.info('Attualmente nella pagina di gestione utenti');
}
```

### Analisi dei parametri di query

```ts
// Metodo 1: Utilizzo di ctx.urlSearchParams (Consigliato)
const page = ctx.urlSearchParams.page || 1;
const status = ctx.urlSearchParams.status;

// Metodo 2: Utilizzo di URLSearchParams per analizzare search
const params = new URLSearchParams(ctx.location.search);
const page = params.get('page') || '1';
const status = params.get('status');
```

### Ricezione dello stato passato tramite la navigazione della rotta

```ts
// Durante la navigazione dalla pagina precedente: ctx.router.navigate('/users/123', { state: { from: 'dashboard' } })
const prevState = ctx.location.state;
if (prevState?.from === 'dashboard') {
  ctx.message.info('Navigato dalla dashboard');
}
```

### Localizzazione delle ancore tramite hash

```ts
const hash = ctx.location.hash; // es. "#edit"
if (hash === '#edit') {
  // Scorrere fino all'area di modifica o eseguire la logica corrispondente
}
```

## Correlati

- [ctx.router](./router.md): Navigazione della rotta; lo `state` di `ctx.router.navigate` può essere recuperato tramite `ctx.location.state` nella pagina di destinazione.
- [ctx.route](./route.md): Informazioni sulla corrispondenza della rotta corrente (parametri, configurazione, ecc.), spesso utilizzate in combinazione con `ctx.location`.