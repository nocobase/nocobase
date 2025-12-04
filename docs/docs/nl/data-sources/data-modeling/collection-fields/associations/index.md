:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Relatievelden

In NocoBase zijn relatievelden geen echte velden, maar worden ze gebruikt om verbindingen tussen collecties tot stand te brengen. Dit concept is vergelijkbaar met relaties in relationele databases.

In relationele databases zijn de meest voorkomende relatietypen de volgende:

- [Eén-op-één](./o2o/index.md): Elke entiteit in twee collecties komt overeen met slechts één entiteit in de andere collectie. Dit type relatie wordt meestal gebruikt om verschillende aspecten van een entiteit in afzonderlijke collecties op te slaan om redundantie te verminderen en de gegevensconsistentie te verbeteren.
- [Eén-op-veel](./o2m/index.md): Elke entiteit in de ene collectie kan gekoppeld zijn aan meerdere entiteiten in een andere collectie. Dit is een van de meest voorkomende relatietypen. Een auteur kan bijvoorbeeld meerdere artikelen schrijven, maar een artikel heeft slechts één auteur.
- [Veel-op-één](./m2o/index.md): Meerdere entiteiten in de ene collectie kunnen gekoppeld zijn aan één entiteit in een andere collectie. Dit type relatie komt ook veel voor in datamodellering. Meerdere studenten kunnen bijvoorbeeld tot dezelfde klas behoren.
- [Veel-op-veel](./m2m/index.md): Meerdere entiteiten in twee collecties kunnen met elkaar verbonden zijn. Dit type relatie vereist doorgaans een tussenliggende collectie om de koppelingen tussen de entiteiten vast te leggen. Denk bijvoorbeeld aan de relatie tussen studenten en cursussen: een student kan zich inschrijven voor meerdere cursussen, en een cursus kan door meerdere studenten gevolgd worden.

Deze relatietypen spelen een belangrijke rol in databasedesign en datamodellering, en helpen bij het beschrijven van complexe relaties en datastructuren uit de echte wereld.