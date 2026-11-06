import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const frFR: LocaleResource<typeof enUS> = {
  navTitle: "Exemple d'impression de modèle",
  title: "Exemple d'impression de modèle",
  description:
    "Affichez un modèle DOCX fixe avec une facture et ses données de devis autorisées au format DOCX ou PDF. La conversion PDF nécessite LibreOffice sur le serveur d'applications.",
  invoiceList: 'Factures',
  invoiceCount_one: 'Facture {{count}}',
  invoiceCount_other: 'Factures {{count}}',
  loading: 'Chargement des factures…',
  empty:
    "Aucune facture n'est disponible dans votre périmètre d'accès au devis.",
  emptyHint:
    'Exécutez les tâches de la base de données Exemples et connectez-vous en tant que sales_manager, ou utilisez un compte pouvant afficher le devis lié.',
  loadFailed: 'Impossible de charger les factures.',
  download: 'Télécharger DOCX',
  downloading: 'Rendu…',
  downloadFailed: 'Impossible de rendre la facture.',
  invoice: 'Facture',
  customer: 'Client',
  issuedOn: 'Publié le',
  quote: 'Citation source',
  amount: 'Total',
  downloadActions: 'Actions de téléchargement',
  downloadPdf: 'Télécharger le PDF',
  pdfConverterUnavailable:
    "La conversion PDF n'est pas disponible car LibreOffice est introuvable sur le serveur d'applications. Installez-le sur la même machine ou conteneur que NocoBase, assurez-vous que le processus serveur peut trouver son exécutable et redémarrez l'application. Le téléchargement DOCX reste disponible.",
  installLibreOffice: 'Télécharger LibreOffice',
  retry: 'Réessayer',
  invoiceCount_many: 'Factures {{count}}',
};

export default frFR;
