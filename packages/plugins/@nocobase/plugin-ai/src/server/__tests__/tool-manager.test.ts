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

    const tool = await manager.getTool('others-test');
    expect(tool).not.to.be.null;

    const toolGroups = await manager.listTools();
    const othersGroup = toolGroups.find((x) => x.group.groupName === 'others');
    const testTool = othersGroup.tools.find((x) => x.name === 'others-test');
    expect(testTool).not.to.be.null;
  });

  it('group name should auto attach to tool name', async () => {
    const groupName = 'testGroup';
    const toolName1 = 'testTool1';
    const toolName2 = 'testTool2';
    manager.registerToolGroup({
      groupName,
    });
    manager.registerTools([
      {
        groupName,
        tool: {
          name: toolName1,
          title: 'test1',
          description: 'test1',
          execution: 'backend',
          invoke: async (ctx, args) => {
            return {
              status: 'success',
              content: 'TEST_TOOL',
            };
          },
        },
      },
      {
        groupName,
        tool: {
          name: toolName2,
          title: 'test2',
          description: 'test1',
          execution: 'backend',
          invoke: async (ctx, args) => {
            return {
              status: 'success',
              content: 'TEST_TOOL',
            };
          },
        },
      },
    ]);

    const actualToolName1 = `${groupName}-${toolName1}`;
    const actualToolName2 = `${groupName}-${toolName2}`;

    const tool1 = await manager.getTool(actualToolName1);
    expect(tool1).toBeDefined();
    const tool2 = await manager.getTool(actualToolName2);
    expect(tool2).toBeDefined();

    const toolList = (await manager.listTools()).flatMap((x) => x.tools);
    const toolInList1 = toolList.find((x) => x.name === actualToolName1);
    expect(toolInList1).toBeDefined();
    const toolInList2 = toolList.find((x) => x.name === actualToolName2);
    expect(toolInList2).toBeDefined();
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
