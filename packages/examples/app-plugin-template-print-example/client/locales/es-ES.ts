import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const esES: LocaleResource<typeof enUS> = {
  navTitle: 'Ejemplo de impresión de plantilla',
  title: 'Ejemplo de impresión de plantilla',
  description:
    'Renderizar una plantilla DOCX fija con una factura y sus datos de cotización autorizados como DOCX o PDF. La conversión de PDF requiere LibreOffice en el servidor de aplicaciones.',
  invoiceList: 'Facturas',
  invoiceCount_one: 'Factura {{count}}',
  invoiceCount_other: 'Facturas {{count}}',
  loading: 'Cargando facturas…',
  empty: 'No hay facturas disponibles en su alcance de acceso a cotizaciones.',
  emptyHint:
    'Ejecute las tareas de la base de datos de ejemplos e inicie sesión como sales_manager, o use una cuenta que pueda ver la cotización de ventas vinculada.',
  loadFailed: 'No se pudieron cargar las facturas.',
  download: 'Descargar DOCX',
  downloading: 'Representación…',
  downloadFailed: 'No se pudo rendir la factura.',
  invoice: 'Factura',
  customer: 'Cliente',
  issuedOn: 'Emitido el',
  quote: 'Cita fuente',
  amount: 'Total',
  downloadActions: 'Descargar acciones',
  downloadPdf: 'Descargar PDF',
  pdfConverterUnavailable:
    'La conversión de PDF no está disponible porque no se pudo encontrar LibreOffice en el servidor de aplicaciones. Instálelo en la misma máquina o contenedor que NocoBase, asegúrese de que el proceso del servidor pueda encontrar su ejecutable y reinicie la aplicación. La descarga de DOCX sigue disponible.',
  installLibreOffice: 'Descargar LibreOffice',
  retry: 'Reintentar',
  invoiceCount_many: 'Facturas {{count}}',
};

export default esES;
