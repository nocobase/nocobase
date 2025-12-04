:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Översikt

## Introduktion

Lagringsmotorer används för att spara filer till specifika tjänster, inklusive lokal lagring (som sparar till serverns hårddisk), molnlagring med mera.

Innan ni laddar upp några filer behöver ni konfigurera en lagringsmotor. Systemet lägger automatiskt till en lokal lagringsmotor vid installationen, som ni kan använda direkt. Ni kan också lägga till nya motorer eller redigera parametrar för befintliga.

## Typer av lagringsmotorer

För närvarande har NocoBase inbyggt stöd för följande motortyper:

- [Lokal lagring](./local)
- [Amazon S3](./amazon-s3)
- [Aliyun OSS](./aliyun-oss)
- [Tencent COS](./tencent-cos)
- [S3 Pro](./s3-pro)

Systemet lägger automatiskt till en lokal lagringsmotor vid installationen, som ni kan använda direkt. Ni kan också lägga till nya motorer eller redigera parametrar för befintliga.

## Gemensamma parametrar

Utöver de specifika parametrarna för olika motortyper är följande gemensamma parametrar (med lokal lagring som exempel):

![Exempel på konfiguration av fillagringsmotor](https://static-docs.nocobase.com/20240529115151.png)

### Titel

Namnet på lagringsmotorn, för mänsklig identifiering.

### Systemnamn

Systemnamnet för lagringsmotorn, används för systemidentifiering. Det måste vara unikt inom systemet. Om det lämnas tomt genererar systemet automatiskt ett slumpmässigt namn.

### Offentlig URL-prefix

Prefixdelen av den offentligt tillgängliga URL:en för filen. Det kan vara bas-URL:en för ett CDN, till exempel: "`https://cdn.nocobase.com/app`" (utan avslutande "/").

### Sökväg

Den relativa sökvägen som används när filer lagras. Denna del läggs också automatiskt till den slutliga URL:en vid åtkomst. Till exempel: "`user/avatar`" (utan inledande eller avslutande "/").

### Filstorleksgräns

Storleksgränsen för filer som laddas upp till denna lagringsmotor. Filer som överskrider denna inställda storlek kan inte laddas upp. Systemets standardgräns är 20 MB, och den kan justeras upp till maximalt 1 GB.

### Filtyper

Ni kan begränsa vilka filtyper som kan laddas upp, genom att använda [MIME](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types)-syntaxen. Till exempel: `image/*` representerar bildfiler. Flera typer kan separeras med kommatecken, till exempel: `image/*, application/pdf` vilket tillåter bild- och PDF-filer.

### Standardlagringsmotor

När denna är markerad ställs den in som systemets standardlagringsmotor. När ett bilagefält eller en filsamling inte anger en lagringsmotor, sparas alla uppladdade filer i standardlagringsmotorn. Standardlagringsmotorn kan inte raderas.

### Behåll fil vid radering av post

När denna är markerad behålls den uppladdade filen i lagringsmotorn även när dataposten i bilagan eller filsamlingen raderas. Som standard är denna inte markerad, vilket innebär att filen i lagringsmotorn raderas samtidigt som posten.

:::info{title=Tips}
Efter att en fil har laddats upp byggs den slutliga åtkomstsökvägen upp genom att sammanfoga flera delar:

```
<Offentlig URL-prefix>/<Sökväg>/<Filnamn><Filändelse>
```

Till exempel: `https://cdn.nocobase.com/app/user/avatar/20240529115151.png`.
:::