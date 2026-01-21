:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Guida Rapida

## Introduzione

Prima di utilizzare il Dipendente AI, è necessario connettersi a un servizio LLM online. NocoBase attualmente supporta i principali servizi LLM online come OpenAI, Gemini, Claude, DepSeek, Qwen e altri.
Oltre ai servizi LLM online, NocoBase supporta anche la connessione a modelli locali Ollama.

## Configurare il servizio LLM

Acceda alla pagina di configurazione del plugin Dipendente AI, clicchi sulla scheda `LLM service` per accedere alla pagina di gestione dei servizi LLM.

![20251021213122](https://static-docs.nocobase.com/20251021213122.png)

Passi il mouse sopra il pulsante `Add New` nell'angolo in alto a destra dell'elenco dei servizi LLM e selezioni il servizio LLM che desidera utilizzare.

![20251021213358](https://static-docs.nocobase.com/20251021213358.png)

Prendendo OpenAI come esempio, inserisca un `title` facile da ricordare nella finestra a comparsa, quindi inserisca la `API key` ottenuta da OpenAI e clicchi su `Submit` per salvare. In questo modo si completa la configurazione del servizio LLM.

Il `Base URL` può essere solitamente lasciato vuoto. Se sta utilizzando un servizio LLM di terze parti compatibile con l'API di OpenAI, compili il `Base URL` corrispondente.

![20251021214549](https://static-docs.nocobase.com/20251021214549.png)

## Test di disponibilità

Nella pagina di configurazione del servizio LLM, clicchi sul pulsante `Test flight`, inserisca il nome del modello che desidera utilizzare e clicchi sul pulsante `Run` per verificare se il servizio LLM e il modello sono disponibili.

![20251021214903](https://static-docs.nocobase.com/20251021214903.png)