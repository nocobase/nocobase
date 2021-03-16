export default async function afterCreate(model: any, options: any = {}) {
  const { migrate = true } = options;
  if (migrate) {
    await model.migrate();
  }
}
