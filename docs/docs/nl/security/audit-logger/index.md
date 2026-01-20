---
pkg: '@nocobase/plugin-audit-logger'
---
:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::



# Auditlogboek

## Introductie

Het auditlogboek wordt gebruikt om gebruikersactiviteiten en de geschiedenis van resource-operaties binnen het systeem vast te leggen en te volgen.

![](https://static-docs.nocobase.com/202501031627719.png)

![](https://static-docs.nocobase.com/202501031627922.png)

## Parameterbeschrijving

| Parameter             | Beschrijving                                                                                                                               |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **Resource**          | Het doelresourcetype van de operatie                                                                                                      |
| **Action**            | Het type uitgevoerde operatie                                                                                                             |
| **User**              | De gebruiker die de operatie uitvoert                                                                                                     |
| **Role**              | De rol van de gebruiker tijdens de operatie                                                                                               |
| **Data source**       | De **gegevensbron**                                                                                                                       |
| **Target collection** | De doel-**collectie**                                                                                                                     |
| **Target record UK**  | De unieke identificatie van de doel-collectie                                                                                             |
| **Source collection** | De bron-**collectie** van het associatieveld                                                                                              |
| **Source record UK**  | De unieke identificatie van de bron-collectie                                                                                             |
| **Status**            | De HTTP-statuscode van de respons op de operatieaanvraag                                                                                  |
| **Created at**        | Het tijdstip van de operatie                                                                                                              |
| **UUID**              | De unieke identificatie van de operatie, consistent met de Request ID van de operatieaanvraag, kan worden gebruikt om applicatielogboeken op te halen |
| **IP**                | Het IP-adres van de gebruiker                                                                                                             |
| **UA**                | De UA-informatie van de gebruiker                                                                                                         |
| **Metadata**          | Metadata zoals parameters, de request body en de responsinhoud van de operatieaanvraag                                                   |

## Beschrijving van Auditresources

Momenteel worden de volgende resource-operaties vastgelegd in het auditlogboek:

### Hoofdtoepassing

| Operatie         | Beschrijving             |
| ---------------- | ----------------------- |
| `app:resart`     | Applicatie opnieuw opstarten     |
| `app:clearCache` | Applicatiecache wissen |

### Pluginbeheerder

| Operatie     | Beschrijving    |
| ------------ | -------------- |
| `pm:add`     | **Plugin** toevoegen     |
| `pm:update`  | **Plugin** bijwerken  |
| `pm:enable`  | **Plugin** inschakelen  |
| `pm:disable` | **Plugin** uitschakelen |
| `pm:remove`  | **Plugin** verwijderen |

### Gebruikersauthenticatie

| Operatie              | Beschrijving     |
| --------------------- | --------------- |
| `auth:signIn`         | Inloggen         |
| `auth:signUp`         | Registreren     |
| `auth:signOut`        | Uitloggen        |
| `auth:changePassword` | Wachtwoord wijzigen |

### Gebruiker

| Operatie              | Beschrijving    |
| --------------------- | -------------- |
| `users:updateProfile` | Profiel bijwerken |

### UI-configuratie

| Operatie                   | Beschrijving      |
| -------------------------- | ---------------- |
| `uiSchemas:insertAdjacent` | UI Schema invoegen |
| `uiSchemas:patch`          | UI Schema wijzigen |
| `uiSchemas:remove`         | UI Schema verwijderen |

### Collectie-operaties

| Operatie         | Beschrijving                       |
| ---------------- | --------------------------------- |
| `create`         | Record aanmaken                     |
| `update`         | Record bijwerken                     |
| `destroy`        | Record verwijderen                     |
| `updateOrCreate` | Record bijwerken of aanmaken           |
| `firstOrCreate`  | Record opvragen of aanmaken            |
| `move`           | Record verplaatsen                       |
| `set`            | Associatieveldrecord instellen      |
| `add`            | Associatieveldrecord toevoegen      |
| `remove`         | Associatieveldrecord verwijderen   |
| `export`         | Record exporteren                     |
| `import`         | Record importeren                     |

## Andere Auditresources toevoegen

Als u andere resource-operaties hebt uitgebreid via **plugins** en u wilt dat deze operaties worden vastgelegd in het auditlogboek, raadpleeg dan de [API](/api/server/audit-manager.md).