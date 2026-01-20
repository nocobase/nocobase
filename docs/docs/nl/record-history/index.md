---
pkg: '@nocobase/plugin-record-history'
---
:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::


# Recordgeschiedenis

## Introductie

De **Recordgeschiedenis**-plugin volgt gegevenswijzigingen door automatisch momentopnames en verschillen van **aanmaak-, wijzigings- en verwijderingsbewerkingen** op te slaan. Dit helpt u om snel gegevenswijzigingen te bekijken en operationele activiteiten te controleren.

![](https://static-docs.nocobase.com/202511011338499.png)

## Recordgeschiedenis inschakelen

### Collecties en velden toevoegen

Ga eerst naar de instellingenpagina van de **Recordgeschiedenis**-plugin om de **collecties** en velden toe te voegen waarvan u de historie wilt bijhouden. Om de efficiëntie van de registratie te verbeteren en dataredundantie te voorkomen, wordt aangeraden om alleen essentiële velden te configureren. Velden zoals **unieke ID**, **createdAt**, **updatedAt**, **createdBy** en **updatedBy** hoeven doorgaans niet te worden vastgelegd.

![](https://static-docs.nocobase.com/202511011315010.png)

![](https://static-docs.nocobase.com/202511011316342.png)

### Historische gegevensmomentopnames synchroniseren

- Voor records die zijn aangemaakt voordat de historietracking werd ingeschakeld, kunnen wijzigingen pas worden vastgelegd nadat de eerste update een momentopname heeft gegenereerd; de eerste update of verwijdering wordt daarom niet geregistreerd.
- Als u de historie van bestaande gegevens wilt bewaren, kunt u een eenmalige momentopnamesynchronisatie uitvoeren.
- De grootte van een momentopname per **collectie** wordt berekend als: aantal records × aantal bij te houden velden.
- Bij grote datasets wordt aangeraden om te filteren op gegevensbereik en alleen belangrijke records te synchroniseren.

![](https://static-docs.nocobase.com/202511011319386.png)

![](https://static-docs.nocobase.com/202511011319284.png)

Klik op de knop "Historische momentopnames synchroniseren", configureer de velden en het gegevensbereik, en start de synchronisatie.

![](https://static-docs.nocobase.com/202511011320958.png)

De synchronisatietaak wordt in de wachtrij geplaatst en op de achtergrond uitgevoerd. U kunt de lijst vernieuwen om de voltooiingsstatus te controleren.

## Het Recordgeschiedenis-blok gebruiken

### Een blok toevoegen

Selecteer het **Recordgeschiedenis-blok** en kies een **collectie** om het bijbehorende historieblok aan uw pagina toe te voegen.

![](https://static-docs.nocobase.com/202511011323410.png)

![](https://static-docs.nocobase.com/202511011331667.png)

Als u een historieblok toevoegt in een pop-upvenster met recorddetails, kunt u "Huidig record" selecteren om de historie specifiek voor dat record weer te geven.

![](https://static-docs.nocobase.com/202511011338042.png)

![](https://static-docs.nocobase.com/202511011338499.png)

### Beschrijvingstemplates bewerken

Klik op "Template bewerken" in de blokinstellingen om de beschrijvingstekst voor de operationele records te configureren.

![](https://static-docs.nocobase.com/202511011340406.png)

U kunt afzonderlijke beschrijvingstemplates configureren voor **aanmaak-, wijzigings- en verwijderingsbewerkingen**. Voor wijzigingsbewerkingen kunt u ook de beschrijvingstemplate voor veldwijzigingen configureren, zowel als een uniforme configuratie voor alle velden als voor specifieke velden afzonderlijk.

![](https://static-docs.nocobase.com/202511011346400.png)

Variabelen kunnen worden gebruikt bij het configureren van de tekst.

![](https://static-docs.nocobase.com/202511011347163.png)

Na configuratie kunt u ervoor kiezen om de template toe te passen op **Alle recordgeschiedenisblokken van de huidige collectie** of **Alleen dit recordgeschiedenisblok**.

![](https://static-docs.nocobase.com/202511011348885.png)