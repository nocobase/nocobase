---
pkg: "@nocobase/plugin-file-manager"
---
:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::



# Filhanterare

## Introduktion

Filhanterar-pluginet tillhandahåller en filsamling, bilagefält och fillagringsmotorer för effektiv filhantering. Filer är poster i en särskild typ av samling, känd som en filsamling, som lagrar filmetadata och kan hanteras via Filhanteraren. Bilagefält är specifika associeringsfält som är kopplade till filsamlingen. Pluginet stöder flera lagringsmetoder, inklusive lokal lagring, Alibaba Cloud OSS, Amazon S3 och Tencent Cloud COS.

## Användarmanual

### Filsamling

En inbyggd 'attachments'-samling finns för att lagra alla filer som är kopplade till bilagefält. Dessutom kan ni skapa nya filsamlingar för att lagra specifika filer.

[Läs mer i dokumentationen om Filsamlingar](/data-sources/file-manager/file-collection)

### Bilagefält

Bilagefält är specifika associeringsfält som är kopplade till filsamlingen. De kan skapas via fälttypen "Bifogad fil" eller konfigureras via ett "Associeringsfält".

[Läs mer i dokumentationen om Bilagefält](/data-sources/file-manager/field-attachment)

### Fillagringsmotor

Fillagringsmotorn används för att spara filer till specifika tjänster, inklusive lokal lagring (spara till serverns hårddisk), molnlagring med mera.

[Läs mer i dokumentationen om Fillagringsmotorn](./storage/index.md)

### HTTP API

Filuppladdningar kan hanteras via HTTP API:et, se [HTTP API](./http-api.md).

## Utveckling

*