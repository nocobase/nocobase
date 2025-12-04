:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Pop-up bewerken

## Introductie

Elke actie of elk veld dat u aanklikt en dat een pop-up opent, kunt u configureren wat betreft de openingswijze, de grootte en meer.

![20251027212617](https://static-docs.nocobase.com/20251027212617.png)

![20251027212800](https://static-docs.nocobase.com/20251027212800.png)

## Openingswijze

- Zijpaneel

![20251027212832](https://static-docs.nocobase.com/20251027212832.png)

- Dialoogvenster

![20251027212905](https://static-docs.nocobase.com/20251027212905.png)

- Subpagina

![20251027212940](https://static-docs.nocobase.com/20251027212940.png)

## Pop-upgrootte

- Groot
- Middel (standaard)
- Klein

## Pop-up UID

De 'Pop-up UID' is de UID van het component dat de pop-up opent. Deze komt ook overeen met het `viewUid`-gedeelte van `view/:viewUid` in de huidige adresbalk. U kunt deze snel verkrijgen door in het instellingenmenu van het triggerende veld of de knop op 'Pop-up UID kopiëren' te klikken. Door de pop-up UID in te stellen, kunt u pop-ups hergebruiken.

![popup-copy-uid-20251102](https://static-docs.nocobase.com/popup-copy-uid-20251102.png)

### Interne pop-up (standaard)
- De 'Pop-up UID' is gelijk aan de UID van de huidige actieknop (standaard is dit de UID van deze knop zelf).

### Externe pop-up (pop-up hergebruiken)
- Vul in het veld 'Pop-up UID' de UID in van een triggerknop op een andere locatie (dit is de pop-up UID) om die specifieke pop-up te hergebruiken.
- Typisch gebruik: meerdere pagina's/blokken gebruiken dezelfde pop-upinterface en -logica, waardoor u dubbele configuratie voorkomt.
- Bij gebruik van een externe pop-up kunnen sommige configuraties niet worden gewijzigd (zie hieronder).

## Overige gerelateerde instellingen

- `Gegevensbron / Collectie`: Alleen-lezen. Geeft de gegevensbron en collectie aan waaraan de pop-up is gekoppeld; standaard wordt de collectie van het huidige blok gebruikt. In de externe pop-upmodus worden de configuraties van de doel-pop-up overgenomen en kan deze instelling niet worden gewijzigd.
- `Associatienaam`: Optioneel. Wordt gebruikt om de pop-up te openen vanuit een 'associatieveld'; wordt alleen weergegeven als er een standaardwaarde is. In de externe pop-upmodus worden de configuraties van de doel-pop-up overgenomen en kan deze instelling niet worden gewijzigd.
- `Source ID`: Wordt alleen weergegeven wanneer `Associatienaam` is ingesteld; gebruikt standaard de `sourceId` van de huidige context en kan naar behoefte worden gewijzigd in een variabele of een vaste waarde.
- `filterByTk`: Kan leeg zijn, een variabele of een vaste waarde, en wordt gebruikt om de gegevensrecords van de pop-up te beperken.

![popup-config-20251102](https://static-docs.nocobase.com/popup-config-20251102.png)