:::tip{title="Avviso di traduzione IA"}
Questo documento è stato tradotto dall'IA. Per informazioni accurate, consultare la [versione inglese](/runjs/context/filter-manager).
:::

# ctx.filterManager

Il gestore delle connessioni dei filtri viene utilizzato per gestire le associazioni di filtraggio tra i moduli di filtraggio (FilterForm) e i blocchi dati (tabelle, liste, grafici, ecc.). È fornito da `BlockGridModel` ed è disponibile solo all'interno del suo contesto (ad esempio, blocchi di moduli di filtraggio, blocchi dati).

## Scenari d'uso

| Scenario | Descrizione |
|------|------|
| **Blocco modulo di filtraggio** | Gestisce le configurazioni di connessione tra gli elementi di filtraggio e i blocchi di destinazione; aggiorna i dati di destinazione quando i filtri cambiano. |
| **Blocco dati (Tabella/Lista)** | Funge da destinazione del filtro, associando le condizioni di filtraggio tramite `bindToTarget`. |
| **Regole di concatenazione / FilterModel personalizzato** | Chiama `refreshTargetsByFilter` all'interno di `doFilter` o `doReset` per attivare l'aggiornamento delle destinazioni. |
| **Configurazione dei campi di connessione** | Utilizza `getConnectFieldsConfig` e `saveConnectFieldsConfig` per mantenere le mappature dei campi tra filtri e destinazioni. |

> Nota: `ctx.filterManager` è disponibile solo nei contesti RunJS che dispongono di un `BlockGridModel` (ad esempio, all'interno di una pagina contenente un modulo di filtraggio); è `undefined` nei normali JSBlock o nelle pagine indipendenti. Si consiglia di utilizzare il concatenamento opzionale (optional chaining) prima dell'accesso.

## Definizione dei tipi

```ts
filterManager: FilterManager;

type FilterConfig = {
  filterId: string;   // UID del modello di filtro
  targetId: string;   // UID del modello del blocco dati di destinazione
  filterPaths?: string[];  // Percorsi dei campi del blocco di destinazione
  operator?: string;  // Operatore di filtro
};

type ConnectFieldsConfig = {
  targets: { targetId: string; filterPaths: string[] }[];
};
```

## Metodi comuni

| Metodo | Descrizione |
|------|------|
| `getFilterConfigs()` | Ottiene tutte le attuali configurazioni di connessione dei filtri. |
| `getConnectFieldsConfig(filterId)` | Ottiene la configurazione dei campi di connessione per un filtro specifico. |
| `saveConnectFieldsConfig(filterId, config)` | Salva la configurazione dei campi di connessione per un filtro. |
| `addFilterConfig(config)` | Aggiunge una configurazione di filtro (filterId + targetId + filterPaths). |
| `removeFilterConfig({ filterId?, targetId?, persist? })` | Rimuove le configurazioni di filtro tramite filterId, targetId o entrambi. |
| `bindToTarget(targetId)` | Associa la configurazione del filtro a un blocco di destinazione, attivando la sua risorsa per applicare il filtro. |
| `unbindFromTarget(targetId)` | Rimuove l'associazione del filtro dal blocco di destinazione. |
| `refreshTargetsByFilter(filterId | filterId[])` | Aggiorna i dati dei blocchi di destinazione associati in base ai filtri specificati. |

## Concetti chiave

- **FilterModel**: Un modello che fornisce le condizioni di filtraggio (ad esempio, FilterFormItemModel), che deve implementare `getFilterValue()` per restituire il valore del filtro corrente.
- **TargetModel**: Il blocco dati che viene filtrato; la sua `resource` deve supportare `addFilterGroup`, `removeFilterGroup` e `refresh`.

## Esempi

### Aggiungere una configurazione di filtro

```ts
await ctx.filterManager?.addFilterConfig({
  filterId: 'filter-form-item-uid',
  targetId: 'table-block-uid',
  filterPaths: ['status', 'createdAt'],
  operator: '$eq',
});
```

### Aggiornare i blocchi di destinazione

```ts
// All'interno di doFilter / doReset di un modulo di filtraggio
ctx.filterManager?.refreshTargetsByFilter(ctx.model.uid);

// Aggiornare le destinazioni associate a più filtri
ctx.filterManager?.refreshTargetsByFilter(['filter-1', 'filter-2']);
```

### Configurazione dei campi di connessione

```ts
// Ottenere la configurazione di connessione
const config = ctx.filterManager?.getConnectFieldsConfig(ctx.model.uid);

// Salvare la configurazione di connessione
await ctx.filterManager?.saveConnectFieldsConfig(ctx.model.uid, {
  targets: [
    { targetId: 'table-uid', filterPaths: ['status'] },
    { targetId: 'chart-uid', filterPaths: ['category'] },
  ],
});
```

### Rimuovere una configurazione

```ts
// Eliminare tutte le configurazioni per un filtro specifico
await ctx.filterManager?.removeFilterConfig({ filterId: 'filter-uid' });

// Eliminare tutte le configurazioni di filtro per una destinazione specifica
await ctx.filterManager?.removeFilterConfig({ targetId: 'table-uid' });
```

## Correlati

- [ctx.resource](./resource.md): La risorsa del blocco di destinazione deve supportare l'interfaccia di filtraggio.
- [ctx.model](./model.md): Utilizzato per ottenere l'UID del modello corrente per filterId / targetId.