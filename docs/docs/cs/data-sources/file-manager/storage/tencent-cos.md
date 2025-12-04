:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Tencent COS

Úložný engine založený na Tencent Cloud COS. Před použitím je nutné připravit odpovídající účet a oprávnění.

## Možnosti konfigurace

![Příklad nastavení úložného enginu Tencent COS](https://static-docs.nocobase.com/20240712222125.png)

:::info{title=Tip}
Tato sekce se věnuje pouze specifickým možnostem úložného enginu Tencent Cloud COS. Obecné parametry naleznete v části [Obecné parametry enginu](./index.md#common-engine-parameters).
:::

### Oblast

Zde vyplňte oblast, kde je uloženo COS úložiště, například: `ap-chengdu`.

:::info{title=Tip}
Informace o oblasti úložného kbelíku (bucketu) si můžete prohlédnout v [konzoli Tencent Cloud COS](https://console.cloud.tencent.com/cos). Stačí zkopírovat pouze prefix oblasti (není potřeba celý název domény).
:::

### SecretId

Vyplňte ID autorizačního přístupového klíče Tencent Cloud.

### SecretKey

Vyplňte Secret autorizačního přístupového klíče Tencent Cloud.

### Bucket

Vyplňte název COS kbelíku (bucketu), například: `qing-cdn-1234189398`.