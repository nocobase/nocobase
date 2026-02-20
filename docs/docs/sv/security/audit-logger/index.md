---
pkg: '@nocobase/plugin-audit-logger'
---
:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::


# Granskningslogg

## Introduktion

Granskningsloggen används för att registrera och spåra användaraktiviteter samt historik över resursoperationer i systemet.

![](https://static-docs.nocobase.com/202501031627719.png)

![](https://static-docs.nocobase.com/202501031627922.png)

## Parameterbeskrivning

| Parameter                 | Beskrivning                                                                                                                               |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **Resurs**                | Målresurstypen för operationen                                                                                                            |
| **Åtgärd**                | Typen av utförd operation                                                                                                                 |
| **Användare**             | Användaren som utförde operationen                                                                                                        |
| **Roll**                  | Användarens roll under operationen                                                                                                         |
| **Datakälla**             | Datakällan                                                                                                                                |
| **Målsamling**            | Målsamlingen                                                                                                                              |
| **Målpostens unika ID**   | Målpostens unika identifierare                                                                                                            |
| **Källsamling**           | Källsamlingen för relationsfältet                                                                                                         |
| **Källpostens unika ID**  | Källpostens unika identifierare                                                                                                           |
| **Status**                | HTTP-statuskoden för operationsbegärans svar                                                                                              |
| **Skapad vid**            | Tidpunkten för operationen                                                                                                                |
| **UUID**                  | Operationens unika identifierare, överensstämmer med begärans ID för operationen, och kan användas för att hämta applikationsloggar.     |
| **IP**                    | Användarens IP-adress                                                                                                                     |
| **UA**                    | Användarens UA-information                                                                                                                |
| **Metadata**              | Metadata som parametrar, begärans kropp och svarsinnehåll för operationen.                                                                |

## Granskningsbara resurser

För närvarande kommer följande resursoperationer att registreras i granskningsloggen:

### Huvudapplikation

| Åtgärd             | Beskrivning          |
| ------------------ | -------------------- |
| `app:resart`       | Applikationsomstart  |
| `app:clearCache`   | Rensa applikationscache |

### Pluginhanterare

| Åtgärd         | Beskrivning    |
| -------------- | -------------- |
| `pm:add`       | Lägg till plugin |
| `pm:update`    | Uppdatera plugin |
| `pm:enable`    | Aktivera plugin |
| `pm:disable`   | Inaktivera plugin |
| `pm:remove`    | Ta bort plugin |

### Användarautentisering

| Åtgärd                  | Beskrivning     |
| ----------------------- | --------------- |
| `auth:signIn`           | Logga in        |
| `auth:signUp`           | Registrera dig  |
| `auth:signOut`          | Logga ut        |
| `auth:changePassword`   | Ändra lösenord  |

### Användare

| Åtgärd                  | Beskrivning    |
| ----------------------- | -------------- |
| `users:updateProfile`   | Uppdatera profil |

### UI-konfiguration

| Åtgärd                       | Beskrivning      |
| ---------------------------- | ---------------- |
| `uiSchemas:insertAdjacent`   | Infoga UI Schema |
| `uiSchemas:patch`            | Ändra UI Schema  |
| `uiSchemas:remove`           | Ta bort UI Schema |

### Samlingsoperationer

| Åtgärd             | Beskrivning                       |
| ------------------ | --------------------------------- |
| `create`           | Skapa post                        |
| `update`           | Uppdatera post                    |
| `destroy`          | Ta bort post                      |
| `updateOrCreate`   | Uppdatera eller skapa post        |
| `firstOrCreate`    | Fråga efter eller skapa post      |
| `move`             | Flytta post                       |
| `set`              | Ställ in relationsfältspost       |
| `add`              | Lägg till relationsfältspost      |
| `remove`           | Ta bort relationsfältspost        |
| `export`           | Exportera post                    |
| `import`           | Importera post                    |

## Lägga till andra granskningsbara resurser

Om ni har utökat andra resursoperationer via **plugin**s och önskar att dessa resursoperationer registreras i granskningsloggen, vänligen se [API](/api/server/audit-manager.md).