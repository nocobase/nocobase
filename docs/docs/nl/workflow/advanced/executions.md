:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Uitvoeringsplan (Geschiedenis)

Zodra een workflow wordt geactiveerd, wordt er een bijbehorend uitvoeringsplan aangemaakt om het uitvoeringsproces van die taak te volgen. Elk uitvoeringsplan heeft een statuswaarde die de huidige uitvoeringsstatus aangeeft. Deze status kunt u zowel in de lijst als in de details van de uitvoeringsgeschiedenis bekijken:

![Uitvoeringsplan Status](https://static-docs.nocobase.com/d4440d92ccafac6fac85da4415bb2a26.png)

Wanneer alle knooppunten in de hoofdprocesvertakking de status 'Voltooid' hebben bereikt en het einde van het proces is bereikt, zal het gehele uitvoeringsplan eindigen met de status 'Voltooid'. Als een knooppunt in de hoofdprocesvertakking een eindstatus krijgt zoals 'Mislukt', 'Fout', 'Geannuleerd' of 'Geweigerd', dan wordt het gehele uitvoeringsplan met de corresponderende status **voortijdig beëindigd**. Wanneer een knooppunt in de hoofdprocesvertakking de status 'Wachtend' heeft, wordt het gehele uitvoeringsplan gepauzeerd, maar blijft de status 'Bezig' weergeven totdat het wachtende knooppunt wordt hervat. Verschillende knooppunttypen behandelen de wachtstatus anders. Een handmatig knooppunt moet bijvoorbeeld wachten op handmatige verwerking, terwijl een vertragingsknooppunt moet wachten tot de ingestelde tijd is verstreken voordat het verdergaat.

De statussen van een uitvoeringsplan zijn als volgt:

| Status        | Corresponderende status van het laatst uitgevoerde knooppunt in het hoofdproces | Betekenis                                                                                             |
| ------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| In wachtrij   | -                                                                                | De workflow is geactiveerd en een uitvoeringsplan is gegenereerd, wachtend in de wachtrij totdat de scheduler de uitvoering plant. |
| Bezig         | Wachtend                                                                         | Het knooppunt vereist een pauze, wachtend op verdere invoer of een callback om verder te gaan.        |
| Voltooid      | Voltooid                                                                         | Geen problemen ondervonden; alle knooppunten zijn één voor één volgens verwachting uitgevoerd.        |
| Mislukt       | Mislukt                                                                          | Mislukt omdat de knooppuntconfiguratie niet werd voldaan.                                             |
| Fout          | Fout                                                                             | Het knooppunt stuitte op een onverwerkte programmatische fout en werd voortijdig beëindigd.           |
| Geannuleerd   | Geannuleerd                                                                      | Een wachtend knooppunt is extern geannuleerd door de workflowbeheerder, waardoor het voortijdig werd beëindigd. |
| Geweigerd     | Geweigerd                                                                        | In een handmatig verwerkingsknooppunt is het handmatig geweigerd, waarna het verdere proces niet wordt voortgezet. |

In het voorbeeld van de [Snelle start](../getting-started.md) weten we al dat u door de details van de uitvoeringsgeschiedenis van een workflow te bekijken, kunt controleren of alle knooppunten normaal zijn uitgevoerd, evenals de uitvoeringsstatus en de resultaatgegevens van elk uitgevoerd knooppunt. In sommige geavanceerde workflows en knooppunten kan een knooppunt meerdere resultaten hebben, zoals het resultaat van een lus-knooppunt:

![Knooppuntresultaten van meerdere uitvoeringen](https://static-docs.nocobase.com/bbda259fa2ddf62b0fc0f982efbedae9.png)

:::info{title=Tip}
Workflows kunnen gelijktijdig worden geactiveerd, maar ze worden sequentieel in een wachtrij uitgevoerd. Zelfs als meerdere workflows tegelijkertijd worden geactiveerd, zullen ze één voor één worden uitgevoerd en niet parallel. Daarom betekent een status 'In wachtrij' dat er andere workflows actief zijn en dat er gewacht moet worden.

De status 'Bezig' geeft alleen aan dat het uitvoeringsplan is gestart en wordt meestal gepauzeerd vanwege de wachtstatus van een intern knooppunt. Het betekent niet dat dit uitvoeringsplan de uitvoeringsbronnen vooraan in de wachtrij heeft ingenomen. Daarom kunnen, wanneer er een 'Bezig' uitvoeringsplan is, andere 'In wachtrij' uitvoeringsplannen nog steeds worden ingepland om te starten.
:::

## Knooppuntuitvoeringsstatus

De status van een uitvoeringsplan wordt bepaald door de uitvoering van elk van de knooppunten. In een uitvoeringsplan na een trigger produceert elk knooppunt na uitvoering een uitvoeringsstatus, en deze status bepaalt of het verdere proces zal doorgaan. Normaal gesproken wordt, nadat een knooppunt succesvol is uitgevoerd, het volgende knooppunt uitgevoerd, totdat alle knooppunten achtereenvolgens zijn voltooid of het proces wordt onderbroken. Bij het tegenkomen van stroomregelingsgerelateerde knooppunten, zoals vertakkingen, lussen, parallelle vertakkingen, vertragingen, enz., wordt de uitvoeringsstroom naar het volgende knooppunt bepaald op basis van de geconfigureerde voorwaarden in het knooppunt en de runtime contextgegevens.

De mogelijke statussen van een knooppunt na uitvoering zijn als volgt:

| Status      | Is eindstatus | Beëindigt voortijdig | Betekenis                                                                                             |
| ----------- | :-----------: | :------------------: | ----------------------------------------------------------------------------------------------------- |
| Wachtend    |       Nee     |          Nee         | Het knooppunt vereist een pauze, wachtend op verdere invoer of een callback om verder te gaan.        |
| Voltooid    |       Ja      |          Nee         | Geen problemen ondervonden, succesvol uitgevoerd, en gaat verder naar het volgende knooppunt tot het einde. |
| Mislukt     |       Ja      |          Ja          | Mislukt omdat de knooppuntconfiguratie niet werd voldaan.                                             |
| Fout        |       Ja      |          Ja          | Het knooppunt stuitte op een onverwerkte programmatische fout en werd voortijdig beëindigd.           |
| Geannuleerd |       Ja      |          Ja          | Een wachtend knooppunt is extern geannuleerd door de workflowbeheerder, waardoor het voortijdig werd beëindigd. |
| Geweigerd   |       Ja      |          Ja          | In een handmatig verwerkingsknooppunt is het handmatig geweigerd, waarna het verdere proces niet wordt voortgezet. |

Behalve de status 'Wachtend' zijn alle andere statussen eindstatussen voor de knooppuntuitvoering. Alleen wanneer de eindstatus 'Voltooid' is, zal het proces doorgaan; anders wordt de gehele workflowuitvoering voortijdig beëindigd. Wanneer een knooppunt zich in een vertakkingsstroom bevindt (parallelle vertakking, voorwaarde, lus, enz.), wordt de eindstatus die door de uitvoering van het knooppunt wordt geproduceerd, afgehandeld door het knooppunt dat de vertakking heeft geïnitieerd, en dit bepaalt de stroom van de gehele workflow.

Als we bijvoorbeeld een voorwaardelijk knooppunt gebruiken in de modus "'Ja' om door te gaan", en het resultaat tijdens de uitvoering is "Nee", dan wordt de gehele workflow voortijdig beëindigd met de status "Mislukt", en worden volgende knooppunten niet uitgevoerd, zoals weergegeven in de onderstaande afbeelding:

![Knooppuntuitvoering mislukt](https://static-docs.nocobase.com/993aecfa1465894bb574444f0a44313e.png)

:::info{title=Tip}
Alle eindstatussen behalve 'Voltooid' kunnen als mislukkingen worden beschouwd, maar de redenen voor de mislukking verschillen. U kunt de uitvoeringsresultaten van het knooppunt bekijken om de oorzaak van de mislukking verder te begrijpen.
:::