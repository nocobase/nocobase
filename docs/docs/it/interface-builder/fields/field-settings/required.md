:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Obbligatorio

## Introduzione

Il requisito di campo obbligatorio è una regola comune per la validazione dei moduli. Può abilitarlo direttamente nella configurazione del campo, oppure impostare dinamicamente un campo come obbligatorio tramite le regole di collegamento del modulo.

## Dove impostare un campo come obbligatorio

### Impostazioni del campo della collezione

Quando un campo della collezione è impostato come obbligatorio, attiva la validazione lato backend e il frontend lo visualizza come obbligatorio per impostazione predefinita (non modificabile).
![20251025175418](https://static-docs.nocobase.com/20251025175418.png)

### Impostazioni del campo

Imposti direttamente un campo come obbligatorio. Questa opzione è adatta per i campi che devono essere sempre compilati dall'utente, come nome utente, password, ecc.

![20251028222818](https://static-docs.nocobase.com/20251028222818.png)

### Regole di collegamento

Imposti un campo come obbligatorio in base a condizioni specifiche tramite le regole di collegamento dei campi del blocco modulo.

Esempio: Il numero dell'ordine è obbligatorio quando la data dell'ordine non è vuota.

![20251028223004](https://static-docs.nocobase.com/20251028223004.png)

### Flusso di lavoro