import { useState } from "react";
import { Repository, Release } from "../types";

// Props for repository card component
export interface RepositoryCardProps {
  repo: Repository;
  onMarkAsSeen: (releaseId: string) => void;
  onMarkAllAsSeen: (repositoryId: string) => void;
  onSync: (repositoryId: string) => void;
  onRemove: (repositoryId: string) => void;
}

// Component for the repository card
const RepositoryCard = ({
  repo,
  onMarkAsSeen,
  onMarkAllAsSeen,
  onSync,
  onRemove,
}: RepositoryCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const unseenCount = repo.releases
    ? repo.releases.filter((r: Release) => !r.seen).length
    : 0;

  return (
    <div className="repository-card">
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
        {unseenCount > 0 && <span className="unseen-badge">{unseenCount}</span>}
        <button
          onClick={() => onRemove(repo.id)}
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

      <div className="accordion">
        <div
          className="accordion-header"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="releases-header">
            <h3>
              Latest Releases
              {repo.releases && repo.releases.length > 0 && (
                <span className="release-count">({repo.releases.length})</span>
              )}
            </h3>
            <div className="releases-actions">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSync(repo.id);
                }}
                className="sync-btn"
                title="Sync releases"
              >
                🔄 Sync
              </button>
              {unseenCount > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onMarkAllAsSeen(repo.id);
                  }}
                  className="mark-all-btn"
                >
                  Mark all as seen
                </button>
              )}
            </div>
          </div>
          <span className={`accordion-icon ${expanded ? "expanded" : ""}`}>
            {expanded ? "▼" : "▶"}
          </span>
        </div>

        <div className={`accordion-content ${expanded ? "expanded" : ""}`}>
          {expanded && (
            <>
              {repo.releases && repo.releases.length > 0 ? (
                <ul className="releases-list">
                  {repo.releases.map((release: Release) => (
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
                          onClick={() => onMarkAsSeen(release.id)}
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
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default RepositoryCard;
