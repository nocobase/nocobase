:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

## Geavanceerde Functies

### Paginering

#### 1. Paginanummering bijwerken

##### Syntaxis
U kunt dit eenvoudig invoegen in uw Office-software.

##### Voorbeeld
In Microsoft Word:
- Gebruik de functie "Invoegen → Paginanummer"  
In LibreOffice:
- Gebruik de functie "Invoegen → Veld → Paginanummer"

##### Resultaat
In het gegenereerde rapport worden de paginanummers op elke pagina automatisch bijgewerkt.


#### 2. Inhoudsopgave genereren

##### Syntaxis
U kunt dit eenvoudig invoegen in uw Office-software.

##### Voorbeeld
In Microsoft Word:
- Gebruik de functie "Invoegen → Index en tabellen → Inhoudsopgave"  
In LibreOffice:
- Gebruik de functie "Invoegen → Inhoudsopgave en index → Inhoudsopgave, index of bibliografie"

##### Resultaat
De inhoudsopgave van het rapport wordt automatisch bijgewerkt op basis van de documentinhoud.


#### 3. Tabelkoppen herhalen

##### Syntaxis
U kunt dit eenvoudig invoegen in uw Office-software.

##### Voorbeeld
In Microsoft Word:
- Klik met de rechtermuisknop op de tabelkop → Tabeleigenschappen → Vink "Rijen herhalen als kopregel bovenaan elke pagina" aan  
In LibreOffice:
- Klik met de rechtermuisknop op de tabelkop → Tabeleigenschappen → tabblad Tekststroom → Vink "Kop herhalen" aan

##### Resultaat
Wanneer een tabel meerdere pagina's beslaat, wordt de tabelkop automatisch bovenaan elke pagina herhaald.


### Internationalisatie (i18n)

#### 1. Vertaling van statische tekst

##### Syntaxis
Gebruik de tag `{t(tekst)}` om statische tekst te internationaliseren:
```
{t(meeting)}
```

##### Voorbeeld
In de sjabloon:
```
{t(meeting)} {t(apples)}
```
JSON-gegevens of een extern lokalisatiewoordenboek (bijvoorbeeld voor "fr-fr") bieden de overeenkomstige vertalingen, zoals "meeting" → "rendez-vous" en "apples" → "Pommes".

##### Resultaat
Bij het genereren van het rapport wordt de tekst vervangen door de overeenkomstige vertaling op basis van de doeltaal.


#### 2. Vertaling van dynamische tekst

##### Syntaxis
Voor gegevensinhoud kunt u de `:t` formatter gebruiken, bijvoorbeeld:
```
{d.id:ifEQ(2):show({t(monday)}):elseShow({t(tuesday)})}
```

##### Voorbeeld
In de sjabloon:
```
{d.id:ifEQ(2):show({t(monday)}):elseShow({t(tuesday)})}
```
JSON-gegevens en het lokalisatiewoordenboek bieden de juiste vertalingen.

##### Resultaat
Op basis van de voorwaarde wordt "lundi" of "mardi" uitgevoerd (als voorbeeld in de doeltaal).


### Sleutel-waardetoewijzing

#### 1. Enum-conversie (:convEnum)

##### Syntaxis
```
{gegevens:convEnum(enumNaam)}
```
Bijvoorbeeld:
```
0:convEnum('ORDER_STATUS')
```

##### Voorbeeld
In een API-opties voorbeeld wordt het volgende meegegeven:
```json
{
  "enum": {
    "ORDER_STATUS": ["pending", "sent", "delivered"]
  }
}
```
In de sjabloon:
```
0:convEnum('ORDER_STATUS')
```

##### Resultaat
Geeft "pending" als uitvoer; als de index buiten het bereik van de enumeratie valt, wordt de oorspronkelijke waarde uitgevoerd.


### Dynamische afbeeldingen
:::info
Ondersteunt momenteel XLSX- en DOCX-bestandstypen
:::
U kunt "dynamische afbeeldingen" invoegen in documentsjablonen. Dit betekent dat tijdelijke aanduidingen voor afbeeldingen in de sjabloon automatisch worden vervangen door echte afbeeldingen tijdens het renderen, op basis van de gegevens. Dit proces is heel eenvoudig en vereist slechts:

1. Voeg een tijdelijke afbeelding in als plaatshouder

2. Bewerk de "Alternatieve tekst" van die afbeelding om het veldlabel in te stellen

3. Render het document, en het systeem zal de afbeelding automatisch vervangen door de daadwerkelijke afbeelding

Hieronder leggen we de werkwijzen voor DOCX en XLSX uit aan de hand van specifieke voorbeelden.


#### Dynamische afbeeldingen invoegen in DOCX-bestanden
##### Vervanging van één afbeelding

