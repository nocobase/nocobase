:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Gebeurtenis-flow

In FlowEngine zijn alle interfacecomponenten **gebeurtenisgestuurd (Event-driven)**.
Het gedrag, de interactie en de gegevenswijzigingen van componenten worden geactiveerd door gebeurtenissen en uitgevoerd via een flow.

## Statische Flow versus Dynamische Flow

Binnen FlowEngine kunnen flows in twee typen worden verdeeld:

### **1. Statische Flow (Static Flow)**

- Wordt door ontwikkelaars in code gedefinieerd;
- Werkt op **alle instanties van een Model-klasse**;
- Wordt vaak gebruikt voor de algemene logica van een Model-klasse;

### **2. Dynamische Flow (Dynamic Flow)**

- Wordt door gebruikers in de interface geconfigureerd;
- Is alleen van toepassing op een specifieke instantie;
- Wordt vaak gebruikt voor gepersonaliseerd gedrag in specifieke scenario's;

Kortom: **een statische flow is een logische sjabloon gedefinieerd op een klasse, terwijl een dynamische flow gepersonaliseerde logica is gedefinieerd op een instantie.**

## Koppelingsregels versus Dynamische Flow

Binnen het configuratiesysteem van FlowEngine zijn er twee manieren om gebeurtenislogica te implementeren:

### **1. Koppelingsregels (Linkage Rules)**

- Zijn **ingebouwde encapsulaties van gebeurtenis-flow stappen**;
- Eenvoudiger te configureren en semantisch sterker;
- In essentie zijn ze nog steeds een vereenvoudigde vorm van een **gebeurtenis-flow (Flow)**.

### **2. Dynamische Flow (Dynamic Flow)**

- Bieden volledige Flow-configuratiemogelijkheden;
- Aanpasbaar:
  - **Trigger (on)**: Definieert wanneer deze moet activeren;
  - **Uitvoeringsstappen (steps)**: Definieert de uit te voeren logica;
- Geschikt voor complexere en flexibelere bedrijfslogica.

Daarom geldt: **Koppelingsregels ≈ Vereenvoudigde Gebeurtenis-flow**, en hun kernmechanismen zijn consistent.

## Consistentie van FlowAction

Zowel **Koppelingsregels** als **Gebeurtenis-flows** zouden dezelfde set **FlowActions** moeten gebruiken.
Dat wil zeggen:

- **FlowAction** definieert de acties die door een Flow kunnen worden aangeroepen;
- Beide delen één actiesysteem, in plaats van twee afzonderlijke te implementeren;
- Dit zorgt voor hergebruik van logica en consistente uitbreiding.

## Conceptuele Hiërarchie

Conceptueel gezien is de kernabstracte relatie van FlowModel als volgt:

```bash
FlowModel
 └── FlowDefinition
      ├── FlowEventDefinition
      │     ├── Globale Gebeurtenissen
      │     └── Lokale Gebeurtenissen
      └── FlowActionDefinition
            ├── Globale Acties
            └── Lokale Acties
```

### Hiërarchie Beschrijving

- **FlowModel**
  Vertegenwoordigt een modelentiteit met configureerbare en uitvoerbare flow-logica.

- **FlowDefinition**
  Definieert een complete set flow-logica (inclusief triggercondities en uitvoeringsstappen).

- **FlowEventDefinition**
  Definieert de triggerbron van de flow, inclusief:
  - **Globale gebeurtenissen**: zoals het opstarten van de applicatie, het voltooien van het laden van gegevens;
  - **Lokale gebeurtenissen**: zoals veldwijzigingen, knopklikken.

- **FlowActionDefinition**
  Definieert de uitvoerbare acties van de flow, inclusief:
  - **Globale acties**: zoals het verversen van de pagina, globale meldingen;
  - **Lokale acties**: zoals het wijzigen van veldwaarden, het schakelen van componentstatussen.

## Samenvatting

| Concept | Doel | Bereik |
|---|---|---|
| **Statische Flow (Static Flow)** | Flow-logica gedefinieerd in code | Alle instanties van XXModel |
| **Dynamische Flow (Dynamic Flow)** | Flow-logica gedefinieerd in de interface | Eén enkele FlowModel-instantie |
| **FlowEvent** | Definieert de trigger (wanneer te activeren) | Globaal of lokaal |
| **FlowAction** | Definieert de uitvoeringslogica | Globaal of lokaal |
| **Koppelingsregel (Linkage Rule)** | Vereenvoudigde encapsulatie van gebeurtenis-flow stappen | Blok-, Actieniveau |