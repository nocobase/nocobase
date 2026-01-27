---
pkg: "@nocobase/plugin-field-encryption"
---
:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::


# Kryptering

## Introduktion

Vissa känsliga affärsdata, som kunders mobilnummer, e-postadresser och kortnummer, kan krypteras. Efter kryptering lagras de som chiffertext i databasen.

![20251104192513](https://static-docs.nocobase.com/20251104192513.png)

## Krypteringsmetoder

:::warning
Pluginet genererar automatiskt en `applikationsnyckel` som lagras i katalogen `/storage/apps/main/encryption-field-keys`.

`Applikationsnyckelfilen` namnges med nyckel-ID och har filändelsen `.key`. Ändra inte filnamnet godtyckligt.

Förvara `applikationsnyckelfilen` säkert. Om ni förlorar den kommer krypterad data inte att kunna dekrypteras.

Om pluginet aktiveras av en underapplikation sparas nyckeln som standard i katalogen `/storage/apps/${underapplikationens namn}/encryption-field-keys`.
:::

### Så fungerar det

Vi använder kuvertkryptering.

![20251118151339](https://static-docs.nocobase.com/20251118151339.png)

### Process för nyckelskapande
1. Första gången ett krypterat fält skapas genererar systemet automatiskt en 32-bitars `applikationsnyckel` som sparas i standardlagringskatalogen, Base64-kodad.
2. Varje gång ett nytt krypterat fält skapas genereras en slumpmässig 32-bitars `fältnyckel` för fältet. Den krypteras sedan med `applikationsnyckeln` och en slumpmässigt genererad 16-bitars `fältkrypteringsvektor` (`AES`-krypteringsalgoritmen) och sparas i fältet `options` i tabellen `fields`.

### Process för fältkryptering
1. Varje gång ni skriver data till ett krypterat fält hämtas först den krypterade `fältnyckeln` och `fältkrypteringsvektorn` från fältet `options` i tabellen `fields`.
2. Den krypterade `fältnyckeln` dekrypteras med hjälp av `applikationsnyckeln` och `fältkrypteringsvektorn`. Därefter krypteras datan med `fältnyckeln` och en slumpmässigt genererad 16-bitars `datakrypteringsvektor` (`AES`-krypteringsalgoritmen).
3. Datan signeras med den dekrypterade `fältnyckeln` (`HMAC-SHA256`-hashalgoritmen) och konverteras till en Base64-kodad sträng (den resulterande `datasignaturen` används sedan för datahämtning).
4. Den 16-bitars `datakrypteringsvektorn` och den krypterade `chiffertexten` sammanfogas binärt och omvandlas till en Base64-kodad sträng.
5. Den Base64-kodade `datasignaturen` och den Base64-kodade `chiffertexten` sammanfogas med en `.` som avgränsare.
6. Den slutliga sammanfogade strängen sparas i databasen.

## Miljövariabler

Om ni vill ange en anpassad `applikationsnyckel` kan ni använda miljövariabeln `ENCRYPTION_FIELD_KEY_PATH`. Pluginet kommer då att ladda filen från den angivna sökvägen som `applikationsnyckel`.

**Krav för applikationsnyckelfilen:**
1. Filändelsen måste vara `.key`.
2. Filnamnet kommer att användas som nyckel-ID; vi rekommenderar att ni använder ett UUID för att säkerställa unikhet.
3. Filinnehållet måste vara 32 byte Base64-kodad binär data.

```bash
ENCRYPTION_FIELD_KEY_PATH=/path/to/my/app-keys/270263524860909922913.key
```

## Fältkonfiguration

![20240802173721](https://static-docs.nocobase.com/20240802173721.png)

## Påverkan på filtrering efter kryptering

Krypterade fält stöder endast följande filter: lika med, inte lika med, existerar, existerar inte.

![20240802174042](https://static-docs.nocobase.com/20240802174042.png)

**Filtreringsprocess:**
1. Hämta det krypterade fältets `fältnyckel` och dekryptera den med `applikationsnyckeln`.
2. Använd `fältnyckeln` för att signera användarens inmatning (`HMAC-SHA256`).
3. Sammanfoga signaturen med en `.` som avgränsare och utför en prefixmatchningsfråga i databasen.

## Nyckelrotation

:::warning
Innan ni använder kommandot `nocobase key-rotation`, se till att pluginet är laddat i applikationen.
:::

När en applikation migreras till en ny miljö och ni inte längre vill använda samma nyckel som i den gamla miljön, kan ni använda kommandot `nocobase key-rotation` för att ersätta `applikationsnyckeln`.

För att köra kommandot för nyckelrotation måste ni ange den gamla applikationens `applikationsnyckel`. Efter körning kommer en ny `applikationsnyckel` att genereras och sparas (Base64-kodad) i standardkatalogen.

```bash
# --key-path anger den gamla miljöns applikationsnyckel
 yarn nocobase key-rotation --key-path /path/to/old-app-keys/270263524860909922913.key
```

För att rotera `applikationsnyckeln` för en underapplikation, lägg till parametern `--app-name` och ange underapplikationens `name`.

```bash
 yarn nocobase key-rotation --app-name a_w0r211vv0az --key-path /path/to/old-app-keys/270263524860909922913.key
```