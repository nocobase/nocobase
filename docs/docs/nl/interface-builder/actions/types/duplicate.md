---

pkg: '@nocobase/plugin-action-duplicate'

---

:::tip{title="AI-vertaalmelding"}
Dit document is vertaald door AI. Raadpleeg de [Engelse versie](/interface-builder/actions/types/duplicate) voor nauwkeurige informatie.
:::

# Dupliceren

## Introductie

De actie "Dupliceren" stelt gebruikers in staat om snel nieuwe records aan te maken op basis van bestaande gegevens. Het ondersteunt twee duplicatiemodi: **Direct dupliceren** en **Dupliceren naar formulier en verder invullen**.

## Installatie

Dit is een ingebouwde plugin, er is geen extra installatie vereist.

## Duplicatiemodus

![20260209224344](https://static-docs.nocobase.com/20260209224344.png)

### Direct dupliceren

![20260209224506](https://static-docs.nocobase.com/20260209224506.png)

- Wordt standaard uitgevoerd als "Direct dupliceren";
- **Sjabloonvelden**: Geef de velden op die moeten worden gedupliceerd. "Alles selecteren" wordt ondersteund. Dit is een verplichte configuratie.

![20260209225910](https://static-docs.nocobase.com/20260209225910.gif)

Klik na de configuratie op de knop om de gegevens te dupliceren.

### Dupliceren naar formulier en verder invullen

De geconfigureerde sjabloonvelden worden als **standaardwaarden** in het formulier ingevuld. Gebruikers kunnen deze waarden wijzigen voordat ze het formulier indienen om de duplicatie te voltooien.

![20260209224704](https://static-docs.nocobase.com/20260209224704.png)

**Sjabloonvelden configureren**: Alleen de geselecteerde velden worden overgenomen als standaardwaarden.

![20260209225148](https://static-docs.nocobase.com/20260209225148.png)

#### Formuliervelden synchroniseren

- Analyseert automatisch de velden die al in het huidige formulierblok zijn geconfigureerd als sjabloonvelden;
- Als de velden van het formulierblok later worden gewijzigd (bijv. het aanpassen van componenten voor relatievelden), moet u de sjabloonconfiguratie opnieuw openen en op **Formuliervelden synchroniseren** klikken om consistentie te waarborgen.

![20260209225450](https://static-docs.nocobase.com/20260209225450.gif)

De sjabloongegevens worden ingevuld als standaardwaarden voor het formulier, en gebruikers kunnen deze na wijziging indienen om de duplicatie te voltooien.

### Aanvullende opmerkingen

#### Dupliceren, Refereren, Voorladen

Verschillende veldtypen (relatietypen) hebben verschillende verwerkingslogica: **Dupliceren / Refereren / Voorladen**. De **veldcomponent** van een relatieveld beïnvloedt deze logica ook:

- Selectie / Record picker: Gebruikt voor **Refereren**
- Sub-formulier / Sub-tabel: Gebruikt voor **Dupliceren**

**Dupliceren**

- Normale velden worden gedupliceerd;
- `hasOne` / `hasMany` kunnen alleen worden gedupliceerd (deze relaties mogen geen selectiecomponenten zoals "Selectie" of "Record picker" gebruiken; gebruik in plaats daarvan componenten zoals "Sub-formulier" of "Sub-tabel");
- Het wijzigen van de component voor `hasOne` / `hasMany` zal de verwerkingslogica **niet** veranderen (het blijft Dupliceren);
- Voor gedupliceerde relatievelden kunnen alle subvelden worden geselecteerd.

**Refereren**

- `belongsTo` / `belongsToMany` worden behandeld als Refereren;
- Als de veldcomponent wordt gewijzigd van "Selectie" naar "Sub-formulier", verandert de relatie van **Refereren naar Dupliceren** (zodra het Dupliceren wordt, worden alle subvelden selecteerbaar).

**Voorladen**

- Relatievelden onder een referentieveld worden behandeld als Voorladen;
- Voorlaadvelden kunnen na een componentwijziging veranderen in Refereren of Dupliceren.

#### Alles selecteren

- Selecteert alle **Duplicatievelden** en **Referentievelden**.

#### De volgende velden worden uitgefilterd uit het record dat als gegevenssjabloon is geselecteerd:

- Primaire sleutels van gedupliceerde relatiegegevens worden gefilterd; primaire sleutels voor Refereren en Voorladen worden niet gefilterd;
- Vreemde sleutels (Foreign keys);
- Velden die geen duplicaten toestaan (Uniek);
- Sorteervelden;
- Automatische codeervelden (Sequence fields);
- Wachtwoord;
- Gemaakt door, Gemaakt op;
- Laatst bijgewerkt door, Bijgewerkt op.

#### Formuliervelden synchroniseren

- Analyseert automatisch de velden die in het huidige formulierblok zijn geconfigureerd naar sjabloonvelden;
- Na het wijzigen van formulierblokvelden (bijv. het aanpassen van componenten voor relatievelden), moet u opnieuw synchroniseren om consistentie te waarborgen.