:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Fältlänkningsregler

## Introduktion

Fältlänkningsregler gör det möjligt att dynamiskt justera tillståndet för fält i formulär- och detaljblock baserat på användaråtgärder. De block som för närvarande stöder fältlänkningsregler är:

- [Formulärblock](/interface-builder/blocks/data-blocks/form)
- [Detaljblock](/interface-builder/blocks/data-blocks/details)
- [Underformulär](/interface-builder/fields/specific/sub-form)

## Användningsinstruktioner

### **Formulärblock**

I ett formulärblock kan länkningsregler dynamiskt justera fältens beteende baserat på specifika villkor:

- **Styra fältets synlighet (visa/dölj)**: Bestäm om det aktuella fältet ska visas baserat på värdena i andra fält.
- **Ange fält som obligatoriskt**: Ställ dynamiskt in ett fält som obligatoriskt eller valfritt under specifika förhållanden.
- **Tilldela värde**: Tilldela automatiskt ett värde till ett fält baserat på villkor.
- **Kör specificerad JavaScript**: Skriv JavaScript enligt affärsbehov.

### **Detaljblock**

I ett detaljblock används länkningsregler främst för att dynamiskt styra synligheten (visa/dölj) för fält i blocket.

![20251029114859](https://static-docs.nocobase.com/20251029114859.png)

## Egenskapslänkning

### Tilldela värde

Exempel: När en order markeras som en tilläggsorder tilldelas orderstatusen automatiskt värdet "Väntar på granskning".

![20251029115348](https://static-docs.nocobase.com/20251029115348.png)

### Obligatoriskt

Exempel: När orderstatusen är "Betald" är fältet för orderbelopp obligatoriskt.

![20251029115031](https://static-docs.nocobase.com/20251029115031.png)

### Visa/Dölj

Exempel: Betalningskonto och totalbelopp visas endast när orderstatusen är "Väntar på betalning".

![20251030223710](https://static-docs.nocobase.com/20251030223710.png)

![20251030223801](https://static-docs.nocobase.com/20251030223801.gif)