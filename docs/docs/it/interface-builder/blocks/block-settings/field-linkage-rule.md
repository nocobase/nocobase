:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Regole di Collegamento dei Campi

## Introduzione

Le regole di collegamento dei campi Le permettono di adattare dinamicamente lo stato dei campi all'interno dei blocchi Modulo/Dettagli in base alle azioni dell'utente. Attualmente, i blocchi che supportano queste regole includono:

- Blocco [Modulo](/interface-builder/blocks/data-blocks/form)
- Blocco [Dettagli](/interface-builder/blocks/data-blocks/details)
- [Sotto-modulo](/interface-builder/fields/specific/sub-form)

## Istruzioni per l'Uso

### **Blocco Modulo**

All'interno di un blocco Modulo, le regole di collegamento possono adattare dinamicamente il comportamento dei campi in base a condizioni specifiche:

- **Controllo della visibilità del campo (mostra/nascondi)**: Decidere se il campo corrente deve essere visualizzato in base ai valori di altri campi.
- **Impostare il campo come obbligatorio**: Impostare dinamicamente un campo come obbligatorio o facoltativo in condizioni specifiche.
- **Assegnare un valore**: Assegnare automaticamente un valore a un campo in base a determinate condizioni.
- **Eseguire JavaScript specificato**: Scrivere codice JavaScript in base alle esigenze aziendali.

### **Blocco Dettagli**

In un blocco Dettagli, le regole di collegamento sono utilizzate principalmente per controllare dinamicamente la visibilità (mostra/nascondi) dei campi all'interno del blocco.

![20251029114859](https://static-docs.nocobase.com/20251029114859.png)

## Collegamento delle Proprietà

### Assegnazione di Valore

Esempio: Quando un ordine viene contrassegnato come ordine supplementare, lo stato dell'ordine viene automaticamente impostato su "In revisione".

![20251029115348](https://static-docs.nocobase.com/20251029115348.png)

### Obbligatorio

Esempio: Quando lo stato dell'ordine è "Pagato", il campo dell'importo dell'ordine è obbligatorio.

![20251029115031](https://static-docs.nocobase.com/20251029115031.png)

### Mostra/Nascondi

Esempio: L'account di pagamento e l'importo totale vengono visualizzati solo quando lo stato dell'ordine è "In attesa di pagamento".

![20251030223710](https://static-docs.nocobase.com/20251030223710.png)

![20251030223801](https://static-docs.nocobase.com/20251030223801.gif)