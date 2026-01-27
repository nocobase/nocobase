---
pkg: "@nocobase/plugin-action-export"
---
:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Esportazione

## Introduzione

La funzione di esportazione Le consente di esportare i record filtrati in formato **Excel** e supporta la configurazione dei campi da esportare. Può selezionare i campi necessari per l'esportazione, in vista di successive analisi, elaborazioni o archiviazioni dei dati. Questa funzionalità aumenta la flessibilità delle operazioni sui dati, rivelandosi particolarmente utile negli scenari in cui i dati devono essere trasferiti ad altre piattaforme o ulteriormente elaborati.

### Punti salienti della funzionalità:
- **Selezione dei campi**: Può configurare e selezionare i campi da esportare, garantendo che i dati esportati siano precisi e concisi.
- **Supporto formato Excel**: I dati esportati verranno salvati come file Excel standard, facilitando l'integrazione e l'analisi con altri dati.

Grazie a questa funzionalità, può facilmente esportare i dati chiave del Suo lavoro per un utilizzo esterno, migliorando l'efficienza operativa.

![20251029170811](https://static-docs.nocobase.com/20251029170811.png)

## Configurazione dell'azione

![20251029171452](https://static-docs.nocobase.com/20251029171452.png)

### Campi esportabili

- Primo livello: Tutti i campi della collezione corrente;
- Secondo livello: Se si tratta di un campo di relazione, è necessario selezionare i campi dalla collezione associata;
- Terzo livello: Vengono elaborati solo tre livelli; i campi di relazione dell'ultimo livello non vengono visualizzati;

![20251029171557](https://static-docs.nocobase.com/20251029171557.png)

- [Regola di collegamento](/interface-builder/actions/action-settings/linkage-rule): Mostra/nasconde dinamicamente il pulsante;
- [Modifica pulsante](/interface-builder/actions/action-settings/edit-button): Modifica il titolo, il tipo e l'icona del pulsante;