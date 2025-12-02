:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Guida alla Sicurezza di NocoBase

NocoBase pone grande enfasi sulla sicurezza dei dati e delle applicazioni, dalla progettazione funzionale all'implementazione del sistema. La piattaforma integra diverse funzionalità di sicurezza come l'autenticazione utente, il controllo degli accessi e la crittografia dei dati, consentendo al contempo una configurazione flessibile delle politiche di sicurezza in base alle esigenze reali. Che si tratti di proteggere i dati degli utenti, gestire i permessi di accesso o isolare gli ambienti di sviluppo e produzione, NocoBase offre strumenti e soluzioni pratiche. Questa guida mira a fornire indicazioni per un utilizzo sicuro di NocoBase, aiutando gli utenti a proteggere i dati, le applicazioni e l'ambiente, garantendo un uso efficiente delle funzionalità del sistema in un contesto di sicurezza.

## Autenticazione Utente

L'autenticazione utente serve a identificare l'identità degli utenti, impedendo l'accesso non autorizzato al sistema e assicurando che le identità degli utenti non vengano utilizzate in modo improprio.

### Chiave Token

Per impostazione predefinita, NocoBase utilizza JWT (JSON Web Token) per l'autenticazione delle API lato server. Gli utenti possono impostare la chiave del Token tramite la variabile d'ambiente di sistema `APP_KEY`. Si prega di gestire con cura la chiave del Token dell'applicazione per evitarne la divulgazione esterna. È importante notare che, se `APP_KEY` viene modificata, anche i Token precedenti diventeranno invalidi.

### Politica dei Token

NocoBase supporta la configurazione delle seguenti politiche di sicurezza per i Token utente:

| Elemento di configurazione              | Descrizione                                                                                                                                                                                                                                                                                                                      |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Validità della sessione          | Il tempo massimo di validità per ogni accesso utente. Durante la validità della sessione, il Token verrà automaticamente aggiornato. Dopo il timeout, all'utente verrà richiesto di effettuare nuovamente l'accesso.                                                                                                |
| Validità del Token        | Il periodo di validità di ogni API Token emesso. Dopo la scadenza del Token, se la sessione è ancora valida e non ha superato il limite di aggiornamento, il server emetterà automaticamente un nuovo Token per mantenere la sessione utente; altrimenti, all'utente verrà richiesto di effettuare nuovamente l'accesso. (Ogni Token può essere aggiornato una sola volta) |
| Limite di aggiornamento del Token scaduto | Il limite di tempo massimo consentito per l'aggiornamento di un Token dopo la sua scadenza.                                                                                                                                                        |

Normalmente, consigliamo agli amministratori di:

- Impostare un periodo di validità del Token più breve per limitare il tempo di esposizione del Token.
- Impostare un periodo di validità della sessione ragionevole, più lungo del periodo di validità del Token ma non eccessivamente lungo, per bilanciare l'esperienza utente e la sicurezza. Utilizzare il meccanismo di aggiornamento automatico del Token per garantire che le sessioni utente attive non vengano interrotte, riducendo al contempo il rischio di abusi delle sessioni a lungo termine.
- Impostare un limite di aggiornamento del Token scaduto ragionevole, in modo che il Token scada naturalmente quando l'utente è inattivo per un lungo periodo senza che venga emesso un nuovo Token, riducendo il rischio di abusi delle sessioni utente inattive.

### Archiviazione del Token lato client

Per impostazione predefinita, i Token utente sono archiviati nel LocalStorage del browser. Dopo aver chiuso e riaperto la pagina del browser, se il Token è ancora valido, l'utente non dovrà effettuare nuovamente l'accesso.

Se desidera che gli utenti effettuino nuovamente l'accesso ogni volta che entrano nella pagina, può impostare la variabile d'ambiente `API_CLIENT_STORAGE_TYPE=sessionStorage`, per salvare il Token utente nel SessionStorage del browser, raggiungendo così l'obiettivo di richiedere agli utenti di effettuare nuovamente l'accesso ogni volta che aprono la pagina.

### Politica delle Password

> Edizione Professional e superiori

NocoBase supporta la configurazione di regole per le password e politiche di blocco per i tentativi di accesso con password per tutti gli utenti, al fine di migliorare la sicurezza delle applicazioni NocoBase che hanno l'accesso tramite password abilitato. Può consultare la [Politica delle Password](./password-policy/index.md) per comprendere ogni elemento di configurazione.

