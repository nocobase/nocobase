:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Lokal lagring

Uppladdade filer sparas i en lokal katalog på servern. Detta lämpar sig för scenarier där systemet hanterar en relativt liten total mängd uppladdade filer, eller för experimentella ändamål.

## Konfigurationsparametrar

![Exempel på inställningar för fillagringsmotorn](https://static-docs.nocobase.com/20240529115151.png)

:::info{title=Tips}
Detta avsnitt behandlar endast de specifika parametrarna för den lokala lagringsmotorn. För allmänna parametrar, se [Allmänna motorparametrar](./index.md#general-engine-parameters).
:::

### Sökväg

Sökvägen anger både den relativa sökvägen för filen som lagras på servern och URL-åtkomstsökvägen. Till exempel representerar ”`user/avatar`” (utan inledande och avslutande ”`/`”):

1. Den relativa sökvägen för den uppladdade filen som lagras på servern: `/path/to/nocobase-app/storage/uploads/user/avatar`.
2. URL-prefixet för åtkomst till filen: `http://localhost:13000/storage/uploads/user/avatar`.