:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Selezione a Cascata

## Introduzione

Il selettore a cascata è pensato per i campi di relazione la cui **collezione** di destinazione è una tabella ad albero. Permette agli utenti di selezionare i dati seguendo la struttura gerarchica della **collezione** ad albero e supporta la ricerca fuzzy per un filtraggio rapido.

## Istruzioni per l'Uso

- Per le relazioni **uno a uno**, il selettore a cascata è a **selezione singola**.

![20251125214656](https://static-docs.nocobase.com/20251125214656.png)

- Per le relazioni **uno a molti**, il selettore a cascata è a **selezione multipla**.

![20251125215318](https://static-docs.nocobase.com/20251125215318.png)

## Opzioni di Configurazione del Campo

### Campo Titolo

Il campo titolo definisce l'etichetta visualizzata per ogni opzione.

![20251125214923](https://static-docs.nocobase.com/20251125214923.gif)

> Supporta la ricerca rapida basata sul campo titolo

![20251125215026](https://static-docs.nocobase.com/20251125215026.gif)

Per maggiori dettagli, consulti:
[Campo Titolo](/interface-builder/fields/field-settings/title-field)

### Ambito dei Dati

Controlla l'ambito dei dati dell'elenco ad albero (se un record figlio corrisponde alle condizioni, verrà incluso anche il suo record padre).

![20251125215111](https://static-docs.nocobase.com/20251125215111.png)

Per maggiori dettagli, consulti:
[Ambito dei Dati](/interface-builder/fields/field-settings/data-scope)

Altri componenti di campo:
[Componenti di Campo](/interface-builder/fields/association-field)