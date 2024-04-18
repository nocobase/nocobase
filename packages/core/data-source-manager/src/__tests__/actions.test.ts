import { list } from '../default-actions/list';

describe('action test', () => {
  describe('list action', async () => {
    it('should list with paginate', async () => {
      const listAction = list;

      const ctx: any = {
        getCurrentRepository() {
          return {};
        },
        action: {
          params: {
            paginate: true,
          },
        },
      };

      vi.spyOn(ctx, 'getCurrentRepository').mockImplementation(() => {
        return {
          findAndCount: async () => [
            [
              {
                id: 1,
                name: 'test',
              },
              {
                id: 2,
                name: 'test2',
              },
            ],
            2,
          ],
        };
      });

      await listAction(ctx, () => {});

      expect(ctx.body).toMatchObject({
        count: 2,
        rows: [
          { id: 1, name: 'test' },
          { id: 2, name: 'test2' },
        ],
        page: 1,
        pageSize: 50,
        totalPage: 1,
      });
    });

    it('should list with non paginate', async () => {
      const listAction = list;

      const ctx: any = {
        getCurrentRepository() {
          return {};
        },
        action: {
          params: {
            paginate: false,
          },
        },
      };

      vi.spyOn(ctx, 'getCurrentRepository').mockImplementation(() => {
        return {
          find: async () => [
            {
              id: 1,
              name: 'test',
            },
            {
              id: 2,
              name: 'test2',
            },
          ],
        };
      });

      await listAction(ctx, () => {});

      expect(ctx.body).toMatchObject([
        { id: 1, name: 'test' },
        { id: 2, name: 'test2' },
      ]);
    });
  });
});
