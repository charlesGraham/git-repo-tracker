// Types for GraphQL API responses

export interface Release {
  id: string;
  tagName: string;
  name?: string;
  htmlUrl: string;
  publishedAt: string;
  seen: boolean;
  body?: string;
  createdAt: string;
  updatedAt: string;
  repositoryId: string;
}

export interface Repository {
  id: string;
  fullName: string;
  owner: string;
  name: string;
  description?: string;
  stargazersCount: number;
  forksCount: number;
  watchersCount: number;
  openIssuesCount: number;
  hasUnseenReleases: boolean;
  createdAt: string;
  updatedAt: string;
  lastSyncedAt: string;
  releases: Release[];
}
