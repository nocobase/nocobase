:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Utilizzo delle variabili di contesto

Le variabili di contesto Le permettono di riutilizzare informazioni dalla pagina corrente, dall'utente, dall'ora e dai filtri applicati, per visualizzare grafici e abilitare collegamenti dinamici in base al contesto.

## Ambito di applicazione
- Nelle condizioni di filtro per le query di dati in modalità Builder: selezioni le variabili da utilizzare.
![clipboard-image-1761486073](https://static-docs.nocobase.com/clipboard-image-1761486073.png)

- Nella scrittura di istruzioni per le query di dati in modalità SQL: scelga le variabili e inserisca le espressioni (ad esempio, `{{ ctx.user.id }}`).
![clipboard-image-1761486145](https://static-docs.nocobase.com/clipboard-image-1761486145.png)

- Nelle opzioni dei grafici in modalità Custom: scriva direttamente espressioni JS.
![clipboard-image-1761486604](https://static-docs.nocobase.com/clipboard-image-1761486604.png)

- Negli eventi di interazione (ad esempio, cliccare per aprire una finestra di dettaglio e passare dati): scriva direttamente espressioni JS.
![clipboard-image-1761486683](https://static-docs.nocobase.com/clipboard-image-1761486683.png)

**Nota:**
- Non racchiuda `{{ ... }}` tra virgolette singole o doppie; il sistema gestirà il binding in modo sicuro in base al tipo di variabile (stringa, numero, data/ora, NULL).
- Quando una variabile è `NULL` o non definita, gestisca esplicitamente i valori nulli in SQL utilizzando `COALESCE(...)` o `IS NULL`.