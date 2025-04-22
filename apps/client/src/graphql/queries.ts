import { gql } from "@apollo/client";

export const GET_REPOSITORIES = gql`
  query GetRepositories {
    repositories {
      id
      fullName
      owner
      name
      description
      stargazersCount
      forksCount
      watchersCount
      openIssuesCount
      hasUnseenReleases
      createdAt
      updatedAt
      lastSyncedAt
      releases {
        id
        tagName
        name
        htmlUrl
        publishedAt
        seen
        body
        createdAt
        updatedAt
        repositoryId
      }
    }
  }
`;

export const GET_REPOSITORY = gql`
  query GetRepository($id: ID!) {
    repository(id: $id) {
      id
      fullName
      owner
      name
      description
      stargazersCount
      forksCount
      watchersCount
      openIssuesCount
      hasUnseenReleases
      createdAt
      updatedAt
      lastSyncedAt
      releases {
        id
        tagName
        name
        htmlUrl
        publishedAt
        seen
        body
        createdAt
        updatedAt
        repositoryId
      }
    }
  }
`;

export const TRACK_REPOSITORY = gql`
  mutation TrackRepository($owner: String!, $name: String!) {
    trackRepository(owner: $owner, name: $name) {
      id
      fullName
      owner
      name
      description
      stargazersCount
      forksCount
      watchersCount
      openIssuesCount
      hasUnseenReleases
      createdAt
      updatedAt
      lastSyncedAt
    }
  }
`;

export const SYNC_REPOSITORY = gql`
  mutation SyncRepository($id: ID!) {
    syncRepository(id: $id) {
      id
      fullName
      owner
      name
      description
      stargazersCount
      forksCount
      watchersCount
      openIssuesCount
      hasUnseenReleases
      createdAt
      updatedAt
      lastSyncedAt
      releases {
        id
        tagName
        name
        htmlUrl
        publishedAt
        seen
        body
        createdAt
        updatedAt
        repositoryId
      }
    }
  }
`;

export const MARK_RELEASE_AS_SEEN = gql`
  mutation MarkReleaseSeen($releaseId: ID!) {
    markReleaseSeen(releaseId: $releaseId) {
      id
      seen
      tagName
      name
    }
  }
`;

export const MARK_ALL_RELEASES_AS_SEEN = gql`
  mutation MarkAllReleasesSeen($repositoryId: ID!) {
    markAllReleasesSeen(repositoryId: $repositoryId) {
      id
      hasUnseenReleases
      releases {
        id
        seen
      }
    }
  }
`;

export const REMOVE_REPOSITORY = gql`
  mutation RemoveRepository($id: ID!) {
    removeRepository(id: $id)
  }
`;
