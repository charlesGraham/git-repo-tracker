import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";
import {
  GET_REPOSITORIES,
  MARK_RELEASE_AS_SEEN,
  MARK_ALL_RELEASES_AS_SEEN,
  SYNC_REPOSITORY,
  TRACK_REPOSITORY,
  REMOVE_REPOSITORY,
} from "./graphql/queries";
import { Repository, Release } from "./types";
import RepositoryCard from "./components/RepositoryCard";

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

    const [owner, name] = newRepo.split("/");
    if (!owner || !name) {
      toast.error("Please enter a valid repository in the format 'owner/name'");
      return;
    }

    const pendingToastId = toast.loading(`Adding ${owner}/${name}...`);

    try {
      const trackResult = await trackRepository({
        variables: { owner, name },
      });

      if (!trackResult.data?.trackRepository?.id) {
        throw new Error("Failed to track repository");
      }

      await syncRepository({
        variables: { id: trackResult.data.trackRepository.id },
      });

      toast.update(pendingToastId, {
        render: `Successfully added ${owner}/${name}`,
        type: "success",
        isLoading: false,
        autoClose: 3000,
        closeButton: true,
      });

      setNewRepo("");
      refetch();
    } catch (err) {
      console.error("Error adding repository:", err);

      toast.update(pendingToastId, {
        render: `Error adding ${owner}/${name}: ${err instanceof Error ? err.message : String(err)}`,
        type: "error",
        isLoading: false,
        autoClose: 5000,
        closeButton: true,
      });
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
      toast.error(
        `Error marking release as seen: ${err instanceof Error ? err.message : String(err)}`
      );
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
      toast.error(
        `Error marking all releases as seen: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  };

  const handleRemoveRepository = async (id: string) => {
    if (!confirm("Are you sure you want to remove this repository?")) return;

    try {
      await removeRepository({
        variables: { id },
      });
      toast.success("Repository removed successfully");
      refetch();
    } catch (err) {
      console.error("Error removing repository:", err);
      toast.error(
        `Error removing repository: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  };

  const handleSyncRepository = async (id: string) => {
    const repository = data?.repositories.find(
      (repo: Repository) => repo.id === id
    );
    const pendingToastId = toast.loading(
      `Syncing ${repository?.fullName || "repository"}...`
    );

    try {
      await syncRepository({
        variables: { id },
      });

      toast.update(pendingToastId, {
        render: `${repository?.fullName || "Repository"} synced successfully`,
        type: "success",
        isLoading: false,
        autoClose: 3000,
        closeButton: true,
      });

      refetch();
    } catch (err) {
      console.error("Error syncing repository:", err);

      toast.update(pendingToastId, {
        render: `Error syncing repository: ${err instanceof Error ? err.message : String(err)}`,
        type: "error",
        isLoading: false,
        autoClose: 5000,
        closeButton: true,
      });
    }
  };

  const getUnseenCount = (releases: Release[]) => {
    return releases ? releases.filter((release) => !release.seen).length : 0;
  };

  const sortedRepositories = useMemo(() => {
    if (!data?.repositories) return [];

    return [...data.repositories].sort((a, b) => {
      const aUnseenCount = getUnseenCount(a.releases);
      const bUnseenCount = getUnseenCount(b.releases);

      if (sortByUnseen) {
        // descending order
        return (
          bUnseenCount - aUnseenCount || a.fullName.localeCompare(b.fullName)
        );
      } else {
        // ascending order
        return a.fullName.localeCompare(b.fullName);
      }
    });
  }, [data?.repositories, sortByUnseen]);

  return (
    <div className="app-container">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />

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

      <div>Hi</div>

      <div className="repositories-container">
        {sortedRepositories.map((repo: Repository) => (
          <RepositoryCard
            key={repo.id}
            repo={repo}
            onMarkAsSeen={handleMarkAsSeen}
            onMarkAllAsSeen={handleMarkAllAsSeen}
            onSync={handleSyncRepository}
            onRemove={handleRemoveRepository}
          />
        ))}

        {data?.repositories && data.repositories.length === 0 && (
          <p>No repositories found. Add one to get started!</p>
        )}
      </div>
    </div>
  );
}

export default App;
