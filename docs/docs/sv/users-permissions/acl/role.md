---
pkg: '@nocobase/plugin-acl'
---
:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::


# Roller

## Administrationscenter

### Rollhantering

![](https://static-docs.nocobase.com/da7083c67d794e23dc6eb0f85b1de86c.png)

Vid installationen av applikationen ingår två fördefinierade roller: "Admin" och "Member". Dessa har olika standardinställningar för behörigheter.

### Lägga till, ta bort och ändra roller

Rollidentifieraren är en unik systemidentifierare. Ni kan anpassa standardroller, men systemets fördefinierade roller kan inte tas bort.

![](https://static-docs.nocobase.com/35f323b346db4f9f12f9bee4dea63302.png)

### Ange standardroll

Standardrollen är den roll som automatiskt tilldelas nya användare om ingen specifik roll anges vid deras skapande.

![](https://static-docs.nocobase.com/f41bba7ff55ca28715c486dc45bc1708.png)

## Personligt center

### Rollväxling

En användare kan tilldelas flera roller. När en användare har flera roller kan ni växla mellan dem i det personliga centret.

![](https://static-docs.nocobase.com/e331d11ec1ca3b8b7e0472105b167819.png)

Standardrollen vid inloggning bestäms av den senast växlade rollen (detta värde uppdateras vid varje rollväxling) eller, om det inte är tillämpligt, den första rollen (systemets standardroll).