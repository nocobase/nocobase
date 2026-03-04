:::tip{title="Avviso di traduzione IA"}
Questo documento è stato tradotto dall'IA. Per informazioni accurate, consultare la [versione inglese](/runjs/context/make-resource).
:::

# ctx.makeResource()

**Crea** e restituisce una nuova istanza di risorsa **senza** scrivere o modificare `ctx.resource`. È adatto a scenari che richiedono più risorse indipendenti o un utilizzo temporaneo.

## Casi d'uso

| Scenario | Descrizione |
|------|------|
| **Risorse multiple** | Caricamento simultaneo di più fonti dati (ad es. elenco utenti + elenco ordini), ognuna con una risorsa indipendente. |
| **Query temporanee** | Query una tantum che vengono eliminate dopo l'uso, senza necessità di collegamento a `ctx.resource`. |
| **Dati ausiliari** | Utilizzo di `ctx.resource` per i dati principali e `makeResource` per creare istanze per dati aggiuntivi. |

Se si necessita di una sola risorsa e si desidera collegarla a `ctx.resource`, è più appropriato utilizzare [ctx.initResource()](./init-resource.md).

## Definizione del tipo

```ts
makeResource<T = FlowResource>(
  resourceType: 'APIResource' | 'SingleRecordResource' | 'MultiRecordResource' | 'SQLResource'
): T;
```

| Parametro | Tipo | Descrizione |
|------|------|------|
| `resourceType` | `string` | Tipo di risorsa: `'APIResource'`, `'SingleRecordResource'`, `'MultiRecordResource'`, `'SQLResource'` |

**Valore di ritorno**: L'istanza della risorsa appena creata.

## Differenza rispetto a ctx.initResource()

| Metodo | Comportamento |
|------|------|
| `ctx.makeResource(type)` | Crea e restituisce solo una nuova istanza, **senza** scrivere in `ctx.resource`. Può essere chiamato più volte per ottenere più risorse indipendenti. |
| `ctx.initResource(type)` | Crea e collega se `ctx.resource` non esiste; la restituisce direttamente se esiste già. Garantisce che `ctx.resource` sia disponibile. |

## Esempi

### Risorsa singola

```ts
const listRes = ctx.makeResource('MultiRecordResource');
listRes.setResourceName('users');
await listRes.refresh();
const users = listRes.getData();
// ctx.resource mantiene il suo valore originale (se presente)
```

### Risorse multiple

```ts
const usersRes = ctx.makeResource('MultiRecordResource');
usersRes.setResourceName('users');
await usersRes.refresh();

const ordersRes = ctx.makeResource('MultiRecordResource');
ordersRes.setResourceName('orders');
await ordersRes.refresh();

ctx.render(
  <div>
    <p>Numero utenti: {usersRes.getData().length}</p>
    <p>Numero ordini: {ordersRes.getData().length}</p>
  </div>
);
```

### Query temporanea

```ts
// Query una tantum, non inquina ctx.resource
const tempRes = ctx.makeResource('SingleRecordResource');
tempRes.setResourceName('users');
tempRes.setFilterByTk(1);
await tempRes.refresh();
const record = tempRes.getData();
```

## Note

- La risorsa appena creata deve chiamare `setResourceName(name)` per specificare la collezione, quindi caricare i dati tramite `refresh()`.
- Ogni istanza di risorsa è indipendente e non influisce sulle altre; ideale per il caricamento parallelo di più fonti dati.

## Correlati

- [ctx.initResource()](./init-resource.md): Inizializza e collega a `ctx.resource`
- [ctx.resource](./resource.md): L'istanza della risorsa nel contesto corrente
- [MultiRecordResource](../resource/multi-record-resource) — Record multipli/Elenco
- [SingleRecordResource](../resource/single-record-resource) — Record singolo
- [APIResource](../resource/api-resource) — Risorsa API generica
- [SQLResource](../resource/sql-resource) — Risorsa query SQL