---
pkg: "@nocobase/plugin-email-manager"
---
:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::

# Proces konfigurace

## Přehled
Po aktivaci pluginu pro e-maily musí administrátoři nejprve dokončit nezbytnou konfiguraci, než budou moci běžní uživatelé připojit své e-mailové účty k NocoBase. (V současné době je podporováno pouze autorizované přihlášení pro účty Outlook a Gmail; přímé přihlášení pomocí účtů Microsoft a Google zatím není k dispozici.)

Jádrem konfigurace jsou nastavení ověřování pro volání API poskytovatele e-mailových služeb. Administrátoři musí provést následující kroky, aby zajistili správnou funkci pluginu:

1.  **Získání ověřovacích informací od poskytovatele služby**
    -   Přihlaste se do vývojářské konzole poskytovatele e-mailových služeb (např. Google Cloud Console nebo Microsoft Azure Portal).
    -   Vytvořte novou aplikaci nebo projekt a povolte službu API pro Gmail nebo Outlook.
    -   Získejte odpovídající ID klienta (Client ID) a tajný klíč klienta (Client Secret).
    -   Nakonfigurujte URI pro přesměrování tak, aby odpovídalo adrese zpětného volání pluginu NocoBase.

2.  **Konfigurace poskytovatele e-mailových služeb**
    -   Přejděte na konfigurační stránku pluginu pro e-maily.
    -   Zadejte požadované ověřovací informace API, včetně ID klienta (Client ID) a tajného klíče klienta (Client Secret), abyste zajistili správné ověření u poskytovatele e-mailových služeb.

3.  **Autorizované přihlášení**
    -   Uživatelé se přihlašují ke svým e-mailovým účtům prostřednictvím protokolu OAuth.
    -   Plugin automaticky vygeneruje a uloží autorizační token uživatele pro následná volání API a e-mailové operace.

4.  **Připojení e-mailových účtů**
    -   Po úspěšné autorizaci bude e-mailový účet uživatele připojen k NocoBase.
    -   Plugin synchronizuje e-mailová data uživatele a poskytuje funkce pro správu, odesílání a přijímání e-mailů.

5.  **Používání e-mailových funkcí**
    -   Uživatelé mohou přímo v platformě prohlížet, spravovat a odesílat e-maily.
    -   Všechny operace jsou prováděny prostřednictvím volání API poskytovatele e-mailových služeb, což zajišťuje synchronizaci v reálném čase a efektivní přenos.

Prostřednictvím výše popsaného procesu poskytuje plugin NocoBase pro e-maily uživatelům efektivní a bezpečné služby správy e-mailů. Pokud narazíte na jakékoli problémy během konfigurace, prostudujte si prosím příslušnou dokumentaci nebo kontaktujte tým technické podpory.

## Konfigurace pluginu

### Aktivace pluginu pro e-maily

1.  Přejděte na stránku správy pluginů
2.  Najděte plugin "Email manager" a aktivujte jej

### Konfigurace poskytovatele e-mailových služeb

Po aktivaci pluginu pro e-maily můžete konfigurovat poskytovatele e-mailových služeb. V současné době jsou podporovány e-mailové služby Google a Microsoft. Klikněte na "Nastavení" -> "Nastavení e-mailu" v horní liště, abyste se dostali na stránku nastavení.

![](https://static-docs.nocobase.com/mail-1733818617187.png)

![](https://static-docs.nocobase.com/mail-1733818617514.png)

Pro každého poskytovatele služby je třeba vyplnit ID klienta (Client ID) a tajný klíč klienta (Client Secret). Následující sekce podrobně popíší, jak tyto dva parametry získat.