---
pkg: '@nocobase/plugin-audit-logger'
---
:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::


# Log di Audit

## Introduzione

Il log di audit viene utilizzato per registrare e tracciare le attività degli utenti e la cronologia delle operazioni sulle risorse all'interno del sistema.

![](https://static-docs.nocobase.com/202501031627719.png)

![](https://static-docs.nocobase.com/202501031627922.png)

## Descrizione dei Parametri

| Parametro                     | Descrizione                                                                                                                               |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **Resource**                  | Tipo di risorsa target dell'operazione                                                                                                    |
| **Action**                    | Tipo di operazione eseguita                                                                                                               |
| **User**                      | Utente che ha eseguito l'operazione                                                                                                       |
| **Role**                      | Ruolo dell'utente durante l'operazione                                                                                                    |
| **Data source**               | La **fonte dati**                                                                                                                         |
| **Target collection**         | La **collezione** target                                                                                                                  |
| **Target record UK**          | L'identificatore univoco della **collezione** target                                                                                      |
| **Source collection**         | La **collezione** sorgente del campo di relazione                                                                                         |
| **Source record UK**          | L'identificatore univoco della **collezione** sorgente del campo di relazione                                                             |
| **Status**                    | Il codice di stato HTTP della risposta alla richiesta dell'operazione                                                                     |
| **Created at**                | L'ora dell'operazione                                                                                                                     |
| **UUID**                      | L'identificatore univoco dell'operazione, coerente con il Request ID della richiesta, utilizzabile per recuperare i log dell'applicazione |
| **IP**                        | L'indirizzo IP dell'utente                                                                                                                |
| **UA**                        | Le informazioni UA dell'utente                                                                                                            |
| **Metadata**                  | Metadati come parametri, corpo della richiesta e contenuto della risposta dell'operazione                                                 |

## Descrizione delle Risorse di Audit

Attualmente, le seguenti operazioni sulle risorse vengono registrate nel log di audit:

### Applicazione Principale

| Operazione         | Descrizione                      |
| ------------------ | -------------------------------- |
| `app:resart`       | Riavvio dell'applicazione        |
| `app:clearCache`   | Cancellazione della cache dell'applicazione |

### Gestore dei Plugin

| Operazione     | Descrizione     |
| -------------- | --------------- |
| `pm:add`       | Aggiungi **plugin**     |
| `pm:update`    | Aggiorna **plugin**   |
| `pm:enable`    | Abilita **plugin**    |
| `pm:disable`   | Disabilita **plugin** |
| `pm:remove`    | Rimuovi **plugin**    |

### Autenticazione Utente

| Operazione            | Descrizione       |
| --------------------- | ----------------- |
| `auth:signIn`         | Accesso           |
| `auth:signUp`         | Registrazione     |
| `auth:signOut`        | Disconnessione    |
| `auth:changePassword` | Modifica password |

### Utente

| Operazione            | Descrizione     |
| --------------------- | --------------- |
| `users:updateProfile` | Aggiorna profilo |

### Configurazione UI

| Operazione                 | Descrizione        |
| -------------------------- | ------------------ |
| `uiSchemas:insertAdjacent` | Inserisci UI Schema |
| `uiSchemas:patch`          | Modifica UI Schema |
| `uiSchemas:remove`         | Rimuovi UI Schema  |

### Operazioni sulle Collezioni

| Operazione         | Descrizione                           |
| ------------------ | ------------------------------------- |
| `create`           | Crea record                           |
| `update`           | Aggiorna record                       |
| `destroy`          | Elimina record                        |
| `updateOrCreate`   | Aggiorna o crea record                |
| `firstOrCreate`    | Cerca o crea record                   |
| `move`             | Sposta record                         |
| `set`              | Imposta record del campo di relazione |
| `add`              | Aggiungi record del campo di relazione |
| `remove`           | Rimuovi record del campo di relazione |
| `export`           | Esporta record                        |
| `import`           | Importa record                        |

## Aggiungere Altre Risorse di Audit

Se ha esteso altre operazioni sulle risorse tramite i **plugin** e desidera che questi comportamenti vengano registrati nel log di audit, può fare riferimento all'[API](/api/server/audit-manager.md).