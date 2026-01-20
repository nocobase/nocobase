---
pkg: "@nocobase/plugin-verification"
---
:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::



pkg: '@nocobase/plugin-verification'
---

# Weryfikacja

:::info{title=Wskazówka}
Począwszy od wersji `1.6.0-alpha.30`, pierwotna funkcja „kodu weryfikacyjnego” została ulepszona do „Zarządzania Weryfikacją”. Umożliwia ona zarządzanie i integrację różnych metod weryfikacji tożsamości użytkownika. Po powiązaniu przez użytkowników odpowiedniej metody weryfikacji, mogą oni przeprowadzać weryfikację tożsamości w razie potrzeby. Stabilne wsparcie dla tej funkcji jest planowane od wersji `1.7.0`.
:::

## Wprowadzenie

**Centrum Zarządzania Weryfikacją umożliwia zarządzanie i integrację różnych metod weryfikacji tożsamości użytkownika.** Na przykład:

- Kod weryfikacyjny SMS – Domyślnie dostarczany przez wtyczkę weryfikacji. Zobacz: [Weryfikacja: SMS](./sms)
- Autentykator TOTP – Zobacz: [Weryfikacja: Autentykator TOTP](../verification-totp/)

Deweloperzy mogą również rozszerzać inne typy weryfikacji za pomocą wtyczek. Zobacz: [Rozszerzanie typów weryfikacji](./dev/type)

**Użytkownicy mogą przeprowadzać weryfikację tożsamości w razie potrzeby, po powiązaniu odpowiedniej metody weryfikacji.** Na przykład:

- Logowanie za pomocą kodu weryfikacyjnego SMS – Zobacz: [Uwierzytelnianie: SMS](../auth-sms/index.md)
- Uwierzytelnianie dwuskładnikowe (2FA) – Zobacz: [Uwierzytelnianie dwuskładnikowe (2FA)](../2fa/)
- Wtórna weryfikacja dla operacji wysokiego ryzyka – Wsparcie w przyszłości

Deweloperzy mogą również integrować weryfikację tożsamości z innymi niezbędnymi scenariuszami, rozszerzając wtyczki. Zobacz: [Rozszerzanie scenariuszy weryfikacji](./dev/scene)

**Różnice i powiązania między modułem weryfikacji a modułem uwierzytelniania użytkownika:** Moduł uwierzytelniania użytkownika odpowiada przede wszystkim za uwierzytelnianie tożsamości w scenariuszach logowania, gdzie procesy takie jak logowanie SMS czy uwierzytelnianie dwuskładnikowe opierają się na weryfikatorach dostarczanych przez moduł weryfikacji. Z kolei moduł weryfikacji zajmuje się weryfikacją tożsamości w przypadku różnych operacji wysokiego ryzyka, a logowanie użytkownika jest jednym z takich scenariuszy.

![](https://static-docs.nocobase.com/202502262315404.png)

![](https://static-docs.nocobase.com/202502262315966.png)