---
pkg: "@nocobase/plugin-wecom"
---
:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::



# Gebruikersgegevens synchroniseren vanuit WeChat Work

## Introductie

De **WeChat Work** plugin ondersteunt het synchroniseren van gebruikers- en afdelingsgegevens vanuit WeChat Work.

## Een aangepaste WeChat Work-applicatie aanmaken en configureren

Eerst moet u een aangepaste applicatie aanmaken in de beheerconsole van WeChat Work en de **Corp ID**, **AgentId** en **Secret** verkrijgen.

Raadpleeg [Gebruikersauthenticatie - WeChat Work](/auth-verification/auth-wecom/).

## Een synchronisatiegegevensbron toevoegen in NocoBase

Ga naar Gebruikers & Rechten - Synchroniseren - Toevoegen, en vul de verkregen informatie in.

![](https://static-docs.nocobase.com/202412041251867.png)

## Contactpersonen synchronisatie configureren

Ga naar de beheerconsole van WeChat Work - Beveiliging en Beheer - Beheerhulpmiddelen, en klik op Contactpersonen synchronisatie.

![](https://static-docs.nocobase.com/202412041249958.png)

Configureer zoals afgebeeld en stel het vertrouwde IP-adres van de onderneming in.

![](https://static-docs.nocobase.com/202412041250776.png)

Nu kunt u verdergaan met de synchronisatie van gebruikersgegevens.

## De server voor het ontvangen van gebeurtenissen instellen

Als u wilt dat wijzigingen in gebruikers- en afdelingsgegevens aan de kant van WeChat Work tijdig worden gesynchroniseerd met de NocoBase-applicatie, kunt u verdere instellingen uitvoeren.

Nadat u de voorgaande configuratie-informatie hebt ingevuld, kunt u de callback-notificatie-URL voor contactpersonen kopiëren.

![](https://static-docs.nocobase.com/202412041256547.png)

Vul deze in bij de WeChat Work-instellingen, verkrijg de Token en EncodingAESKey, en voltooi de configuratie van de NocoBase gebruikerssynchronisatiegegevensbron.

![](https://static-docs.nocobase.com/202412041257947.png)