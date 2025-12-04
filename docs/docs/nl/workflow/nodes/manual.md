---
pkg: '@nocobase/plugin-workflow-manual'
---
:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::


# Handmatige actie

## Introductie

Wanneer een bedrijfsproces niet volledig geautomatiseerd kan worden, kunt u via een handmatige knoop een deel van de besluitvorming aan een persoon overlaten.

Wanneer een handmatige knoop wordt uitgevoerd, onderbreekt deze de uitvoering van de gehele workflow en genereert een takenlijstitem voor de betreffende gebruiker. Nadat de gebruiker de taak heeft ingediend, wordt op basis van de geselecteerde status besloten of de workflow wordt voortgezet, in afwachting blijft of wordt beëindigd. Dit is erg handig in scenario's zoals goedkeuringsprocessen.

## Installatie

Dit is een ingebouwde plugin, dus installatie is niet nodig.

## Knoop aanmaken

Klik in de configuratie-interface van de workflow op de plusknop ("+") in de workflow om een "Handmatige actie"-knoop toe te voegen:

![Handmatige knoop aanmaken](https://static-docs.nocobase.com/4dd259f1aceeaf9b825abb4b257df909.png)

## Knoop configureren

### Verantwoordelijke

Een handmatige knoop vereist dat u een gebruiker aanwijst als de uitvoerder van de takenlijst. De lijst met takenlijstitems kunt u toevoegen als een blok op een pagina. De inhoud van de taakpop-up voor elke knoop moet worden geconfigureerd in de interface van de knoop zelf.

Selecteer een gebruiker, of kies de primaire of externe sleutel van gebruikersgegevens uit de context via een variabele.

![Handmatige knoop_Configuratie_Verantwoordelijke_Variabele selecteren](https://static-docs.nocobase.com/22fbca3b8e21fda3a831019037001445.png)

:::info{title=Tip}
Momenteel ondersteunt de optie voor de verantwoordelijke van handmatige knopen nog geen verwerking door meerdere gebruikers. Dit zal in een toekomstige versie worden ondersteund.
:::

### Gebruikersinterface configureren

De interfaceconfiguratie voor takenlijstitems is de kern van de handmatige knoop. U kunt een aparte configuratiepop-up openen door op de knop "Gebruikersinterface configureren" te klikken, die u net als een gewone pagina 'what you see is what you get' (WYSIWYG) kunt configureren:

![Handmatige knoop_Knoopconfiguratie_Interfaceconfiguratie](https://static-docs.nocobase.com/fd360168c879743cf22d57440cd2590f.png)

#### Tabs

Tabs kunt u gebruiken om verschillende soorten inhoud te onderscheiden. Denk hierbij aan een tab voor goedgekeurde formulieren, een andere voor afgewezen formulieren, of voor het tonen van details van gerelateerde gegevens. Ze zijn vrij configureerbaar.

#### Blokken

De ondersteunde bloktypen zijn hoofdzakelijk verdeeld in twee categorieën: datablokken en formulierblokken. Daarnaast wordt Markdown voornamelijk gebruikt voor statische inhoud, zoals informatiemeldingen.

##### Datablok

Datablokken kunnen triggergegevens of de verwerkingsresultaten van elke knoop weergeven, om de verantwoordelijke van de taak relevante contextuele informatie te bieden. Als de workflow bijvoorbeeld wordt geactiveerd door een formuliergebeurtenis, kunt u een detailblok voor de triggergegevens aanmaken. Dit komt overeen met de detailconfiguratie van een gewone pagina, waarbij u elk veld uit de triggergegevens kunt selecteren voor weergave:

![Handmatige knoop_Knoopconfiguratie_Interfaceconfiguratie_Datablok_Trigger](https://static-docs.nocobase.com/675c3e58a1a4f45db310a72c2d0a404c.png)

Datablokken voor knoopgegevens werken op een vergelijkbare manier; u kunt het gegevensresultaat van een stroomopwaartse knoop selecteren om als details weer te geven. Denk bijvoorbeeld aan het resultaat van een stroomopwaartse rekenknoop, dat dient als contextuele referentie-informatie voor de taak van de verantwoordelijke:

![Handmatige knoop_Knoopconfiguratie_Interfaceconfiguratie_Datablok_Knoopgegevens](https://static-docs.nocobase.com/a583e26e508e95440d998c4.png)

:::info{title=Tip}
Aangezien de workflow zich tijdens de interfaceconfiguratie in een niet-uitgevoerde staat bevindt, worden er geen specifieke gegevens weergegeven in de datablokken. De relevante gegevens voor een specifieke workflow-instantie zijn pas zichtbaar in de takenlijstpop-up nadat de workflow is geactiveerd en uitgevoerd.
:::

##### Formulierblok

In de takenlijstinterface moet ten minste één formulierblok worden geconfigureerd voor de uiteindelijke beslissing of de workflow moet worden voortgezet. Als er geen formulier is geconfigureerd, kan de workflow na onderbreking niet verdergaan. Er zijn drie typen formulierblokken:

- Aangepast formulier
- Formulier voor nieuwe gegevens
- Formulier voor gegevens bijwerken

![Handmatige knoop_Knoopconfiguratie_Interfaceconfiguratie_Formuliertypen](https://static-docs.nocobase.com/2d068f3012ab07e32a265405492104a8.png)

Formulieren voor nieuwe gegevens en formulieren voor gegevens bijwerken vereisen de selectie van een basiscollectie. Nadat de gebruiker de taak heeft ingediend, worden de waarden in het formulier gebruikt om gegevens in de gespecificeerde collectie aan te maken of bij te werken. Een aangepast formulier stelt u in staat om vrijelijk een tijdelijk formulier te definiëren dat niet aan een collectie is gekoppeld. De veldwaarden die door de gebruiker worden ingediend, kunnen in latere knopen worden gebruikt.

De verzendknoppen van het formulier kunnen in drie typen worden geconfigureerd:

- Indienen en workflow voortzetten
- Indienen en workflow beëindigen
- Alleen formulierwaarden opslaan

![Handmatige knoop_Knoopconfiguratie_Interfaceconfiguratie_Formulierknoppen](https://static-docs.nocobase.com/6b45995b14152e85a821dff6f6e3189a.png)

De drie knoppen vertegenwoordigen drie knoopstatussen binnen de workflow. Na indiening verandert de status van de knoop naar "Voltooid", "Geweigerd" of blijft deze in de status "In afwachting". Een formulier moet ten minste één van de eerste twee opties geconfigureerd hebben om de verdere stroom van de gehele workflow te bepalen.

Op de knop "Workflow voortzetten" kunt u toewijzingen voor formuliervelden configureren:

![Handmatige knoop_Knoopconfiguratie_Interfaceconfiguratie_Formulierknop_Formulierwaarden instellen](https://static-docs.nocobase.com/2cec2d4e2957f068877e616dec3b56dd.png)

![Handmatige knoop_Knoopconfiguratie_Interfaceconfiguratie_Formulierknop_Pop-up formulierwaarden instellen](https://static-docs.nocobase.com/5ff51b60c76cdb76e6f1cc95dc3d8640.png)

Nadat u de pop-up heeft geopend, kunt u waarden toewijzen aan elk formulierveld. Na het indienen van het formulier zal deze waarde de uiteindelijke waarde van het veld zijn. Dit is vooral handig bij het beoordelen van gegevens. U kunt meerdere verschillende "Workflow voortzetten"-knoppen in een formulier gebruiken, waarbij elke knop verschillende opsommingswaarden instelt voor velden met een vergelijkbare status, om zo het effect te bereiken van het voortzetten van de workflow met verschillende gegevenswaarden.

## Takenlijstblok

Voor handmatige verwerking moet u ook een takenlijst aan een pagina toevoegen om openstaande taken weer te geven. Zo kunnen de betrokken medewerkers via deze lijst de specifieke taken van de handmatige knoop benaderen en afhandelen.

### Blok toevoegen

U kunt "Workflow Takenlijst" selecteren uit de blokken op een pagina om een blok voor de takenlijst toe te voegen:

![Handmatige knoop_Takenlijstblok toevoegen](https://static-docs.nocobase.com/198b41754cd73b704267bf30fe5e647.png)

Voorbeeld van een takenlijstblok:

![Handmatige knoop_Takenlijst](https://static-docs.nocobase.com/cfefb0d34.png)

### Takenlijstdetails

Daarna kunnen de betrokken medewerkers op de betreffende taak klikken om de takenlijstpop-up te openen en de handmatige verwerking uit te voeren:

![Handmatige knoop_Takenlijstdetails](https://static-docs.nocobase.com/ccfd0533deebff6b3f6ef4408066e688.png)

## Voorbeeld

### Artikelbeoordeling

Stel dat een artikel dat door een gewone gebruiker is ingediend, eerst door een beheerder moet worden goedgekeurd voordat het de status 'gepubliceerd' krijgt. Als de workflow wordt afgewezen, blijft het artikel in conceptstatus (niet openbaar). Dit proces kan worden geïmplementeerd met behulp van een updateformulier in een handmatige knoop.

Maak een workflow aan die wordt geactiveerd door "Artikel aanmaken" en voeg een handmatige knoop toe:

<figure>
  <img alt="Handmatige knoop_Voorbeeld_Artikelbeoordeling_Workflow-orkestratie" src="https://github.com/nocobase/nocobase/assets/525658/2021bf42-f372-4f69-9c84-5a786c061e0e" width="360" />
</figure>

Configureer in de handmatige knoop de beheerder als verantwoordelijke. Voeg in de configuratie-interface een blok toe op basis van de triggergegevens, om de details van het nieuwe artikel weer te geven:

<figure>
  <img alt="Handmatige knoop_Voorbeeld_Artikelbeoordeling_Knoopconfiguratie_Detailblok" src="https://github.com/nocobase/nocobase/assets/525658/c61d0aac-23cb-4387-b60e-ce3cc7bf1c24" width="680" />
</figure>

Voeg in de configuratie-interface een blok toe op basis van een formulier voor gegevens bijwerken, selecteer de artikelcollectie, zodat de beheerder kan beslissen of de beoordeling wordt goedgekeurd. Na goedkeuring wordt het betreffende artikel bijgewerkt op basis van andere, latere configuraties. Na het toevoegen van het formulier is er standaard een knop "Workflow voortzetten", die kan worden beschouwd als 'goedkeuren'. Voeg vervolgens een knop "Workflow beëindigen" toe, te gebruiken voor afwijzing:

<figure>
  <img alt="Handmatige knoop_Voorbeeld_Artikelbeoordeling_Knoopconfiguratie_Formulier en acties" src="https://github.com/nocobase/nocobase/assets/525658/4baaf41e-3d81-4ee8-a038-29db05e0d99f" width="673" />
</figure>

Wanneer de workflow wordt voortgezet, moeten we de status van het artikel bijwerken. Hiervoor zijn er twee configuratiemethoden. Eén is om het statusveld van het artikel direct in het formulier weer te geven, zodat de gebruiker dit kan selecteren. Deze methode is geschikter voor situaties die actieve formulierinvulling vereisen, zoals het geven van feedback:

<figure>
  <img alt="Handmatige knoop_Voorbeeld_Artikelbeoordeling_Knoopconfiguratie_Formuliervelden" src="https://github.com/nocobase/nocobase/assets/525658/82ea4e0e-25fc-4921-841e-e1a2782a87d1" width="668" />
</figure>

Om de taak van de gebruiker te vereenvoudigen, is een andere manier om formulierwaarde-toewijzing te configureren op de knop "Workflow voortzetten". Voeg in de toewijzing een veld "Status" toe met de waarde "Gepubliceerd". Dit betekent dat wanneer de gebruiker op de knop klikt, het artikel wordt bijgewerkt naar de gepubliceerde status:

<figure>
  <img alt="Handmatige knoop_Voorbeeld_Artikelbeoordeling_Knoopconfiguratie_Formuliertoewijzing" src="https://github.com/nocobase/nocobase/assets/525658/0340bd9f-8323-4e4f-bc5a-8f81be3d6736" width="711" />
</figure>

Selecteer vervolgens in het configuratiemenu rechtsboven in het formulierblok de filterconditie voor de bij te werken gegevens. Kies hier de collectie "Artikelen" en de filterconditie is "ID `gelijk aan` Trigger variabele / Trigger gegevens / ID":

<figure>
  <img alt="Handmatige knoop_Voorbeeld_Artikelbeoordeling_Knoopconfiguratie_Formulierconditie" src="https://github.com/nocobase/nocobase/assets/525658/da004055-0262-49ae-88dd-3844f3c92e28" width="1020" />
</figure>

Tot slot kunt u de titels van elk blok, de tekst van de relevante knoppen en de placeholdertekst van de formuliervelden aanpassen om de interface gebruiksvriendelijker te maken:

<figure>
  <img alt="Handmatige knoop_Voorbeeld_Artikelbeoordeling_Knoopconfiguratie_Definitief formulier" src="https://github.com/nocobase/nocobase/assets/525658/21db5f6b-690b-49c1-8259-4f7b8874620d" width="678" />
</figure>

Sluit het configuratiepaneel en klik op de verzendknop om de knoopconfiguratie op te slaan. De workflow is nu geconfigureerd. Nadat u deze workflow heeft ingeschakeld, wordt deze automatisch geactiveerd wanneer een nieuw artikel wordt aangemaakt. De beheerder kan in de takenlijst zien dat deze workflow verwerking vereist. Na het klikken op 'bekijken' zijn de details van de taak zichtbaar:

<figure>
  <img alt="Handmatige knoop_Voorbeeld_Artikelbeoordeling_Takenlijst" src="https://github.com/nocobase/nocobase/assets/525658/4e1748cd-6a07-4045-82e5-286826607826" width="1363" />
</figure>

<figure>
  <img alt="Handmatige knoop_Voorbeeld_Artikelbeoordeling_Takenlijstdetails" src="https://github.com/nocobase/nocobase/assets/525658/65f01fb1-8cb0-45f8-ac21-ec8ab59be449" width="680" />
</figure>

De beheerder kan op basis van de artikeldetails handmatig beoordelen of het artikel kan worden gepubliceerd. Indien dit het geval is, klikt u op de knop "Goedkeuren" en wordt het artikel bijgewerkt naar de status 'gepubliceerd'. Indien niet, klikt u op de knop "Afwijzen" en blijft het artikel in conceptstatus.

## Verlofgoedkeuring

Stel dat een medewerker verlof aanvraagt, wat pas van kracht wordt na goedkeuring door een leidinggevende, en waarbij de verlofgegevens van de betreffende medewerker moeten worden afgeschreven. Ongeacht goedkeuring of afwijzing, zal via een verzoekknoop een sms-API worden aangeroepen om een melding per sms naar de medewerker te sturen (zie de sectie [HTTP-verzoek](#_HTTP_请求)). Dit scenario kan worden geïmplementeerd met behulp van een aangepast formulier in een handmatige knoop.

Maak een workflow aan die wordt geactiveerd door "Verlof aanvragen" en voeg een handmatige knoop toe. Dit is vergelijkbaar met het eerdere artikelbeoordelingsproces, maar hier is de verantwoordelijke de leidinggevende. Voeg in de configuratie-interface een blok toe op basis van de triggergegevens om de details van de nieuwe verlofaanvraag weer te geven. Voeg vervolgens een ander blok toe op basis van een aangepast formulier, zodat de leidinggevende kan beslissen of de aanvraag wordt goedgekeurd. Voeg in het aangepaste formulier een veld toe voor de goedkeuringsstatus en een veld voor de reden van afwijzing:

<figure>
  <img alt="Handmatige knoop_Voorbeeld_Verlofgoedkeuring_Knoopconfiguratie" src="https://github.com/nocobase/nocobase/assets/525658/ef3bc7b8-56e8-4a4e-826e-ffd0b547d1b6" width="675" />
</figure>

In tegenstelling tot het artikelbeoordelingsproces, configureren we hier slechts één knop "Workflow voortzetten" voor indiening, zonder de knop "Workflow beëindigen" te gebruiken, omdat we de verdere workflow moeten voortzetten op basis van het goedkeuringsresultaat van de leidinggevende.

Tegelijkertijd kunnen we na de handmatige knoop via een voorwaardelijke knoop bepalen of de leidinggevende de verlofaanvraag heeft goedgekeurd. In de goedkeuringstak voegen we gegevensverwerking toe om verlof af te schrijven, en na het samenvoegen van de takken voegen we een verzoekknoop toe om een sms-melding naar de medewerker te sturen. Dit resulteert in de volgende complete workflow:

<figure>
  <img alt="Handmatige knoop_Voorbeeld_Verlofgoedkeuring_Workflow-orkestratie" src="https://github.com/nocobase/nocobase/assets/525658/733f68da-e44f-4172-9772-a287ac2724f2" width="593" />
</figure>

De conditie in de voorwaardelijke knoop is geconfigureerd als "Handmatige knoop / Aangepaste formuliergegevens / Waarde van het goedkeuringsveld is 'Goedgekeurd'":

<figure>
  <img alt="Handmatige knoop_Voorbeeld_Verlofgoedkeuring_Conditie" src="https://github.com/nocobase/nocobase/assets/525658/57b972f0-a3ce-4f33-8d40-4272ad205c20" width="678" />
</figure>

De gegevens in de verzendverzoekknoop kunnen ook de corresponderende formuliervariabelen van de handmatige knoop gebruiken om de sms-inhoud voor goedkeuring en afwijzing te onderscheiden. Hiermee is de configuratie van de gehele workflow voltooid. Nadat de workflow is ingeschakeld, kan de leidinggevende, wanneer een medewerker een verlofaanvraagformulier indient, de goedkeuring verwerken in de takenlijst. De werking is in principe vergelijkbaar met het artikelbeoordelingsproces.