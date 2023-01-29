export function mockTasks() {
    const currentDate = new Date();
    const tasks: any[] = [
      {
        start: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1),
        end: new Date(currentDate.getFullYear(), currentDate.getMonth(), 15),
        name: "Some Project",
        id: "ProjectSample",
        progress: 25,
        type: "project",
        hideChildren: false,
        displayOrder: 1,
      },
      {
        start: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1),
        end: new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          2,
          12,
          28
        ),
        name: "Idea",
        id: "Task 0",
        progress: 45,
        type: "task",
        project: "ProjectSample",
        displayOrder: 2,
      },
      {
        start: new Date(currentDate.getFullYear(), currentDate.getMonth(), 2),
        end: new Date(currentDate.getFullYear(), currentDate.getMonth(), 4, 0, 0),
        name: "Research",
        id: "Task 1",
        progress: 25,
        dependencies: ["Task 0"],
        type: "task",
        project: "ProjectSample",
        displayOrder: 3,
      },
      {
        start: new Date(currentDate.getFullYear(), currentDate.getMonth(), 4),
        end: new Date(currentDate.getFullYear(), currentDate.getMonth(), 8, 0, 0),
        name: "Discussion with team",
        id: "Task 2",
        progress: 10,
        dependencies: ["Task 1"],
        type: "task",
        project: "ProjectSample",
        displayOrder: 4,
      },
      {
        start: new Date(currentDate.getFullYear(), currentDate.getMonth(), 8),
        end: new Date(currentDate.getFullYear(), currentDate.getMonth(), 9, 0, 0),
        name: "Developing",
        id: "Task 3",
        progress: 2,
        dependencies: ["Task 2"],
        type: "task",
        project: "ProjectSample",
        displayOrder: 5,
      },
      {
        start: new Date(currentDate.getFullYear(), currentDate.getMonth(), 8),
        end: new Date(currentDate.getFullYear(), currentDate.getMonth(), 10),
        name: "Review",
        id: "Task 4",
        type: "task",
        progress: 70,
        dependencies: ["Task 2"],
        project: "ProjectSample",
        displayOrder: 6,
      },
      {
        start: new Date(currentDate.getFullYear(), currentDate.getMonth(), 15),
        end: new Date(currentDate.getFullYear(), currentDate.getMonth(), 15),
        name: "Release",
        id: "Task 6",
        progress: currentDate.getMonth(),
        type: "milestone",
        dependencies: ["Task 4"],
        project: "ProjectSample",
        displayOrder: 7,
      },
      {
        start: new Date(currentDate.getFullYear(), currentDate.getMonth(), 18),
        end: new Date(currentDate.getFullYear(), currentDate.getMonth(), 19),
        name: "Party Time",
        id: "Task 9",
        progress: 0,
        isDisabled: true,
        type: "task",
      },
    ];
    return tasks;
  }


  export const formatData = (data = [], fieldNames) => {
    const tasks: any[] = [];
    data.forEach((v) => {
      tasks.push({
        start: new Date(v[fieldNames.start]),
        end: new Date(v[fieldNames.end]),
        name: v[fieldNames.title],
        id: v.id + '',
        type: 'task',
        progress: v[fieldNames.progress],
      });
    });
    return tasks;
  };