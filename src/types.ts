export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  createdAt: Date;
  lastActiveAt: Date;
}

export interface Project {
  id: string;
  title: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string; // User ID
  pages: Page[];
  collaborators: ProjectCollaborator[];
  isPublic: boolean;
}

export interface ProjectCollaborator {
  userId: string;
  role: 'owner' | 'editor' | 'viewer';
  addedAt: Date;
  addedBy: string;
}

export interface Page {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  projectId: string;
  parentPageId?: string; // For sub-pages
  childPages: string[]; // Array of child page IDs
  linkedPages: string[]; // Array of linked page IDs
  createdBy: string; // User ID
  lastModifiedBy: string; // User ID
}

export interface PageLink {
  id: string;
  sourcePageId: string;
  targetPageId: string;
  linkText: string;
  createdAt: Date;
  createdBy: string;
}

export interface PageVersion {
  id: string;
  pageId: string;
  version: number;
  title: string;
  content: string;
  createdAt: Date;
  createdBy: string;
  changeType: 'create' | 'edit' | 'rename' | 'delete';
  changeDescription?: string;
}

export interface WorkspaceState {
  projects: Project[];
  currentProject: Project | null;
  currentPage: Page | null;
  isSplitView: boolean;
  pageLinks: PageLink[];
  users: User[];
  currentUser: User | null;
  pageVersions: PageVersion[];
  isOnline: boolean;
  collaborators: User[]; // Currently online collaborators
}
