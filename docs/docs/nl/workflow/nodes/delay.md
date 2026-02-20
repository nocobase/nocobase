:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Vertraging

## Introductie

De Vertraging-node kan een vertraging toevoegen aan de workflow. Nadat de vertraging is afgelopen, kan de workflow, afhankelijk van de configuratie, ofwel de daaropvolgende nodes blijven uitvoeren, ofwel voortijdig worden beëindigd.

Deze node wordt vaak gebruikt in combinatie met de Parallelle Tak-node. U kunt een Vertraging-node toevoegen aan een van de takken om verwerking na een time-out af te handelen. Stel bijvoorbeeld dat in een parallelle tak de ene tak handmatige verwerking bevat en de andere een Vertraging-node. Wanneer de handmatige verwerking een time-out bereikt, betekent de instelling 'mislukken bij time-out' dat de handmatige verwerking binnen de gestelde tijd moet zijn voltooid. De instelling 'doorgaan bij time-out' zorgt ervoor dat de handmatige verwerking na het verstrijken van de tijd kan worden genegeerd.

## Installatie

Dit is een ingebouwde plugin, dus installatie is niet nodig.

## Node maken

Klik in de configuratie-interface van de workflow op de plusknop ('+') in de stroom om een 'Vertraging'-node toe te voegen:

![Vertraging-node maken](https://static-docs.nocobase.com/d0816999c9f7acaec1c409bd8fb6cc36.png)

## Nodeconfiguratie

![Vertraging-node_Nodeconfiguratie](https://static-docs.nocobase.com/5fe8a36535f20a087a0148ffa1cd2aea.png)

### Vertragingstijd

Voor de vertragingstijd kunt u een getal invoeren en een tijdseenheid selecteren. Ondersteunde tijdseenheden zijn: seconden, minuten, uren, dagen en weken.

### Status bij time-out

Voor de status bij time-out kunt u kiezen uit 'Slagen en doorgaan' of 'Mislukken en afsluiten'. De eerste optie betekent dat de workflow na afloop van de vertraging de daaropvolgende nodes blijft uitvoeren. De tweede optie betekent dat de workflow na afloop van de vertraging voortijdig wordt beëindigd met een mislukte status.

## Voorbeeld

Neem als voorbeeld het scenario waarin een werkorder binnen een beperkte tijd na indiening moet worden beantwoord. We moeten een handmatige node toevoegen aan een van de twee parallelle takken en een Vertraging-node aan de andere. Als de handmatige verwerking niet binnen 10 minuten wordt beantwoord, wordt de status van de werkorder bijgewerkt naar 'time-out en onverwerkt'.

![Vertraging-node_Voorbeeld_Stroomorganisatie](https://static-docs.nocobase.com/898c84adc376dc211b003a62e16e8e5b.png)