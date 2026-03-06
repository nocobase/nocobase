:::tip{title="Avis de traduction IA"}
Ce document a été traduit par IA. Pour des informations précises, veuillez consulter la [version anglaise](/get-started/translations).
:::

# Contribution à la traduction

La langue par défaut de NocoBase est l'anglais. Actuellement, l'application principale prend en charge l'anglais, l'italien, le néerlandais, le chinois simplifié et le japonais. Nous vous invitons sincèrement à contribuer aux traductions pour d'autres langues, afin de permettre aux utilisateurs du monde entier de profiter d'une expérience NocoBase encore plus fluide.

---

## I. Localisation du système

### 1. Traduction de l'interface système et des plugins

#### 1.1 Portée de la traduction
Ceci s'applique uniquement à la localisation de l'interface système et des plugins de NocoBase, et ne couvre pas les autres contenus personnalisés (tels que les tables de données ou les blocs Markdown).

![bbb6e0b44aeg](https://static-docs.nocobase.com/img_v3_02kh_8d429938-3aca-44b6-a437-bbb6e0b44aeg.jpg)

![20250319220127](https://static-docs.nocobase.com/20250319220127.png)


#### 1.2 Aperçu du contenu de localisation
NocoBase utilise Git pour gérer son contenu de localisation. Le dépôt principal est :
https://github.com/nocobase/nocobase/tree/main/locales

Chaque langue est représentée par un fichier JSON nommé selon son code de langue (par exemple, de-DE.json, fr-FR.json). La structure du fichier est organisée par modules de plugins, utilisant des paires clé-valeur pour stocker les traductions. Par exemple :

```json
{
  // Plugin client
  "@nocobase/client": {
    "(Fields only)": "(Fields only)",
    "12 hour": "12 hour",
    "24 hour": "24 hour"
    // ...autres paires clé-valeur
  },
  "@nocobase/plugin-acl": {
    // Paires clé-valeur pour ce plugin
  }
  // ...autres modules de plugins
}
```

Lors de la traduction, veuillez convertir progressivement la structure vers une forme similaire à celle-ci :

```json
{
  // Plugin client
  "@nocobase/client": {
    "(Fields only)": "(Champs uniquement - traduit)",
    "12 hour": "12 heures",
    "24 hour": "24 heures"
    // ...autres paires clé-valeur
  },
  "@nocobase/plugin-acl": {
    // Paires clé-valeur pour ce plugin
  }
  // ...autres modules de plugins
}
```

#### 1.3 Tests et synchronisation de la traduction
- Après avoir terminé votre traduction, veuillez tester et vérifier que tous les textes s'affichent correctement.
Nous avons également publié un plugin de validation de traduction - recherchez `Locale tester` dans le magasin de plugins.
![20250422233152](https://static-docs.nocobase.com/20250422233152.png)
Après l'installation, copiez le contenu JSON du fichier de localisation correspondant dans le dépôt git, collez-le à l'intérieur, puis cliquez sur OK pour vérifier si le contenu de la traduction est effectif.
![20250422233950](https://static-docs.nocobase.com/20250422233950.png)

- Une fois soumis, les scripts du système synchroniseront automatiquement le contenu de localisation vers le dépôt de code.

#### 1.4 Plugin de localisation NocoBase 2.0

> **Note :** Cette section est en cours de développement. Le plugin de localisation pour NocoBase 2.0 présente quelques différences par rapport à la version 1.x. Des détails seront fournis dans une prochaine mise à jour.

<!-- TODO: Ajouter des détails sur les différences du plugin de localisation 2.0 -->

## II. Localisation de la documentation (NocoBase 2.0)

La documentation de NocoBase 2.0 est gérée selon une nouvelle structure. Les fichiers sources de la documentation se trouvent dans le dépôt principal de NocoBase :

https://github.com/nocobase/nocobase/tree/next/docs

### 2.1 Structure de la documentation

La documentation utilise [Rspress](https://rspress.dev/) comme générateur de site statique et prend en charge 22 langues. La structure est organisée comme suit :

```
docs/
├── docs/
│   ├── en/                    # Anglais (langue source)
│   ├── cn/                    # Chinois simplifié
│   ├── ja/                    # Japonais
│   ├── ko/                    # Coréen
│   ├── de/                    # Allemand
│   ├── fr/                    # Français
│   ├── es/                    # Espagnol
│   ├── pt/                    # Portugais
│   ├── ru/                    # Russe
│   ├── it/                    # Italien
│   ├── tr/                    # Turc
│   ├── uk/                    # Ukrainien
│   ├── vi/                    # Vietnamien
│   ├── id/                    # Indonésien
│   ├── th/                    # Thaï
│   ├── pl/                    # Polonais
│   ├── nl/                    # Néerlandais
│   ├── cs/                    # Tchèque
│   ├── ar/                    # Arabe
│   ├── he/                    # Hébreu
│   ├── hi/                    # Hindi
│   ├── sv/                    # Suédois
│   └── public/                # Ressources partagées (images, etc.)
├── theme/                     # Thème personnalisé
├── rspress.config.ts          # Configuration Rspress
└── package.json
```

### 2.2 Flux de travail de traduction

1. **Synchronisation avec la source anglaise** : Toutes les traductions doivent être basées sur la documentation anglaise (`docs/en/`). Lorsque la documentation anglaise est mise à jour, les traductions doivent être mises à jour en conséquence.

2. **Stratégie de branche** :
   - Utilisez la branche `develop` ou `next` comme référence pour le contenu anglais le plus récent.
   - Créez votre branche de traduction à partir de la branche cible.

3. **Structure des fichiers** : Chaque répertoire de langue doit refléter la structure du répertoire anglais. Par exemple :
   ```
   docs/en/get-started/index.md    →    docs/fr/get-started/index.md
   docs/en/api/acl/acl.md          →    docs/fr/api/acl/acl.md
   ```

### 2.3 Contribuer aux traductions

1. Forkez le dépôt : https://github.com/nocobase/nocobase
2. Clonez votre fork et basculez sur la branche `develop` ou `next`
3. Naviguez vers le répertoire `docs/docs/`
4. Trouvez le répertoire de la langue à laquelle vous souhaitez contribuer (par exemple, `fr/` pour le français)
5. Traduisez les fichiers markdown, en conservant la même structure de fichiers que la version anglaise
6. Testez vos modifications localement :
   ```bash
   cd docs
   yarn install
   yarn dev
   ```
7. Soumettez une Pull Request au dépôt principal

### 2.4 Guide de traduction

- **Maintenir la cohérence du formatage** : Conservez la même structure markdown, les titres, les blocs de code et les liens que la source.
- **Préserver le frontmatter** : Gardez tout frontmatter YAML en haut des fichiers inchangé, sauf s'il contient du contenu traduisible.
- **Références d'images** : Utilisez les mêmes chemins d'images provenant de `docs/public/` - les images sont partagées entre toutes les langues.
- **Liens internes** : Mettez à jour les liens internes pour qu'ils pointent vers le bon chemin de langue.
- **Exemples de code** : En général, les exemples de code ne doivent pas être traduits, mais les commentaires à l'intérieur du code peuvent l'être.

### 2.5 Configuration de la navigation

La structure de navigation pour chaque langue est définie dans les fichiers `_nav.json` et `_meta.json` au sein de chaque répertoire de langue. Lors de l'ajout de nouvelles pages ou sections, assurez-vous de mettre à jour ces fichiers de configuration.

## III. Localisation du site officiel

Les pages du site web et tout le contenu sont stockés dans :
https://github.com/nocobase/website

### 3.1 Prise en main et ressources de référence

Lors de l'ajout d'une nouvelle langue, veuillez vous référer aux pages de langues existantes :
- Anglais : https://github.com/nocobase/website/tree/main/src/pages/en
- Chinois : https://github.com/nocobase/website/tree/main/src/pages/cn
- Japonais : https://github.com/nocobase/website/tree/main/src/pages/ja

![Diagramme de localisation du site web](https://static-docs.nocobase.com/20250319121600.png)

Les modifications de style global se trouvent à :
- Anglais : https://github.com/nocobase/website/blob/main/src/layouts/BaseEN.astro
- Chinois : https://github.com/nocobase/website/blob/main/src/layouts/BaseCN.astro
- Japonais : https://github.com/nocobase/website/blob/main/src/layouts/BaseJA.astro

![Diagramme de style global](https://static-docs.nocobase.com/20250319121501.png)

La localisation des composants globaux du site web est disponible à :
https://github.com/nocobase/website/tree/main/src/components

![Diagramme des composants du site web](https://static-docs.nocobase.com/20250319122940.png)

### 3.2 Structure du contenu et méthode de localisation

Nous utilisons une approche de gestion de contenu mixte. Le contenu et les ressources en anglais, chinois et japonais sont régulièrement synchronisés depuis le système CMS et écrasés, tandis que les autres langues peuvent être éditées directement dans des fichiers locaux. Le contenu local est stocké dans le répertoire `content`, organisé comme suit :

```
/content
  /articles        # Articles de blog
    /article-slug
      index.md     # Contenu anglais (par défaut)
      index.cn.md  # Contenu chinois
      index.ja.md  # Contenu japonais
      metadata.json # Métadonnées et autres propriétés de localisation
  /tutorials       # Tutoriels
  /releases        # Informations de version
  /pages           # Quelques pages statiques
  /categories      # Informations sur les catégories
    /article-categories.json  # Liste des catégories d'articles
    /category-slug            # Détails d'une catégorie individuelle
      /category.json
  /tags            # Informations sur les tags
    /article-tags.json        # Liste des tags d'articles
    /release-tags.json        # Liste des tags de version
    /tag-slug                 # Détails d'un tag individuel
      /tag.json
  /help-center     # Contenu du centre d'aide
    /help-center-tree.json    # Structure de navigation du centre d'aide
  ....
```

### 3.3 Guide de traduction du contenu

- À propos de la traduction du contenu Markdown

1. Créez un nouveau fichier de langue basé sur le fichier par défaut (par exemple, de `index.md` à `index.fr.md`)
2. Ajoutez les propriétés localisées dans les champs correspondants du fichier JSON
3. Maintenez la cohérence dans la structure des fichiers, les liens et les références d'images

- Traduction du contenu JSON
De nombreuses métadonnées de contenu sont stockées dans des fichiers JSON, qui contiennent généralement des champs multilingues :

```json
{
  "id": 123,
  "title": "English Title",       // Titre anglais (par défaut)
  "title_cn": "中文标题",          // Titre chinois
  "title_ja": "日本語タイトル",    // Titre japonais
  "description": "English description",
  "description_cn": "中文描述",
  "description_ja": "日本語の説明",
  "slug": "article-slug",         // Chemin URL (généralement non traduit)
  "status": "published",
  "publishedAt": "2025-03-19T12:00:00Z"
}
```

**Notes de traduction :**

1. **Convention de nommage des champs** : Les champs de traduction utilisent généralement le format `{champ_original}_{code_langue}`
   - Par exemple : title_fr (titre français), description_de (description allemande)

2. **Lors de l'ajout d'une nouvelle langue** :
   - Ajoutez une version avec suffixe de langue correspondante pour chaque champ nécessitant une traduction
   - Ne modifiez pas les valeurs des champs originaux (tels que title, description, etc.), car ils servent de contenu pour la langue par défaut (anglais)

3. **Mécanisme de synchronisation CMS** :
   - Le système CMS met périodiquement à jour le contenu en anglais, chinois et japonais
   - Le système ne mettra à jour/écrasera que le contenu de ces trois langues (certaines propriétés dans le JSON), et **ne supprimera pas** les champs de langue ajoutés par d'autres contributeurs
   - Par exemple : si vous avez ajouté une traduction française (title_fr), la synchronisation CMS n'affectera pas ce champ.


### 3.4 Configuration de la prise en charge d'une nouvelle langue

Pour ajouter la prise en charge d'une nouvelle langue, vous devez modifier la configuration `SUPPORTED_LANGUAGES` dans le fichier `src/utils/index.ts` :

```typescript
export const SUPPORTED_LANGUAGES = {
  en: {
    code: 'en',
    locale: 'en-US',
    name: 'English',
    default: true
  },
  cn: {
    code: 'cn',
    locale: 'zh-CN',
    name: 'Chinese'
  },
  ja: {
    code: 'ja',
    locale: 'ja-JP',
    name: 'Japanese'
  },
  // Exemple d'ajout d'une nouvelle langue :
  fr: {
    code: 'fr',
    locale: 'fr-FR',
    name: 'French'
  }
};
```

### 3.5 Fichiers de mise en page (Layouts) et styles

Chaque langue nécessite des fichiers de mise en page correspondants :

1. Créez un nouveau fichier de mise en page (par exemple, pour le français, créez `src/layouts/BaseFR.astro`)
2. Vous pouvez copier un fichier de mise en page existant (tel que `BaseEN.astro`) et le traduire
3. Le fichier de mise en page contient les traductions des éléments globaux tels que les menus de navigation, les pieds de page, etc.
4. Assurez-vous de mettre à jour la configuration du sélecteur de langue pour basculer correctement vers la langue nouvellement ajoutée

### 3.6 Création de répertoires de pages par langue

Créez des répertoires de pages indépendants pour la nouvelle langue :

1. Créez un dossier nommé avec le code de langue dans le répertoire `src` (par exemple `src/fr/`)
2. Copiez la structure des pages des autres répertoires de langues (par exemple `src/en/`)
3. Mettez à jour le contenu des pages, en traduisant les titres, les descriptions et le texte dans la langue cible
4. Assurez-vous que les pages utilisent le bon composant de mise en page (par exemple, `.layout: '@/layouts/BaseFR.astro'`)

### 3.7 Localisation des composants

Certains composants communs nécessitent également une traduction :

1. Vérifiez les composants dans le répertoire `src/components/`
2. Portez une attention particulière aux composants avec du texte fixe (comme les barres de navigation, les pieds de page, etc.)
3. Les composants peuvent utiliser le rendu conditionnel pour afficher le contenu dans différentes langues :

```astro
{Astro.url.pathname.startsWith('/en') && <p>English content</p>}
{Astro.url.pathname.startsWith('/cn') && <p>中文内容</p>}
{Astro.url.pathname.startsWith('/fr') && <p>Contenu français</p>}
```

### 3.8 Tests et validation

Après avoir terminé la traduction, effectuez des tests approfondis :

1. Lancez le site web localement (généralement avec `yarn dev`)
2. Vérifiez l'affichage de toutes les pages dans la nouvelle langue
3. Vérifiez que la fonctionnalité de changement de langue fonctionne correctement
4. Assurez-vous que tous les liens pointent vers les pages de la version linguistique correcte
5. Vérifiez les mises en page réactives pour vous assurer que le texte traduit ne casse pas le design de la page

## IV. Comment commencer à traduire

Si vous souhaitez contribuer à une nouvelle traduction de langue pour NocoBase, veuillez suivre ces étapes :

| Composant | Dépôt | Branche | Notes |
|-----------|-------|---------|-------|
| Interface système | https://github.com/nocobase/nocobase/tree/main/locales | main | Fichiers de localisation JSON |
| Documentation (2.0) | https://github.com/nocobase/nocobase | develop / next | Répertoire `docs/docs/<lang>/` |
| Site officiel | https://github.com/nocobase/website | main | Voir Section III |

Après avoir terminé votre traduction, veuillez soumettre une Pull Request à NocoBase. Les nouvelles langues apparaîtront dans la configuration du système, vous permettant de sélectionner les langues à afficher.

![Diagramme des langues activées](https://static-docs.nocobase.com/20250319123452.png)

## Documentation NocoBase 1.x

Pour le guide de traduction de NocoBase 1.x, veuillez vous référer à :

https://docs.nocobase.com/welcome/community/translations