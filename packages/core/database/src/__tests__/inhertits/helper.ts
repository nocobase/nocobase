const pgOnly = () => (process.env.DB_DIALECT == 'postgres' ? describe : describe.skip);

export default pgOnly;
