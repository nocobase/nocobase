:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Obligatorisk

## Introduktion

Obligatorisk är en vanlig regel för formulärvalidering. Ni kan aktivera den direkt i fältkonfigurationen, eller dynamiskt ställa in ett fält som obligatoriskt via formulärets kopplingsregler.

## Var kan ni ställa in ett fält som obligatoriskt?

### Inställningar för samlingsfält

När ett samlingsfält är inställt som obligatoriskt utlöser det backend-validering, och frontend visar det också som obligatoriskt som standard (kan inte ändras).
![20251025175418](https://static-docs.nocobase.com/20251025175418.png)

### Fältinställningar

Ställ in ett fält direkt som obligatoriskt. Detta är lämpligt för fält som alltid måste fyllas i av användaren, såsom användarnamn, lösenord, etc.

![20251028222818](https://static-docs.nocobase.com/20251028222818.png)

### Kopplingsregler

Ställ in ett fält som obligatoriskt baserat på villkor via formulärblockets fältkopplingsregler.

Exempel: Ordernumret är obligatoriskt när orderdatumet inte är tomt.

![20251028223004](https://static-docs.nocobase.com/20251028223004.png)

### Arbetsflöde