:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Impostare le Regole di Validazione

## Introduzione

Le regole di validazione servono a garantire che i dati inseriti dagli utenti rispettino le aspettative.

## Dove Impostare le Regole di Validazione dei Campi

### Configurare le Regole di Validazione per i Campi della collezione

La maggior parte dei campi supporta la configurazione di regole di validazione. Una volta configurate le regole per un campo, la validazione lato server (backend) viene attivata al momento dell'invio dei dati. Diversi tipi di campi supportano regole di validazione differenti.

-   **Campo Data**

    ![20251028225946](https://static-docs.nocobase.com/20251028225946.png)

-   **Campo Numerico**

    ![20251028230418](https://static-docs.nocobase.com/20251028230418.png)

-   **Campo Testo**

    Oltre a limitare la lunghezza del testo, i campi di testo supportano anche espressioni regolari personalizzate per una validazione più precisa.

    ![20251028230554](https://static-docs.nocobase.com/20251028230554.png)

### Validazione Frontend nella Configurazione del Campo

Le regole di validazione impostate nella configurazione del campo attiveranno la validazione lato client (frontend), assicurando che l'input dell'utente sia conforme ai requisiti.

![20251028230105](https://static-docs.nocobase.com/20251028230105.png)

![20251028230255](https://static-docs.nocobase.com/20251028230255.png)

I **campi di testo** supportano anche la validazione tramite espressioni regolari personalizzate per soddisfare requisiti di formato specifici.

![20251028230903](https://static-docs.nocobase.com/20251028230903.png)