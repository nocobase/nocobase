:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Aliyun OSS

Úložný engine založený na Aliyun OSS. Před použitím je nutné připravit příslušné účty a oprávnění.

## Konfigurace

![Příklad konfigurace Aliyun OSS](https://static-docs.nocobase.com/20240712220011.png)

:::info{title=Poznámka}
Zde jsou popsány pouze specifické parametry pro úložný engine Aliyun OSS. Obecné parametry naleznete v části [Obecné parametry enginu](./index.md#common-engine-parameters).
:::

### Oblast

Zadejte oblast úložiště OSS, například: `oss-cn-hangzhou`.

:::info{title=Poznámka}
Informace o oblasti úložiště si můžete prohlédnout v [konzoli Aliyun OSS](https://oss.console.aliyun.com/). Stačí použít pouze prefix oblasti (bez úplného názvu domény).
:::

### AccessKey ID

Zadejte ID autorizačního přístupového klíče Alibaba Cloud.

### AccessKey Secret

Zadejte Secret autorizačního přístupového klíče Alibaba Cloud.

### Název bucketu

Zadejte název OSS bucketu.