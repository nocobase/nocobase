:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Modulo di filtro

## Introduzione

Il modulo di filtro consente agli utenti di filtrare i dati compilando i campi del modulo. Può essere utilizzato per filtrare blocchi tabella, blocchi grafico, blocchi elenco e altro ancora.

## Come si usa

Iniziamo con un semplice esempio per capire rapidamente come utilizzare il modulo di filtro. Supponiamo di avere un blocco tabella contenente informazioni utente e di voler filtrare i dati utilizzando un modulo di filtro, come segue:

![20251031163036_rec_](https://static-docs.nocobase.com/20251031163036_rec_.gif)

I passaggi di configurazione sono i seguenti:

1.  Abiliti la modalità di modifica e aggiunga un blocco "Modulo di filtro" e un "Blocco tabella" alla pagina.
![20251031163525_rec_](https://static-docs.nocobase.com/20251031163525_rec_.gif)
2.  Aggiunga il campo "Nickname" sia al blocco tabella che al blocco del modulo di filtro.
![20251031163932_rec_](https://static-docs.nocobase.com/20251031163932_rec_.gif)
3.  Ora può iniziare a usarlo.
![20251031163036_rec_](https://static-docs.nocobase.com/20251031163036_rec_.gif)

## Utilizzo avanzato

Il blocco del modulo di filtro supporta configurazioni più avanzate. Di seguito sono riportati alcuni casi d'uso comuni.

### Collegare più blocchi

Un singolo campo del modulo può filtrare i dati di più blocchi contemporaneamente. Ecco come fare:

1.  Clicchi sull'opzione di configurazione "Connect fields" per il campo.
![20251031170300](https://static-docs.nocobase.com/20251031170300.png)
2.  Aggiunga i blocchi di destinazione che desidera collegare. In questo esempio, selezioneremo il blocco elenco nella pagina.
![20251031170718](https://static-docs.nocobase.com/20251031170718.png)
3.  Selezioni uno o più campi dal blocco elenco da collegare. Qui selezioniamo il campo "Nickname".
![20251031171039](https://static-docs.nocobase.com/20251031171039.png)
4.  Clicchi sul pulsante Salva per completare la configurazione. Il risultato è il seguente:
![20251031171209_rec_](https://static-docs.nocobase.com/20251031171209_rec_.gif)

### Collegare blocchi grafico

Riferimento: [Filtri di pagina e collegamento](../../../data-visualization/guide/filters-and-linkage.md)

### Campi personalizzati

Oltre a selezionare i campi dalle **collezioni**, può anche creare campi del modulo utilizzando i "Campi personalizzati". Ad esempio, può creare un campo di selezione a discesa con opzioni personalizzate. Ecco come fare:

1.  Clicchi sull'opzione "Campi personalizzati" per aprire il pannello di configurazione.
![20251031173833](https://static-docs.nocobase.com/20251031173833.png)
2.  Compili il titolo del campo, selezioni "Select" come modello di campo e configuri le opzioni.
![20251031174857_rec_](https://static-docs.nocobase.com/20251031174857_rec_.gif)
3.  I campi personalizzati appena aggiunti devono essere collegati manualmente ai campi nei blocchi di destinazione. Ecco come fare:
![20251031181957_rec_](https://static-docs.nocobase.com/20251031181957_rec_.gif)
4.  Configurazione completata. Il risultato è il seguente:
![20251031182235_rec_](https://static-docs.nocobase.com/20251031182235_rec_.gif)

Modelli di campo attualmente supportati:

-   `Input`: Campo di testo a riga singola
-   `Number`: Campo di input numerico
-   `Date`: Selettore data
-   `Select`: Menu a discesa (può essere configurato per selezione singola o multipla)
-   `Radio group`: Pulsanti di opzione (radio button)
-   `Checkbox group`: Caselle di controllo (checkbox)

### Compressione

Aggiunga un pulsante di compressione per comprimere ed espandere il contenuto del modulo di filtro, risparmiando spazio sulla pagina.

![20251031182743](https://static-docs.nocobase.com/20251031182743.png)

Configurazioni supportate:

![20251031182849](https://static-docs.nocobase.com/20251031182849.png)

-   **Righe compresse**: Imposta il numero di righe di campi del modulo visualizzate nello stato compresso.
-   **Compressione predefinita**: Se abilitato, il modulo di filtro viene visualizzato per impostazione predefinita nello stato compresso.