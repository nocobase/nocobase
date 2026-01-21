:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Integrace

## Přehled

NocoBase nabízí komplexní integrační možnosti, které umožňují bezproblémové propojení s externími systémy, službami třetích stran a různými zdroji dat. Díky flexibilním integračním metodám můžete rozšířit funkčnost NocoBase tak, aby vyhovovala rozmanitým obchodním potřebám.

## Metody integrace

### Integrace API

NocoBase poskytuje výkonné možnosti API pro integraci s externími aplikacemi a službami:

![20250301003106](https://static-docs.nocobase.com/20250301003106.png)

- **[Klíče API](/integration/api-keys/)**: Použijte klíče API pro bezpečné ověřování a programový přístup k prostředkům NocoBase.
- **[Dokumentace API](/integration/api-doc/)**: Vestavěná dokumentace API pro zkoumání a testování koncových bodů.

### Jednotné přihlášení (SSO)

Integrujte se s podnikovými identitními systémy pro jednotné ověřování:

![auth_sso-2025-11-24-08-26-46](https://static-docs.nocobase.com/auth_sso-2025-11-24-08-26-46.png)

- **[Integrace SSO](/integration/sso/)**: Podporuje ověřování SAML, OIDC, CAS, LDAP a platforem třetích stran.
- Centralizovaná správa uživatelů a řízení přístupu.
- Bezproblémové ověřování napříč systémy.

### Integrace pracovních postupů

Propojte pracovní postupy NocoBase s externími systémy:

![auth_sso-2025-11-24-12-02-01](https://static-docs.nocobase.com/auth_sso-2025-11-24-12-02-01.png)

- **[Webhook pracovního postupu](/integration/workflow-webhook/)**: Přijímejte události z externích systémů pro spouštění pracovních postupů.
- **[HTTP požadavek pracovního postupu](/integration/workflow-http-request/)**: Odesílejte HTTP požadavky na externí API z pracovních postupů.
- Automatizujte obchodní procesy napříč platformami.

### Externí zdroje dat

Připojte se k externím databázím a datovým systémům:

![20240512085558](https://static-docs.nocobase.com/20240512085558.png)

- **[Externí databáze](/data-sources/)**: Přímé připojení k databázím MySQL, PostgreSQL, MariaDB, MSSQL, Oracle a KingbaseES.
- Rozpoznání struktur tabulek externích databází a provádění operací CRUD s externími daty přímo v NocoBase.
- Jednotné rozhraní pro správu dat.

### Vložený obsah

Vkládejte externí obsah do NocoBase:

![20240408220322](https://static-docs.nocobase.com/20240408220322.png)

- **[Iframe blok](/integration/block-iframe/)**: Vkládání externích webových stránek a aplikací.
- **JS bloky**: Spouštění vlastního JavaScript kódu pro pokročilé integrace.

## Běžné scénáře integrace

### Integrace podnikových systémů

- Propojte NocoBase s ERP, CRM nebo jinými podnikovými systémy.
- Obousměrná synchronizace dat.
- Automatizace pracovních postupů napříč systémy.

### Integrace služeb třetích stran

- Dotazování stavu plateb z platebních bran, integrace zprávových služeb nebo cloudových platforem.
- Využití externích API pro rozšíření funkcionality.
- Vytváření vlastních integrací pomocí webhooků a HTTP požadavků.

### Integrace dat

- Připojení k více zdrojům dat.
- Agregace dat z různých systémů.
- Vytváření jednotných dashboardů a reportů.

## Bezpečnostní aspekty

Při integraci NocoBase s externími systémy zvažte následující osvědčené bezpečnostní postupy:

1.  **Používejte HTTPS**: Vždy používejte šifrovaná připojení pro přenos dat.
2.  **Chraňte klíče API**: Bezpečně ukládejte klíče API a pravidelně je obměňujte.
3.  **Princip nejmenších oprávnění**: Udělujte pouze nezbytná oprávnění pro integrace.
4.  **Auditní záznamy**: Monitorujte a zaznamenávejte integrační aktivity.
5.  **Validace dat**: Ověřujte všechna data z externích zdrojů.