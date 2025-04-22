import { gql } from "@apollo/client";

export const GET_REPOSITORIES = gql`
  query GetRepositories {
    repositories {
      id
      fullName
      owner
      description
      htmlUrl
      releases {
        id
        tagName
        name
        htmlUrl
        publishedAt
        seen
      }
    }
  }
`;

export const SYNC_REPOSITORY = gql`
  mutation SyncRepository($fullName: String!) {
    syncRepository(fullName: $fullName) {
      id
      fullName
      owner
      description
      htmlUrl
      releases {
        id
        tagName
        name
        htmlUrl
        publishedAt
        seen
      }
    }
  }
`;

export const MARK_RELEASE_AS_SEEN = gql`
  mutation MarkReleaseAsSeen($releaseId: String!) {
    markReleaseAsSeen(releaseId: $releaseId) {
      id
      seen
    }
  }
`;

export const MARK_ALL_RELEASES_AS_SEEN = gql`
  mutation MarkAllReleasesAsSeen($repositoryId: String!) {
    markAllReleasesAsSeen(repositoryId: $repositoryId) {
      id
      releases {
        id
        seen
      }
    }
  }
`;
