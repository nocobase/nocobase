:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

## Istruzioni di configurazione

### Attivare la funzione di stampa dei modelli
La stampa dei modelli supporta attualmente i blocchi di dettaglio e i blocchi tabella. Di seguito, Le illustriamo come configurare queste due tipologie di blocchi.

#### Blocchi di dettaglio

1.  **Aprire il blocco di dettaglio**:
    *   Nell'applicazione, acceda al blocco di dettaglio in cui desidera utilizzare la funzione di stampa dei modelli.

2.  **Accedere al menu delle operazioni di configurazione**:
    *   Nella parte superiore dell'interfaccia, clicchi sul menu "Operazioni di configurazione".

3.  **Selezionare "Stampa modelli"**:
    *   Nel menu a discesa, clicchi sull'opzione "Stampa modelli" per attivare la funzionalità del plugin.

![Attivare la stampa dei modelli](https://static-docs.nocobase.com/20241212150539-2024-12-12-15-05-43.png)

### Configurare i modelli

1.  **Accedere alla pagina di configurazione dei modelli**:
    *   Nel menu di configurazione del pulsante "Stampa modelli", selezioni l'opzione "Configurazione modelli".

![Opzione di configurazione dei modelli](https://static-docs.nocobase.com/20241212151858-2024-12-12-15-19-01.png)

2.  **Aggiungere un nuovo modello**:
    *   Clicchi sul pulsante "Aggiungi modello" per accedere alla pagina di aggiunta del modello.

![Pulsante Aggiungi modello](https://static-docs.nocobase.com/20241212151243-2024-12-12-15-12-46.png)

3.  **Inserire le informazioni del modello**:
    *   Nel modulo del modello, inserisca il nome del modello e selezioni il tipo di modello (Word, Excel, PowerPoint).
    *   Carichi il file del modello corrispondente (sono supportati i formati `.docx`, `.xlsx`, `.pptx`).

![Configurare nome e file del modello](https://static-docs.nocobase.com/20241212151518-2024-12-12-15-15-21.png)

4.  **Modificare e salvare il modello**:
    *   Acceda alla pagina "Elenco campi", copi i campi e li inserisca nel modello.
      ![Elenco campi](https://static-docs.nocobase.com/20250107141010.png)
      ![20241212152743-2024-12-12-15-27-45](https://static-docs.nocobase.com/20241212152743-2024-12-12-15-27-45.png)
    *   Dopo aver completato l'inserimento, clicchi sul pulsante "Salva" per terminare l'aggiunta del modello.

5.  **Gestione dei modelli**:
    *   Clicchi sul pulsante "Usa" a destra dell'elenco dei modelli per attivare il modello.
    *   Clicchi sul pulsante "Modifica" per cambiare il nome del modello o sostituire il file del modello.
    *   Clicchi sul pulsante "Scarica" per scaricare il file del modello configurato.
    *   Clicchi sul pulsante "Elimina" per rimuovere i modelli non più necessari. Il sistema Le chiederà una conferma per evitare cancellazioni accidentali.
      ![Gestione dei modelli](https://static-docs.nocobase.com/20250107140436.png)

#### Blocchi tabella

L'utilizzo dei blocchi tabella è sostanzialmente lo stesso dei blocchi di dettaglio, con le seguenti differenze:

1.  Supporto per la stampa di più record: è necessario selezionare prima i record da stampare; è possibile stamparne fino a 100 contemporaneamente.
    
    ![20250416215633-2025-04-16-21-56-35](https://static-docs.nocobase.com/20250416215633-2025-04-16-21-56-35.png)

2.  Gestione isolata dei modelli: i modelli per i blocchi tabella e i blocchi di dettaglio non sono intercambiabili, poiché le strutture dei dati sono diverse (uno è un oggetto, l'altro è un array).