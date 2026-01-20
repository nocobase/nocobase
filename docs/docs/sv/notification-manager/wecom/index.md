---
pkg: '@nocobase/plugin-auth-wecom'
---
:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::


# Avisering: WeCom

## Introduktion

**WeCom**-pluginet gör det möjligt för applikationen att skicka aviseringsmeddelanden till WeCom-användare.

## Lägg till och konfigurera en WeCom-autentiserare

Först behöver ni lägga till och konfigurera en WeCom-autentiserare i NocoBase. Se [Användarautentisering - WeCom](/auth-verification/auth-wecom). Endast systemanvändare som har loggat in via WeCom kan ta emot systemaviseringar via WeCom.

## Lägg till en WeCom-aviseringskanal

![](https://static-docs.nocobase.com/202412041522365.png)

## Konfigurera WeCom-aviseringskanalen

Välj den autentiserare ni just konfigurerade.

![](https://static-docs.nocobase.com/202412041525284.png)

## Konfiguration av aviseringsnod för arbetsflöde

Välj den konfigurerade WeCom-aviseringskanalen. Den stöder tre meddelandetyper: Textkort, Markdown och Mallkort.

![](https://static-docs.nocobase.com/202412041529319.png)