#### Regole per le Password

| Elemento di configurazione                     | Descrizione                                                                                                        |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **Lunghezza della password**               | Il requisito di lunghezza minima della password, la lunghezza massima è 64 caratteri.                                                 |
| **Complessità della password**             | Imposta i requisiti di complessità per la password, i tipi di caratteri che devono essere inclusi.                   |
| **Non includere il nome utente nella password** | Imposta se la password può includere il nome utente dell'utente corrente.                                                  |
| **Memorizza la cronologia delle password**           | Memorizza il numero di password utilizzate di recente dall'utente. L'utente non può riutilizzarle quando cambia la password. |

#### Configurazione della Scadenza della Password

| Elemento di configurazione                                    | Descrizione                                                                                                                                                                                                                                                                                                                                                                                      |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Periodo di validità della password**           | Il periodo di validità delle password utente. Gli utenti devono cambiare la propria password prima della scadenza per ricalcolare il periodo di validità. Se non cambiano la password prima della scadenza, non potranno accedere con la vecchia password e avranno bisogno dell'assistenza dell'amministratore per resettarla. <br>Se sono configurati altri metodi di accesso, l'utente può accedere utilizzando tali metodi. |
| **Canale di notifica per il promemoria di scadenza della password** | Entro 10 giorni dalla scadenza della password dell'utente, verrà inviato un promemoria ogni volta che l'utente effettua l'accesso.                                                                                                                                                                                                                                                            |

#### Sicurezza dell'Accesso con Password

| Elemento di configurazione                                         | Descrizione                                                                                                                                                                                                                                               |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Tentativi massimi di accesso con password non valida**                | Imposta il numero massimo di tentativi di accesso che un utente può effettuare entro un intervallo di tempo specificato.                                                                                                                                                                 |
| **Intervallo di tempo massimo per tentativi di accesso non validi (secondi)** | Imposta l'intervallo di tempo per il calcolo dei tentativi massimi di accesso non validi dell'utente, in secondi.                                                                                                                                                              |
| **Tempo di blocco (secondi)**                                    | Imposta il tempo di blocco dell'utente dopo che ha superato il limite di tentativi di accesso con password non valida (0 significa nessun limite). <br>Durante il periodo in cui l'utente è bloccato, sarà proibito accedere al sistema tramite qualsiasi metodo di autenticazione, incluse le API keys. |

Normalmente, consigliamo di:

- Impostare regole per le password robuste per ridurre il rischio che le password vengano indovinate per associazione o tramite attacchi a forza bruta.
- Impostare un periodo di validità della password ragionevole per obbligare gli utenti a cambiarle regolarmente.
- Combinare il numero di tentativi di accesso con password non valida e la configurazione del tempo per limitare i tentativi di accesso con password ad alta frequenza in un breve periodo e prevenire attacchi a forza bruta.
- Se i requisiti di sicurezza sono molto stringenti, è possibile impostare un tempo di blocco ragionevole per l'utente dopo aver superato il limite di accesso. Tuttavia, è importante notare che l'impostazione del tempo di blocco potrebbe essere sfruttata in modo malevolo; gli attaccanti potrebbero intenzionalmente inserire più volte password errate per gli account target, costringendoli al blocco e impedendone il normale utilizzo. Nell'uso effettivo, è possibile combinare restrizioni IP, limitazioni di frequenza delle API e altri mezzi per prevenire questo tipo di attacchi.
- Modificare il nome utente, l'email e la password predefiniti dell'utente root di NocoBase per evitare utilizzi malevoli.
- Poiché sia la scadenza della password che il blocco dell'account impediranno l'accesso al sistema, inclusi gli account amministratore, si consiglia di configurare più account nel sistema che abbiano il permesso di reimpostare le password e sbloccare gli utenti.

