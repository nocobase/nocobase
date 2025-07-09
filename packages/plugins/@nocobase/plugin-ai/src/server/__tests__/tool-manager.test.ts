import { ToolManager } from '../manager/tool-manager';

describe('ToolManager Test', () => {
  let manager: ToolManager;
  beforeEach(() => {
    manager = new ToolManager();
  });

  it('While tool register without specified group, should add to others group', async () => {
    manager.registerTools([
      {
        tool: {
          title: 'test',
          description: 'test',
          name: 'test',
          invoke: async (ctx, args) => {
            return {
              status: 'success',
              content: 'TEST_TOOL',
            };
          },
        },
      },
    ]);

    const tool = await manager.getTool('test');
    expect(tool).not.to.be.null;

    const toolGroups = await manager.listTools();
    const othersGroup = toolGroups.find((x) => x.group.groupName === 'others');
    const testTool = othersGroup.tools.find((x) => x.name === 'test');
    expect(testTool).not.to.be.null;
  });

  it('In dynamic tool registration, tool name should have group name prefix', async () => {
    const groupName = 'testGroup';
    const toolName = 'testTool';
    manager.registerToolGroup({
      groupName,
    });
    manager.registerDynamicTool({
      groupName,
      getTools: async () => {
        return [
          {
            tool: {
              title: 'TEST_TOOL',
              description: 'TEST_TOOL',
              name: toolName,
              invoke: async (ctx, args) => {
                return {
                  status: 'success',
                  content: 'TEST_TOOL',
                };
              },
            },
          },
        ];
      },
    });
    const actualToolName = groupName + '-' + toolName;
    const tool = await manager.getTool(actualToolName);
    expect(tool).not.to.be.null;
    expect(tool.name).eq(actualToolName);

    const toolList = await manager.listTools();
    const [firstGroup] = toolList.filter((x) => x.group.groupName === groupName);
    const [firstTool] = firstGroup.tools;
    expect(firstTool).not.to.be.null;
    expect(firstTool.name).eq(actualToolName);
  });
});
