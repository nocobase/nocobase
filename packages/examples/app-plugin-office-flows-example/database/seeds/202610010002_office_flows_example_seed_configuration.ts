import { defineSeed, type SeedDefinition } from '@nocobase/db';

/**
 * Demonstration configuration: departments with the people a distribution
 * row carries, company management groups, and the 2026 public holidays.
 * Two departments share a head and three share a leader, so the pages can
 * show one reminder reaching a person who appears in several rows.
 */
const seed: SeedDefinition = defineSeed({
  name: '202610010002_office_flows_example_seed_configuration',

  async run(context) {
    const repository = (name: string) => context.repository(name);
    await repository('officeFlowsDepartments').createMany({
      values: [
        {
          name: '信息技术部',
          clerks: ['huangtao'],
          heads: ['xulei'],
          leaders: ['mahui'],
          sort: 1,
        },
        {
          name: '财务部',
          clerks: ['gaoyan', 'linfeng'],
          heads: ['heming'],
          leaders: ['mahui'],
          sort: 2,
        },
        {
          name: '工会',
          clerks: ['luoxin'],
          heads: ['heming'],
          leaders: ['songyu'],
          sort: 3,
        },
        {
          name: '董事会办公室',
          clerks: ['tangjun'],
          heads: ['fanqing'],
          leaders: ['songyu'],
          sort: 4,
        },
        {
          name: '风险管理部',
          clerks: ['guoning'],
          heads: ['denghui'],
          leaders: ['mahui'],
          sort: 5,
        },
      ],
    });
    await repository('officeFlowsManagementGroups').createMany({
      values: [
        { name: '公司领导', members: ['yeqing', 'caobin'], sort: 1 },
        { name: '董事会', members: ['jiangli', 'yeqing'], sort: 2 },
      ],
    });
    // 国务院办公厅关于2026年部分节假日安排的通知（国办发明电〔2025〕7号）
    const holiday = (name: string, dates: string[]) =>
      dates.map((date) => ({ date, kind: 'holiday', name }));
    const workday = (name: string, dates: string[]) =>
      dates.map((date) => ({ date, kind: 'workday', name: `${name}调休上班` }));
    const [first, ...rest] = [
      ...holiday('元旦', ['2026-01-01', '2026-01-02', '2026-01-03']),
      ...workday('元旦', ['2026-01-04']),
      ...holiday('春节', [
        '2026-02-15',
        '2026-02-16',
        '2026-02-17',
        '2026-02-18',
        '2026-02-19',
        '2026-02-20',
        '2026-02-21',
        '2026-02-22',
        '2026-02-23',
      ]),
      ...workday('春节', ['2026-02-14', '2026-02-28']),
      ...holiday('清明节', ['2026-04-04', '2026-04-05', '2026-04-06']),
      ...holiday('劳动节', [
        '2026-05-01',
        '2026-05-02',
        '2026-05-03',
        '2026-05-04',
        '2026-05-05',
      ]),
      ...workday('劳动节', ['2026-05-09']),
      ...holiday('端午节', ['2026-06-19', '2026-06-20', '2026-06-21']),
      ...holiday('中秋节', ['2026-09-25', '2026-09-26', '2026-09-27']),
      ...holiday('国庆节', [
        '2026-10-01',
        '2026-10-02',
        '2026-10-03',
        '2026-10-04',
        '2026-10-05',
        '2026-10-06',
        '2026-10-07',
      ]),
      ...workday('国庆节', ['2026-09-20', '2026-10-10']),
    ];
    await repository('officeFlowsHolidays').createMany({
      values: [first, ...rest],
    });
  },
});

export default seed;
