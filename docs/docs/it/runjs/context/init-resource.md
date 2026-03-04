:::tip{title="Avviso di traduzione IA"}
Questo documento è stato tradotto dall'IA. Per informazioni accurate, consultare la [versione inglese](/runjs/context/init-resource).
:::

# ctx.initResource()

**Inizializza** la risorsa per il contesto corrente. Se `ctx.resource` non esiste già, ne crea una del tipo specificato e la associa al contesto; se esiste già, viene utilizzata direttamente. Successivamente, è possibile accedervi tramite `ctx.resource`.

## Casi d'uso

In genere viene utilizzato negli scenari **JSBlock** (blocco indipendente). La maggior parte dei blocchi, dei popup e di altri componenti ha `ctx.resource` già pre-associato e non richiede chiamate manuali. JSBlock non ha alcuna risorsa per impostazione predefinita, pertanto è necessario chiamare `ctx.initResource(type)` prima di caricare i dati tramite `ctx.resource`.

## Definizione del tipo

```ts
initResource(
  type: 'APIResource' | 'SingleRecordResource' | 'MultiRecordResource' | 'SQLResource'
): FlowResource;
```

| Parametro | Tipo | Descrizione |
|-----------|------|-------------|
| `type` | `string` | Tipo di risorsa: `'APIResource'`, `'SingleRecordResource'`, `'MultiRecordResource'`, `'SQLResource'` |

**Valore di ritorno**: L'istanza della risorsa nel contesto corrente (ovvero `ctx.resource`).

## Differenza rispetto a ctx.makeResource()

| Metodo | Comportamento |
|--------|---------------|
| `ctx.initResource(type)` | Crea e associa se `ctx.resource` non esiste; restituisce quella esistente se presente. Garantisce che `ctx.resource` sia disponibile. |
| `ctx.makeResource(type)` | Crea e restituisce solo una nuova istanza, **non** scrive in `ctx.resource`. Adatto per scenari che richiedono più risorse indipendenti o un uso temporaneo. |

## Esempi

### Dati dell'elenco (MultiRecordResource)

```ts
ctx.initResource('MultiRecordResource');
ctx.resource.setResourceName('users');
await ctx.resource.refresh();
const rows = ctx.resource.getData();
ctx.render(<pre>{JSON.stringify(rows, null, 2)}</pre>);
```

### Record singolo (SingleRecordResource)

```ts
ctx.initResource('SingleRecordResource');
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1); // Specifica la chiave primaria
await ctx.resource.refresh();
const record = ctx.resource.getData();
```

### Specificare la fonte dati

```ts
ctx.initResource('MultiRecordResource');
ctx.resource.setDataSourceKey('main');
ctx.resource.setResourceName('orders');
await ctx.resource.refresh();
```

## Note

- Nella maggior parte degli scenari dei blocchi (moduli, tabelle, dettagli, ecc.) e dei popup, `ctx.resource` è già pre-associato dall'ambiente di runtime, quindi la chiamata a `ctx.initResource` non è necessaria.
- L'inizializzazione manuale è richiesta solo in contesti come JSBlock dove non è presente una risorsa predefinita.
- Dopo l'inizializzazione, è necessario chiamare `setResourceName(name)` per specificare la collezione e quindi chiamare `refresh()` per caricare i dati.

## Correlati

- [ctx.resource](./resource.md) — L'istanza della risorsa nel contesto corrente
- [ctx.makeResource()](./make-resource.md) — Crea una nuova istanza di risorsa senza associarla a `ctx.resource`
- [MultiRecordResource](../resource/multi-record-resource.md) — Record multipli/Elenco
- [SingleRecordResource](../resource/single-record-resource.md) — Record singolo
- [APIResource](../resource/api-resource.md) — Risorsa API generica
- [SQLResource](../resource/sql-resource.md) — Risorsa query SQL