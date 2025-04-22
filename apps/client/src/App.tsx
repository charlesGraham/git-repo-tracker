import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@apollo/client";
import "./App.css";
import {
  GET_REPOSITORIES,
  MARK_RELEASE_AS_SEEN,
  MARK_ALL_RELEASES_AS_SEEN,
  SYNC_REPOSITORY,
  TRACK_REPOSITORY,
  REMOVE_REPOSITORY,
} from "./graphql/queries";

function App() {
  const [newRepo, setNewRepo] = useState("");
  const [sortByUnseen, setSortByUnseen] = useState(true);
  const { loading, error, data, refetch } = useQuery(GET_REPOSITORIES);
  const [trackRepository] = useMutation(TRACK_REPOSITORY);
  const [syncRepository] = useMutation(SYNC_REPOSITORY);
  const [markReleaseAsSeen] = useMutation(MARK_RELEASE_AS_SEEN);
  const [markAllAsSeen] = useMutation(MARK_ALL_RELEASES_AS_SEEN);
  const [removeRepository] = useMutation(REMOVE_REPOSITORY);

  const handleAddRepository = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRepo) return;

    // Parse owner and name from input
    const [owner, name] = newRepo.split("/");
    if (!owner || !name) {
      alert("Please enter a valid repository in the format 'owner/name'");
      return;
    }

    try {
      // First track the repository
      const trackResult = await trackRepository({
        variables: { owner, name },
      });

      if (!trackResult.data?.trackRepository?.id) {
        throw new Error("Failed to track repository");
      }

      // Then sync the repository using its ID
      await syncRepository({
        variables: { id: trackResult.data.trackRepository.id },
      });

      setNewRepo("");
      refetch();
    } catch (err) {
      console.error("Error adding repository:", err);
      alert(
        `Error adding repository: ${err instanceof Error ? err.message : String(err)}`
      );
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

  const handleRemoveRepository = async (id: string) => {
    if (!confirm("Are you sure you want to remove this repository?")) return;

    try {
      await removeRepository({
        variables: { id },
      });
      refetch();
    } catch (err) {
      console.error("Error removing repository:", err);
    }
  };

  const getUnseenCount = (releases: any[]) => {
    return releases ? releases.filter((release) => !release.seen).length : 0;
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
                    href={`https://github.com/${repo.fullName}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {repo.fullName}
                  </a>
                </h2>
                {unseenCount > 0 && (
                  <span className="unseen-badge">{unseenCount}</span>
                )}
                <button
                  onClick={() => handleRemoveRepository(repo.id)}
                  className="remove-btn"
                  title="Remove repository"
                >
                  ×
                </button>
              </div>

              {repo.description && (
                <p className="repo-description">{repo.description}</p>
              )}

              <div className="repo-stats">
                <span title="Stars">⭐ {repo.stargazersCount}</span>
                <span title="Forks">🍴 {repo.forksCount}</span>
                <span title="Watchers">👀 {repo.watchersCount}</span>
                <span title="Open Issues">📝 {repo.openIssuesCount}</span>
                <span title="Last Synced">
                  🔄 {new Date(repo.lastSyncedAt).toLocaleString()}
                </span>
              </div>

              <div className="releases-header">
                <h3>Latest Releases</h3>
                <div className="releases-actions">
                  <button
                    onClick={() =>
                      syncRepository({ variables: { id: repo.id } })
                    }
                    className="sync-btn"
                    title="Sync releases"
                  >
                    🔄 Sync
                  </button>
                  {unseenCount > 0 && (
                    <button
                      onClick={() => handleMarkAllAsSeen(repo.id)}
                      className="mark-all-btn"
                    >
                      Mark all as seen
                    </button>
                  )}
                </div>
              </div>

              {repo.releases && repo.releases.length > 0 ? (
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

        {data?.repositories && data.repositories.length === 0 && (
          <p>No repositories found. Add one to get started!</p>
        )}
      </div>
    </div>
  );
}

export default App;
