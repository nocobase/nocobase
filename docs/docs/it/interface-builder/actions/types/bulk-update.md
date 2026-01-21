---
pkg: "@nocobase/plugin-action-bulk-update"
---
:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Aggiornamento in Blocco

## Introduzione

L'azione di aggiornamento in blocco viene utilizzata quando è necessario applicare lo stesso aggiornamento a un gruppo di record. Prima di eseguire un aggiornamento in blocco, l'utente deve predefinire la logica di assegnazione dei valori ai campi. Questa logica verrà applicata a tutti i record selezionati quando l'utente fa clic sul pulsante di aggiornamento.

![20251029195320](https://static-docs.nocobase.com/20251029195320.png)

## Configurazione dell'Azione

![20251029195729](https://static-docs.nocobase.com/20251029195729.png)

### Dati da aggiornare

Selezionati/Tutti, predefinito su Selezionati.

![20251029200034](https://static-docs.nocobase.com/20251029200034.png)

### Assegnazione dei campi

Imposti i campi per l'aggiornamento in blocco. Solo i campi impostati verranno aggiornati.

Come mostrato in figura, configuri l'azione di aggiornamento in blocco nella tabella degli ordini per aggiornare in blocco i dati selezionati allo stato "In attesa di approvazione".

![20251029200109](https://static-docs.nocobase.com/20251029200109.png)

- [Modifica pulsante](/interface-builder/actions/action-settings/edit-button): Modifichi il titolo, il tipo e l'icona del pulsante;
- [Regola di collegamento](/interface-builder/actions/action-settings/linkage-rule): Mostri/nasconda dinamicamente il pulsante;
- [Doppia conferma](/interface-builder/actions/action-settings/double-check)