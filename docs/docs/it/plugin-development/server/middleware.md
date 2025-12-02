:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Middleware

Il middleware del server NocoBase è essenzialmente un **middleware Koa**. Può manipolare l'oggetto `ctx` per gestire richieste e risposte, proprio come farebbe in Koa. Tuttavia, poiché NocoBase deve gestire la logica a diversi livelli di business, raggruppare tutto il middleware renderebbe la manutenzione e la gestione estremamente complesse.

Per questo motivo, NocoBase suddivide il middleware in **quattro livelli**:

1.  **Middleware a livello di fonte dati**: `app.dataSourceManager.use()`  
    Agisce solo sulle richieste di **una specifica fonte dati**, ed è comunemente utilizzato per la logica di connessione al database, la validazione dei campi o la gestione delle transazioni per quella fonte dati.

2.  **Middleware a livello di risorsa**: `app.resourceManager.use()`  
    È efficace solo per le risorse definite e adatto alla gestione della logica a livello di risorsa, come i permessi sui dati o la formattazione.

3.  **Middleware a livello di permessi**: `app.acl.use()`  
    Viene eseguito prima dei controlli sui permessi e serve a verificare i permessi o i ruoli dell'utente.

4.  **Middleware a livello di applicazione**: `app.use()`  
    Viene eseguito per ogni richiesta ed è adatto per la registrazione dei log, la gestione generale degli errori, l'elaborazione delle risposte, ecc.

## Registrazione del Middleware

Il middleware viene solitamente registrato nel metodo `load` del `plugin`, ad esempio:

```ts
export class MyPlugin extends Plugin {
  load() {
    // Middleware a livello di applicazione
    this.app.use(async (ctx, next) => {
      console.log('App middleware');
      await next();
    });

    // Middleware a livello di fonte dati
    this.app.dataSourceManager.use(async (ctx, next) => {
      console.log('DataSource middleware');
      await next();
    });

    // Middleware a livello di permessi
    this.app.acl.use(async (ctx, next) => {
      console.log('ACL middleware');
      await next();
    });

    // Middleware a livello di risorsa
    this.app.resourceManager.use(async (ctx, next) => {
      console.log('Resource middleware');
      await next();
    });

  }
}
```

### Ordine di Esecuzione

L'ordine di esecuzione del middleware è il seguente:

1.  Per prima cosa, viene eseguito il middleware dei permessi aggiunto tramite `acl.use()`.
2.  Poi, viene eseguito il middleware delle risorse aggiunto tramite `resourceManager.use()`.
3.  Successivamente, viene eseguito il middleware della fonte dati aggiunto tramite `dataSourceManager.use()`.
4.  Infine, viene eseguito il middleware dell'applicazione aggiunto tramite `app.use()`.

## Meccanismo di Inserimento `before` / `after` / `tag`

Per un controllo più flessibile sull'ordine del middleware, NocoBase offre i parametri `before`, `after` e `tag`:

-   **tag**: Assegna un'etichetta al middleware, utilizzabile per riferimenti da parte di middleware successivi.
-   **before**: Inserisce il middleware prima di quello con il `tag` specificato.
-   **after**: Inserisce il middleware dopo quello con il `tag` specificato.

Esempio:

```ts
// Middleware normale
app.use(m1, { tag: 'restApi' });
app.resourceManager.use(m2, { tag: 'parseToken' });
app.resourceManager.use(m3, { tag: 'checkRole' });

// m4 verrà posizionato prima di m1
app.use(m4, { before: 'restApi' });

// m5 verrà inserito tra m2 e m3
app.resourceManager.use(m5, { after: 'parseToken', before: 'checkRole' });
```

:::tip

Se non viene specificata alcuna posizione, l'ordine di esecuzione predefinito per il middleware appena aggiunto è:  
`acl.use()` -> `resourceManager.use()` -> `dataSourceManager.use()` -> `app.use()`  

:::

## Esempio del Modello a Cipolla

L'ordine di esecuzione del middleware segue il **modello a cipolla** di Koa, ovvero entra per primo nello stack del middleware ed esce per ultimo.

```ts
app.use(async (ctx, next) => {
  ctx.body = ctx.body || [];
  ctx.body.push(1);
  await next();
  ctx.body.push(2);
});

app.resourceManager.use(async (ctx, next) => {
  ctx.body = ctx.body || [];
  ctx.body.push(3);
  await next();
  ctx.body.push(4);
});

app.acl.use(async (ctx, next) => {
  ctx.body = ctx.body || [];
  ctx.body.push(5);
  await next();
  ctx.body.push(6);
});

app.resourceManager.define({
  name: 'test',
  actions: {
    async list(ctx, next) {
      ctx.body = ctx.body || [];
      ctx.body.push(7);
      await next();
      ctx.body.push(8);
    },
  },
});
```

Esempi di ordine di output per diverse interfacce:

-   **Richiesta normale**: `/api/hello`  
    Output: `[1,2]` (risorsa non definita, non esegue il middleware `resourceManager` e `acl`)  

-   **Richiesta di risorsa**: `/api/test:list`  
    Output: `[5,3,7,1,2,8,4,6]`  
    Il middleware viene eseguito in base all'ordine dei livelli e al modello a cipolla.

## Riepilogo

-   Il Middleware di NocoBase è un'estensione del Middleware di Koa.
-   Quattro livelli: Applicazione -> Fonte dati -> Risorsa -> Permessi.
-   È possibile utilizzare `before` / `after` / `tag` per controllare in modo flessibile l'ordine di esecuzione.
-   Segue il modello a cipolla di Koa, garantendo che il middleware sia componibile e annidabile.
-   Il middleware a livello di fonte dati agisce solo sulle richieste di una fonte dati specificata, mentre il middleware a livello di risorsa agisce solo sulle richieste di risorse definite.