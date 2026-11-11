/** Everything about projects; a write to one project names `skillProjects/<id>`. */
export const projectsScope = 'skillProjects';
export const projectScope = (id: string) => `${projectsScope}/${id}`;
