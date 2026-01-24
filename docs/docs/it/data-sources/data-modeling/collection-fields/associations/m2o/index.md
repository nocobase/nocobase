:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Molti a Uno

In un database di una biblioteca, abbiamo due entità: libri e autori. Un autore può scrivere più libri, ma ogni libro di solito ha un solo autore. In questo scenario, la relazione tra autori e libri è di tipo molti a uno. Più libri possono essere associati allo stesso autore, ma ogni libro può avere un solo autore.

Diagramma ER:

![alt text](https://static-docs.nocobase.com/eaeeac974844db05c75cf0deeedf362.png)

Configurazione del campo:

![alt text](https://static-docs.nocobase.com/3b4484ebb98d82f832f3dbf752bd84c9.png)

## Descrizione dei parametri

### Collezione di origine

La collezione di origine, ovvero la collezione in cui si trova il campo attuale.

### Collezione di destinazione

La collezione di destinazione, ovvero la collezione a cui associare il campo.

### Chiave esterna

Il campo nella collezione di origine utilizzato per stabilire l'associazione tra le due collezioni.

### Chiave di destinazione

Il campo nella collezione di destinazione a cui fa riferimento la chiave esterna. Deve essere univoco.

### ON DELETE

ON DELETE si riferisce alle regole applicate ai riferimenti di chiave esterna nelle collezioni figlie correlate quando vengono eliminati i record nella collezione padre. È un'opzione utilizzata quando si definisce un vincolo di chiave esterna. Le opzioni comuni di ON DELETE includono:

- **CASCADE**: Quando un record nella collezione padre viene eliminato, tutti i record correlati nella collezione figlia vengono eliminati automaticamente.
- **SET NULL**: Quando un record nella collezione padre viene eliminato, i valori della chiave esterna nei record correlati della collezione figlia vengono impostati su NULL.
- **RESTRICT**: L'opzione predefinita, impedisce l'eliminazione di un record della collezione padre se esistono record correlati nella collezione figlia.
- **NO ACTION**: Simile a RESTRICT, impedisce l'eliminazione di un record della collezione padre se esistono record correlati nella collezione figlia.