# GitHub Repository Tracker API Documentation

This folder contains documentation and examples for using the GitHub Repository Tracker GraphQL API.

## Sample Queries

The `queries.graphql` file contains a collection of example GraphQL queries and mutations that demonstrate how to interact with the API. These queries can be used in the GraphQL Playground, which is available at http://localhost:3000/graphql when the application is running.

### How to Use the Sample Queries

1. Start the API server using `npm run dev` from the api folder
2. Open the GraphQL Playground at http://localhost:3000/graphql
3. Copy and paste the desired query from `queries.graphql`
4. Replace any placeholder values (like `REPOSITORY_ID_HERE`) with actual values from your database
5. Run the query using the "Play" button

## Available Operations

### Queries
- `repositories`: Get all tracked repositories
- `repository(id: ID!)`: Get a specific repository by ID

### Mutations
- `trackRepository(owner: String!, name: String!)`: Track a new GitHub repository
- `syncRepository(id: ID!)`: Manually sync a repository to get latest releases
- `markReleaseSeen(releaseId: ID!)`: Mark a specific release as seen
- `markAllReleasesSeen(repositoryId: ID!)`: Mark all releases for a repository as seen
- `syncAllRepositories`: Trigger a sync of all tracked repositories
- `removeRepository(id: ID!)`: Remove a repository from tracking

## Data Storage

When you track a repository using the `trackRepository` mutation, the following happens:

1. The API fetches repository data from GitHub's API
2. This data is stored in your PostgreSQL database:
   - Repository information is stored in the `repository` table
   - Each release is stored in the `release` table with a link to its repository
   - Repository statistics (stars, forks, etc.) are preserved
   - All releases are initially marked as "unseen"

The database serves as your local cache and source of truth for tracked repositories. This allows:
- Offline access to repository data
- Tracking which releases you've reviewed (seen status)
- Determining which repositories have unseen updates
- Periodic background syncing with GitHub

When you sync a repository (manually or via scheduled task), only the data in your database is updated - the process doesn't affect the actual GitHub repository.

## Tips

- After tracking a repository, use its ID in other queries and mutations
- The release IDs are needed for the `markReleaseSeen` mutation
- Use the `hasUnseenReleases` field to identify repositories with new releases
- The `seen` field on releases indicates whether you've reviewed that release 