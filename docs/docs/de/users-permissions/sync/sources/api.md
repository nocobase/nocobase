:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Benutzerdaten über die HTTP API synchronisieren

## API-Schlüssel erhalten

Lesen Sie dazu [API-Schlüssel](/auth-verification/api-keys). Stellen Sie sicher, dass die Rolle, die Ihrem API-Schlüssel zugewiesen ist, die erforderlichen Berechtigungen zur Synchronisierung von Benutzerdaten besitzt.

## API-Übersicht

### Beispiel

```bash
curl 'https://localhost:13000/api/userData:push' \
  -H 'Authorization: Bearer <token>' \
  --data-raw '{"dataType":"user","records":[]}' # Den Anfragekörper finden Sie unten ausführlich beschrieben
```

### Endpunkt

```bash
POST /api/userData:push
```

### Format der Benutzerdaten

#### UserData

| Parameter  | Typ                               | Beschreibung                                                                 |
| ---------- | ---------------------------------- | ---------------------------------------------------------------------------- |
| `dataType` | `'user' \| 'department'`           | Erforderlich. Der Typ der zu übertragenden Daten. Verwenden Sie `user` für die Übertragung von Benutzerdaten. |
| `matchKey` | `'username' \| 'email' \| 'phone'` | Optional. Wird verwendet, um vorhandene Systembenutzer anhand des angegebenen Feldes abzugleichen. |
| `records`  | `UserRecord[]`                     | Erforderlich. Ein Array von Benutzerdatensätzen.                             |

#### UserRecord

| Parameter     | Typ        | Beschreibung                                                                                                 |
| ------------- | ---------- | ------------------------------------------------------------------------------------------------------------ |
| `uid`         | `string`   | Erforderlich. Eindeutiger Bezeichner für die Benutzerdatenquelle, der zur Verknüpfung der Quelldaten mit dem Systembenutzer dient. Für einen Benutzer unveränderlich. |
| `nickname`    | `string`   | Optional. Spitzname des Benutzers.                                                                           |
| `username`    | `string`   | Optional. Benutzername.                                                                                      |
| `email`       | `string`   | Optional. E-Mail-Adresse des Benutzers.                                                                      |
| `phone`       | `string`   | Optional. Telefonnummer des Benutzers.                                                                       |
| `departments` | `string[]` | Optional. Array der UIDs der Abteilungen, zu denen der Benutzer gehört.                                      |
| `isDeleted`   | `boolean`  | Optional. Zeigt an, ob der Datensatz gelöscht wurde.                                                         |
| `<field>`     | `any`      | Optional. Benutzerdefinierte Felder in der Benutzertabelle.                                                  |

### Format der Abteilungsdaten

:::info
Um Abteilungsdaten zu übertragen, muss das [Abteilungen](../../departments) Plugin installiert und aktiviert sein.
:::

#### DepartmentData

| Parameter  | Typ                      | Beschreibung                                                                 |
| ---------- | ------------------------ | ---------------------------------------------------------------------------- |
| `dataType` | `'user' \| 'department'` | Erforderlich. Der Typ der zu übertragenden Daten. Verwenden Sie `department` für Abteilungsdaten. |
| `records`  | `DepartmentRecord[]`     | Erforderlich. Ein Array von Abteilungsdatensätzen.                           |

#### DepartmentRecord

| Parameter   | Typ       | Beschreibung                                                                                                       |
| ----------- | --------- | ------------------------------------------------------------------------------------------------------------------ |
| `uid`       | `string`  | Erforderlich. Eindeutiger Bezeichner für die Abteilungsdatenquelle, der zur Verknüpfung der Quelldaten mit der Systemabteilung dient. Unveränderlich. |
| `title`     | `string`  | Erforderlich. Titel der Abteilung.                                                                                 |
| `parentUid` | `string`  | Optional. UID der übergeordneten Abteilung.                                                                        |
| `isDeleted` | `boolean` | Optional. Zeigt an, ob der Datensatz gelöscht wurde.                                                               |
| `<field>`   | `any`     | Optional. Benutzerdefinierte Felder in der Abteilungstabelle.                                                      |

:::info

1. Das mehrfache Übertragen von Daten ist idempotent.
2. Wenn eine übergeordnete Abteilung beim Übertragen von Abteilungsdaten noch nicht existiert, kann keine Verknüpfung hergestellt werden. Sie können die Daten erneut übertragen, nachdem die übergeordnete Abteilung erstellt wurde.
3. Wenn die Abteilung eines Benutzers beim Übertragen von Benutzerdaten noch nicht existiert, kann der Benutzer dieser Abteilung nicht zugeordnet werden. Sie können die Benutzerdaten erneut übertragen, nachdem die Abteilungsdaten übertragen wurden.
:::