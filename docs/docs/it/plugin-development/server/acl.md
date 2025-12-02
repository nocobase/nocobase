:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Controllo delle autorizzazioni ACL

ACL (Access Control List) viene utilizzato per controllare le autorizzazioni di operazione sulle risorse. Lei può assegnare le autorizzazioni ai ruoli, oppure ignorare le restrizioni di ruolo e vincolare direttamente le autorizzazioni. Il sistema ACL offre un meccanismo flessibile di gestione delle autorizzazioni, supportando frammenti di autorizzazione, middleware, valutazione condizionale e altri metodi.

:::tip Nota

Gli oggetti ACL appartengono alle fonti dati (`dataSource.acl`). L'ACL della fonte dati principale può essere acceduto rapidamente tramite `app.acl`. Per l'utilizzo dell'ACL di altre fonti dati, consulti il capitolo [Gestione delle fonti dati](./data-source-manager.md).

:::

## Registrare Frammenti di Autorizzazione (Snippet)

I frammenti di autorizzazione (Snippet) possono registrare combinazioni di autorizzazioni comunemente utilizzate come unità di autorizzazione riutilizzabili. Dopo che un ruolo è stato associato a uno snippet, ottiene il set di autorizzazioni corrispondente, riducendo la configurazione duplicata e migliorando l'efficienza della gestione delle autorizzazioni.

```ts
acl.registerSnippet({
  name: 'ui.customRequests', // Il prefisso ui.* indica le autorizzazioni configurabili nell'interfaccia
  actions: ['customRequests:*'], // Operazioni sulle risorse corrispondenti, supporta i caratteri jolly
});
```

## Autorizzazioni che Ignorano i Vincoli di Ruolo (allow)

`acl.allow()` viene utilizzato per consentire a determinate operazioni di bypassare i vincoli di ruolo, ed è adatto per API pubbliche, scenari che richiedono una valutazione dinamica delle autorizzazioni, o casi in cui la valutazione delle autorizzazioni deve basarsi sul contesto della richiesta.

```ts
// Accesso pubblico, nessun login richiesto
acl.allow('app', 'getLang', 'public');

// Accessibile agli utenti loggati
acl.allow('app', 'getInfo', 'loggedIn');

// Basato su una condizione personalizzata
acl.allow('orders', ['create', 'update'], (ctx) => {
  return ctx.auth.user?.isAdmin ?? false;
});
```

**Descrizione del parametro `condition`:**

- `'public'`：Qualsiasi utente (inclusi gli utenti non autenticati) può accedere senza alcuna autenticazione
- `'loggedIn'`：Solo gli utenti loggati possono accedere, richiede un'identità utente valida
- `(ctx) => Promise<boolean>` o `(ctx) => boolean`：Funzione personalizzata che determina dinamicamente se l'accesso è consentito in base al contesto della richiesta, può implementare logiche di autorizzazione complesse

## Registrare Middleware di Autorizzazione (use)

`acl.use()` viene utilizzato per registrare middleware di autorizzazione personalizzati, consentendo l'inserimento di logiche personalizzate nel flusso di controllo delle autorizzazioni. Viene solitamente utilizzato in combinazione con `ctx.permission` per definire regole di autorizzazione personalizzate. È adatto per scenari che richiedono un controllo delle autorizzazioni non convenzionale, come moduli pubblici che necessitano di verifica password personalizzata, controlli dinamici delle autorizzazioni basati sui parametri della richiesta, ecc.

**Scenari applicativi tipici:**

- Scenari di moduli pubblici: nessun utente, nessun ruolo, ma le autorizzazioni devono essere vincolate tramite password personalizzate
- Controllo delle autorizzazioni basato su parametri della richiesta, indirizzi IP e altre condizioni
- Regole di autorizzazione personalizzate, che ignorano o modificano il flusso di controllo delle autorizzazioni predefinito

**Controllare le autorizzazioni tramite `ctx.permission`:**

```ts
acl.use(async (ctx, next) => {
  const { resourceName, actionName } = ctx.action;
  
  // Esempio: Il modulo pubblico richiede la verifica della password per ignorare il controllo delle autorizzazioni
  if (resourceName === 'publicForms' && actionName === 'submit') {
    const password = ctx.request.body?.password;
    if (password === 'your-secret-password') {
      // Verifica superata, ignorare il controllo delle autorizzazioni
      ctx.permission = {
        skip: true,
      };
    } else {
      ctx.throw(403, 'Invalid password');
    }
  }
  
  // Eseguire il controllo delle autorizzazioni (continuare il flusso ACL)
  await next();
});
```

**Descrizione della proprietà `ctx.permission`:**

