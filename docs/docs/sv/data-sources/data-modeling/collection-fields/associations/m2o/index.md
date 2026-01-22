:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Många-till-en

I en biblioteksdatabas finns det två entiteter: böcker och författare. En författare kan skriva flera böcker, men varje bok har oftast bara en författare. I det här fallet är relationen mellan författare och böcker många-till-en. Flera böcker kan kopplas till samma författare, men varje bok kan bara ha en författare.

ER-diagram:

![alt text](https://static-docs.nocobase.com/eaeeac974844db05c75cf0deeedf3652.png)

Fältkonfiguration:

![alt text](https://static-docs.nocobase.com/3b4484ebb82f3dbf752bd84c9.png)

## Parameterbeskrivning

### Källsamling

Källsamlingen, det vill säga den samling där det aktuella fältet finns.

### Målsamling

Målsamlingen, det vill säga den samling som ska kopplas till.

### Främmande nyckel

Fältet i källsamlingen som används för att upprätta kopplingen mellan de två samlingarna.

### Målnyckel

Fältet i målsamlingen som den främmande nyckeln refererar till. Det måste vara unikt.

### ON DELETE

ON DELETE avser de regler som tillämpas på främmande nyckelreferenser i relaterade underordnade samlingar när poster i den överordnade samlingen tas bort. Det är ett alternativ som används när man definierar ett främmande nyckelvillkor. Vanliga ON DELETE-alternativ inkluderar:

- **CASCADE**: När en post i den överordnade samlingen tas bort, raderas automatiskt alla relaterade poster i den underordnade samlingen.
- **SET NULL**: När en post i den överordnade samlingen tas bort, sätts de främmande nyckelvärdena i de relaterade posterna i den underordnade samlingen till NULL.
- **RESTRICT**: Standardalternativet, det förhindrar att en post i den överordnade samlingen tas bort om det finns relaterade poster i den underordnade samlingen.
- **NO ACTION**: Liknar RESTRICT, det förhindrar att en post i den överordnade samlingen tas bort om det finns relaterade poster i den underordnade samlingen.