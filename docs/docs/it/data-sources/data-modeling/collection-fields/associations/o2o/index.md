:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Uno a Uno

Nel rapporto tra dipendenti e profili personali, ogni dipendente può avere una sola voce di profilo personale, e ogni voce di profilo personale può corrispondere a un solo dipendente. In questo scenario, la relazione tra dipendente e profilo personale è di tipo uno a uno.

La chiave esterna in una relazione uno a uno può essere posizionata sia nella collezione di origine che in quella di destinazione. Se la relazione indica "ha uno", la chiave esterna è più appropriata nella collezione di destinazione; se invece indica una "relazione di appartenenza", allora la chiave esterna è più adatta nella collezione di origine.

Ad esempio, nel caso sopra menzionato, in cui un dipendente ha un solo profilo personale e il profilo personale appartiene al dipendente, è opportuno posizionare la chiave esterna nella collezione dei profili personali.

## Uno a Uno (Ha Uno)

Questo indica che un dipendente ha una voce di profilo personale.

Relazione ER

![alt text](https://static-docs.nocobase.com/4359e128936bbd7c9ff51bcff1d646dd.png)

Configurazione del campo

![alt text](https://static-docs.nocobase.com/7665a87e094b4fb50c9426a108f87105.png)

## Uno a Uno (Appartiene A)

Questo indica che un profilo personale appartiene a un dipendente specifico.

Relazione ER

![](https://static-docs.nocobase.com/31e7cc3e630220cf1e98753ca24ac72d.png)

Configurazione del campo

![alt text](https://static-docs.nocobase.com/4f09eeb3c7717d61a349842da43c187c.png)

## Descrizione dei Parametri

### Collezione di origine

La collezione di origine è la collezione in cui si trova il campo corrente.

### Collezione di destinazione

La collezione di destinazione è la collezione a cui si sta collegando.

### Chiave esterna

Utilizzata per stabilire una relazione tra due collezioni. In una relazione uno a uno, la chiave esterna può essere posizionata sia nella collezione di origine che in quella di destinazione. Se indica "ha uno", la chiave esterna è più appropriata nella collezione di destinazione; se invece indica una "relazione di appartenenza", allora la chiave esterna è più adatta nella collezione di origine.

### Chiave di origine <- Chiave esterna (Chiave esterna nella collezione di destinazione)

Il campo referenziato dal vincolo di chiave esterna deve essere univoco. Quando la chiave esterna è posizionata nella collezione di destinazione, indica "ha uno".

### Chiave di destinazione <- Chiave esterna (Chiave esterna nella collezione di origine)

Il campo referenziato dal vincolo di chiave esterna deve essere univoco. Quando la chiave esterna è posizionata nella collezione di origine, indica "appartiene a".

### ON DELETE

`ON DELETE` si riferisce alle regole d'azione per il riferimento della chiave esterna nella collezione figlia correlata quando si eliminano record dalla collezione padre. È un'opzione definita durante la creazione di un vincolo di chiave esterna. Le opzioni comuni di `ON DELETE` includono:

-   CASCADE: Quando un record nella collezione padre viene eliminato, elimina automaticamente tutti i record correlati nella collezione figlia.
-   SET NULL: Quando un record nella collezione padre viene eliminato, imposta il valore della chiave esterna correlata nella collezione figlia su `NULL`.
-   RESTRICT: L'opzione predefinita: se si tenta di eliminare un record dalla collezione padre e esistono record correlati nella collezione figlia, l'eliminazione del record padre viene rifiutata.
-   NO ACTION: Simile a `RESTRICT`: se esistono record correlati nella collezione figlia, l'eliminazione di un record dalla collezione padre viene rifiutata.