---
pkg: '@nocobase/plugin-file-previewer-office'
---

:::tip{title="AI-vertaalmelding"}
Dit document is vertaald door AI. Raadpleeg de [Engelse versie](/file-manager/file-preview/ms-office) voor nauwkeurige informatie.
:::

# Office-bestandsvoorbeeld <Badge>v1.8.11+</Badge>

De Office-bestandsvoorbeeld-plugin wordt gebruikt om bestanden in Office-formaat te bekijken in NocoBase-applicaties, zoals Word, Excel en PowerPoint.  
De plugin is gebaseerd op een openbare online service van Microsoft, waarmee bestanden die toegankelijk zijn via een openbare URL kunnen worden ingesloten in een voorbeeldinterface. Hierdoor kunnen gebruikers deze bestanden in de browser bekijken zonder ze te hoeven downloaden of Office-applicaties te gebruiken.

## Gebruikershandleiding

Standaard is de plugin **uitgeschakeld**. U kunt deze na activering in de plugin-manager direct gebruiken; er is geen extra configuratie vereist.

![Plugin-activeringsinterface](https://static-docs.nocobase.com/20250731140048.png)

Nadat u met succes een Office-bestand (Word / Excel / PowerPoint) heeft geüpload naar een bestandsveld in een collectie, klikt u op het bijbehorende bestandspictogram of de link om de inhoud van het bestand te bekijken in de pop-up of de ingesloten voorbeeldinterface.

![Voorbeeld van preview-bewerking](https://static-docs.nocobase.com/20250731143231.png)

## Werkingsprincipe

De voorbeeldweergave die door deze plugin wordt ingesloten, is afhankelijk van de openbare online service van Microsoft (Office Web Viewer). Het proces verloopt als volgt:

- De frontend genereert een openbaar toegankelijke URL voor het door de gebruiker geüploade bestand (inclusief ondertekende S3-URL's);
- De plugin laadt het bestandsvoorbeeld in een iframe met het volgende adres:

  ```
  https://view.officeapps.live.com/op/embed.aspx?src=<Openbare bestands-URL>
  ```

- De service van Microsoft vraagt de bestandsinhoud op via deze URL, rendert deze en retourneert een bekijkbare pagina.

## Aandachtspunten

- Omdat deze plugin afhankelijk is van de online service van Microsoft, moet u ervoor zorgen dat de netwerkverbinding stabiel is en dat de gerelateerde services van Microsoft toegankelijk zijn.
- Microsoft heeft toegang tot de door u verstrekte bestands-URL en de bestandsinhoud wordt tijdelijk gecachet op hun server om de voorbeeldpagina te renderen. Dit brengt een zeker privacyrisico met zich mee. Als u hier bezorgd over bent, raden wij u aan de preview-functie van deze plugin niet te gebruiken[^1].
- Het te bekijken bestand moet een openbaar toegankelijke URL hebben. Normaal gesproken genereren bestanden die naar NocoBase worden geüpload automatisch toegankelijke openbare links (inclusief ondertekende URL's gegenereerd door de S3-Pro plugin). Als er echter toegangsrechten zijn ingesteld voor het bestand of als het is opgeslagen in een intern netwerk, kan er geen voorbeeld worden weergegeven[^2].
- De service ondersteunt geen inlogauthenticatie of bronnen in privéopslag. Bestanden die bijvoorbeeld alleen toegankelijk zijn binnen een intern netwerk of waarvoor inloggen vereist is, kunnen deze preview-functie niet gebruiken.
- Nadat de bestandsinhoud door de Microsoft-service is opgehaald, kan deze voor korte tijd worden gecachet. Zelfs als het bronbestand wordt verwijderd, kan de voorbeeldinhoud nog enige tijd toegankelijk blijven.
- Er zijn aanbevolen limieten voor de bestandsgrootte: voor Word- en PowerPoint-bestanden wordt aangeraden de 10 MB niet te overschrijden, en voor Excel-bestanden de 5 MB, om de stabiliteit van de weergave te garanderen[^3].
- Momenteel is er geen officiële, duidelijke licentiebeschrijving voor commercieel gebruik van deze service. Beoordeel zelf de risico's bij gebruik[^4].

## Ondersteunde bestandsformaten

De plugin ondersteunt alleen voorbeelden voor de volgende Office-bestandsformaten, gebaseerd op het MIME-type of de bestandsextensie:

- Word-documenten:
  `application/vnd.openxmlformats-officedocument.wordprocessingml.document` (`.docx`) of `application/msword` (`.doc`)
- Excel-spreadsheets:
  `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` (`.xlsx`) of `application/vnd.ms-excel` (`.xls`)
- PowerPoint-presentaties:
  `application/vnd.openxmlformats-officedocument.presentationml.presentation` (`.pptx`) of `application/vnd.ms-powerpoint` (`.ppt`)
- OpenDocument-tekst: `application/vnd.oasis.opendocument.text` (`.odt`)

Andere bestandsformaten maken geen gebruik van de preview-functie van deze plugin.

[^1]: [What is the status of view.officeapps.live.com?](https://learn.microsoft.com/en-us/answers/questions/5191451/what-is-the-status-of-view-officeapps-live-com)
[^2]: [Microsoft Q&A - Access denied or non-public files cannot be previewed](https://learn.microsoft.com/en-us/answers/questions/1411722/https-view-officeapps-live-com-op-embed-aspx)
[^3]: [Microsoft Q&A - File size limits for Office Web Viewer](https://learn.microsoft.com/en-us/answers/questions/1411722/https-view-officeapps-live-com-op-embed-aspx#file-size-limits)
[^4]: [Microsoft Q&A - Commercial use of Office Web Viewer](https://learn.microsoft.com/en-us/answers/questions/5191451/what-is-the-status-of-view-officeapps-live-com#commercial-use)