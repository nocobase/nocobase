:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Voorbeeldweergave en Opslaan

*   **Voorbeeldweergave**: Toont tijdelijk de wijzigingen uit het configuratiepaneel in de paginagrafiek om het resultaat te controleren.
*   **Opslaan**: Slaat de wijzigingen uit het configuratiepaneel permanent op in de database.

## Toegangspunten

![clipboard-image-1761479218](https://static-docs.nocobase.com/clipboard-image-1761479218.png)

*   In de grafische configuratiemodus (Basic-modus) worden wijzigingen standaard automatisch in de voorbeeldweergave toegepast.
*   Na wijzigingen in de SQL- en Custom-modi kunt u op de knop 'Voorbeeldweergave' aan de rechterkant klikken om de wijzigingen toe te passen.
*   Onderaan het configuratiepaneel vindt u een uniforme knop 'Voorbeeldweergave'.

## Gedrag van de voorbeeldweergave
*   De configuratie wordt tijdelijk op de pagina weergegeven, maar niet naar de database geschreven. Na het vernieuwen van de pagina of het annuleren van de bewerking, blijft het voorbeeldresultaat niet behouden.
*   Ingebouwde 'debounce'-functionaliteit: Meerdere vernieuwingen binnen korte tijd voeren alleen de laatste uit, om frequente verzoeken te voorkomen.
*   Als u opnieuw op 'Voorbeeldweergave' klikt, wordt het vorige voorbeeldresultaat overschreven.

## Foutmeldingen
*   Queryfouten of validatiefouten: Deze worden weergegeven in het gedeelte 'Gegevens bekijken'.
*   Fouten in de grafiekconfiguratie (ontbrekende Basic-mapping, uitzonderingen van Custom JS): Deze worden weergegeven in het grafiekgebied of de console, terwijl de pagina bruikbaar blijft.
*   Controleer eerst de kolomnamen en gegevenstypen in 'Gegevens bekijken' voordat u velden toewijst of Custom-code schrijft; dit vermindert fouten aanzienlijk.

## Opslaan en Annuleren
*   **Opslaan**: Schrijft de huidige wijzigingen naar de blokconfiguratie en past deze onmiddellijk toe op de pagina.
*   **Annuleren**: Negeert de huidige niet-opgeslagen wijzigingen en herstelt de laatst opgeslagen status.
*   **Bereik van opslaan**:
    *   Gegevensquery: De parameters van de Builder; in SQL-modus wordt ook de SQL-tekst opgeslagen.
    *   Grafiekopties: Het Basic-type, veldtoewijzing en eigenschappen; de JS-tekst van Custom.
    *   Interactie-evenementen: De JS-tekst en bindingslogica van evenementen.
*   Na het opslaan is het blok van kracht voor alle bezoekers (afhankelijk van de paginatoestemmingen).

## Aanbevolen werkwijze
*   Configureer de gegevensquery → Voer de query uit → Bekijk de gegevens om kolomnamen en typen te bevestigen → Configureer grafiekopties om kernvelden toe te wijzen → Gebruik de voorbeeldweergave om te valideren → Sla op om toe te passen.