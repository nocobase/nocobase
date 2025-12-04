---
pkg: '@nocobase/plugin-acl'
---
:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::


# Konfigurera behörigheter

## Allmänna behörighetsinställningar

![](https://static-docs.nocobase.com/119a9650259f9be71210121d0d3a435d.png)

### Konfigurationsbehörigheter

1.  **Tillåter att konfigurera gränssnittet**: Denna behörighet styr om en användare får konfigurera gränssnittet. När den aktiveras visas en knapp för UI-konfiguration. Rollen "admin" har denna behörighet aktiverad som standard.
2.  **Tillåter att installera, aktivera, inaktivera plugin**: Denna behörighet avgör om en användare kan aktivera eller inaktivera plugin. När den är aktiv får användaren tillgång till gränssnittet för plugin-hanteraren. Rollen "admin" har denna behörighet aktiverad som standard.
3.  **Tillåter att konfigurera plugin**: Denna behörighet låter användaren konfigurera plugin-parametrar eller hantera plugin-backenddata. Rollen "admin" har denna behörighet aktiverad som standard.
4.  **Tillåter att rensa cache, starta om applikationen**: Denna behörighet är kopplad till systemunderhållsuppgifter som att rensa cacheminnet och starta om applikationen. När den aktiverats visas relaterade åtgärdsknappar i personliga inställningar. Denna behörighet är inaktiverad som standard.
5.  **Nya menyalternativ tillåts åtkomst som standard**: Nyskapade menyalternativ är åtkomliga som standard, och denna inställning är aktiverad som standard.

### Globala åtgärdsbehörigheter

Globala åtgärdsbehörigheter gäller universellt för alla samlingar och kategoriseras efter åtgärdstyp. Dessa behörigheter kan konfigureras baserat på dataskop: all data eller användarens egen data. Den förra tillåter åtgärder på hela samlingen, medan den senare begränsar åtgärder till data som är relevanta för användaren.

## Samlingsåtgärdsbehörigheter

![](https://static-docs.nocobase.com/6a6e0281391cecdea5b5218e6173c5d7.png)

![](https://static-docs.nocobase.com/9814140434ff9e1bf028a6c282a5a165.png)

Samlingsåtgärdsbehörigheter möjliggör finjustering av globala åtgärdsbehörigheter genom att konfigurera åtkomst till resurser inom varje samling. Dessa behörigheter är uppdelade i två aspekter:

1.  **Åtgärdsbehörigheter**: Dessa inkluderar åtgärder för att lägga till, visa, redigera, ta bort, exportera och importera. Behörigheter ställs in baserat på dataskop:
    -   **Alla poster**: Ger användaren möjlighet att utföra åtgärder på alla poster inom samlingen.
    -   **Egna poster**: Begränsar användaren till att endast utföra åtgärder på poster som de själva har skapat.

2.  **Fältbehörigheter**: Fältbehörigheter gör det möjligt att ställa in specifika behörigheter för varje fält under olika operationer. Till exempel kan vissa fält konfigureras för att endast vara visningsbara, utan redigeringsrättigheter.

## Menyåtkomstbehörigheter

Menyåtkomstbehörigheter styr åtkomst baserat på menyalternativ.

![](https://static-docs.nocobase.com/28eddfc843d27641162d9129e3b6e33f.png)

## Plugin-konfigurationsbehörigheter

Plugin-konfigurationsbehörigheter styr möjligheten att konfigurera specifika plugin-parametrar. När de är aktiverade visas det motsvarande gränssnittet för plugin-hantering i administratörscentret.

![](https://static-docs.nocobase.com/5a742ae20a9de93dc2722468b9fd7475.png)