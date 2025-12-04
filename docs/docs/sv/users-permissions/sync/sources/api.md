:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Synkronisera användardata via HTTP API

## Skaffa en API-nyckel

Se [API-nycklar](/auth-verification/api-keys). Se till att rollen som är kopplad till API-nyckeln har de nödvändiga behörigheterna för att synkronisera användardata.

## API-översikt

### Exempel

```bash
curl 'https://localhost:13000/api/userData:push' \
  -H 'Authorization: Bearer <token>' \
  --data-raw '{"dataType":"user","records":[]}' # Se detaljer om förfrågningskroppen nedan
```

### Slutpunkt

```bash
POST /api/userData:push
```

### Användardataformat

#### UserData

| Parameter  | Typ                               | Beskrivning                                                                 |
| ---------- | ---------------------------------- | --------------------------------------------------------------------------- |
| `dataType` | `'user' \| 'department'`           | Obligatorisk. Typ av data som skickas. Använd `user` för att skicka användardata. |
| `matchKey` | `'username' \| 'email' \| 'phone'` | Valfri. Används för att matcha befintliga systemanvändare baserat på det angivna fältet. |
| `records`  | `UserRecord[]`                     | Obligatorisk. Array med användardataposter.                                 |

#### UserRecord

| Parameter     | Typ        | Beskrivning                                                                                                 |
| ------------- | ---------- | ----------------------------------------------------------------------------------------------------------- |
| `uid`         | `string`   | Obligatorisk. Unik identifierare för källanvändardata, används för att koppla källdata till systemanvändaren. Oföränderlig för en användare. |
| `nickname`    | `string`   | Valfri. Användarens smeknamn.                                                                               |
| `username`    | `string`   | Valfri. Användarnamn.                                                                                       |
| `email`       | `string`   | Valfri. Användarens e-postadress.                                                                           |
| `phone`       | `string`   | Valfri. Användarens telefonnummer.                                                                          |
| `departments` | `string[]` | Valfri. Array med UID:er för avdelningar som användaren tillhör.                                            |
| `isDeleted`   | `boolean`  | Valfri. Anger om posten är borttagen.                                                                       |
| `<field>`     | `any`      | Valfri. Anpassade fält i användartabellen.                                                                  |

### Avdelningsdataformat

:::info
För att skicka avdelningsdata krävs att [Avdelningar](../../departments) plugin är installerad och aktiverad.
:::

#### DepartmentData

| Parameter  | Typ                      | Beskrivning                                                                |
| ---------- | ------------------------ | -------------------------------------------------------------------------- |
| `dataType` | `'user' \| 'department'` | Obligatorisk. Typ av data som skickas. Använd `department` för avdelningsdata. |
| `records`  | `DepartmentRecord[]`     | Obligatorisk. Array med avdelningsdataposter.                              |

#### DepartmentRecord

| Parameter   | Typ       | Beskrivning                                                                                                       |
| ----------- | --------- | ------------------------------------------------------------------------------------------------------------------- |
| `uid`       | `string`  | Obligatorisk. Unik identifierare för källavdelningsdata, används för att koppla källdata till systemavdelningen. Oföränderlig. |
| `title`     | `string`  | Obligatorisk. Avdelningens titel.                                                                                   |
| `parentUid` | `string`  | Valfri. UID för överordnad avdelning.                                                                               |
| `isDeleted` | `boolean` | Valfri. Anger om posten är borttagen.                                                                               |
| `<field>`   | `any`     | Valfri. Anpassade fält i avdelningstabellen.                                                                        |

:::info

1. Att skicka data flera gånger är en idempotent operation.
2. Om en överordnad avdelning inte finns när avdelningsdata skickas, kan kopplingen inte göras. Du kan skicka data igen efter att den överordnade avdelningen har skapats.
3. Om en användares avdelning inte finns när användardata skickas, kan användaren inte kopplas till den avdelningen. Du kan skicka användardata igen efter att avdelningsdata har skickats.

:::