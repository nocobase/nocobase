import type { AccountSwitcherResource } from './en-US.js';

const esES: AccountSwitcherResource = {
  menu: {
    switchAccount: 'Cambiar de cuenta',
    search: 'Buscar por nombre o correo',
    loading: 'Cargando cuentas…',
    empty: 'No hay cuentas que coincidan',
    more: '{{count}} más. Busca para acotar la lista.',
    loadFailed: 'No se pueden cargar las cuentas.',
  },
  banner: {
    actingAs: 'Actuando como {{name}}',
    description: 'Los cambios se registran con esta cuenta.',
    return: 'Volver a {{name}}',
  },
  errors: {
    switchFailed: 'No se puede cambiar de cuenta. Inténtalo de nuevo.',
    returnFailed: 'No se puede volver a tu cuenta. Inténtalo de nuevo.',
  },
};

export default esES;
