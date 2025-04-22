# GitHub Repository Tracker - Frontend

This React application provides a user interface for tracking GitHub repositories and their releases. It's built with React, TypeScript, Vite, Apollo Client, and React Toastify to interact with the NestJS GraphQL API.

## Features

- Track GitHub repositories by owner/name format
- View repository details (stars, forks, watchers, open issues)
- Display repository releases with their details in collapsible accordions
- Mark releases as seen individually or all at once
- Sync repositories to fetch the latest releases
- Remove tracked repositories
- Sort repositories by those with unseen releases
- Toast notifications for all operations (success, error, loading states)

## Tech Stack

- **React**: UI library for building the user interface
- **TypeScript**: For type-safe code
- **Vite**: Fast build tool and development server
- **Apollo Client**: GraphQL client for React
- **React Toastify**: For toast notifications
- **CSS**: Custom styling with CSS variables for theming

## Architecture

### Component Structure

The application follows a component-based architecture:

- **App.tsx**: Main application component that handles API calls and state management
- **RepositoryCard.tsx**: Reusable component for displaying repository details with accordion UI
- **Types.ts**: TypeScript interfaces for the application's data models

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

### Toast Notifications

The application uses React Toastify to display notifications for various operations:

- Loading toasts for operations in progress (syncing, adding repositories)
- Success toasts for completed operations
- Error toasts for failed operations
- Custom toast styling and positioning

Example implementation:

```typescript
// Show loading toast
const pendingToastId = toast.loading(`Adding ${owner}/${name}...`);

try {
  // Perform operation
  // ...
  
  // Update to success toast
  toast.update(pendingToastId, {
    render: `Successfully added ${owner}/${name}`,
    type: "success",
    isLoading: false,
    autoClose: 3000,
    closeButton: true
  });
} catch (err) {
  // Update to error toast
  toast.update(pendingToastId, {
    render: `Error: ${err instanceof Error ? err.message : String(err)}`,
    type: "error",
    isLoading: false,
    autoClose: 5000,
    closeButton: true
  });
}
```

### Accordion UI for Repository Releases

Each repository is displayed in a card with an accordion-style UI for viewing releases:

- Repository details are always visible (name, stars, forks, etc.)
- Releases are hidden by default and can be expanded/collapsed
- Visual indicators for repositories with unseen releases
- Smooth transitions for accordion opening/closing

## API Interaction Flow

### Adding a Repository

1. User enters repository in format `owner/name` (e.g., `facebook/react`)
2. Loading toast is displayed
3. Application calls the `trackRepository` mutation with `owner` and `name` parameters
4. After successful tracking, it calls the `syncRepository` mutation to fetch releases
5. Success toast is displayed
6. The UI refreshes to display the newly added repository with its releases

### Syncing Repositories

1. User clicks the "Sync" button on a repository card
2. Loading toast is displayed
3. Application calls the `syncRepository` mutation with the repository ID
4. The API fetches the latest releases from GitHub
5. Success toast is displayed
6. The UI refreshes to display any new releases

### Marking Releases as Seen

1. User clicks "Mark as seen" on an unseen release
2. Application calls the `markReleaseSeen` mutation with the release ID
3. The UI updates to show the release as seen
4. Unseen release count badge is updated

### Removing Repositories

1. User clicks the remove button on a repository card
2. Confirmation dialog is shown
3. If confirmed, the repository is removed from tracking
4. Success toast is displayed

## Repository Card Component

The `RepositoryCard` component encapsulates:

- Repository details display
- Accordion functionality for releases
- Action buttons for repository operations
- UI states for seen/unseen releases

The component accepts props for:
- Repository data
- Callback functions for various actions

## Styling

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
  --badge-color: #f85149;
}
```

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

1. **Component Organization**: Separated UI components into reusable pieces
2. **Type Safety**: Uses TypeScript interfaces for data and props
3. **Error Handling**: Proper error handling with toast notifications
4. **Responsive Design**: Works on mobile and desktop
5. **Performance**: 
   - Uses Apollo Client cache for efficient data management
   - Optimizes rendering with React hooks like useMemo
   - Lazy loading of content with accordion UI
6. **User Experience**:
   - Toast notifications for all operations
   - Loading states with visual feedback
   - Accordion UI to manage visual complexity
   - Sorts repositories by relevance (unseen releases first)
   - Visual indicators for unseen content
