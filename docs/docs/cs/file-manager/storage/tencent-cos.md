:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Tencent Cloud COS

Úložný engine založený na Tencent Cloud COS. Před použitím je nutné připravit příslušný účet a oprávnění.

## Parametry konfigurace

![Příklad konfigurace úložného enginu Tencent COS](https://static-docs.nocobase.com/20240712222125.png)

:::info{title=Poznámka}
Tato sekce představuje pouze specifické parametry pro úložný engine Tencent Cloud COS. Obecné parametry naleznete v části [Obecné parametry enginu](./index.md#obecne-parametry-enginu).
:::

### Oblast

Zadejte oblast pro úložiště COS, například: `ap-chengdu`.

:::info{title=Poznámka}
Informace o oblasti vašeho úložiště můžete zobrazit v [konzoli Tencent Cloud COS](https://console.cloud.tencent.com/cos). Potřebujete použít pouze předponu oblasti (nikoli celou doménu).
:::

### SecretId

Zadejte ID vašeho přístupového klíče Tencent Cloud.

### SecretKey

Zadejte Secret vašeho přístupového klíče Tencent Cloud.

### Úložiště

Zadejte název úložiště COS, například: `qing-cdn-1234189398`.