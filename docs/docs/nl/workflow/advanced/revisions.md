:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Versiebeheer

Nadat een geconfigureerde workflow minstens één keer is geactiveerd, moet u, als u de configuratie van de workflow of de bijbehorende knooppunten wilt wijzigen, eerst een nieuwe versie aanmaken voordat u wijzigingen aanbrengt. Dit zorgt er tevens voor dat de uitvoeringsgeschiedenis van eerder geactiveerde workflows niet wordt beïnvloed door toekomstige aanpassingen.

Op de configuratiepagina van de workflow kunt u de bestaande workflowversies bekijken via het versiemenu rechtsboven.

![Workflowversies bekijken](https://static-docs.nocobase.com/ad93d2c08166b0e3e643fb148713a63f.png)

In het menu 'Meer acties' ("...") aan de rechterkant kunt u ervoor kiezen om de momenteel bekeken versie te kopiëren naar een nieuwe versie.

![Workflow kopiëren naar een nieuwe versie](https://static-docs.nocobase.com/2805798e6caca2af004893390a744256.png)

Nadat u naar een nieuwe versie hebt gekopieerd, klikt u op de schakelaar "Inschakelen"/"Uitschakelen" om de betreffende versie naar de ingeschakelde status te schakelen, waarna de nieuwe workflowversie actief wordt.

Als u een oudere versie opnieuw wilt selecteren, schakelt u ernaar over via het versiemenu en klikt u vervolgens opnieuw op de schakelaar "Inschakelen"/"Uitschakelen" om deze naar de ingeschakelde status te schakelen. De momenteel bekeken versie wordt dan actief, en volgende triggers zullen het proces van die versie uitvoeren.

Wanneer u de workflow wilt uitschakelen, klikt u op de schakelaar "Inschakelen"/"Uitschakelen" om deze naar de uitgeschakelde status te schakelen, waarna de workflow niet langer wordt geactiveerd.

:::info{title=Tip}
In tegenstelling tot het "Kopiëren" van een workflow vanuit de workflowbeheerlijst, blijft een workflow die "naar een nieuwe versie is gekopieerd" gegroepeerd onder dezelfde workflowset, alleen onderscheiden door de versie. Het kopiëren van een workflow wordt echter behandeld als een volledig nieuwe workflow, onafhankelijk van de versies van de vorige workflow, en de uitvoeringsaantallen worden ook gereset naar nul.
:::