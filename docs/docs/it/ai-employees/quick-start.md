:::tip{title="Avviso di traduzione IA"}
Questo documento è stato tradotto dall'IA. Per informazioni accurate, consultare la [versione inglese](/ai-employees/quick-start).
:::

# Avvio rapido

Completiamo la configurazione minima utilizzabile di un dipendente AI in 5 minuti.

## Installazione del plugin

I dipendenti AI sono integrati in NocoBase (`@nocobase/plugin-ai`), pertanto non è richiesta un'installazione separata.

## Configurazione dei modelli

È possibile configurare i servizi LLM da uno dei seguenti punti di accesso:

1. Accesso amministratore: `Impostazioni di sistema -> AI Employees -> LLM service`.
2. Scorciatoia frontend: Nel pannello della chat AI, utilizzi il `Model Switcher` per scegliere un modello, quindi faccia clic sulla scorciatoia "Aggiungi servizio LLM" per accedere direttamente alla configurazione.

![quick-start-model-switcher-add-llm-service.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/quick-start-model-switcher-add-llm-service.png)

In genere, è necessario confermare quanto segue:
1. Selezionare il Provider.
2. Inserire la Chiave API (API Key).
3. Configurare i `Modelli abilitati` (Enabled Models); è sufficiente utilizzare l'opzione "Recommend" per impostazione predefinita.

## Abilitazione dei dipendenti integrati

I dipendenti AI integrati sono abilitati per impostazione predefinita e solitamente non è necessario attivarli singolarmente.

Se desidera regolare la disponibilità (abilitare/disabilitare un dipendente specifico), può modificare l'interruttore `Enabled` nella pagina dell'elenco in `Impostazioni di sistema -> AI Employees`.

![ai-employee-list-enable-switch.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/ai-employee-list-enable-switch.png)

## Inizio della collaborazione

Nella pagina dell'applicazione, passi il mouse sopra l'icona di scelta rapida in basso a destra e scelga un dipendente AI.
![ai-employees-entry-bottom-right.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/ai-employees-entry-bottom-right.png)

Faccia clic per aprire la finestra di dialogo della chat AI:

![chat-footer-employee-switcher-and-model-switcher.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/chat-footer-employee-switcher-and-model-switcher.png)

Può inoltre:  
* Aggiungere blocchi
* Aggiungere allegati
* Abilitare la ricerca web
* Cambiare dipendente AI
* Selezionare i modelli

I dipendenti AI possono anche acquisire automaticamente la struttura della pagina come contesto. Ad esempio, Dex su un blocco modulo può leggere automaticamente la struttura dei campi del modulo e richiamare le competenze adatte per operare sulla pagina.

## Attività rapide 

Può preimpostare attività comuni per ogni dipendente AI nella posizione corrente, in modo da poter iniziare a lavorare con un solo clic, rendendo il tutto rapido e conveniente.

<video controls class="rounded shadow"><source src="https://static-docs.nocobase.com/z-2025-11-02-12.19.33-2025-11-02-12-19-49.mp4" type="video/mp4"></video>

## Panoramica dei dipendenti integrati

NocoBase fornisce diversi dipendenti AI integrati ottimizzati per vari scenari.

È sufficiente:

1. Configurare i servizi LLM.
2. Regolare lo stato di abilitazione dei dipendenti quando necessario (abilitati per impostazione predefinita).
3. Selezionare il modello nella chat e iniziare a collaborare.

| Nome dipendente | Ruolo | Capacità principali |
| :--- | :--- | :--- |
| **Cole** | Assistente NocoBase | Domande e risposte sull'uso del prodotto, recupero documenti |
| **Ellis** | Esperto di e-mail | Scrittura di e-mail, generazione di riepiloghi, suggerimenti di risposta |
| **Dex** | Esperto di organizzazione dati | Traduzione di campi, formattazione, estrazione di informazioni |
| **Viz** | Analista di insight | Insight sui dati, analisi dei trend, interpretazione degli indicatori chiave |
| **Lexi** | Assistente alla traduzione | Traduzione multilingue, assistenza alla comunicazione |
| **Vera** | Analista di ricerca | Ricerca web, aggregazione di informazioni, ricerca approfondita |
| **Dara** | Esperto di visualizzazione dati | Configurazione di grafici, generazione di report visivi |
| **Orin** | Esperto di modellazione dati | Assistenza nella progettazione della struttura delle collezioni, suggerimenti sui campi |
| **Nathan** | Ingegnere frontend | Assistenza nella scrittura di frammenti di codice frontend, regolazioni di stile |

**Note**

Alcuni dipendenti AI integrati non compaiono nell'elenco in basso a destra perché operano in scenari dedicati:

- Orin: pagine di modellazione dati.
- Dara: blocchi di configurazione dei grafici.
- Nathan: JS Block e altri editor di codice simili.