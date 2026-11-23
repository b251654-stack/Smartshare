export type ProjectRecord<T> = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  design: T;
};

const PROJECTS_KEY = 'smartshare-projects';
const LEGACY_PROJECT_KEY = 'smartshare-project';

function projectsStorageKey(userId?: string): string {
  return userId ? `${PROJECTS_KEY}:${userId}` : `${PROJECTS_KEY}:guest`;
}

export function readProjects<T>(userId?: string): ProjectRecord<T>[] {
  try {
    const storageKey = projectsStorageKey(userId);
    let storedProjects = window.localStorage.getItem(storageKey);

    if (!storedProjects && !userId) {
      storedProjects = window.localStorage.getItem(PROJECTS_KEY);
      if (storedProjects) window.localStorage.setItem(storageKey, storedProjects);
    }

    if (storedProjects) {
      const parsed: unknown = JSON.parse(storedProjects);
      if (!Array.isArray(parsed)) {
        throw new Error('Saved projects data is not a list.');
      }

      return parsed.filter((project): project is ProjectRecord<T> =>
        typeof project === 'object' &&
        project !== null &&
        typeof project.id === 'string' &&
        typeof project.name === 'string' &&
        typeof project.updatedAt === 'string' &&
        typeof project.createdAt === 'string' &&
        'design' in project
      );
    }

    if (userId) return [];

    const legacy = window.localStorage.getItem(LEGACY_PROJECT_KEY);
    if (!legacy) return [];

    const design: unknown = JSON.parse(legacy);
    if (typeof design !== 'object' || design === null || !('items' in design)) {
      throw new Error('Saved project data is invalid.');
    }

    const now = new Date().toISOString();
    const migrated: ProjectRecord<T>[] = [{
      id: 'legacy-project',
      name: 'My first design',
      createdAt: now,
      updatedAt: now,
      design: design as T
    }];
    window.localStorage.setItem(storageKey, JSON.stringify(migrated));
    return migrated;
  } catch (error) {
    console.error('Could not load saved projects.', error);
    return [];
  }
}

export function saveProject<T>(project: ProjectRecord<T>, userId?: string): void {
  const storageKey = projectsStorageKey(userId);
  const projects = readProjects<T>(userId);
  const existing = projects.findIndex(item => item.id === project.id);

  if (existing === -1) {
    projects.unshift(project);
  } else {
    projects[existing] = project;
  }

  window.localStorage.setItem(storageKey, JSON.stringify(projects));
}

export function deleteProject<T>(id: string, userId?: string): void {
  const projects = readProjects<T>(userId).filter(project => project.id !== id);
  window.localStorage.setItem(projectsStorageKey(userId), JSON.stringify(projects));
}

export function createProjectId(): string {
  return globalThis.crypto?.randomUUID?.() ??
    `project-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
