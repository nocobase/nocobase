:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Många-till-många

I ett kursregistreringssystem finns det två entiteter: studenter och kurser. En student kan registrera sig för flera kurser, och en kurs kan ha flera studenter registrerade, vilket utgör en många-till-många-relation. I en relationsdatabas används vanligtvis en mellanliggande samling, till exempel en registreringssamling, för att representera många-till-många-relationen mellan studenter och kurser. Denna samling kan registrera vilka kurser varje student har valt och vilka studenter som har registrerat sig för varje kurs. Denna design representerar effektivt många-till-många-relationen mellan studenter och kurser.

ER-diagram:

![alt text](https://static-docs.nocobase.com/0e9921228e1ee375dc639431bb89782c.png)

Fältkonfiguration:

![alt text](https://static-docs.nocobase.com/8e2739ac5d44fb46f30e2da42ca87a82.png)

## Parameterbeskrivning

### Source collection

Källsamlingen, det vill säga den samling där det aktuella fältet finns.

### Target collection

Målsamlingen, det vill säga den samling som ska associeras med.

### Through collection

Mellansamlingen, som används när en många-till-många-relation finns mellan två entiteter. Mellansamlingen har två främmande nycklar som används för att upprätthålla kopplingen mellan de två entiteterna.

### Source key

Källnyckeln, det fält i källsamlingen som refereras av den främmande nyckeln. Det måste vara unikt.

### Foreign key 1

Främmande nyckel 1, det fält i mellansamlingen som etablerar kopplingen till källsamlingen.

### Foreign key 2

Främmande nyckel 2, det fält i mellansamlingen som etablerar kopplingen till målsamlingen.

### Target key

Målnyckeln, det fält i målsamlingen som refereras av den främmande nyckeln. Det måste vara unikt.

### ON DELETE

`ON DELETE` avser de regler som tillämpas på främmande nyckelreferenser i relaterade underordnade samlingar när poster i den överordnade samlingen raderas. Det är ett alternativ som används när man definierar en främmande nyckelbegränsning. Vanliga `ON DELETE`-alternativ inkluderar:

- `CASCADE`: När en post i den överordnade samlingen raderas, raderas alla relaterade poster i den underordnade samlingen automatiskt.
- `SET NULL`: När en post i den överordnade samlingen raderas, ställs de främmande nyckelvärdena i de relaterade posterna i den underordnade samlingen in på `NULL`.
- `RESTRICT`: Standardalternativet, det förhindrar radering av en post i den överordnade samlingen om det finns relaterade poster i den underordnade samlingen.
- `NO ACTION`: Liknar `RESTRICT`, det förhindrar radering av en post i den överordnade samlingen om det finns relaterade poster i den underordnade samlingen.