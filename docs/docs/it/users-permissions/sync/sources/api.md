:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Sincronizzare i Dati Utente tramite API HTTP

## Ottenere una Chiave API

Faccia riferimento a [Chiavi API](/auth-verification/api-keys). Si assicuri che il ruolo associato alla chiave API disponga delle autorizzazioni necessarie per sincronizzare i dati utente.

## Panoramica dell'API

### Esempio

```bash
curl 'https://localhost:13000/api/userData:push' \
  -H 'Authorization: Bearer <token>' \
  --data-raw '{"dataType":"user","records":[]}' # Vedere i dettagli del corpo della richiesta di seguito
```

### Endpoint

```bash
POST /api/userData:push
```

### Formato dei Dati Utente

#### UserData

| Parametro  | Tipo                               | Descrizione                                                                 |
| ---------- | ---------------------------------- | --------------------------------------------------------------------------- |
| `dataType` | `'user' \| 'department'`           | Obbligatorio. Tipo di dati da inviare. Utilizzi `user` per l'invio di dati utente. |
| `matchKey` | `'username' \| 'email' \| 'phone'` | Opzionale. Utilizzato per abbinare gli utenti esistenti nel sistema in base al campo specificato. |
| `records`  | `UserRecord[]`                     | Obbligatorio. Array di record di dati utente.                               |

#### UserRecord

| Parametro     | Tipo       | Descrizione                                                                                                 |
| ------------- | ---------- | ----------------------------------------------------------------------------------------------------------- |
| `uid`         | `string`   | Obbligatorio. Identificatore univoco per i dati utente di origine, utilizzato per associare i dati di origine all'utente del sistema. Immutabile per un utente. |
| `nickname`    | `string`   | Opzionale. Nickname dell'utente.                                                                            |
| `username`    | `string`   | Opzionale. Nome utente.                                                                                     |
| `email`       | `string`   | Opzionale. Indirizzo email dell'utente.                                                                     |
| `phone`       | `string`   | Opzionale. Numero di telefono dell'utente.                                                                  |
| `departments` | `string[]` | Opzionale. Array di UID dei dipartimenti a cui appartiene l'utente.                                         |
| `isDeleted`   | `boolean`  | Opzionale. Indica se il record è stato eliminato.                                                           |
| `<field>`     | `any`      | Opzionale. Campi personalizzati nella tabella utente.                                                       |

### Formato dei Dati del Dipartimento

:::info
L'invio di dati sui dipartimenti richiede che il plugin [Dipartimenti](../../departments) sia installato e abilitato.
:::

#### DepartmentData

| Parametro  | Tipo                     | Descrizione                                                                |
| ---------- | ------------------------ | -------------------------------------------------------------------------- |
| `dataType` | `'user' \| 'department'` | Obbligatorio. Tipo di dati da inviare. Utilizzi `department` per i dati del dipartimento. |
| `records`  | `DepartmentRecord[]`     | Obbligatorio. Array di record di dati del dipartimento.                    |

#### DepartmentRecord

| Parametro   | Tipo      | Descrizione                                                                                                       |
| ----------- | --------- | ------------------------------------------------------------------------------------------------------------------- |
| `uid`       | `string`  | Obbligatorio. Identificatore univoco per i dati del dipartimento di origine, utilizzato per associare i dati di origine al dipartimento del sistema. Immutabile. |
| `title`     | `string`  | Obbligatorio. Titolo del dipartimento.                                                                              |
| `parentUid` | `string`  | Opzionale. UID del dipartimento padre.                                                                              |
| `isDeleted` | `boolean` | Opzionale. Indica se il record è stato eliminato.                                                                   |
| `<field>`   | `any`     | Opzionale. Campi personalizzati nella tabella del dipartimento.                                                     |

:::info

1.  L'invio ripetuto dei dati è un'operazione idempotente.
2.  Se un dipartimento padre non esiste al momento dell'invio dei dati del dipartimento, l'associazione non può essere stabilita. Può inviare nuovamente i dati dopo che il dipartimento padre è stato creato.
3.  Se il dipartimento di un utente non esiste al momento dell'invio dei dati utente, l'utente non può essere associato a quel dipartimento. Può inviare nuovamente i dati utente dopo aver inviato i dati del dipartimento.

:::