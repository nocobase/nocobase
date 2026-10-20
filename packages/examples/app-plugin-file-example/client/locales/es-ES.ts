import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const esES: LocaleResource<typeof enUS> = {
  officePreviewTitle: 'Vista previa de la oficina local',
  officePreviewDescription:
    'Cargue un archivo DOCX, XLSX o PPTX a continuación, luego seleccione Vista previa. Los documentos se procesan en su navegador sin Office Online ni un servicio de vista previa externo. Los archivos adjuntos de pedidos utilizan la misma vista previa.',
  officePreviewLimits:
    'No se requiere conexión a Internet cuando se puede acceder a la aplicación y al servicio de archivos en su red local. Este no es un modo completamente desconectado. Los archivos DOC, XLS, PPT y OpenDocument heredados siguen siendo de solo descarga en este ejemplo.',
  title: 'Adjuntos',
  description:
    'Cargue uno o varios archivos y obtenga una vista previa de ellos en su lugar. Los registros se almacenan a través del repositorio de archivos API.',
  apiHint:
    'Esta página mantiene el flujo del repositorio sin procesar: el control de carga llama a uploadOne para un solo archivo y a uploadMany para un lote.',
  retention:
    'Al eliminar un registro se eliminan únicamente sus metadatos; el objeto almacenado permanece en el disco.',
  choose: 'Elegir archivos',
  uploading: 'Subiendo…',
  dropHint: 'o soltar archivos aquí',
  tooLarge: 'El archivo excede el tamaño máximo',
  rejected: 'El tipo de archivo no está permitido',
  uploadFailed: 'Falló la carga',
  preview: 'Vista previa',
  download: 'Descargar',
  remove: 'Eliminar',
  unlink: 'Eliminar del pedido',
  empty: 'Aún no hay archivos.',
  close: 'Cerrar',
  previous: 'Anterior',
  next: 'Siguiente',
  loading: 'Cargando…',
  previewUnsupported:
    'Este tipo de archivo no tiene vista previa en línea. Descárgalo en su lugar.',
  previewFailed: 'No se pudo cargar el archivo.',
  navGroup: 'Ejemplo de archivo',
  navAttachments: 'Adjuntos',
  navProfiles: 'Avatares de perfil',
  navOrders: 'Anexos de pedidos',
  profilesTitle: 'Avatares de perfil (uno a uno)',
  profilesDescription:
    'Un perfil tiene como máximo un avatar. Cargar un nuevo avatar reemplaza el archivo anterior.',
  profilesRelationHint:
    'Relación: fileExampleProfiles.avatar es una relación hasOne con fileExampleProfileAvatars, que mantiene un ID de perfil único.',
  noAvatar: 'Sin avatar',
  profilesNoFile: 'No hay ningún archivo de avatar conectado',
  profilesEmpty:
    'No se encontraron perfiles. Ejecute la semilla de ejemplo para crear registros de demostración.',
  uploadAvatar: 'Subir avatar',
  replaceAvatar: 'Reemplazar avatar',
  removeAvatar: 'Eliminar avatar',
  avatarHint:
    'La carga almacena el archivo y luego lo conecta a través de la relación del perfil; eliminar solo borra la relación.',
  ordersTitle: 'Adjuntos de pedidos (uno a muchos)',
  ordersDescription:
    'Una orden posee cualquier número de archivos adjuntos. Seleccione varios archivos a la vez para cargarlos como un lote.',
  ordersRelationHint:
    'Relación: fileExampleOrders.attachments es una relación hasMany con fileExampleOrderAttachments a través de orderId.',
  ordersNoFiles: 'No hay archivos adjuntos en esta orden.',
  ordersEmpty:
    'No se encontraron pedidos. Ejecute la semilla de ejemplo para crear registros de demostración.',
  ordersHint:
    'Al eliminar un archivo adjunto se borra la relación de pedido. El registro del archivo permanece disponible en el Repositorio de archivos.',
  'status.draft': 'Borrador',
  'status.submitted': 'Enviado',
  'status.archived': 'Archivado',
};

export default esES;
