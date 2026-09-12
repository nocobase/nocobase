# Chapter 2: Designing the System

<iframe width="800" height="450" src="https://www.youtube.com/embed/sAaOX6HelqA?si=HEyHVi7pQS3UL3RP" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

Designing a task management system may sound complex, but with NocoBase, this process becomes straightforward and even enjoyable.  We'll walk through defining requirements, designing the data structure, and planning future features, all step-by-step.

Rest assured, we won't be wading through intimidating lines of code; instead, we’ll use the most intuitive and straightforward approach to build your task management system.

### 2.1 System Requirements Analysis

Before we dive in, let's clarify the features this task management system should include. Consider how we typically manage tasks or what an ideal task management system might offer:

- **Task Management**: Users can create, edit, and delete tasks, assign tasks to different people, and track task progress in real-time.
- **Multiple Views**: Tasks can be displayed in various formats, such as a list view, Kanban board, Gantt chart, or calendar view for better visualization.
- **Online Documentation**: Tasks should support online document editing, helping team members understand task details.
- **Attachment Management**: Attachments like images, videos, and important records should be added to tasks as needed.
- **Comments**: Team members can comment on tasks, share feedback, and document discussions.

Below is a flowchart to outline how these functional modules relate to each other:
![](https://static-docs.nocobase.com/task_management20241106949.drawio.svg)

Clearer now, right?

---

> **Introduction to Collection:** NocoBase uses a "Collection" method to describe data structures, unifying data from various sources and providing a solid foundation for data management and analysis.
>
> It supports various types of collections including general, inheritance, tree, calendar, file, expression, SQL, view, and external collections, catering to diverse data handling needs.
>
> This design enhances the flexibility and efficiency of data operations.

### 2.2 Collections Design

Now let’s dig into the design. To support these features, we need to plan the Collections for the system. Don’t worry; we won’t need a complex database structure—just a few simple tables.

Based on our requirements analysis, we’ll design the following Collections:

1. **Users Collection**: Stores user information in the system. Who is working on the tasks? Who is managing them?
2. **Tasks Collection**: Contains detailed information for each task, including task name, document, assigned person, and progress status.
3. **Attachments Collection**: Stores all task-related attachments, such as images and files.
4. **Comments Collection**: Records user comments on tasks, allowing team members to interact.

The relationships between these tables are straightforward: each task can have multiple attachments and comments, and all attachments and comments are created or uploaded by a user. This setup forms the core structure of our task management system.

Here’s a diagram showing the basic relationships between these tables:
![](https://static-docs.nocobase.com/241219-2.svg)

### 2.3 Table Design in NocoBase

So, how do we implement this task management system with NocoBase? It’s even simpler than you might think:

- **Tasks Table**: This is the core of the entire system, storing detailed information for each task.
- **Comments Table**: Stores comments related to tasks so that team members can provide feedback.

More complex features, such as attachment management and user information, are already built into NocoBase, so there’s no need for manual setup. Much simpler, right?

We’ll start with a basic task data management system and gradually expand its functionality. For example, we’ll first design the basic fields for tasks, then later add the comments feature. The whole process is flexible and easy to control.

Our table structure will look something like this, covering all the fields we need:
![](https://static-docs.nocobase.com/241219-3.svg)

### Summary

In this section, you’ve learned how to design a basic task management system. Using NocoBase, we started with requirements analysis and then planned the Collections and field structure. Next, you’ll find that implementing these features is even easier than designing them.

For instance, the initial Tasks Table might be as simple as this:

```text
Tasks Table:
        Task Name (task_name) - Single-line text
        Task Description (task_description) - Multi-line text
```

Pretty intuitive, right? Ready for the [next step? (Chapter 3: Task Data Management)](https://www.nocobase.com/en/tutorials/task-tutorial-data-management-guide)

---

Keep exploring and creating endless possibilities! If you encounter any issues along the way, don’t forget to check the [NocoBase Documentation](https://docs.nocobase.com/) or join the [NocoBase Community](https://forum.nocobase.com/) for support. See you in the next chapter!
