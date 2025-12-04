---
pkg: '@nocobase/plugin-workflow-mailer'
---
:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::


# Skicka e-post

## Introduktion

Används för att skicka e-post. Stöder innehåll i både text- och HTML-format.

## Skapa nod

I arbetsflödeskonfigurationsgränssnittet klickar ni på plusknappen ("+") i flödet för att lägga till en "Skicka e-post"-nod:

![20251031130522](https://static-docs.nocobase.com/20251031130522.png)

## Nodkonfiguration

![20251031131125](https://static-docs.nocobase.com/20251031131125.png)

Varje alternativ kan använda variabler från arbetsflödets kontext. För känslig information kan ni även använda globala variabler och hemligheter.

## Vanliga frågor och svar

### Frekvensbegränsning för Gmail-utskick

När ni skickar vissa e-postmeddelanden kan ni stöta på följande fel:

```json
{
  "code": "ECONNECTION",
  "response": "421-4.7.0 Try again later, closing connection. (EHLO)\n421-4.7.0 For more information, go to\n421 4.7.0 About SMTP error messages - Google Workspace Admin Help 3f1490d57ef6-e7f7352f44csm831688276.30 - gsmtp",
  "responseCode": 421,
  "command": "EHLO"
}
```

Detta beror på att Gmail frekvensbegränsar utskicksförfrågningar från domäner som inte är specificerade. När ni driftsätter applikationen behöver ni konfigurera serverns värdnamn till den domän ni har konfigurerat i Gmail. Till exempel vid en Docker-driftsättning:

```yaml
services:
  app:
    image: nocobase/nocobase
    hostname: <your-custom-hostname> # Ange till er konfigurerade utskicksdomän
```

Referens: [Google SMTP Relay - Intermittent problems](https://forum.nocobase.com/t/google-smtp-relay-intermittent-problems/5483/6)