:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Lagringsmotor: Lokal lagring

Uppladdade filer sparas i en lokal katalog på serverns hårddisk. Detta passar bra för scenarier där systemet hanterar en liten total volym av uppladdade filer, eller för experimentella syften.

## Konfigurationsparametrar

![Exempel på konfiguration av fillagringsmotor](https://static-docs.nocobase.com/20240529115151.png)

:::info{title=Obs!}
Det här avsnittet presenterar endast parametrar som är specifika för den lokala lagringsmotorn. För allmänna parametrar, se [Allmänna motorparametrar](./index.md#引擎通用参数).
:::

### Sökväg

Beskriver både den relativa sökvägen för fillagring på servern och URL-åtkomstsökvägen. Till exempel representerar ”`user/avatar`” (utan inledande eller avslutande snedstreck ”`/`”):

1. Den relativa sökvägen på servern där uppladdade filer lagras: `/path/to/nocobase-app/storage/uploads/user/avatar`.
2. URL-prefixet för åtkomst till filerna: `http://localhost:13000/storage/uploads/user/avatar`.