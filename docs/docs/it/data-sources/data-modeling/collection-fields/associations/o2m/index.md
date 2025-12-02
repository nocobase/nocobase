:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Uno a Molti

La relazione tra una classe e i suoi studenti è un esempio di relazione uno a molti: una classe può avere più studenti, ma ogni studente appartiene a una sola classe.

Diagramma ER:

![alt text](https://static-docs.nocobase.com/9475f044d123d28ac8e56a077411f8dc.png)

Configurazione del Campo:

![alt text](https://static-docs.nocobase.com/a608ce54821172dad8e56a077411f8dc.png)

## Descrizione dei Parametri

### Collezione di Origine

La collezione di origine, ovvero la collezione in cui risiede il campo attuale.

### Collezione di Destinazione

La collezione di destinazione, ovvero la collezione a cui associare il campo.

### Chiave di Origine

Il campo nella collezione di origine che è referenziato dalla chiave esterna. Deve essere univoco.

### Chiave Esterna

Il campo nella collezione di destinazione utilizzato per stabilire l'associazione tra le due collezioni.

### Chiave di Destinazione

Il campo nella collezione di destinazione utilizzato per visualizzare ogni record di riga nel blocco di relazione, solitamente un campo univoco.

### ON DELETE

ON DELETE si riferisce alle regole applicate ai riferimenti di chiave esterna nelle collezioni figlie correlate quando i record nella collezione padre vengono eliminati. È un'opzione utilizzata quando si definisce un vincolo di chiave esterna. Le opzioni comuni di ON DELETE includono:

- **CASCADE**: Quando un record nella collezione padre viene eliminato, tutti i record correlati nella collezione figlia vengono automaticamente eliminati.
- **SET NULL**: Quando un record nella collezione padre viene eliminato, i valori della chiave esterna nei record correlati della collezione figlia vengono impostati su NULL.
- **RESTRICT**: L'opzione predefinita, impedisce l'eliminazione di un record della collezione padre se esistono record correlati nella collezione figlia.
- **NO ACTION**: Simile a RESTRICT, impedisce l'eliminazione di un record della collezione padre se esistono record correlati nella collezione figlia.