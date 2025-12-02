:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Integrazione Single Sign-On (SSO)

NocoBase offre soluzioni complete di Single Sign-On (SSO), supportando diversi protocolli di autenticazione principali per un'integrazione senza interruzioni con i sistemi di identità aziendali esistenti.

## Panoramica

Il Single Sign-On consente agli utenti di accedere a più sistemi correlati ma indipendenti con un unico set di credenziali. Gli utenti si autenticano una sola volta e ottengono l'accesso a tutte le applicazioni autorizzate senza dover inserire ripetutamente nome utente e password. Questo migliora l'esperienza utente, aumentando al contempo la sicurezza e l'efficienza amministrativa.

## Protocolli di Autenticazione Supportati

NocoBase supporta i seguenti protocolli e metodi di autenticazione tramite **plugin**:

### Protocolli SSO Aziendali

- **[SAML 2.0](/auth-verification/auth-saml/)**: Standard aperto basato su XML, ampiamente utilizzato per l'autenticazione dell'identità aziendale. Ideale per l'integrazione con Identity Provider (IdP) aziendali.

- **[OIDC (OpenID Connect)](/auth-verification/auth-oidc/)**: Livello di autenticazione moderno basato su OAuth 2.0, che fornisce meccanismi di autenticazione e autorizzazione. Supporta l'integrazione con i principali provider di identità (come Google, Azure AD, ecc.).

- **[CAS (Central Authentication Service)](/auth-verification/auth-cas/)**: Protocollo SSO sviluppato dall'Università di Yale, ampiamente adottato nelle istituzioni di istruzione superiore.

- **[LDAP](/auth-verification/auth-ldap/)**: Lightweight Directory Access Protocol, utilizzato per accedere e mantenere servizi di informazioni di directory distribuiti. Adatto per l'integrazione con Active Directory o altri server LDAP.

### Autenticazione tramite Piattaforme di Terze Parti

- **[WeCom (WeChat Work)](/auth-verification/auth-wecom/)**: Supporta l'accesso tramite codice QR di WeCom e l'autenticazione senza interruzioni all'interno dell'app.

- **[DingTalk](/auth-verification/auth-dingtalk/)**: Supporta l'accesso tramite codice QR di DingTalk e l'autenticazione senza interruzioni all'interno dell'app.

### Altri Metodi di Autenticazione

- **[Verifica tramite SMS](/auth-verification/auth-sms/)**: Autenticazione basata su codice di verifica tramite SMS del telefono cellulare.

- **[Nome Utente/Password](/auth-verification/auth/)**: Metodo di autenticazione di base integrato in NocoBase.

## Passaggi per l'Integrazione

### 1. Installare il Plugin di Autenticazione

In base alle Sue esigenze, individui e installi il **plugin** di autenticazione appropriato dal gestore dei **plugin**. La maggior parte dei **plugin** di autenticazione SSO richiede un acquisto o un abbonamento separato.

![auth_sso-2025-11-24-08-26-46](https://static-docs.nocobase.com/auth_sso-2025-11-24-08-26-46.png)

Ad esempio, installi il **plugin** di autenticazione SAML 2.0:

![](https://static-docs.nocobase.com/6a12f3d8073c47532a4f8aac900e4296.png)

Oppure installi il **plugin** di autenticazione OIDC:

![](https://static-docs.nocobase.com/202411122358790.png)

### 2. Configurare il Metodo di Autenticazione

1. Vada su **Impostazioni di Sistema > Autenticazione Utente**

![](https://static-docs.nocobase.com/202411130004459.png)

2. Clicchi su **Aggiungi Metodo di Autenticazione**
3. Selezioni il tipo di autenticazione installato (ad esempio, SAML)

![](https://static-docs.nocobase.com/5076fe56086b7799be308bbaf7c4425d.png)

Oppure selezioni OIDC:

![](https://static-docs.nocobase.com/1efbde1c0e2f4967efc1c4336be45ca2.png)

4. Configuri i parametri richiesti come indicato

### 3. Configurare l'Identity Provider

Ogni protocollo di autenticazione richiede una configurazione specifica dell'Identity Provider:

- **SAML**: Configuri i metadati dell'IdP, i certificati, ecc.

![](https://static-docs.nocobase.com/976b66e589973c322d81dcddd22c6146.png)

- **OIDC**: Configuri Client ID, Client Secret, l'endpoint di discovery, ecc.

![](https://static-docs.nocobase.com/202411130006341.png)

- **CAS**: Configuri l'indirizzo del server CAS
- **LDAP**: Configuri l'indirizzo del server LDAP, il Bind DN, ecc.
- **WeCom/DingTalk**: Configuri le credenziali dell'applicazione, il Corp ID, ecc.

### 4. Testare l'Autenticazione

Dopo la configurazione, esegua un test di accesso:

1. Effettui il logout dalla sessione corrente
2. Selezioni il metodo SSO configurato nella pagina di accesso

![](https://static-docs.nocobase.com/74963865c9d36a294948e6adeb5b24bc.png)

3. Completi il flusso di autenticazione dell'Identity Provider
4. Verifichi l'accesso riuscito a NocoBase

## Mappatura Utente e Assegnazione Ruoli

Dopo un'autenticazione SSO riuscita, NocoBase gestisce automaticamente gli account utente:

- **Primo Accesso**: Crea automaticamente un nuovo account utente e sincronizza le informazioni di base (nickname, email, ecc.) dall'Identity Provider.
- **Accessi Successivi**: Utilizza l'account esistente; può facoltativamente sincronizzare le informazioni utente aggiornate.
- **Assegnazione Ruoli**: Può configurare ruoli predefiniti o assegnare automaticamente i ruoli in base agli attributi utente forniti dall'Identity Provider.

## Raccomandazioni di Sicurezza

1. **Utilizzi HTTPS**: Si assicuri che NocoBase sia distribuito in un ambiente HTTPS per proteggere la trasmissione dei dati di autenticazione.
2. **Aggiornamenti Regolari dei Certificati**: Aggiorni e ruoti tempestivamente le credenziali di sicurezza, come i certificati SAML.
3. **Configuri la Whitelist degli URL di Callback**: Configuri correttamente gli URL di callback di NocoBase nell'Identity Provider.
4. **Principio del Minimo Privilegio**: Assegni ruoli e permessi appropriati agli utenti SSO.
5. **Abiliti la Registrazione Audit**: Registri e monitori le attività di accesso SSO.

## Risoluzione dei Problemi

### Accesso SSO non Riuscito?

1. Verifichi che la configurazione dell'Identity Provider sia corretta
2. Si assicuri che gli URL di callback siano configurati correttamente
3. Controlli i log di NocoBase per messaggi di errore dettagliati
4. Confermi che i certificati e le chiavi siano validi

### Informazioni Utente non Sincronizzate?

1. Controlli gli attributi utente restituiti dall'Identity Provider
2. Verifichi che la configurazione della mappatura dei campi sia corretta
3. Confermi che l'opzione di sincronizzazione delle informazioni utente sia abilitata

### Come Supportare Diversi Metodi di Autenticazione?

NocoBase supporta la configurazione simultanea di diversi metodi di autenticazione. Gli utenti possono selezionare il metodo preferito nella pagina di accesso.

## Risorse Correlate

- [Documentazione sull'Autenticazione](/auth-verification/auth/)
- [Autenticazione tramite Chiavi API](/integration/api-keys/)
- [Gestione Utenti e Permessi](/plugins/@nocobase/plugin-users/)