:::tip{title="AI-översättningsmeddelande"}
Detta dokument har översatts av AI. För korrekt information, se [den engelska versionen](/system-management/localization/index).
:::

# Lokaliseringshantering

## Introduktion

Pluginet för lokaliseringshantering används för att hantera och implementera NocoBase lokaliseringsresurser. Det kan översätta systemets menyer, samlingar, fält och alla plugin för att anpassa dem till specifika regioners språk och kultur.

## Installation

Detta plugin är inbyggt och kräver ingen extra installation.

## Användningsinstruktioner

### Aktivera plugin

![](https://static-docs.nocobase.com/d16f6ecd6bfb8d1e8acff38f23ad37f8.png)

### Gå till sidan för lokaliseringshantering

<img src="https://static-docs.nocobase.com/202404202134187.png"/>

### Synkronisera översättningsposter

<img src="https://static-docs.nocobase.com/202404202134850.png"/>

För närvarande stöds synkronisering av följande innehåll:

- Systemets och pluginens lokala språkpaket
- Samlingstitlar, fälttitlar och etiketter för fältalternativ
- Menytitlar

Efter att synkroniseringen är klar kommer systemet att lista alla översättningsbara poster för det aktuella språket.

<img src="https://static-docs.nocobase.com/202404202136567.png"/>

:::info{title=Tips}
Olika moduler kan ha samma originalposter, vilka behöver översättas separat.
:::

### Skapa poster automatiskt

Vid sidredigering kommer anpassad text i varje block automatiskt att skapa motsvarande poster och samtidigt generera översättningsinnehåll för det aktuella språket.

![](https://static-docs.nocobase.com/Localization-02-12-2026_08_39_AM.png)

![](https://static-docs.nocobase.com/Localization-NocoBase-02-12-2026_08_39_AM.png)

:::info{title=Tips}
När ni definierar text i kod måste ni manuellt ange ns (namespace), till exempel: `${ctx.i18n.t('My custom js block', { ns: 'lm-flow-engine' })}`
:::


### Redigera översättningsinnehåll

<img src="https://static-docs.nocobase.com/202404202142836.png"/>

### Publicera översättning

När översättningen är klar måste ni klicka på knappen "Publicera" för att ändringarna ska träda i kraft.

<img src="https://static-docs.nocobase.com/202404202143135.png"/>

### Översätta andra språk

I "Systeminställningar", aktivera andra språk, till exempel förenklad kinesiska.

![](https://static-docs.nocobase.com/618830967aaeb643c892fce355d59a73.png)

Växla till den språkmiljön.

<img src="https://static-docs.nocobase.com/202404202144789.png"/>

Synkronisera poster.

<img src="https://static-docs.nocobase.com/202404202145877.png"/>

Översätt och publicera.

<img src="https://static-docs.nocobase.com/202404202143135.png"/>