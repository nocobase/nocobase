:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Översikt

## Inbyggda motorer

NocoBase har för närvarande stöd för följande inbyggda motortyper:

- [Lokal lagring](./local.md)
- [Alibaba Cloud OSS](./aliyun-oss.md)
- [Amazon S3](./amazon-s3.md)
- [Tencent Cloud COS](./tencent-cos.md)

En lokal lagringsmotor läggs automatiskt till vid systeminstallationen och kan användas direkt. Ni kan också lägga till nya motorer eller redigera befintliga motorparametrar.

## Gemensamma motorparametrar

Utöver de specifika parametrarna för olika motortyper, är följande gemensamma parametrar (med lokal lagring som exempel):

![Exempel på konfiguration av fillagringsmotor](https://static-docs.nocobase.com/20240529115151.png)

### Titel

Namnet på lagringsmotorn, används för mänsklig identifiering.

### Systemnamn

Systemnamnet för lagringsmotorn, används för systemidentifiering. Det måste vara unikt i systemet. Om det lämnas tomt genereras det automatiskt av systemet.

### Bas-URL för åtkomst

Prefixet för URL-adressen för extern åtkomst till filen. Detta kan vara bas-URL:en för ett CDN, till exempel: "`https://cdn.nocobase.com/app`" (utan det avslutande "`/`").

### Sökväg

Den relativa sökvägen som används vid lagring av filer. Denna del kommer också automatiskt att läggas till den slutliga URL:en vid åtkomst. Till exempel: "`user/avatar`" (utan inledande eller avslutande "`/`").

### Filstorleksgräns

Storleksgränsen för filer som laddas upp till denna lagringsmotor. Filer som överskrider denna inställda storlek kan inte laddas upp. Systemets standardgräns är 20 MB, och den maximala justerbara gränsen är 1 GB.

### Filtyp

Ni kan begränsa vilka filtyper som kan laddas upp, med hjälp av [MIME](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types) syntaxbeskrivningsformat. Till exempel: `image/*` representerar bildfiler. Flera typer kan separeras med kommatecken, till exempel: `image/*, application/pdf` för att tillåta både bild- och PDF-filer.

### Standardlagringsmotor

När detta alternativ är markerat, ställs det in som systemets standardlagringsmotor. Om ett bilagefält eller en fil**samling** inte anger en lagringsmotor, sparas uppladdade filer i standardlagringsmotorn. Standardlagringsmotorn kan inte raderas.

### Behåll filer vid radering av poster

När detta alternativ är markerat, behålls uppladdade filer i lagringsmotorn även när dataposter i bilage- eller fil**samlingen** raderas. Som standard är detta alternativ avmarkerat, vilket innebär att filer i lagringsmotorn raderas samtidigt som posterna.

:::info{title=Tips}
Efter att en fil har laddats upp, konstrueras den slutliga åtkomstsökvägen genom att flera delar sammanfogas:

```
<Bas-URL för åtkomst>/<Sökväg>/<Filnamn><Filändelse>
```

Till exempel: `https://cdn.nocobase.com/app/user/avatar/20240529115151.png`.
:::