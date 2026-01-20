:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Keuzelijst

## Introductie

De keuzelijst ondersteunt het koppelen van gegevens door te kiezen uit bestaande gegevens in de doel-*collectie*, of door nieuwe gegevens toe te voegen aan de doel-*collectie* en deze vervolgens te koppelen. De opties in de keuzelijst ondersteunen ook vrij zoeken.

![20251029205901](https://static-docs.nocobase.com/20251029205901.png)

## Veldconfiguratie

### Gegevensbereik instellen

Hiermee bepaalt u het gegevensbereik van de keuzelijst.

![20251029210025](https://static-docs.nocobase.com/20251029210025.png)

Meer informatie vindt u in [Gegevensbereik instellen](/interface-builder/fields/field-settings/data-scope)

### Sorteerregels instellen

Hiermee bepaalt u de sortering van de gegevens in de keuzelijst.

Voorbeeld: Sorteren op servicedatum in aflopende volgorde.

![20251029210105](https://static-docs.nocobase.com/20251029210105.png)

### Meerdere records toevoegen/koppelen toestaan

Beperkt de mogelijkheid om meerdere records te koppelen in een 'veel-op-veel'-relatie tot slechts één record.

![20251029210145](https://static-docs.nocobase.com/20251029210145.png)

### Titelveld

Het titelveld is het veld dat als label wordt weergegeven in de opties.

![20251029210507](https://static-docs.nocobase.com/20251029210507.gif)

> Ondersteunt snel zoeken op basis van het titelveld.

Meer informatie vindt u in [Titelveld](/interface-builder/fields/field-settings/title-field)

### Snel aanmaken: Eerst toevoegen, dan selecteren

![20251125220046](https://static-docs.nocobase.com/20251125220046.png)

#### Toevoegen via keuzelijst

Nadat u een nieuw record heeft aangemaakt in de doel-*collectie*, selecteert het systeem dit automatisch en koppelt het zodra het formulier wordt ingediend.

In het voorbeeld hieronder heeft de *collectie* 'Orders' een 'veel-op-één'-relatieveld **"Account"**.

![20251125220447](https://static-docs.nocobase.com/20251125220447.gif)

#### Toevoegen via pop-upvenster

Toevoegen via een pop-upvenster is geschikt voor complexere invoerscenario's en stelt u in staat een aangepast formulier te configureren voor het aanmaken van nieuwe records.

![20251125220607](https://static-docs.nocobase.com/20251125220607.gif)

[Veldcomponent](/interface-builder/fields/association-field)