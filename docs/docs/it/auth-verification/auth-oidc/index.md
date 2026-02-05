---
pkg: '@nocobase/plugin-auth-oidc'
---
:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::


# Autenticazione: OIDC

## Introduzione

Il plugin Autenticazione: OIDC segue lo standard del protocollo OIDC (Open ConnectID), utilizzando il flusso del codice di autorizzazione (Authorization Code Flow), per consentire agli utenti di accedere a NocoBase utilizzando account forniti da provider di servizi di autenticazione di terze parti (IdP).

## Attivare il plugin

![](https://static-docs.nocobase.com/202411122358790.png)

## Aggiungere l'autenticazione OIDC

Acceda alla pagina di gestione dei plugin di autenticazione utente.

![](https://static-docs.nocobase.com/202411130004459.png)

Aggiungi - OIDC

![](https://static-docs.nocobase.com/1efbde1c0e2f4967efc1c4336be45ca2.png)

## Configurazione

### Configurazione di base

![](https://static-docs.nocobase.com/202411130006341.png)

| Configurazione                                     | Descrizione                                                                                                                                                                | Versione       |
| :------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------- |
| Registrazione automatica se l'utente non esiste    | Se non viene trovato un utente esistente corrispondente, creare automaticamente un nuovo utente?                                                                           | -              |
| Issuer                                             | L'issuer è fornito dall'IdP e di solito termina con `/.well-known/openid-configuration`.                                                                                   | -              |
| ID Cliente                                         | L'ID Cliente                                                                                                                                                               | -              |
| Segreto Cliente                                    | Il Segreto Cliente                                                                                                                                                         | -              |
| Scope                                              | Opzionale, il valore predefinito è `openid email profile`.                                                                                                                 | -              |
| Algoritmo di firma della risposta id_token         | Il metodo di firma per `id_token`, il valore predefinito è `RS256`.                                                                                                        | -              |
| Abilita il logout avviato da RP                    | Abilita il logout avviato da RP. Quando l'utente effettua il logout, viene disconnessa anche la sessione IdP. L'URL di reindirizzamento post-logout dell'IdP deve essere quello fornito in [Utilizzo](#utilizzo). | `v1.3.44-beta` |

### Mappatura dei campi

![](https://static-docs.nocobase.com/92d63c8f6082b50d9f475674cb5650.png)

| Configurazione                            | Descrizione                                                                                                                                                      |
| :---------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mappatura dei campi                       | Mappatura dei campi. I campi attualmente disponibili per la mappatura in NocoBase sono nickname, email e numero di telefono. Il nickname predefinito utilizza `openid`. |
| Utilizzare questo campo per associare l'utente | Campo utilizzato per abbinare e associare gli utenti esistenti. È possibile scegliere email o nome utente; l'email è l'impostazione predefinita. Le informazioni utente fornite dall'IdP devono includere i campi `email` o `username`. |

### Configurazione avanzata

![](https://static-docs.nocobase.com/202411130013306.png)

| Configurazione                                                     | Descrizione                                                                                                                                                                                                                                                         | Versione       |
| :----------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :------------- |
| HTTP                                                               | Indica se l'URL di callback di NocoBase utilizza il protocollo HTTP; il valore predefinito è `https`.                                                                                                                                                                | -              |
| Porta                                                              | Porta per l'URL di callback di NocoBase; i valori predefiniti sono `443/80`.                                                                                                                                                                                        | -              |
| Token di stato                                                     | Utilizzato per verificare l'origine della richiesta e prevenire attacchi CSRF. È possibile inserire un valore fisso, ma **si consiglia vivamente di lasciarlo vuoto, in quanto verrà generato un valore casuale per impostazione predefinita. Se si desidera utilizzare un valore fisso, si prega di valutare attentamente l'ambiente di utilizzo e i rischi per la sicurezza.** | -              |
| Passa parametri nello scambio del codice di autorizzazione          | Quando si scambia un codice per un token, alcuni IdP potrebbero richiedere il passaggio di Client ID o Client Secret come parametri. È possibile selezionare questa opzione e specificare i nomi dei parametri corrispondenti.                                                                                | -              |
| Metodo per chiamare l'endpoint delle informazioni utente            | Il metodo HTTP utilizzato per richiedere l'API delle informazioni utente.                                                                                                                                                                                             | -              |
| Dove inserire il token di accesso quando si chiama l'endpoint delle informazioni utente | Come viene passato il token di accesso quando si chiama l'API delle informazioni utente:<br/>- Header - Nell'intestazione della richiesta (predefinito).<br />- Body - Nel corpo della richiesta, utilizzato con il metodo `POST`.<br />- Query parameters - Come parametri di query, utilizzato con il metodo `GET`.                   | -              |
| Salta la verifica SSL                                              | Salta la verifica SSL quando si richiede l'API dell'IdP. **Questa opzione espone il Suo sistema a rischi di attacchi man-in-the-middle. Abiliti questa opzione solo se comprende appieno il suo scopo e le sue implicazioni. È fortemente sconsigliato utilizzarla in ambienti di produzione.**        | `v1.3.40-beta` |

### Utilizzo

![](https://static-docs.nocobase.com/202411130019570.png)

| Configurazione                   | Descrizione                                                                                    |
| :------------------------------- | :--------------------------------------------------------------------------------------------- |
| URL di reindirizzamento          | Utilizzato per configurare l'URL di callback nell'IdP.                                         |
| URL di reindirizzamento post-logout | Utilizzato per configurare l'URL di reindirizzamento post-logout nell'IdP quando il logout avviato da RP è abilitato. |

:::info
Durante i test locali, utilizzi `127.0.0.1` invece di `localhost` per l'URL, poiché il metodo di accesso OIDC richiede la scrittura dello stato nel cookie del client per la convalida della sicurezza. Se la finestra di accesso appare e scompare rapidamente senza che l'accesso avvenga con successo, verifichi i log del server per eventuali problemi di mancata corrispondenza dello stato e si assicuri che il parametro `state` sia incluso nel cookie della richiesta. Questo problema si verifica spesso quando lo stato nel cookie del client non corrisponde allo stato presente nella richiesta.
:::

## Accesso

Acceda alla pagina di accesso e clicchi sul pulsante sotto il modulo di accesso per avviare l'accesso tramite terze parti.

![](https://static-docs.nocobase.com/e493d156254c2ac0b6f6e1002e6a2e6b.png)