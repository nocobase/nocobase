---
pkg: "@nocobase/plugin-action-export-pro"
---
:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Esportazione Allegati

## Introduzione

La funzionalità di esportazione allegati consente di esportare i campi correlati agli allegati come pacchetto compresso.

#### Configurazione dell'Esportazione Allegati

![20251029173251](https://static-docs.nocobase.com/20251029173251.png)

![20251029173425](https://static-docs.nocobase.com/20251029173425.png)

![20251029173345](https://static-docs.nocobase.com/20251029173345.png)

- Configuri i campi allegato da esportare; è possibile selezionarne più di uno.
- Può scegliere se generare una cartella per ogni record.

Regole di denominazione dei file:

- Se sceglie di generare una cartella per ogni record, la regola di denominazione del file sarà: `{valore del campo titolo del record}/{nome del campo allegato}[-{numero di sequenza del file}].{estensione del file}`.
- Se sceglie di non generare una cartella, la regola di denominazione del file sarà: `{valore del campo titolo del record}-{nome del campo allegato}[-{numero di sequenza del file}].{estensione del file}`.

Il numero di sequenza del file viene generato automaticamente quando un campo allegato contiene più allegati.

- [Regola di Collegamento](/interface-builder/actions/action-settings/linkage-rule): visualizza/nasconde dinamicamente il pulsante;
- [Modifica Pulsante](/interface-builder/actions/action-settings/edit-button): modifica il titolo, il tipo e l'icona del pulsante;