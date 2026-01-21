:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# En-till-många

Relationen mellan en klass och dess elever är ett exempel på en en-till-många-relation: en klass kan ha flera elever, men varje elev tillhör endast en klass.

ER-diagram:

![alt text](https://static-docs.nocobase.com/9475f044d123d28ac8e56a077411f8dc.png)

Fältkonfiguration:

![alt text](https://static-docs.nocobase.com/a608ce54821172dad7e8ab760107ff4e.png)

## Parameterbeskrivning

### Källsamling

Källsamlingen är den samling där det aktuella fältet finns.

### Målsamling

Målsamlingen är den samling som ska associeras med.

### Källnyckel

Fältet i källsamlingen som refereras av främmande nyckeln. Det måste vara unikt.

### Främmande nyckel

Fältet i målsamlingen som används för att upprätta kopplingen mellan de två samlingarna.

### Målnyckel

Fältet i målsamlingen som används för att visa varje radpost i relationsblocket, vanligtvis ett unikt fält.

### ON DELETE

ON DELETE avser de regler som tillämpas på referenser till främmande nycklar i relaterade underordnade samlingar när poster i den överordnade samlingen raderas. Det är ett alternativ som används när man definierar en främmande nyckelbegränsning. Vanliga ON DELETE-alternativ inkluderar:

- **CASCADE**: När en post i den överordnade samlingen raderas, raderas automatiskt alla relaterade poster i den underordnade samlingen.
- **SET NULL**: När en post i den överordnade samlingen raderas, sätts värdena för de främmande nycklarna i de relaterade underordnade samlingarnas poster till NULL.
- **RESTRICT**: Standardalternativet. Det förhindrar radering av en post i den överordnade samlingen om det finns relaterade poster i den underordnade samlingen.
- **NO ACTION**: Liknar RESTRICT. Det förhindrar radering av en post i den överordnade samlingen om det finns relaterade poster i den underordnade samlingen.