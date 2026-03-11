:::tip{title="Avviso di traduzione IA"}
Questo documento è stato tradotto dall'IA. Per informazioni accurate, consultare la [versione inglese](/runjs/context/request).
:::

# ctx.request()

Avvia una richiesta HTTP autenticata all'interno di RunJS. La richiesta include automaticamente `baseURL`, `Token`, `locale`, `role`, ecc. dell'applicazione corrente e segue la logica di intercettazione delle richieste e di gestione degli errori dell'applicazione.

## Casi d'uso

Applicabile a qualsiasi scenario in RunJS in cui sia necessario avviare una richiesta HTTP remota, come JSBlock, JSField, JSItem, JSColumn, flussi di lavoro, collegamenti, JSAction, ecc.

## Definizione del tipo

```typescript
request(options: RequestOptions): Promise<AxiosResponse<any>>;
```

`RequestOptions` estende `AxiosRequestConfig` di Axios:

```typescript
type RequestOptions = AxiosRequestConfig & {
  skipNotify?: boolean | ((error: any) => boolean);  // Indica se saltare i messaggi di errore globali in caso di fallimento della richiesta
  skipAuth?: boolean;                                 // Indica se saltare il reindirizzamento dell'autenticazione (es. non reindirizzare alla pagina di login in caso di errore 401)
};
```

## Parametri comuni

| Parametro | Tipo | Descrizione |
|------|------|------|
| `url` | string | URL della richiesta. Supporta lo stile risorsa (es. `users:list`, `posts:create`) o un URL completo |
| `method` | 'get' \| 'post' \| 'put' \| 'patch' \| 'delete' | Metodo HTTP, predefinito `'get'` |
| `params` | object | Parametri di query, serializzati nell'URL |
| `data` | any | Corpo della richiesta, utilizzato per post/put/patch |
| `headers` | object | Intestazioni di richiesta personalizzate |
| `skipNotify` | boolean \| (error) => boolean | Se impostato su true o se la funzione restituisce true, non verranno visualizzati messaggi di errore globali in caso di fallimento |
| `skipAuth` | boolean | Se impostato su true, gli errori 401 ecc. non attiveranno il reindirizzamento dell'autenticazione (es. reindirizzamento alla pagina di login) |

## URL in stile risorsa

L'API delle risorse di NocoBase supporta il formato abbreviato `risorsa:azione`:

| Formato | Descrizione | Esempio |
|------|------|------|
| `collection:action` | CRUD su singola collezione | `users:list`, `users:get`, `users:create`, `posts:update` |
| `collection.relation:action` | Risorse associate (richiede il passaggio della chiave primaria tramite `resourceOf` o URL) | `posts.comments:list` |

I percorsi relativi verranno concatenati con la `baseURL` dell'applicazione (solitamente `/api`); le richieste cross-origin devono utilizzare un URL completo e il servizio di destinazione deve essere configurato con CORS.

## Struttura della risposta

Il valore restituito è un oggetto di risposta Axios. Campi comuni:

- `response.data`: Corpo della risposta
- Le interfacce di elenco solitamente restituiscono `data.data` (array di record) + `data.meta` (paginazione, ecc.)
- Le interfacce per record singolo/creazione/aggiornamento solitamente restituiscono il record in `data.data`

## Esempi

### Query di elenco

```javascript
const { data } = await ctx.request({
  url: 'users:list',
  method: 'get',
  params: { pageSize: 10, page: 1 },
});

const rows = Array.isArray(data?.data) ? data.data : [];
const meta = data?.meta; // Informazioni su paginazione e altro
```

### Invio dati

```javascript
const res = await ctx.request({
  url: 'users:create',
  method: 'post',
  data: { nickname: 'Mario Rossi', email: 'mario.rossi@example.com' },
});

const newRecord = res?.data?.data;
```

### Con filtraggio e ordinamento

```javascript
const res = await ctx.request({
  url: 'users:list',
  method: 'get',
  params: {
    pageSize: 20,
    sort: ['-createdAt'],
    filter: { status: 'active' },
  },
});
```

### Saltare la notifica di errore

```javascript
const res = await ctx.request({
  url: 'some:action',
  method: 'get',
  skipNotify: true,  // Non mostra il messaggio globale in caso di fallimento
});

// Oppure decidere se saltare in base al tipo di errore
const res2 = await ctx.request({
  url: 'some:action',
  method: 'get',
  skipNotify: (err) => err?.name === 'CanceledError',
});
```

### Richiesta cross-origin

Quando si utilizza un URL completo per richiedere altri domini, il servizio di destinazione deve essere configurato con CORS per consentire l'origine dell'applicazione corrente. Se l'interfaccia di destinazione richiede un proprio token, questo può essere passato tramite gli header:

```javascript
const res = await ctx.request({
  url: 'https://api.example.com/v1/data',
  method: 'get',
});

const res2 = await ctx.request({
  url: 'https://api.other.com/items',
  method: 'get',
  headers: {
    Authorization: 'Bearer <token_servizio_destinazione>',
  },
});
```

### Visualizzazione con ctx.render

```javascript
const { data } = await ctx.request({
  url: 'users:list',
  method: 'get',
  params: { pageSize: 5 },
});
const rows = Array.isArray(data?.data) ? data.data : [];

ctx.render([
  '<div style="padding:12px">',
  '<h4>' + ctx.t('Elenco utenti') + '</h4>',
  '<ul>',
  ...rows.map((r) => '<li>' + (r.nickname ?? r.username ?? '') + '</li>'),
  '</ul>',
  '</div>',
].join(''));
```

## Note

- **Gestione degli errori**: Il fallimento della richiesta genererà un'eccezione e, per impostazione predefinita, apparirà un messaggio di errore globale. Utilizzi `skipNotify: true` per intercettare e gestire l'errore autonomamente.
- **Autenticazione**: Le richieste sullo stesso dominio includeranno automaticamente il Token, la lingua (locale) e il ruolo dell'utente corrente; le richieste cross-origin richiedono che la destinazione supporti CORS e che il token venga passato negli header, se necessario.
- **Permessi sulle risorse**: Le richieste sono soggette ai vincoli ACL e possono accedere solo alle risorse per le quali l'utente corrente dispone dei permessi.

## Correlati

- [ctx.message](./message.md) - Mostra messaggi leggeri al termine della richiesta
- [ctx.notification](./notification.md) - Mostra notifiche al termine della richiesta
- [ctx.render](./render.md) - Esegue il rendering dei risultati della richiesta nell'interfaccia
- [ctx.makeResource](./make-resource.md) - Costruisce un oggetto risorsa per il caricamento dei dati a catena (alternativa a `ctx.request`)