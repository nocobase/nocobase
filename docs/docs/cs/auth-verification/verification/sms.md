---
pkg: '@nocobase/plugin-verification'
---
:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::

# Ověření: SMS

## Úvod

SMS ověřovací kód je vestavěný typ ověření, který slouží k vygenerování jednorázového dynamického hesla (OTP) a jeho odeslání uživateli prostřednictvím SMS zprávy.

## Přidání SMS ověřovače

Přejděte na stránku správy ověření.

![](https://static-docs.nocobase.com/202502271726791.png)

Přidat - SMS OTP

![](https://static-docs.nocobase.com/202502271726056.png)

## Konfigurace administrátorem

![](https://static-docs.nocobase.com/202502271727711.png)

V současné době jsou podporováni tito poskytovatelé SMS služeb:

- <a href="https://www.aliyun.com/product/sms" target="_blank">Aliyun SMS</a>
- <a href="https://cloud.tencent.com/product/sms" target="_blank">Tencent Cloud SMS</a>

Při konfiguraci SMS šablony v administraci poskytovatele služeb je nutné vyhradit parametr pro ověřovací kód.

- Příklad konfigurace Aliyun: `Váš ověřovací kód je: ${code}`

- Příklad konfigurace Tencent Cloud: `Váš ověřovací kód je: {1}`

Vývojáři mohou také rozšířit podporu pro další poskytovatele SMS služeb ve formě pluginů. Viz: [Rozšíření poskytovatelů SMS služeb](./dev/sms-type)

## Navázání uživatele

Po přidání ověřovače si uživatelé mohou navázat telefonní číslo v rámci své osobní správy ověření.

![](https://static-docs.nocobase.com/202502271737016.png)

![](https://static-docs.nocobase.com/202502271737769.png)

![](https://static-docs.nocobase.com/202502271738515.png)

Po úspěšném navázání lze provést ověření identity v jakémkoli scénáři, který tento ověřovač používá.

![](https://static-docs.nocobase.com/202502271739607.png)

## Zrušení navázání uživatele

Zrušení navázání telefonního čísla vyžaduje ověření prostřednictvím již navázané metody ověření.

![](https://static-docs.nocobase.com/202502282103205.png)