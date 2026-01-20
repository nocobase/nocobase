:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Úložný engine: Amazon S3

Úložný engine založený na Amazon S3. Před použitím je nutné připravit příslušný účet a oprávnění.

## Konfigurační parametry

![Příklad konfigurace úložného enginu Amazon S3](https://static-docs.nocobase.com/20251031092524.png)

:::info{title=Tip}
Tato sekce představuje pouze parametry specifické pro úložný engine Amazon S3. Obecné parametry naleznete v části [Obecné parametry enginu](./index#引擎通用参数).
:::

### Region

Zadejte region S3 úložiště, například: `us-west-1`.

:::info{title=Tip}
Informace o regionu vašeho úložiště si můžete prohlédnout v [konzoli Amazon S3](https://console.aws.amazon.com/s3/). Stačí použít pouze prefix regionu (není potřeba zadávat celou doménu).
:::

### AccessKey ID

Zadejte AccessKey ID pro autorizovaný přístup k Amazon S3.

### AccessKey Secret

Zadejte AccessKey Secret pro autorizovaný přístup k Amazon S3.

### Úložiště

Zadejte název S3 úložiště.