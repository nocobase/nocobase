:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Panoramica

Lo sviluppo di plugin lato server per NocoBase offre diverse funzionalità e capacità per aiutarla a personalizzare ed estendere le caratteristiche principali di NocoBase. Di seguito trova le principali capacità e i capitoli correlati per lo sviluppo di plugin lato server NocoBase:

| Modulo                                      | Descrizione                                                                     | Capitolo correlato                                |
| :------------------------------------------ | :------------------------------------------------------------------------------ | :------------------------------------------------ |
| **Classe Plugin**                           | Creare e gestire i plugin lato server, estendendo le funzionalità principali    | [plugin.md](plugin.md)                            |
| **Operazioni sul Database**                 | Fornisce interfacce per le operazioni sul database, supportando le operazioni CRUD e la gestione delle transazioni | [database.md](database.md)                        |
| **Collezioni Personalizzate**               | Personalizzare le strutture delle collezioni in base alle esigenze aziendali per una gestione flessibile del modello dati | [collections.md](collections.md)                  |
| **Compatibilità Dati per l'Aggiornamento dei Plugin** | Garantisce che gli aggiornamenti dei plugin non influiscano sui dati esistenti, gestendo la migrazione e la compatibilità dei dati | [migration.md](migration.md)                      |
| **Gestione delle Fonti Dati Esterne**       | Integrare e gestire le fonti dati esterne per abilitare l'interazione dei dati | [data-source-manager.md](data-source-manager.md)  |
| **API Personalizzate**                      | Estendere la gestione delle risorse API scrivendo interfacce personalizzate     | [resource-manager.md](resource-manager.md)        |
| **Gestione dei Permessi API**               | Personalizzare i permessi API per un controllo degli accessi granulare          | [acl.md](acl.md)                                  |
| **Intercettazione e Filtraggio di Richieste/Risposte** | Aggiungere intercettori o middleware per richieste e risposte per gestire attività come la registrazione (logging), l'autenticazione, ecc. | [context.md](context.md) e [middleware.md](middleware.md) |
| **Ascolto di Eventi**                       | Ascoltare gli eventi di sistema (ad esempio, dall'applicazione o dal database) e attivare i gestori corrispondenti | [event.md](event.md)                              |
| **Gestione della Cache**                    | Gestire la cache per migliorare le prestazioni e la velocità di risposta dell'applicazione | [cache.md](cache.md)                              |
| **Attività Pianificate**                   | Creare e gestire attività pianificate, come la pulizia periodica, la sincronizzazione dei dati, ecc. | [cron-job-manager.md](cron-job-manager.md)        |
| **Supporto Multilingua**                    | Integrare il supporto multilingua per implementare l'internazionalizzazione e la localizzazione | [i18n.md](i18n.md)                                |
| **Output dei Log**                          | Personalizzare i formati e i metodi di output dei log per migliorare le capacità di debug e monitoraggio | [logger.md](logger.md)                            |
| **Comandi Personalizzati**                  | Estendere la CLI di NocoBase aggiungendo comandi personalizzati                | [command.md](command.md)                          |
| **Scrittura di Casi di Test**               | Scrivere ed eseguire casi di test per garantire la stabilità e l'accuratezza funzionale del plugin | [test.md](test.md)                                |