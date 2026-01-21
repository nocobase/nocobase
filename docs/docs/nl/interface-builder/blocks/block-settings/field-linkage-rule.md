:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Veldkoppelingsregels

## Introductie

Veldkoppelingsregels maken het mogelijk om de status van velden in formulier-/detailblokken dynamisch aan te passen op basis van gebruikersacties. Momenteel ondersteunen de volgende blokken veldkoppelingsregels:

- [Formulierblok](/interface-builder/blocks/data-blocks/form)
- [Detailblok](/interface-builder/blocks/data-blocks/details)
- [Subformulier](/interface-builder/fields/specific/sub-form)

## Gebruiksaanwijzing

### **Formulierblok**

In een formulierblok kunt u met koppelingsregels het gedrag van velden dynamisch aanpassen op basis van specifieke voorwaarden:

- **De zichtbaarheid van velden beheren (tonen/verbergen)**: Bepaal of het huidige veld wordt weergegeven op basis van de waarden van andere velden.
- **Velden als verplicht instellen**: Stel een veld dynamisch in als verplicht of optioneel onder specifieke voorwaarden.
- **Waarde toewijzen**: Wijs automatisch een waarde toe aan een veld op basis van voorwaarden.
- **Specifieke JavaScript uitvoeren**: Schrijf JavaScript volgens de bedrijfsvereisten.

### **Detailblok**

In een detailblok worden koppelingsregels voornamelijk gebruikt om de zichtbaarheid (tonen/verbergen) van velden op het blok dynamisch te beheren.

![20251029114859](https://static-docs.nocobase.com/20251029114859.png)

## Eigenschapskoppeling

### Waarde toewijzen

Voorbeeld: Wanneer een bestelling is gemarkeerd als een aanvullende bestelling, wordt de bestelstatus automatisch ingesteld op 'In afwachting van beoordeling'.

![20251029115348](https://static-docs.nocobase.com/20251029115348.png)

### Verplicht

Voorbeeld: Wanneer de bestelstatus 'Betaald' is, is het veld voor het bestelbedrag verplicht.

![20251029115031](https://static-docs.nocobase.com/20251029115031.png)

### Tonen/Verbergen

Voorbeeld: Het betaalaccount en het totaalbedrag worden alleen weergegeven wanneer de bestelstatus 'In afwachting van betaling' is.

![20251030223710](https://static-docs.nocobase.com/20251030223710.png)

![20251030223801](https://static-docs.nocobase.com/20251030223801.gif)