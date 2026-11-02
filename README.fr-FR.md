# NocoBase 3

> Cette branche contient NocoBase 3. Si vous cherchez la plateforme sans code NocoBase 2, consultez [NocoBase 2](https://nocode.nocobase.com/).

[English](./README.md) | [Español](./README.es-ES.md) | Français | [Deutsch](./README.de-DE.md) | [Português](./README.pt-BR.md) | [Русский](./README.ru-RU.md) | [Bahasa Indonesia](./README.id-ID.md) | [Tiếng Việt](./README.vi-VN.md) | [简体中文](./README.zh-CN.md) | [繁體中文](./README.zh-TW.md) | [日本語](./README.ja-JP.md) | [한국어](./README.ko-KR.md)

**Construisez des systèmes métier fiables**

NocoBase est la plateforme open source pour créer, exploiter et faire évoluer des systèmes métier avec l’IA. Les agents écrivent le code et font le travail, NocoBase fournit le socle et la gouvernance, et ce sont les humains qui décident.

[▶ Voir la démo](https://static-docs.nocobase.com/nocobase-3-fr.mp4)

[Site web](https://www.nocobase.com/fr-FR/) · [Documentation](https://docs.nocobase.com/) · [Démarrage rapide](#quick-start) · [Communauté](https://forum.nocobase.com/)

## Pourquoi NocoBase

**L’IA écrit du code en un rien de temps. Construire des systèmes métier fiables reste difficile.**

Votre équipe développe déjà avec l’IA ou en vibe coding. Le code s’écrit vite, mais de nouveaux problèmes apparaissent.

- **Un socle à bâtir de zéro**

  Même quand l’IA écrit le code, permissions, moteurs de workflow et circuits de validation restent difficiles à concevoir de zéro. Les cas limites abondent et la maintenance est lourde.

- **Une architecture qui dérive hors de contrôle**

  Changez de développeur, de modèle ou même de session, et l’IA peut improviser différemment à chaque fois. Le système devient de plus en plus difficile à maintenir.

- **Trop de travail en parallèle pour tout relire**

  Vous jonglez entre plusieurs projets et tâches, entre terminaux et conversations, tandis que les agents livrent toujours plus de modifications. Impossible de tout relire, mais lâcher prise semble trop risqué.

- **Un savoir-faire difficile à capitaliser et à partager**

  Contexte des besoins, documents métier et retours d’expérience restent éparpillés dans des conversations, sur différents ordinateurs. Quand les personnes ou les agents changent, on ne les retrouve plus.

<a id="quick-start"></a>

## Démarrage rapide

Node.js 24+ et pnpm 11 sont requis. Sous Windows, utilisez WSL. Ces exemples utilisent SQLite : aucun serveur de base de données distinct n’est nécessaire.

### Avec un agent de programmation

Ouvrez un agent de programmation compatible avec les Skills dans un dossier vide et installez la Skill de création d’applications :

```bash
npx skills@latest add nocobase/skills-v3 --skill nocobase-create-app -g
```

Sélectionnez votre agent pendant l’installation. S’il ne reconnaît pas la nouvelle Skill, ouvrez une nouvelle session. Envoyez ensuite :

```text
Suis la Skill nocobase-create-app pour créer et démarrer une application NocoBase 3 dans le dossier vide actuel, avec le modèle par défaut et SQLite.
```

### Depuis le terminal

Exécutez les commandes suivantes depuis le dossier parent où vous conservez vos projets :

```bash
PNPM_CONFIG_MINIMUM_RELEASE_AGE=0 pnpm create @nocobase/app@beta my-app --template-tag=beta
cd my-app
pnpm nocobase config init --dialect sqlite
pnpm nocobase config check
pnpm dev
```

Consultez la [documentation](https://docs.nocobase.com/) pour les instructions d’installation détaillées et les guides de développement.

## L’écosystème NocoBase

- **[NocoBase Core](https://www.nocobase.com/fr-FR/core/)**

  **Laissez les agents se concentrer sur votre logique métier. Le socle est prêt.**

  NocoBase Core est le socle applicatif open source des systèmes métier créés et exploités avec l’IA. Permissions, workflows, fichiers et autres briques sont prêts à l’emploi : les agents ne développent que ce qui est propre à votre métier, sur une architecture cohérente.

- **[NocoBase Studio](https://www.nocobase.com/fr-FR/studio/)**

  **Les agents font avancer le travail. Votre équipe garde la maîtrise.**

  NocoBase Studio est la plateforme de gouvernance pour les humains et les agents qui développent des logiciels ensemble. Il réunit Claude Code, Codex et OpenCode en une seule équipe d’agents qui fait avancer les tâches en autonomie. L’avancement se lit en un coup d’œil, et les décisions clés reviennent aux humains.

- **[NocoBase Solution](https://www.nocobase.com/fr-FR/solutions/)**

  **Des applications métier open source. Pilotées par l’IA, prêtes à l’emploi.**

  NocoBase Solution est une gamme d’applications métier pilotées par des agents et construites sur Core. Les agents font l’essentiel du travail, les humains ne prennent que les décisions clés.

## Communauté et contributions

- Posez vos questions et partagez votre expérience sur le [forum communautaire](https://forum.nocobase.com/).
- Signalez des bugs reproductibles et proposez des améliorations via [GitHub Issues](https://github.com/nocobase/nocobase/issues).
- Lisez la [documentation](https://docs.nocobase.com/) pour comprendre le framework et les plugins.

Les contributions sont les bienvenues. Avant de modifier ce dépôt, lisez [AGENTS.md](./AGENTS.md) et les instructions de développement pertinentes.