- `skip: true`：Ignora i successivi controlli delle autorizzazioni ACL e consente direttamente l'accesso
- Può essere impostato dinamicamente nel middleware in base alla logica personalizzata per ottenere un controllo flessibile delle autorizzazioni

## Aggiungere Vincoli di Dati Fissi per Operazioni Specifiche (addFixedParams)

`addFixedParams` può aggiungere vincoli di ambito dati (filter) fissi a determinate operazioni sulle risorse. Questi vincoli bypassano le restrizioni di ruolo e vengono applicati direttamente, solitamente utilizzati per proteggere i dati critici del sistema.

```ts
acl.addFixedParams('roles', 'destroy', () => {
  return {
    filter: {
      $and: [
        { 'name.$ne': 'root' },
        { 'name.$ne': 'admin' },
        { 'name.$ne': 'member' },
      ],
    },
  };
});

// Anche se un utente ha l'autorizzazione per eliminare i ruoli, non può eliminare ruoli di sistema come root, admin, member
```

> **Suggerimento:** `addFixedParams` può essere utilizzato per impedire che dati sensibili vengano accidentalmente eliminati o modificati, come ruoli di sistema predefiniti, account amministratore, ecc. Questi vincoli agiscono in combinazione con le autorizzazioni di ruolo, garantendo che anche con le autorizzazioni non sia possibile manipolare i dati protetti.

## Verificare le Autorizzazioni (can)

`acl.can()` viene utilizzato per verificare se un determinato ruolo ha l'autorizzazione per eseguire un'operazione specificata, restituendo un oggetto risultato di autorizzazione o `null`. È comunemente utilizzato nella logica di business per valutare dinamicamente le autorizzazioni, ad esempio in middleware o nei gestori di operazioni per decidere se consentire l'esecuzione di determinate operazioni in base al ruolo.

```ts
const result = acl.can({
  roles: ['admin', 'manager'], // Può passare un singolo ruolo o un array di ruoli
  resource: 'orders',
  action: 'delete',
});

if (result) {
  console.log(`Il ruolo ${result.role} può eseguire l'operazione ${result.action}`);
  // result.params contiene i parametri fissi impostati tramite addFixedParams
  console.log('Parametri fissi:', result.params);
} else {
  console.log('Nessuna autorizzazione per eseguire questa operazione');
}
```

> **Suggerimento:** Se vengono passati più ruoli, ogni ruolo verrà controllato in sequenza e verrà restituito il risultato del primo ruolo che ha l'autorizzazione.

**Definizioni di tipo:**

```ts
interface CanArgs {
  role?: string;      // Ruolo singolo
  roles?: string[];   // Più ruoli (controllati in sequenza, restituisce il primo ruolo con autorizzazione)
  resource: string;   // Nome della risorsa
  action: string;    // Nome dell'operazione
}

interface CanResult {
  role: string;       // Ruolo con autorizzazione
  resource: string;   // Nome della risorsa
  action: string;    // Nome dell'operazione
  params?: any;       // Informazioni sui parametri fissi (se impostati tramite addFixedParams)
}
```

## Registrare Operazioni Configurabili (setAvailableAction)

Se Lei desidera che le operazioni personalizzate siano configurabili nell'interfaccia (ad esempio, visualizzate nella pagina di gestione dei ruoli), deve utilizzare `setAvailableAction` per registrarle. Le operazioni registrate appariranno nell'interfaccia di configurazione delle autorizzazioni, dove gli amministratori potranno configurare le autorizzazioni di operazione per i diversi ruoli.

```ts
acl.setAvailableAction('importXlsx', {
  displayName: '{{t("Import")}}', // Nome visualizzato nell'interfaccia, supporta l'internazionalizzazione
  type: 'new-data',               // Tipo di operazione
  onNewRecord: true,              // Se deve avere effetto alla creazione di nuovi record
});
```

**Descrizione dei parametri:**

- **displayName**: Nome visualizzato nell'interfaccia di configurazione delle autorizzazioni, supporta l'internazionalizzazione (utilizzando il formato `{{t("key")}}`)
- **type**: Tipo di operazione, determina la classificazione di questa operazione nella configurazione delle autorizzazioni
  - `'new-data'`：Operazioni che creano nuovi dati (come importazione, aggiunta, ecc.)
  - `'existing-data'`：Operazioni che modificano dati esistenti (come aggiornamento, eliminazione, ecc.)
- **onNewRecord**: Se deve avere effetto alla creazione di nuovi record, valido solo per il tipo `'new-data'`

Dopo la registrazione, questa operazione apparirà nell'interfaccia di configurazione delle autorizzazioni, dove gli amministratori potranno configurare le autorizzazioni dell'operazione nella pagina di gestione dei ruoli.