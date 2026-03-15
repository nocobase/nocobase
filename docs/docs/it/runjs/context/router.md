:::tip{title="Avviso di traduzione IA"}
Questo documento è stato tradotto dall'IA. Per informazioni accurate, consultare la [versione inglese](/runjs/context/router).
:::

# ctx.router

Un'istanza di router basata su React Router, utilizzata per la navigazione tramite codice in RunJS. Solitamente viene utilizzata in combinazione con `ctx.route` e `ctx.location`.

## Casi d'uso

| Scenario | Descrizione |
|------|------|
| **JSBlock / JSField** | Navigazione verso pagine di dettaglio, elenchi o link esterni dopo il clic su un pulsante. |
| **Regole di collegamento / Flusso di eventi** | Eseguire `navigate` verso un elenco o un dettaglio dopo un invio andato a buon fine, oppure passare lo `state` alla pagina di destinazione. |
| **JSAction / Gestione eventi** | Eseguire la navigazione all'interno di logiche come l'invio di moduli o il clic su link. |
| **Navigazione della vista** | Aggiornare l'URL tramite `navigate` durante il cambio dello stack di viste interno. |

> Nota: `ctx.router` è disponibile solo negli ambienti RunJS dotati di un contesto di routing (ad esempio, JSBlock all'interno di una pagina, pagine Flow, flussi di eventi, ecc.); potrebbe essere nullo in contesti puramente backend o privi di routing (come i flussi di lavoro).

## Definizione del tipo

```typescript
router: Router
```

`Router` proviene da `@remix-run/router`. In RunJS, le operazioni di navigazione come il salto, il ritorno o l'aggiornamento sono implementate tramite `ctx.router.navigate()`.

## Metodi

### ctx.router.navigate()

Naviga verso un percorso di destinazione o esegue un'azione di ritorno/aggiornamento.

**Firma:**

```typescript
navigate(to: string | number | null, options?: RouterNavigateOptions): Promise<void>
```

**Parametri:**

- `to`: Percorso di destinazione (string), posizione relativa nella cronologia (number, ad esempio `-1` per tornare indietro) o `null` (per aggiornare la pagina corrente).
- `options`: Configurazione opzionale.
  - `replace?: boolean`: Indica se sostituire la voce corrente nella cronologia (il valore predefinito è `false`, ovvero viene aggiunta una nuova voce).
  - `state?: any`: Stato da passare alla rotta di destinazione. Questi dati non appaiono nell'URL e sono accessibili tramite `ctx.location.state` nella pagina di destinazione. È adatto per informazioni sensibili, dati temporanei o informazioni che non dovrebbero essere inserite nell'URL.

## Esempi

### Navigazione di base

```ts
// Naviga all'elenco utenti (aggiunge una nuova voce alla cronologia, permette di tornare indietro)
ctx.router.navigate('/admin/users');

// Naviga a una pagina di dettaglio
ctx.router.navigate(`/admin/users/${recordId}`);
```

### Sostituzione della cronologia (nessuna nuova voce)

```ts
// Reindirizza alla home page dopo il login; l'utente non tornerà alla pagina di login tornando indietro
ctx.router.navigate('/admin', { replace: true });

// Sostituisce la pagina corrente con la pagina di dettaglio dopo l'invio di un modulo con successo
ctx.router.navigate(`/admin/users/${newId}`, { replace: true });
```

### Passaggio dello state

```ts
// Trasmette dati durante la navigazione; la pagina di destinazione li recupera tramite ctx.location.state
ctx.router.navigate('/admin/users/123', { 
  state: { from: 'dashboard', tab: 'profile' } 
});
```

### Indietro e Aggiorna

```ts
// Torna indietro di una pagina
ctx.router.navigate(-1);

// Torna indietro di due pagine
ctx.router.navigate(-2);

// Aggiorna la pagina corrente
ctx.router.navigate(null);
```

## Relazione con ctx.route e ctx.location

| Scopo | Utilizzo consigliato |
|------|----------|
| **Navigazione / Salto** | `ctx.router.navigate(path)` |
| **Leggere il percorso corrente** | `ctx.route.pathname` o `ctx.location.pathname` |
| **Leggere lo state passato durante la navigazione** | `ctx.location.state` |
| **Leggere i parametri della rotta** | `ctx.route.params` |

`ctx.router` è responsabile delle "azioni di navigazione", mentre `ctx.route` e `ctx.location` sono responsabili dello "stato della rotta corrente".

## Note

- `navigate(path)` aggiunge una nuova voce alla cronologia per impostazione predefinita, consentendo agli utenti di tornare indietro tramite il pulsante del browser.
- `replace: true` sostituisce la voce corrente nella cronologia senza aggiungerne una nuova, il che è utile per scenari come il reindirizzamento post-login o la navigazione dopo un invio andato a buon fine.
- **Riguardo al parametro `state`**:
  - I dati passati tramite `state` non appaiono nell'URL, rendendolo adatto per dati sensibili o temporanei.
  - È possibile accedervi tramite `ctx.location.state` nella pagina di destinazione.
  - Lo `state` viene salvato nella cronologia del browser e rimane accessibile durante la navigazione avanti/indietro.
  - Lo `state` andrà perso dopo un aggiornamento forzato della pagina.

## Correlati

- [ctx.route](./route.md): Informazioni sulla corrispondenza della rotta corrente (pathname, params, ecc.).
- [ctx.location](./location.md): Posizione URL corrente (pathname, search, hash, state); lo `state` viene letto qui dopo la navigazione.