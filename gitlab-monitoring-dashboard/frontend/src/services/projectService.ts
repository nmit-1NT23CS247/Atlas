import { dataSource } from './dataSource';
import { Project, ProjectStats } from '../types/project';

export const projectService = {
  getProjects(): Project[] {
    return dataSource.getProjects();
  },

  getProjectById(id: string): Project | undefined {
    return dataSource.getProjectById(id);
  },

  getProjectStats(): ProjectStats[] {
    return dataSource.getProjectStats();
  },
};
