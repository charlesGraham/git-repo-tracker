# GitHub Repository Tracker - Frontend

This React application provides a user interface for tracking GitHub repositories and their releases. It's built with React, TypeScript, Vite, and Apollo Client to interact with the NestJS GraphQL API.

## Features

- Track GitHub repositories by owner/name format
- View repository details (stars, forks, watchers, open issues)
- Display repository releases with their details
- Mark releases as seen individually or all at once
- Sync repositories to fetch the latest releases
- Remove tracked repositories
- Sort repositories by those with unseen releases

## Tech Stack

- **React**: UI library for building the user interface
- **TypeScript**: For type-safe code
- **Vite**: Fast build tool and development server
- **Apollo Client**: GraphQL client for React
- **CSS**: Custom styling with CSS variables for theming

## Architecture

### Apollo Client Setup

The application uses Apollo Client to interact with the GraphQL API. The client configuration is in `src/apollo-client.ts`:

```typescript
import { ApolloClient, InMemoryCache, createHttpLink, ApolloLink } from "@apollo/client";
import { onError } from "@apollo/client/link/error";

const httpLink = createHttpLink({
  uri: "/graphql",
});

// Log any GraphQL errors or network error
const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors)
    graphQLErrors.forEach(({ message, locations, path }) => {
      console.error(
        `[GraphQL error]: Message: ${message}, Location: ${JSON.stringify(
          locations
        )}, Path: ${path}`
      );
    });
  if (networkError) console.error(`[Network error]: ${networkError}`);
});

// Combine the error link with the http link
const link = ApolloLink.from([errorLink, httpLink]);

export const apolloClient = new ApolloClient({
  link,
  cache: new InMemoryCache(),
  connectToDevTools: true,
});
```

### GraphQL Operations

All GraphQL queries and mutations are defined in `src/graphql/queries.ts`:

- `GET_REPOSITORIES`: Fetches the list of all tracked repositories with their releases
- `GET_REPOSITORY`: Fetches a single repository by ID
- `TRACK_REPOSITORY`: Adds a new repository to be tracked
- `SYNC_REPOSITORY`: Syncs a repository to fetch the latest releases
- `MARK_RELEASE_AS_SEEN`: Marks a single release as seen
- `MARK_ALL_RELEASES_AS_SEEN`: Marks all releases for a repository as seen
- `REMOVE_REPOSITORY`: Removes a repository from tracking

### Component Structure

The main application component in `src/App.tsx` handles:

1. **State Management**:
   - Repository data from GraphQL queries
   - Form state for adding new repositories
   - Sorting preferences for repositories

2. **User Interactions**:
   - Adding repositories (`handleAddRepository`)
   - Marking releases as seen (`handleMarkAsSeen`)
   - Marking all releases as seen (`handleMarkAllAsSeen`)
   - Removing repositories (`handleRemoveRepository`)
   - Syncing repositories to fetch latest releases

3. **Data Processing**:
   - Sorting repositories based on unseen releases
   - Calculating unseen release counts

### Styling

The application uses CSS variables for theming in `src/App.css`:

```css
:root {
  --primary-color: #0366d6;
  --bg-color: #f6f8fa;
  --card-bg: #fff;
  --border-color: #e1e4e8;
  --text-color: #24292e;
  --secondary-text: #586069;
  --unseen-bg: #fffbea;
  --success-color: #2ea44f;
}
```

## API Interaction Flow

### Adding a Repository

1. User enters repository in format `owner/name` (e.g., `facebook/react`)
2. Application calls the `trackRepository` mutation with `owner` and `name` parameters
3. After successful tracking, it calls the `syncRepository` mutation to fetch releases
4. The UI refreshes to display the newly added repository with its releases

### Syncing Repositories

1. User clicks the "Sync" button on a repository card
2. Application calls the `syncRepository` mutation with the repository ID
3. The API fetches the latest releases from GitHub
4. The UI refreshes to display any new releases

### Marking Releases as Seen

1. User clicks "Mark as seen" on an unseen release
2. Application calls the `markReleaseSeen` mutation with the release ID
3. The UI updates to show the release as seen
4. Unseeded release count badge is updated

### Viewing Repository Details

The repository card displays:
- Repository name and owner with link to GitHub
- Description (if available)
- Stats (stars, forks, watchers, open issues)
- Last sync time
- List of releases with publish dates
- Unseen release count badge

## NestJS Backend Integration

The frontend communicates with a NestJS GraphQL API that:

1. **Stores repository data** in a database using TypeORM
2. **Fetches repository and release data** from the GitHub API
3. **Provides GraphQL resolvers** for all operations
4. **Manages the seen/unseen state** of releases

The API schema defines:
- `Repository` type with metadata fields and release relationship
- `Release` type with details about GitHub releases
- Mutations for tracking, syncing, and managing repositories
- Queries for retrieving repository and release data

## Development

To start the development server:

```bash
npm run dev
```

## Building for Production

To build the application for production:

```bash
npm run build
```

The build output will be in the `dist` directory.

## Best Practices

This application follows these best practices:

1. **Type Safety**: Uses TypeScript for all code
2. **Error Handling**: Proper error handling for all API operations
3. **Responsive Design**: Works on mobile and desktop
4. **Performance**: 
   - Uses Apollo Client cache for efficient data management
   - Optimizes rendering with React hooks like useMemo
5. **User Experience**:
   - Shows loading states during API operations
   - Provides clear error messages
   - Sorts repositories by relevance (unseen releases first)
   - Uses visual indicators for unseen content
