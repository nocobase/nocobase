:::tip{title="Avviso di traduzione IA"}
Questo documento è stato tradotto dall'IA. Per informazioni accurate, consultare la [versione inglese](/runjs/resource/api-resource).
:::

# APIResource

Una **risorsa API generica** per effettuare richieste basate su URL, adatta a qualsiasi interfaccia HTTP. Eredita dalla classe base `FlowResource` ed estende la configurazione della richiesta e il metodo `refresh()`. A differenza di [MultiRecordResource](./multi-record-resource.md) e [SingleRecordResource](./single-record-resource.md), `APIResource` non dipende dal nome di una risorsa; effettua richieste direttamente tramite URL, rendendola ideale per interfacce personalizzate, API di terze parti e altri scenari simili.

**Modalità di creazione**: `ctx.makeResource('APIResource')` o `ctx.initResource('APIResource')`. È necessario chiamare `setURL()` prima dell'uso. Nel contesto RunJS, `ctx.api` (APIClient) viene iniettato automaticamente, quindi non è necessario chiamare `setAPIClient` manualmente.

---

## Scenari di utilizzo

| Scenario | Descrizione |
|------|------|
| **Interfaccia personalizzata** | Chiamata a API di risorse non standard (es. `/api/custom/stats`, `/api/reports/summary`). |
| **API di terze parti** | Richiesta a servizi esterni tramite URL completo (richiede il supporto CORS da parte della destinazione). |
| **Query una tantum** | Recupero dati temporaneo e "usa e getta", che non necessita di essere collegato a `ctx.resource`. |
| **Scelta tra APIResource e ctx.request** | Utilizzi `APIResource` quando sono necessari dati reattivi, eventi o stati di errore; utilizzi `ctx.request()` per semplici richieste singole. |

---

## Funzionalità della classe base (FlowResource)

Tutte le risorse dispongono di quanto segue:

| Metodo | Descrizione |
|------|------|
| `getData()` | Ottiene i dati correnti. |
| `setData(value)` | Imposta i dati (solo locale). |
| `hasData()` | Verifica se i dati esistono. |
| `getMeta(key?)` / `setMeta(meta)` | Legge/scrive metadati. |
| `getError()` / `setError(err)` / `clearError()` | Gestione dello stato di errore. |
| `on(event, callback)` / `once` / `off` / `emit` | Sottoscrizione e attivazione di eventi. |

---

## Configurazione della richiesta

| Metodo | Descrizione |
|------|------|
| `setAPIClient(api)` | Imposta l'istanza APIClient (solitamente iniettata automaticamente in RunJS). |
| `getURL()` / `setURL(url)` | URL della richiesta. |
| `loading` | Legge/scrive lo stato di caricamento (get/set). |
| `clearRequestParameters()` | Cancella i parametri della richiesta. |
| `setRequestParameters(params)` | Unisce e imposta i parametri della richiesta. |
| `setRequestMethod(method)` | Imposta il metodo della richiesta (es. `'get'`, `'post'`, predefinito `'get'`). |
| `addRequestHeader(key, value)` / `removeRequestHeader(key)` | Intestazioni (headers) della richiesta. |
| `addRequestParameter(key, value)` / `getRequestParameter(key)` / `removeRequestParameter(key)` | Aggiunge, elimina o consulta un singolo parametro. |
| `setRequestBody(data)` | Corpo della richiesta (utilizzato per POST/PUT/PATCH). |
| `setRequestOptions(key, value)` / `getRequestOptions()` | Opzioni generali della richiesta. |

---

## Formato URL

- **Stile risorsa**: Supporta l'abbreviazione delle risorse NocoBase, come `users:list` o `posts:get`, che verranno concatenate con il `baseURL`.
- **Percorso relativo**: es. `/api/custom/endpoint`, concatenato con il `baseURL` dell'applicazione.
- **URL completo**: Utilizzare indirizzi completi per richieste cross-origin; la destinazione deve avere il CORS configurato.

---

## Recupero dati

| Metodo | Descrizione |
|------|------|
| `refresh()` | Avvia una richiesta basata su URL, metodo, parametri, intestazioni e dati correnti. Scrive i dati della risposta in `setData(data)` e attiva l'evento `'refresh'`. In caso di fallimento, imposta `setError(err)` e lancia un `ResourceError`, senza attivare l'evento `refresh`. Richiede che `api` e URL siano stati impostati. |

---

## Esempi

### Richiesta GET di base

```js
const res = ctx.makeResource('APIResource');
res.setURL('/api/custom/endpoint');
res.setRequestParameters({ page: 1, pageSize: 10 });
await res.refresh();
const data = res.getData();
```

### URL in stile risorsa

```js
const res = ctx.makeResource('APIResource');
res.setURL('users:list');
res.setRequestParameters({ pageSize: 20, sort: ['-createdAt'] });
await res.refresh();
const rows = res.getData()?.data ?? [];
```

### Richiesta POST (con corpo della richiesta)

```js
const res = ctx.makeResource('APIResource');
res.setURL('/api/custom/submit');
res.setRequestMethod('post');
res.setRequestBody({ name: 'test', type: 'report' });
await res.refresh();
const result = res.getData();
```

### Ascolto dell'evento refresh

```js
const res = ctx.makeResource('APIResource');
res.setURL('/api/stats');
res.on('refresh', () => {
  const data = res.getData();
  ctx.render(<div>Statistiche: {JSON.stringify(data)}</div>);
});
await res.refresh();
```

### Gestione degli errori

```js
const res = ctx.makeResource('APIResource');
res.setURL('/api/may-fail');
try {
  await res.refresh();
  const data = res.getData();
} catch (e) {
  const err = res.getError();
  ctx.message.error(err?.message ?? 'Richiesta fallita');
}
```

### Intestazioni di richiesta personalizzate

```js
const res = ctx.makeResource('APIResource');
res.setURL('https://api.example.com/data');
res.addRequestHeader('X-Custom-Header', 'valore');
res.addRequestParameter('key', 'xxx');
await res.refresh();
```

---

## Note

- **Dipendenza da ctx.api**: In RunJS, `ctx.api` è iniettato dall'ambiente; la chiamata manuale a `setAPIClient` è solitamente superflua. Se utilizzata in uno scenario privo di contesto, deve impostarla autonomamente.
- **Refresh significa richiesta**: `refresh()` avvia una richiesta basata sulla configurazione corrente; metodo, parametri, dati, ecc., devono essere configurati prima della chiamata.
- **Gli errori non aggiornano i dati**: In caso di fallimento, `getData()` mantiene il valore precedente; le informazioni sull'errore possono essere recuperate tramite `getError()`.
- **Confronto con ctx.request**: Utilizzi `ctx.request()` per semplici richieste una tantum; utilizzi `APIResource` quando è richiesta la gestione di dati reattivi, eventi e stati di errore.

---

## Correlati

- [ctx.resource](../context/resource.md) - L'istanza della risorsa nel contesto corrente
- [ctx.initResource()](../context/init-resource.md) - Inizializza e associa a `ctx.resource`
- [ctx.makeResource()](../context/make-resource.md) - Crea una nuova istanza di risorsa senza associazione
- [ctx.request()](../context/request.md) - Richiesta HTTP generica, adatta per semplici chiamate una tantum
- [MultiRecordResource](./multi-record-resource.md) - Per collezioni/elenchi, supporta CRUD e paginazione
- [SingleRecordResource](./single-record-resource.md) - Per record singoli