1. Open uw DOCX-sjabloon en voeg een tijdelijke afbeelding in (dit kan elke plaatshouderafbeelding zijn, zoals een [effen blauwe afbeelding](https://static-docs.nocobase.com/solid-color-image-2025-04-14-11-00-26.png))

:::info
**Instructies voor afbeeldingsformaat**

- Momenteel ondersteunen plaatshouderafbeeldingen alleen het PNG-formaat. We raden u aan onze meegeleverde voorbeeld [effen blauwe afbeelding](https://static-docs.nocobase.com/solid-color-image-2025-04-14-11-00-26.png) te gebruiken.
- De uiteindelijke gerenderde afbeeldingen ondersteunen alleen de formaten PNG, JPG en JPEG. Andere afbeeldingsformaten kunnen mogelijk niet worden gerenderd.

**Instructies voor afbeeldingsgrootte**

Of het nu gaat om DOCX of XLSX, de uiteindelijke grootte van de gerenderde afbeelding zal de afmetingen van de tijdelijke afbeelding in de sjabloon volgen. Dit betekent dat de daadwerkelijk ingevoegde afbeelding automatisch wordt geschaald naar dezelfde grootte als de plaatshouderafbeelding die u hebt ingevoegd. Als u wilt dat de gerenderde afbeelding 150×150 is, gebruik dan een tijdelijke afbeelding in de sjabloon en pas deze aan tot die afmetingen.
:::

2. Klik met de rechtermuisknop op deze afbeelding, bewerk de "Alternatieve tekst" en vul het gewenste afbeeldingsveldlabel in, bijvoorbeeld `{d.imageUrl}`:
   
![20250414211130-2025-04-14-21-11-31](https://static-docs.nocobase.com/20250414211130-2025-04-14-21-11-31.png)

3. Gebruik de volgende voorbeeldgegevens voor het renderen:
```json
{
  "name": "Apple",
  "imageUrl": "https://images.pexels.com/photos/206959/pexels-photo-206959.jpeg",
}
```

4. In het gerenderde resultaat wordt de tijdelijke afbeelding vervangen door de daadwerkelijke afbeelding:

![20250414203444-2025-04-14-20-34-46](https://static-docs.nocobase.com/20250414203444-2025-04-14-20-34-46.png)

##### Meerdere afbeeldingen cyclisch vervangen

Als u een groep afbeeldingen in de sjabloon wilt invoegen, zoals een productlijst, kunt u dit ook via lussen realiseren. De specifieke stappen zijn als volgt:
1. Stel dat uw gegevens er als volgt uitzien:
```json
{
  "products": [
    {
      "name": "Apple",
      "imageUrl": "https://images.pexels.com/photos/206959/pexels-photo-206959.jpeg",
    },
    {
      "name": "Banana",
      "imageUrl": "https://images.pexels.com/photos/61127/pexels-photo-61127.jpeg",
    },
  ]
}
```

2. Stel een lusgebied in de DOCX-sjabloon in en voeg in elk lusitem tijdelijke afbeeldingen in met de alternatieve tekst ingesteld op `{d.products[i].imageUrl}`, zoals hieronder weergegeven:

![20250414205418-2025-04-14-20-54-19](https://static-docs.nocobase.com/20250414205418-2025-04-14-20-54-19.png)

3. Na het renderen worden alle tijdelijke afbeeldingen vervangen door de bijbehorende gegevensafbeeldingen:
   
![20250414205503-2025-04-14-20-55-05](https://static-docs.nocobase.com/20250414205503-2025-04-14-20-55-05.png)

#### Dynamische afbeeldingen invoegen in XLSX-bestanden

De werkwijze in Excel-sjablonen (XLSX) is in principe hetzelfde, let echter op de volgende punten:

1. Nadat u een afbeelding hebt ingevoegd, zorg er dan voor dat u "afbeelding in cel" selecteert, en niet dat de afbeelding boven de cel zweeft.

![20250414211643-2025-04-14-21-16-45](https://static-docs.nocobase.com/20250414211643-2025-04-14-21-16-45.png)

2. Nadat u de cel hebt geselecteerd, klikt u op "Alternatieve tekst" om het veldlabel in te vullen, bijvoorbeeld `{d.imageUrl}`.

### Barcode
:::info
Ondersteunt momenteel XLSX- en DOCX-bestandstypen
:::

#### Barcodes genereren (zoals QR-codes)

Het genereren van barcodes werkt op dezelfde manier als dynamische afbeeldingen en vereist slechts drie stappen:

1. Voeg een tijdelijke afbeelding in de sjabloon in om de positie van de barcode te markeren

2. Bewerk de "Alternatieve tekst" van de afbeelding en voer het veldlabel voor het barcodeformaat in, bijvoorbeeld `{d.code:barcode(qrcode)}`, waarbij `qrcode` het type barcode is (zie de ondersteunde lijst hieronder)

![20250414214626-2025-04-14-21-46-28](https://static-docs.nocobase.com/20250414214626-2025-04-14-21-46-28.png)

3. Na het renderen wordt de plaatshouderafbeelding automatisch vervangen door de corresponderende barcodeafbeelding:
   
![20250414214925-2025-04-14-21-49-26](https://static-docs.nocobase.com/20250414214925-2025-04-14-21-49-26.png)

#### Ondersteunde barcodetypen

| Barcode naam | Type   |
| ------------ | ------ |
| QR-code      | qrcode |