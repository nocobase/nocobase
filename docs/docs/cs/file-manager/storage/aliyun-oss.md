:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Úložný engine: Aliyun OSS

Úložný engine založený na Aliyun OSS. Před použitím je nutné připravit si příslušný účet a oprávnění.

## Konfigurační parametry

![Příklad konfigurace úložného enginu Aliyun OSS](https://static-docs.nocobase.com/20240712220011.png)

:::info{title=Poznámka}
Tato sekce představuje pouze specifické parametry pro úložný engine Aliyun OSS. Obecné parametry naleznete v části [Obecné parametry enginu](./index#引擎通用参数).
:::

### Oblast

Zadejte oblast OSS úložiště, například: `oss-cn-hangzhou`.

:::info{title=Poznámka}
Informace o oblasti vašeho úložiště (bucketu) si můžete prohlédnout v [konzoli Aliyun OSS](https://oss.console.aliyun.com/). Stačí použít pouze prefix oblasti (není potřeba celé doménové jméno).
:::

### AccessKey ID

Zadejte ID vašeho přístupového klíče Aliyun.

### AccessKey Secret

Zadejte Secret vašeho přístupového klíče Aliyun.

### Úložiště (Bucket)

Zadejte název OSS bucketu.

### Časový limit

Zadejte časový limit pro nahrávání na Aliyun OSS, v milisekundách. Výchozí hodnota je `60000` milisekund (tj. 60 sekund).