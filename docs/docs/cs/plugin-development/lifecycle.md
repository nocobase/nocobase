:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Životní cyklus

Tato sekce popisuje háčky životního cyklu pluginů na straně serveru i klienta, aby pomohla vývojářům správně registrovat a uvolňovat zdroje.

Můžete porovnat s životním cyklem FlowModel, abyste zdůraznili společné koncepty.

## Doporučený obsah

- Zpětná volání spouštěná při instalaci, povolení, zakázání nebo odinstalaci pluginů.
- Načasování připojení, aktualizace a zničení komponent na straně klienta.
- Doporučení pro zpracování asynchronních úloh a chyb v rámci životního cyklu.