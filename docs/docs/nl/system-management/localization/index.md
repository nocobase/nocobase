:::tip{title="AI-vertaalmelding"}
Dit document is vertaald door AI. Raadpleeg de [Engelse versie](/system-management/localization/index) voor nauwkeurige informatie.
:::

# Lokalisatiebeheer

## Introductie

De Lokalisatiebeheer-plugin wordt gebruikt voor het beheren en implementeren van de lokalisatiebronnen van NocoBase. U kunt hiermee de menu's, collecties, velden en alle plugins van het systeem vertalen om deze aan te passen aan de taal en cultuur van specifieke regio's.

## Installatie

Deze plugin is ingebouwd en vereist geen extra installatie.

## Gebruiksaanwijzing

### Plugin activeren

![](https://static-docs.nocobase.com/d16f6ecd6bfb8d1e8acff38f23ad37f8.png)

### De pagina Lokalisatiebeheer openen

<img src="https://static-docs.nocobase.com/202404202134187.png"/>

### Vertaalitems synchroniseren

<img src="https://static-docs.nocobase.com/202404202134850.png"/>

Momenteel wordt de synchronisatie van de volgende inhoud ondersteund:

- Lokale taalpakketten voor het systeem en plugins
- Titels van collecties, veldtitels en labels van veldopties
- Menutitels

Na de synchronisatie toont het systeem alle vertaalbare items voor de huidige taal.

<img src="https://static-docs.nocobase.com/202404202136567.png"/>

:::info{title=Tip}
Verschillende modules kunnen dezelfde originele tekstitems bevatten, die afzonderlijk vertaald moeten worden.
:::

### Automatisch items maken

Bij het bewerken van een pagina zal de aangepaste tekst in elk blok automatisch een overeenkomstig item aanmaken en tegelijkertijd de vertaling voor de huidige taal genereren.

![](https://static-docs.nocobase.com/Localization-02-12-2026_08_39_AM.png)

![](https://static-docs.nocobase.com/Localization-NocoBase-02-12-2026_08_39_AM.png)

:::info{title=Tip}
Wanneer u tekst in code definieert, moet u handmatig de ns (namespace) opgeven, bijvoorbeeld: `${ctx.i18n.t('My custom js block', { ns: 'lm-flow-engine' })}`
:::


### Vertaalinhoud bewerken

<img src="https://static-docs.nocobase.com/202404202142836.png"/>

### Vertalingen publiceren

Nadat de vertaling is voltooid, moet u op de knop "Publiceren" klikken om de wijzigingen van kracht te laten worden.

<img src="https://static-docs.nocobase.com/202404202143135.png"/>

### Andere talen vertalen

Schakel andere talen in via "Systeeminstellingen", bijvoorbeeld Vereenvoudigd Chinees.

![](https://static-docs.nocobase.com/618830967aaeb643c892fce355d59a73.png)

Schakel over naar die taalomgeving.

<img src="https://static-docs.nocobase.com/202404202144789.png"/>

Synchroniseer de items.

<img src="https://static-docs.nocobase.com/202404202145877.png"/>

Vertaal en publiceer.

<img src="https://static-docs.nocobase.com/202404202143135.png"/>