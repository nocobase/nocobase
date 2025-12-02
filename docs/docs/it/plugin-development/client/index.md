:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Panoramica

Lo sviluppo di **plugin** lato client per NocoBase offre diverse funzionalità e capacità per aiutare gli sviluppatori a personalizzare ed estendere le caratteristiche frontend di NocoBase. Di seguito sono elencate le principali capacità e i capitoli correlati dello sviluppo di **plugin** lato client per NocoBase:

| Modulo                     | Descrizione                                                              | Capitolo correlato                                      |
| :------------------------- | :----------------------------------------------------------------------- | :------------------------------------------------------ |
| **Classe Plugin**          | Crea e gestisce i **plugin** lato client, estendendo le funzionalità frontend. | [Plugin](plugin.md)                                     |
| **Router**                 | Personalizza il routing frontend, implementando la navigazione e i reindirizzamenti delle pagine. | [Router](router.md)                                     |
| **Risorsa**                | Gestisce le risorse frontend, occupandosi del recupero e delle operazioni sui dati. | [Risorsa](resource.md)                                  |
| **Richiesta**              | Personalizza le richieste HTTP, gestendo le chiamate API e la trasmissione dei dati. | [Richiesta](request.md)                                 |
| **Contesto**               | Ottiene e utilizza il contesto dell'applicazione, accedendo allo stato globale e ai servizi. | [Contesto](context.md)                                  |
| **ACL**                    | Implementa il controllo degli accessi frontend, gestendo i permessi di accesso a pagine e funzionalità. | [ACL](acl.md)                                           |
| **Gestore Fonti Dati**     | Gestisce e utilizza più **fonti dati**, implementando il loro switch e accesso. | [Gestore Fonti Dati](data-source-manager.md)           |
| **Stili e Temi**           | Personalizza stili e temi, realizzando la personalizzazione e l'abbellimento dell'interfaccia utente. | [Stili e Temi](styles-themes.md)                        |
| **I18n**                   | Integra il supporto multilingua, implementando l'internazionalizzazione e la localizzazione. | [I18n](i18n.md)                                         |
| **Logger**                 | Personalizza i formati e i metodi di output dei log, migliorando le capacità di debug e monitoraggio. | [Logger](logger.md)                                     |
| **Test**                   | Scrive ed esegue casi di test, garantendo la stabilità e l'accuratezza funzionale del **plugin**. | [Test](test.md)                                         |

Estensioni UI

| Modulo                  | Descrizione                                                                                                                                                             | Capitolo correlato                                                                                              |
| :---------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------- |
| **Configurazione UI**   | Utilizza il FlowEngine e i modelli di **flusso di lavoro** per implementare la configurazione e l'orchestrazione dinamica delle proprietà dei componenti, supportando la personalizzazione visiva di pagine e interazioni complesse. | [FlowEngine](../../flow-engine/index.md) e [Modello di Flusso di Lavoro](../../flow-engine/flow-model.md) |
| **Estensioni Blocchi**  | Personalizza i blocchi di pagina, creando moduli e layout UI riutilizzabili.                                                                                             | [Blocchi](../../ui-development-block/index.md)                                                                 |
| **Estensioni Campi**    | Personalizza i tipi di campo, implementando la visualizzazione e la modifica di dati complessi.                                                                           | [Campi](../../ui-development-field/index.md)                                                                   |
| **Estensioni Azioni**   | Personalizza i tipi di azione, implementando la logica complessa e la gestione delle interazioni.                                                                         | [Azioni](../../ui-development-action/index.md)                                                                 |