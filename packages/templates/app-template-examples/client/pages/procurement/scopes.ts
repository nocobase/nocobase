/** Everything about procurement requests; a write to one request names `procurement/<id>`. */
export const procurementScope = 'procurement';
export const requestScope = (id: string) => `${procurementScope}/${id}`;
