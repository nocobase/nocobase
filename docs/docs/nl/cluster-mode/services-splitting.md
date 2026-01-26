:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Service splitsing <Badge>v1.9.0+</Badge>

## Introductie

Normaal gesproken draaien alle services van een NocoBase-applicatie binnen dezelfde Node.js-instantie. Naarmate de functionaliteit binnen de applicatie complexer wordt door bedrijfsgroei, kunnen sommige tijdrovende services de algehele prestaties beïnvloeden.

Om de applicatieprestaties te verbeteren, ondersteunt NocoBase het splitsen van applicatieservices om op verschillende knooppunten in clustermodus te draaien. Dit voorkomt dat prestatieproblemen van één service de hele applicatie beïnvloeden en leiden tot het niet correct kunnen beantwoorden van gebruikersverzoeken.

Aan de andere kant maakt dit ook gerichte horizontale schaling van specifieke services mogelijk, wat de benutting van clustermiddelen verbetert.

Bij het implementeren van NocoBase in een cluster kunnen verschillende services worden gesplitst en op verschillende knooppunten worden geïmplementeerd. Het onderstaande diagram illustreert de gesplitste structuur:

![20250803214857](https://static-docs.nocobase.com/20250803214857.png)

## Welke services kunnen worden gesplitst?

### Asynchrone workflow

**Service-sleutel**: `workflow:process`

Workflows in asynchrone modus worden na activering in een wachtrij geplaatst voor uitvoering. Deze workflows kunnen worden beschouwd als achtergrondtaken, waarbij gebruikers doorgaans niet hoeven te wachten op de terugkeer van resultaten. Vooral bij complexe en tijdrovende processen met een hoog activeringsvolume, wordt aangeraden deze te splitsen en op onafhankelijke knooppunten te laten draaien.

### Andere asynchrone taken op gebruikersniveau

**Service-sleutel**: `async-task:process`

Dit omvat taken die zijn gemaakt door gebruikersacties zoals asynchroon importeren en exporteren. Bij grote hoeveelheden gegevens of hoge gelijktijdigheid, wordt aangeraden deze te splitsen en op onafhankelijke knooppunten te laten draaien.

## Hoe services te splitsen

Het splitsen van verschillende services naar verschillende knooppunten wordt gerealiseerd door de omgevingsvariabele `WORKER_MODE` te configureren. Deze omgevingsvariabele kan volgens de volgende regels worden geconfigureerd:

- `WORKER_MODE=<leeg>`: Indien niet geconfigureerd of leeg, is de werkmodus hetzelfde als de huidige single-instantie modus; alle verzoeken worden geaccepteerd en alle taken worden verwerkt. Dit is compatibel met eerder niet-geconfigureerde applicaties.
- `WORKER_MODE=!`: De werkmodus is om alleen verzoeken te verwerken en geen taken.
- `WORKER_MODE=workflow:process,async-task:process`: Geconfigureerd met één of meer service-identificatoren (gescheiden door komma's), is de werkmodus om alleen taken voor deze identificatoren te verwerken en geen verzoeken.
- `WORKER_MODE=*`: De werkmodus is om alle achtergrondtaken te verwerken, ongeacht de module, maar geen verzoeken.
- `WORKER_MODE=!,workflow:process`: De werkmodus is om verzoeken te verwerken en tegelijkertijd taken voor een specifieke identificator te verwerken.
- `WORKER_MODE=-`: De werkmodus is om geen verzoeken of taken te verwerken (deze modus is vereist binnen het worker-proces).

In een K8S-omgeving kunnen knooppunten met dezelfde splitsfunctionaliteit bijvoorbeeld dezelfde omgevingsvariabeleconfiguratie gebruiken, waardoor het eenvoudig wordt om een specifiek type service horizontaal te schalen.

## Configuratievoorbeelden

### Meerdere knooppunten met afzonderlijke verwerking

Stel dat er drie knooppunten zijn: `node1`, `node2` en `node3`. Deze kunnen als volgt worden geconfigureerd:

- `node1`: Verwerkt alleen gebruikers-UI-verzoeken, configureer `WORKER_MODE=!`.
- `node2`: Verwerkt alleen workflow-taken, configureer `WORKER_MODE=workflow:process`.
- `node3`: Verwerkt alleen asynchrone taken, configureer `WORKER_MODE=async-task:process`.

### Meerdere knooppunten met gemengde verwerking

Stel dat er vier knooppunten zijn: `node1`, `node2`, `node3` en `node4`. Deze kunnen als volgt worden geconfigureerd:

- `node1` en `node2`: Verwerken alle reguliere verzoeken, configureer `WORKER_MODE=!`, en laat een load balancer de verzoeken automatisch over deze twee knooppunten verdelen.
- `node3` en `node4`: Verwerken alle andere achtergrondtaken, configureer `WORKER_MODE=*`.

## Referentie voor ontwikkelaars

Bij het ontwikkelen van bedrijfs-plugins kunt u services die aanzienlijke resources verbruiken, splitsen op basis van de vereisten van het scenario. Dit kan op de volgende manieren worden gerealiseerd:

1. Definieer een nieuwe service-identificator, bijvoorbeeld `my-plugin:process`, voor de configuratie van omgevingsvariabelen, en voorzie deze van documentatie.
2. Gebruik in de bedrijfslogica aan de serverzijde van de plugin de `app.serving()`-interface om de omgeving te controleren en te bepalen of het huidige knooppunt een specifieke service moet leveren, gebaseerd op de omgevingsvariabele.

```javascript
const MY_PLUGIN_SERVICE_KEY = 'my-plugin:process';
// In de server-side code van de plugin
if (this.app.serving(MY_PLUGIN_SERVICE_KEY)) {
  // Verwerk de bedrijfslogica voor deze service
} else {
  // Verwerk de bedrijfslogica voor deze service niet
}
```