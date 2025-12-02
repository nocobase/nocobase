:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Molti-a-Molti

In un sistema di iscrizione ai corsi, esistono due entità: studenti e corsi. Uno studente può iscriversi a più corsi e un corso può avere più studenti iscritti, il che costituisce una relazione molti-a-molti. In un database relazionale, per rappresentare la relazione molti-a-molti tra studenti e corsi, si utilizza solitamente una collezione intermedia, come una collezione di iscrizioni. Questa collezione può registrare quali corsi ha scelto ogni studente e quali studenti si sono iscritti a ciascun corso. Questo design rappresenta efficacemente la relazione molti-a-molti tra studenti e corsi.

Diagramma ER

![alt text](https://static-docs.nocobase.com/0e9921228e1ee375dc639431bb89782c.png)

Configurazione del campo

![alt text](https://static-docs.nocobase.com/8e2739ac5d44fb46f30e2da42ca87a82.png)

## Descrizione dei parametri

### Source collection

La collezione di origine, ovvero la collezione in cui si trova il campo attuale.

### Target collection

La collezione di destinazione, ovvero la collezione a cui associare il campo.

### Through collection

La collezione intermedia, utilizzata quando esiste una relazione molti-a-molti tra due entità. La collezione intermedia ha due chiavi esterne che servono a mantenere l'associazione tra le due entità.

### Source key

Il campo nella collezione di origine a cui fa riferimento la chiave esterna. Deve essere univoco.

### Foreign key 1

Il campo nella collezione intermedia che stabilisce l'associazione con la collezione di origine.

### Foreign key 2

Il campo nella collezione intermedia che stabilisce l'associazione con la collezione di destinazione.

### Target key

Il campo nella collezione di destinazione a cui fa riferimento la chiave esterna. Deve essere univoco.

### ON DELETE

ON DELETE si riferisce alle regole applicate ai riferimenti di chiave esterna nelle collezioni figlie correlate quando i record nella collezione padre vengono eliminati. È un'opzione utilizzata quando si definisce un vincolo di chiave esterna. Le opzioni comuni di ON DELETE includono:

- CASCADE: Quando un record nella collezione padre viene eliminato, tutti i record correlati nella collezione figlia vengono eliminati automaticamente.
- SET NULL: Quando un record nella collezione padre viene eliminato, i valori della chiave esterna nei record correlati della collezione figlia vengono impostati su NULL.
- RESTRICT: L'opzione predefinita, impedisce l'eliminazione di un record della collezione padre se esistono record correlati nella collezione figlia.
- NO ACTION: Simile a RESTRICT, impedisce l'eliminazione di un record della collezione padre se esistono record correlati nella collezione figlia.