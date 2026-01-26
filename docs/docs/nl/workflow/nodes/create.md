:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Gegevens aanmaken

Gebruik deze functie om een nieuwe rij gegevens toe te voegen aan een collectie. De veldwaarden voor de nieuwe gegevensrij kunnen variabelen uit de workflowcontext gebruiken. Voor het toewijzen van waarden aan relatievelden kunt u direct verwijzen naar de corresponderende gegevensvariabelen in de context; dit kan een object zijn of de waarde van een foreign key. Als u geen variabelen gebruikt, moet u de foreign key-waarden handmatig invullen. Voor relaties met meerdere waarden moeten de foreign key-waarden met komma's worden gescheiden.

## Node aanmaken

In de configuratie-interface van de workflow klikt u op de plusknop ('+') in de workflow om een 'Gegevens aanmaken'-node toe te voegen:

![Voeg 'Gegevens aanmaken'-node toe](https://static-docs.nocobase.com/386c8c01c89b1eeab848510e77f4841a.png)

## Node-configuratie

![Gegevens aanmaken Node_Voorbeeld_Node-configuratie](https://static-docs.nocobase.com/5f7b97a51b64a1741cf82a4d4455b610.png)

### Collectie

Selecteer de collectie waaraan u een nieuw gegeven wilt toevoegen.

### Veldwaarden

Wijs waarden toe aan de velden van de collectie. U kunt variabelen uit de workflowcontext gebruiken of handmatig statische waarden invullen.

:::info{title="Opmerking"}
Gegevens die door de 'Gegevens aanmaken'-node in een workflow worden aangemaakt, verwerken niet automatisch gebruikersgegevens zoals 'Aangemaakt door' en 'Laatst gewijzigd door'. U moet de waarden voor deze velden zelf configureren, afhankelijk van de situatie.
:::

### Relatiegegevens voorladen

Als de velden van de nieuwe gegevens relatievelden bevatten en u de corresponderende relatiegegevens in latere workflowstappen wilt gebruiken, dan kunt u de corresponderende relatievelden aanvinken in de voorlaadconfiguratie. Op deze manier worden, nadat de nieuwe gegevens zijn aangemaakt, de corresponderende relatiegegevens automatisch geladen en samen opgeslagen in de resultaatsgegevens van de node.

## Voorbeeld

Stel dat wanneer een gegeven in de collectie 'Artikelen' wordt aangemaakt of bijgewerkt, er automatisch een 'Artikelversies'-gegeven moet worden aangemaakt om een wijzigingsgeschiedenis voor het artikel vast te leggen. Dit kunt u realiseren met de 'Gegevens aanmaken'-node:

![Gegevens aanmaken Node_Voorbeeld_Workflowconfiguratie](https://static-docs.nocobase.com/dfd4820d49c145fa331883fc09c9161f.png)

![Gegevens aanmaken Node_Voorbeeld_Node-configuratie](https://static-docs.nocobase.com/1a0992e66170be12a068da6503298868.png)

Nadat u de workflow met deze configuratie hebt ingeschakeld, zal, wanneer een gegeven in de collectie 'Artikelen' wordt gewijzigd, automatisch een 'Artikelversies'-gegeven worden aangemaakt om de wijzigingsgeschiedenis van het artikel vast te leggen.