![](https://static-docs.nocobase.com/202501031618900.png)

### Blocco Utente

> Edizione Professional e superiori, incluso nel plugin della politica delle password

Gestisce gli utenti bloccati per aver superato il limite di tentativi di accesso con password non valida. È possibile sbloccarli attivamente o aggiungere attivamente utenti anomali all'elenco di blocco. Dopo che un utente è bloccato, gli sarà proibito accedere al sistema tramite qualsiasi metodo di autenticazione, incluse le API keys.

![](https://static-docs.nocobase.com/202501031618399.png)

### Chiavi API

NocoBase supporta la chiamata delle API di sistema tramite chiavi API. Gli utenti possono aggiungere chiavi API nella configurazione del plugin Chiavi API.

- Si prega di associare il ruolo corretto alla chiave API e assicurarsi che i permessi associati al ruolo siano configurati correttamente.
- Durante l'utilizzo delle chiavi API, prevenire la loro divulgazione esterna.
- Normalmente, consigliamo agli utenti di impostare un periodo di validità per le chiavi API e di evitare l'opzione "Mai scadere".
- Se una chiave API viene utilizzata in modo anomalo e potrebbe esserci un rischio di divulgazione, gli utenti possono eliminare la chiave API corrispondente per invalidarla.

![](https://static-docs.nocobase.com/46141872fc0ad9a96fa5b14e97fcba12.png)

### Single Sign-On (SSO)

> Plugin Commerciale

NocoBase offre un ricco set di plugin di autenticazione SSO, supportando diversi protocolli mainstream come OIDC, SAML 2.0, LDAP e CAS. Allo stesso tempo, NocoBase dispone anche di un set completo di interfacce di estensione per i metodi di autenticazione, che possono supportare lo sviluppo rapido e l'integrazione di altri tipi di autenticazione. È possibile collegare facilmente il proprio IdP esistente con NocoBase per gestire centralmente le identità degli utenti sull'IdP e migliorare la sicurezza.
![](https://static-docs.nocobase.com/202501031619427.png)

### Autenticazione a due fattori (Two-factor authentication)

> Edizione Enterprise

L'autenticazione a due fattori richiede agli utenti di fornire una seconda informazione valida per dimostrare la propria identità quando effettuano l'accesso con una password, ad esempio inviando un codice di verifica dinamico monouso al dispositivo fidato dell'utente, per verificare l'identità dell'utente e garantire che l'identità dell'utente non venga utilizzata in modo improprio, riducendo il rischio di fughe di password.

### Controllo Accessi IP

> Edizione Enterprise

NocoBase supporta l'impostazione di blacklist o whitelist per gli IP di accesso degli utenti.

- In ambienti con requisiti di sicurezza rigorosi, è possibile impostare una whitelist IP per consentire l'accesso al sistema solo a IP o intervalli IP specifici, al fine di limitare le connessioni di rete esterne non autorizzate e ridurre i rischi di sicurezza alla fonte.
- In condizioni di accesso alla rete pubblica, se l'amministratore rileva accessi anomali, può impostare una blacklist IP per bloccare indirizzi IP malevoli noti o accessi da fonti sospette, riducendo le minacce alla sicurezza come scansioni malevole e attacchi a forza bruta.
- Le richieste di accesso rifiutate vengono registrate nei log.

## Controllo dei Permessi

Configurando diversi ruoli nel sistema e assegnando i permessi corrispondenti a tali ruoli, è possibile controllare in modo granulare i permessi degli utenti per accedere alle risorse. Gli amministratori devono configurare in modo ragionevole in base alle esigenze dello scenario reale, al fine di ridurre il rischio di fughe di risorse di sistema.

### Utente Root

Durante l'installazione iniziale di NocoBase, l'applicazione inizializzerà un utente root. Si consiglia agli utenti di modificare le informazioni relative all'utente root impostando le variabili d'ambiente di sistema per evitare utilizzi malevoli.

- `INIT_ROOT_USERNAME` - nome utente root
- `INIT_ROOT_EMAIL` - email utente root
- `INIT_ROOT_PASSWORD` - password utente root, si prega di impostare una password robusta.

Durante l'utilizzo successivo del sistema, si consiglia agli utenti di configurare e utilizzare altri account amministratore, evitando il più possibile di operare direttamente sull'applicazione con l'utente root.

### Ruoli e Permessi

NocoBase controlla i permessi degli utenti per accedere alle risorse configurando ruoli nel sistema, autorizzando ruoli diversi e associando gli utenti ai ruoli corrispondenti. Ogni utente può avere più ruoli e può passare da un ruolo all'altro per operare sulle risorse da diverse prospettive. Se è installato il plugin dei dipartimenti, è anche possibile associare ruoli e dipartimenti, in modo che gli utenti possano avere i ruoli associati al proprio dipartimento.

![](https://static-docs.nocobase.com/202501031620965.png)

### Permessi di Configurazione del Sistema

I permessi di configurazione del sistema includono le seguenti impostazioni:

- Se consentire l'interfaccia di configurazione
- Se consentire l'installazione, l'abilitazione, la disabilitazione di plugin
- Se consentire la configurazione di plugin
- Se consentire la pulizia della cache, il riavvio dell'applicazione
- I permessi di configurazione per ogni plugin

### Permessi del Menu

I permessi del menu sono utilizzati per controllare l'autorizzazione degli utenti ad accedere a diverse pagine del menu, sia su desktop che su mobile.
![](https://static-docs.nocobase.com/202501031620717.png)

### Permessi sui Dati

NocoBase offre un controllo granulare sui permessi degli utenti per accedere ai dati all'interno del sistema, garantendo che utenti diversi possano accedere solo ai dati pertinenti alle loro responsabilità, prevenendo abusi di potere e fughe di dati.

#### Controllo Globale

![](https://static-docs.nocobase.com/202501031620866.png)

#### Controllo a livello di tabella e di campo

![](https://static-docs.nocobase.com/202501031621047.png)

#### Controllo dell'Ambito dei Dati

Imposta l'ambito dei dati su cui gli utenti possono operare. Si noti che l'ambito dei dati qui è diverso dall'ambito dei dati configurato nel blocco. L'ambito dei dati configurato nel blocco viene solitamente utilizzato solo per il filtraggio dei dati lato frontend. Se è necessario controllare rigorosamente i permessi degli utenti per accedere alle risorse dati, è necessario configurarlo qui, dove il controllo è gestito dal server.

![](https://static-docs.nocobase.com/202501031621712.png)

## Sicurezza dei Dati

Durante il processo di archiviazione e backup dei dati, NocoBase fornisce meccanismi efficaci per garantire la sicurezza dei dati.

### Archiviazione delle Password

Le password degli utenti di NocoBase vengono crittografate e archiviate utilizzando l'algoritmo scrypt, che può resistere efficacemente ad attacchi hardware su larga scala.

### Variabili d'Ambiente e Chiavi

Quando si utilizzano servizi di terze parti in NocoBase, si consiglia di configurare le informazioni della chiave di terze parti nelle variabili d'ambiente e di archiviarle crittografate. Questo è comodo per la configurazione e l'utilizzo in luoghi diversi e migliora anche la sicurezza. Può consultare la documentazione per i metodi di utilizzo dettagliati.

:::warning
Per impostazione predefinita, la chiave è crittografata utilizzando l'algoritmo AES-256-CBC. NocoBase genererà automaticamente una chiave di crittografia a 32 bit e la salverà in `storage/.data/environment/aes_key.dat`. Gli utenti devono conservare correttamente il file della chiave per evitare che venga rubato. Se è necessario migrare i dati, il file della chiave deve essere migrato insieme.
:::

![](https://static-docs.nocobase.com/202501031622612.png)

### Archiviazione dei File

Se è necessario archiviare file sensibili, si consiglia di utilizzare un servizio di cloud storage compatibile con il protocollo S3 e, in combinazione con il plugin commerciale File storage: S3 (Pro), realizzare la lettura e scrittura privata dei file. Se è necessario utilizzarlo in un ambiente di rete interna, si consiglia di utilizzare applicazioni di storage che supportano la distribuzione privata e sono compatibili con il protocollo S3, come MinIO.

![](https://static-docs.nocobase.com/202501031623549.png)

### Backup dell'Applicazione

Per garantire la sicurezza dei dati dell'applicazione ed evitare la perdita di dati, si consiglia di eseguire regolarmente il backup del database.

Gli utenti della versione open-source possono fare riferimento a https://www.nocobase.com/en/blog/nocobase-backup-restore per eseguire il backup utilizzando gli strumenti del database. Si consiglia inoltre di conservare correttamente i file di backup per prevenire la fuga di dati.

Gli utenti della versione Professional e superiori possono utilizzare il gestore di backup per i backup. Il gestore di backup offre le seguenti funzionalità:

- Backup automatico programmato: i backup automatici periodici fanno risparmiare tempo e operazioni manuali, garantendo una maggiore sicurezza dei dati.
- Sincronizzazione dei file di backup con il cloud storage: isola i file di backup dal servizio applicativo stesso per prevenire la perdita dei file di backup in caso di indisponibilità del servizio a causa di un guasto del server.
- Crittografia dei file di backup: imposta una password per i file di backup per ridurre il rischio di perdita di dati causata dalla fuga dei file di backup.

![](https://static-docs.nocobase.com/202501031623107.png)

## Sicurezza dell'Ambiente di Esecuzione

La corretta distribuzione di NocoBase e la garanzia della sicurezza dell'ambiente di esecuzione sono fondamentali per la sicurezza delle applicazioni NocoBase.

### Distribuzione HTTPS

Per prevenire attacchi man-in-the-middle, si consiglia di aggiungere un certificato SSL/TLS al sito della propria applicazione NocoBase per garantire la sicurezza dei dati durante la trasmissione in rete.

### Crittografia del Trasporto API

> Edizione Enterprise

In ambienti con requisiti di sicurezza dei dati più stringenti, NocoBase supporta l'abilitazione della crittografia del trasporto API per crittografare il contenuto delle richieste e delle risposte API, evitando la trasmissione in chiaro e aumentando la soglia per la decifrazione dei dati.

### Distribuzione Privata

Per impostazione predefinita, NocoBase non necessita di comunicare con servizi di terze parti e il team NocoBase non raccoglie alcuna informazione sugli utenti. È necessario connettersi al server NocoBase solo quando si eseguono le seguenti due operazioni:

1. Download automatico di plugin commerciali tramite la piattaforma NocoBase Service.
2. Verifica online e attivazione dell'applicazione della versione commerciale.

Se è disposto a sacrificare un certo grado di comodità, entrambe queste operazioni supportano anche il completamento offline e non richiedono una connessione diretta al server NocoBase.

NocoBase supporta la distribuzione completamente in rete interna, fare riferimento a:

- https://www.nocobase.com/en/blog/load-docker-image
- [Caricare i plugin nella directory dei plugin per installare e aggiornare](/get-started/install-upgrade-plugins#third-party-plugins)

### Isolamento di Ambienti Multipli

> Edizione Professional e superiori

Nell'uso pratico, consigliamo agli utenti aziendali di isolare gli ambienti di test e produzione per garantire la sicurezza dei dati dell'applicazione e dell'ambiente di esecuzione nell'ambiente di produzione. Utilizzando il plugin di gestione delle migrazioni, è possibile migrare i dati dell'applicazione tra diversi ambienti.

![](https://static-docs.nocobase.com/202501031627729.png)

## Audit e Monitoraggio

### Log di Audit

> Edizione Enterprise

La funzionalità dei log di audit di NocoBase registra le attività degli utenti all'interno del sistema. Registrando le operazioni chiave e i comportamenti di accesso degli utenti, gli amministratori possono:

- Controllare le informazioni di accesso degli utenti come IP, dispositivo e orario delle operazioni, per rilevare tempestivamente comportamenti anomali.
- Tracciare la cronologia delle operazioni sulle risorse dati all'interno del sistema.

![](https://static-docs.nocobase.com/202501031627719.png)

![](https://static-docs.nocobase.com/202501031627922.png)

### Log dell'Applicazione

NocoBase fornisce diversi tipi di log per aiutare gli utenti a comprendere lo stato di funzionamento del sistema e i record di comportamento, individuando e localizzando tempestivamente i problemi del sistema, garantendo la sicurezza e la controllabilità del sistema da diverse prospettive. I principali tipi di log includono:

- Log delle richieste: log delle richieste API, inclusi URL di accesso, metodi HTTP, parametri di richiesta, tempi di risposta e codici di stato.
- Log di sistema: registra gli eventi di esecuzione dell'applicazione, inclusi l'avvio del servizio, le modifiche alla configurazione, i messaggi di errore e le operazioni chiave.
- Log SQL: registra le istruzioni delle operazioni sul database e i relativi tempi di esecuzione, coprendo azioni come query, aggiornamenti, inserimenti ed eliminazioni.
- Log del flusso di lavoro: log di esecuzione del flusso di lavoro, inclusi tempo di esecuzione, informazioni di funzionamento, messaggi di errore, ecc.