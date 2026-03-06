:::tip{title="Avviso di traduzione IA"}
Questo documento è stato tradotto dall'IA. Per informazioni accurate, consultare la [versione inglese](/ai-employees/features/llm-service).
:::

# Configurazione del servizio LLM

Prima di utilizzare gli AI Employee, è necessario configurare i servizi LLM disponibili.

Attualmente sono supportati OpenAI, Gemini, Claude, DeepSeek, Qwen, Kimi e i modelli locali Ollama.

## Creazione di un nuovo servizio

Acceda a `Impostazioni di sistema -> AI Employee -> LLM service`.

1. Clicchi su `Add New` per aprire la finestra di creazione.
2. Selezioni il `Provider`.
3. Compili i campi `Title`, `API Key` e `Base URL` (opzionale).
4. Configuri i `Enabled Models`:
   - `Recommended models`: utilizza i modelli raccomandati ufficialmente.
   - `Select models`: selezioni i modelli dall'elenco fornito dal Provider.
   - `Manual input`: inserisca manualmente l'ID del modello e il nome visualizzato.
5. Clicchi su `Submit` per salvare.

![llm-service-create-provider-enabled-models.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/llm-service-create-provider-enabled-models.png)

## Abilitazione e ordinamento dei servizi

Nell'elenco dei servizi LLM è possibile:

- Utilizzare l'interruttore `Enabled` per attivare o disattivare il servizio.
- Trascinare i servizi per ordinarli (questo influisce sull'ordine di visualizzazione dei modelli).

![llm-service-list-enabled-and-sort.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/llm-service-list-enabled-and-sort.png)

## Test di disponibilità

Utilizzi la funzione `Test flight` in fondo alla finestra di configurazione per verificare la disponibilità del servizio e dei modelli.

Si consiglia di effettuare il test prima di procedere con l'utilizzo operativo.