import {
  ApolloClient,
  InMemoryCache,
  createHttpLink,
  ApolloLink,
} from "@apollo/client";
import { onError } from "@apollo/client/link/error";

const httpLink = createHttpLink({
  uri: "/graphql", // This will be proxied to http://localhost:3000/graphql
});

// log errors
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

// combine error link with the http link
const link = ApolloLink.from([errorLink, httpLink]);

export const apolloClient = new ApolloClient({
  link,
  cache: new InMemoryCache(),
  connectToDevTools: true,
});
