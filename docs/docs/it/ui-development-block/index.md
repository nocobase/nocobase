:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Panoramica sulle estensioni dei blocchi

In NocoBase 2.0, il meccanismo di estensione dei blocchi è stato notevolmente semplificato. Gli sviluppatori devono solo ereditare la classe base **FlowModel** corrispondente e implementare i metodi di interfaccia correlati (principalmente il metodo `renderComponent()`) per personalizzare rapidamente i blocchi.

## Categorie di blocchi

NocoBase classifica i blocchi in tre tipi, visualizzati in gruppi nell'interfaccia di configurazione:

- **Blocchi dati**: Blocchi che ereditano da `DataBlockModel` o `CollectionBlockModel`
- **Blocchi filtro**: Blocchi che ereditano da `FilterBlockModel`
- **Altri blocchi**: Blocchi che ereditano direttamente da `BlockModel`

> Il raggruppamento dei blocchi è determinato dalla classe base corrispondente. La logica di classificazione si basa sulle relazioni di ereditarietà e non richiede alcuna configurazione aggiuntiva.

## Descrizione delle classi base

Il sistema fornisce quattro classi base per le estensioni:

### BlockModel

**Modello di blocco base**, la classe base per blocchi più versatile.

- Adatto per blocchi di sola visualizzazione che non dipendono dai dati
- Classificato nel gruppo **Altri blocchi**
- Applicabile a scenari personalizzati

### DataBlockModel

**Modello di blocco dati (non legato a una tabella dati)**, per blocchi con fonti dati personalizzate.

- Non direttamente legato a una tabella dati, può personalizzare la logica di recupero dei dati
- Classificato nel gruppo **Blocchi dati**
- Applicabile a: chiamate ad API esterne, elaborazione dati personalizzata, grafici statistici, ecc.

### CollectionBlockModel

**Modello di blocco collezione**, per blocchi che devono essere legati a una tabella dati.

- Richiede il collegamento a una classe base di modello di tabella dati
- Classificato nel gruppo **Blocchi dati**
- Applicabile a: liste, moduli, bacheche Kanban e altri blocchi che dipendono chiaramente da una specifica tabella dati

### FilterBlockModel

**Modello di blocco filtro**, per la creazione di blocchi di condizioni di filtro.

- Classe base del modello per la creazione di condizioni di filtro
- Classificato nel gruppo **Blocchi filtro**
- Di solito funziona in combinazione con i blocchi dati

## Come scegliere una classe base

Quando seleziona una classe base, può seguire questi principi:

- **Necessità di legarsi a una tabella dati**: Dia priorità a `CollectionBlockModel`
- **Fonte dati personalizzata**: Scelga `DataBlockModel`
- **Per impostare condizioni di filtro e lavorare con i blocchi dati**: Scelga `FilterBlockModel`
- **Non sa come classificare**: Scelga `BlockModel`

## Avvio rapido

La creazione di un blocco personalizzato richiede solo tre passaggi:

1. Erediti la classe base corrispondente (ad esempio, `BlockModel`)
2. Implementi il metodo `renderComponent()` per restituire un componente React
3. Registri il modello di blocco nel plugin

Per esempi dettagliati, si prega di fare riferimento a [Scrivere un plugin per blocchi](./write-a-block-plugin).