import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@apollo/client";
import "./App.css";
import {
  GET_REPOSITORIES,
  MARK_RELEASE_AS_SEEN,
  MARK_ALL_RELEASES_AS_SEEN,
  SYNC_REPOSITORY,
} from "./graphql/queries";

function App() {
  const [newRepo, setNewRepo] = useState("");
  const [sortByUnseen, setSortByUnseen] = useState(true);
  const { loading, error, data, refetch } = useQuery(GET_REPOSITORIES);
  const [syncRepository] = useMutation(SYNC_REPOSITORY);
  const [markReleaseAsSeen] = useMutation(MARK_RELEASE_AS_SEEN);
  const [markAllAsSeen] = useMutation(MARK_ALL_RELEASES_AS_SEEN);

  const handleAddRepository = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRepo) return;

    try {
      await syncRepository({
        variables: { fullName: newRepo },
      });
      setNewRepo("");
      refetch();
    } catch (err) {
      console.error("Error adding repository:", err);
    }
  };

  const handleMarkAsSeen = async (releaseId: string) => {
    try {
      await markReleaseAsSeen({
        variables: { releaseId },
      });
      refetch();
    } catch (err) {
      console.error("Error marking release as seen:", err);
    }
  };

  const handleMarkAllAsSeen = async (repositoryId: string) => {
    try {
      await markAllAsSeen({
        variables: { repositoryId },
      });
      refetch();
    } catch (err) {
      console.error("Error marking all releases as seen:", err);
    }
  };

  const getUnseenCount = (releases: any[]) => {
    return releases.filter((release) => !release.seen).length;
  };

  const sortedRepositories = useMemo(() => {
    if (!data?.repositories) return [];

    return [...data.repositories].sort((a, b) => {
      const aUnseenCount = getUnseenCount(a.releases);
      const bUnseenCount = getUnseenCount(b.releases);

      if (sortByUnseen) {
        // Sort by unseen count (descending), then alphabetically by name
        return (
          bUnseenCount - aUnseenCount || a.fullName.localeCompare(b.fullName)
        );
      } else {
        // Sort alphabetically by name
        return a.fullName.localeCompare(b.fullName);
      }
    });
  }, [data?.repositories, sortByUnseen]);

  return (
    <div className="app-container">
      <h1>GitHub Repository Tracker</h1>

      <form onSubmit={handleAddRepository} className="add-repo-form">
        <input
          type="text"
          value={newRepo}
          onChange={(e) => setNewRepo(e.target.value)}
          placeholder="owner/repository-name"
        />
        <button type="submit">Add Repository</button>
      </form>

      {loading && <p>Loading repositories...</p>}
      {error && <p className="error">Error: {error.message}</p>}

      {data?.repositories && data.repositories.length > 0 && (
        <div className="sort-controls">
          <label>
            <input
              type="checkbox"
              checked={sortByUnseen}
              onChange={() => setSortByUnseen(!sortByUnseen)}
            />
            Prioritize repositories with unseen releases
          </label>
        </div>
      )}

      <div className="repositories-container">
        {sortedRepositories.map((repo: any) => {
          const unseenCount = getUnseenCount(repo.releases);
          return (
            <div key={repo.id} className="repository-card">
              <div className="repo-header">
                <h2>
                  <a
                    href={repo.htmlUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {repo.fullName}
                  </a>
                </h2>
                {unseenCount > 0 && (
                  <span className="unseen-badge">{unseenCount}</span>
                )}
              </div>
              <p>{repo.description}</p>

              <div className="releases-header">
                <h3>Latest Releases</h3>
                {unseenCount > 0 && (
                  <button
                    onClick={() => handleMarkAllAsSeen(repo.id)}
                    className="mark-all-btn"
                  >
                    Mark all as seen
                  </button>
                )}
              </div>

              {repo.releases.length > 0 ? (
                <ul className="releases-list">
                  {repo.releases.map((release: any) => (
                    <li
                      key={release.id}
                      className={
                        release.seen ? "release seen" : "release unseen"
                      }
                    >
                      <div className="release-info">
                        <h4>
                          <a
                            href={release.htmlUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {release.name || release.tagName}
                          </a>
                        </h4>
                        <p>
                          Published:{" "}
                          {new Date(release.publishedAt).toLocaleDateString()}
                        </p>
                      </div>
                      {!release.seen && (
                        <button
                          onClick={() => handleMarkAsSeen(release.id)}
                          className="mark-seen-btn"
                        >
                          Mark as seen
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No releases found</p>
              )}
            </div>
          );
        })}

        {data?.repositories.length === 0 && (
          <p>No repositories found. Add one to get started!</p>
        )}
      </div>
    </div>
  );
}

export default App;
