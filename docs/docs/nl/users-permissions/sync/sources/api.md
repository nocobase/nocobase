:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Gebruikersgegevens synchroniseren via HTTP API

## API-sleutel verkrijgen

Raadpleeg [API-sleutels](/auth-verification/api-keys). Zorg ervoor dat de rol die aan de API-sleutel is gekoppeld, de benodigde rechten heeft om gebruikersgegevens te synchroniseren.

## API-overzicht

### Voorbeeld

```bash
curl 'https://localhost:13000/api/userData:push' \
  -H 'Authorization: Bearer <token>' \
  --data-raw '{"dataType":"user","records":[]}' # Zie hieronder voor details over de request body
```

### Endpoint

```bash
POST /api/userData:push
```

### Formaat gebruikersgegevens

#### UserData

| Parameter  | Type                               | Beschrijving                                                                 |
| ---------- | ---------------------------------- | ---------------------------------------------------------------------------- |
| `dataType` | `'user' \| 'department'`           | Verplicht. Het type gegevens dat wordt gepusht. Gebruik `user` voor het pushen van gebruikersgegevens. |
| `matchKey` | `'username' \| 'email' \| 'phone'` | Optioneel. Wordt gebruikt om bestaande systeemgebruikers te matchen op basis van het opgegeven veld. |
| `records`  | `UserRecord[]`                     | Verplicht. Array van gebruikersgegevensrecords.                              |

#### UserRecord

| Parameter     | Type       | Beschrijving                                                                                                 |
| ------------- | ---------- | ------------------------------------------------------------------------------------------------------------ |
| `uid`         | `string`   | Verplicht. Unieke identificatie voor de brongebruikersgegevens, gebruikt om de brondata te koppelen aan de systeemgebruiker. Onveranderlijk voor een gebruiker. |
| `nickname`    | `string`   | Optioneel. Bijnaam van de gebruiker.                                                                         |
| `username`    | `string`   | Optioneel. Gebruikersnaam.                                                                                   |
| `email`       | `string`   | Optioneel. E-mailadres van de gebruiker.                                                                     |
| `phone`       | `string`   | Optioneel. Telefoonnummer van de gebruiker.                                                                  |
| `departments` | `string[]` | Optioneel. Array van afdelings-UID's waartoe de gebruiker behoort.                                           |
| `isDeleted`   | `boolean`  | Optioneel. Geeft aan of het record is verwijderd.                                                            |
| `<field>`     | `any`      | Optioneel. Aangepaste velden in de gebruikerstabel.                                                          |

### Formaat afdelingsgegevens

:::info
Voor het pushen van afdelingsgegevens is het vereist dat de [Afdelingen](../../departments) plugin is geïnstalleerd en geactiveerd.
:::

#### DepartmentData

| Parameter  | Type                     | Beschrijving                                                                |
| ---------- | ------------------------ | --------------------------------------------------------------------------- |
| `dataType` | `'user' \| 'department'` | Verplicht. Het type gegevens dat wordt gepusht. Gebruik `department` voor afdelingsgegevens. |
| `records`  | `DepartmentRecord[]`     | Verplicht. Array van afdelingsgegevensrecords.                              |

#### DepartmentRecord

| Parameter   | Type      | Beschrijving                                                                                                       |
| ----------- | --------- | ------------------------------------------------------------------------------------------------------------------ |
| `uid`       | `string`  | Verplicht. Unieke identificatie voor de bronafdelingsgegevens, gebruikt om de brondata te koppelen aan de systeemafdeling. Onveranderlijk. |
| `title`     | `string`  | Verplicht. Titel van de afdeling.                                                                                  |
| `parentUid` | `string`  | Optioneel. UID van de bovenliggende afdeling.                                                                      |
| `isDeleted` | `boolean` | Optioneel. Geeft aan of het record is verwijderd.                                                                  |
| `<field>`   | `any`     | Optioneel. Aangepaste velden in de afdelingstabel.                                                                 |

:::info

1. Het pushen van gegevens is een idempotente bewerking.
2. Als een bovenliggende afdeling nog niet bestaat bij het pushen van afdelingsgegevens, kan de koppeling niet worden gemaakt. U kunt de gegevens opnieuw pushen nadat de bovenliggende afdeling is aangemaakt.
3. Als de afdeling van een gebruiker nog niet bestaat bij het pushen van gebruikersgegevens, kan de gebruiker niet aan die afdeling worden gekoppeld. U kunt de gebruikersgegevens opnieuw pushen nadat de afdelingsgegevens zijn gepusht.

:::