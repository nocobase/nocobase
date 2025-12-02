:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Integrazione

## Panoramica

NocoBase offre capacità di integrazione complete, consentendo una connessione senza interruzioni con sistemi esterni, servizi di terze parti e varie fonti dati. Grazie a metodi di integrazione flessibili, può estendere le funzionalità di NocoBase per soddisfare diverse esigenze aziendali.

## Metodi di Integrazione

### Integrazione API

NocoBase offre potenti capacità API per l'integrazione con applicazioni e servizi esterni:

![20250301003106](https://static-docs.nocobase.com/20250301003106.png)

- **[Chiavi API](/integration/api-keys/)**: Utilizzi le chiavi API per un'autenticazione sicura e per accedere in modo programmatico alle risorse di NocoBase.
- **[Documentazione API](/integration/api-doc/)**: Documentazione API integrata per esplorare e testare gli endpoint.

### Single Sign-On (SSO)

Si integri con i sistemi di identità aziendali per un'autenticazione unificata:

![auth_sso-2025-11-24-08-26-46](https://static-docs.nocobase.com/auth_sso-2025-11-24-08-26-46.png)

- **[Integrazione SSO](/integration/sso/)**: Supporto per l'autenticazione SAML, OIDC, CAS, LDAP e piattaforme di terze parti.
- Gestione centralizzata degli utenti e controllo degli accessi.
- Esperienza di autenticazione senza interruzioni tra i sistemi.

### Integrazione dei flussi di lavoro

Connetta i flussi di lavoro NocoBase con sistemi esterni:

![auth_sso-2025-11-24-12-02-01](https://static-docs.nocobase.com/auth_sso-2025-11-24-12-02-01.png)

- **[Webhook del flusso di lavoro](/integration/workflow-webhook/)**: Riceva eventi da sistemi esterni per attivare i flussi di lavoro.
- **[Richiesta HTTP del flusso di lavoro](/integration/workflow-http-request/)**: Invia richieste HTTP ad API esterne dai flussi di lavoro.
- Automatizzi i processi aziendali tra piattaforme.

### Fonti dati esterne

Si connetta a database e sistemi di dati esterni:

![20240512085558](https://static-docs.nocobase.com/20240512085558.png)

- **[Database esterni](/data-sources/)**: Si connetta direttamente a database MySQL, PostgreSQL, MariaDB, MSSQL, Oracle e KingbaseES.
- Riconosca le strutture delle tabelle dei database esterni ed esegua operazioni CRUD sui dati esterni direttamente all'interno di NocoBase.
- Interfaccia di gestione dati unificata.

### Contenuto Incorporato

Incorpori contenuti esterni all'interno di NocoBase:

![20240408220322](https://static-docs.nocobase.com/20240408220322.png)

- **[Blocco Iframe](/integration/block-iframe/)**: Incorpori pagine web e applicazioni esterne.
- **Blocchi JS**: Esegua codice JavaScript personalizzato per integrazioni avanzate.

## Scenari di Integrazione Comuni

### Integrazione con Sistemi Aziendali

- Connetta NocoBase con sistemi ERP, CRM o altri sistemi aziendali.
- Sincronizzazione dati bidirezionale.
- Automatizzi i flussi di lavoro tra sistemi.

### Integrazione con Servizi di Terze Parti

- Interroghi lo stato dei pagamenti dai gateway di pagamento, integri servizi di messaggistica o piattaforme cloud.
- Sfrutti le API esterne per estendere le funzionalità.
- Costruisca integrazioni personalizzate utilizzando webhook e richieste HTTP.

### Integrazione Dati

- Si connetta a più fonti dati.
- Aggreghi dati da sistemi diversi.
- Crei dashboard e report unificati.

## Considerazioni sulla Sicurezza

Quando integra NocoBase con sistemi esterni, tenga in considerazione le seguenti best practice di sicurezza:

1.  **Utilizzi HTTPS**: Utilizzi sempre connessioni crittografate per la trasmissione dei dati.
2.  **Protegga le Chiavi API**: Archivi le chiavi API in modo sicuro e le ruoti regolarmente.
3.  **Principio del Minimo Privilegio**: Conceda solo le autorizzazioni necessarie per l'integrazione.
4.  **Registrazione Audit**: Monitori e registri le attività di integrazione.
5.  **Validazione dei Dati**: Validi tutti i dati provenienti da fonti esterne.