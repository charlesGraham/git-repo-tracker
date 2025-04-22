import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository as TypeOrmRepository } from 'typeorm';
import { Repository } from './entities/repository.entity';
import { Release } from './entities/release.entity';
import {
  GitHubService,
  GitHubRepository,
  GitHubRelease,
} from '../github/github.service';

@Injectable()
export class RepositoriesService {
  private readonly logger = new Logger(RepositoriesService.name);

  constructor(
    @InjectRepository(Repository)
    private repositoriesRepository: TypeOrmRepository<Repository>,
    @InjectRepository(Release)
    private releasesRepository: TypeOrmRepository<Release>,
    private githubService: GitHubService,
  ) {}

  /**
   * Get all tracked repositories
   */
  async findAll(): Promise<Repository[]> {
    return this.repositoriesRepository.find();
  }

  /**
   * Get a repository by ID
   */
  async findOne(id: string): Promise<Repository> {
    const repository = await this.repositoriesRepository.findOne({
      where: { id },
    });
    if (!repository) {
      throw new NotFoundException(`Repository with ID ${id} not found`);
    }
    return repository;
  }

  /**
   * Find a repository by owner and name
   */
  async findByOwnerAndName(
    owner: string,
    name: string,
  ): Promise<Repository | null> {
    return this.repositoriesRepository.findOne({
      where: { owner, name },
    });
  }

  /**
   * Track a new repository
   */
  async trackRepository(owner: string, name: string): Promise<Repository> {
    // Check if repository already exists
    const existingRepo = await this.findByOwnerAndName(owner, name);
    if (existingRepo) {
      return existingRepo;
    }

    // Fetch repository from GitHub
    const ghRepo: GitHubRepository = await this.githubService.getRepository(
      owner,
      name,
    );

    // Create new repository entity
    const repository = new Repository();
    repository.owner = owner;
    repository.name = name;
    repository.fullName = `${owner}/${name}`;
    repository.description = ghRepo.description || '';
    repository.stargazersCount = ghRepo.stargazers_count;
    repository.forksCount = ghRepo.forks_count;
    repository.watchersCount = ghRepo.watchers_count;
    repository.openIssuesCount = ghRepo.open_issues_count;
    repository.lastSyncedAt = new Date();

    // Save the repository
    const savedRepo = await this.repositoriesRepository.save(repository);

    // Sync releases
    await this.syncReleases(savedRepo.id);

    return this.findOne(savedRepo.id);
  }

  /**
   * Remove a repository from tracking
   */
  async removeRepository(id: string): Promise<boolean> {
    const result = await this.repositoriesRepository.delete(id);
    return result.affected ? result.affected > 0 : false;
  }

  /**
   * Sync releases for a specific repository
   */
  async syncReleases(repositoryId: string): Promise<Repository> {
    const repository = await this.repositoriesRepository.findOne({
      where: { id: repositoryId },
      relations: ['releases'],
    });

    if (!repository) {
      throw new NotFoundException(
        `Repository with ID ${repositoryId} not found`,
      );
    }

    try {
      // Fetch releases from GitHub
      const ghReleases: GitHubRelease[] = await this.githubService.getReleases(
        repository.owner,
        repository.name,
      );

      // Map of existing releases by tag name for quick lookup
      const existingReleasesByTag = new Map(
        (repository.releases || []).map((release) => [
          release.tagName,
          release,
        ]),
      );

      // Check if there are any new releases
      let hasNewReleases = false;

      // Process each release from GitHub
      for (const ghRelease of ghReleases) {
        const existingRelease = existingReleasesByTag.get(ghRelease.tag_name);

        if (!existingRelease) {
          // This is a new release
          const release = new Release();
          release.tagName = ghRelease.tag_name;
          release.name = ghRelease.name || '';
          release.body = ghRelease.body || '';
          release.htmlUrl = ghRelease.html_url;
          release.publishedAt = ghRelease.published_at
            ? new Date(ghRelease.published_at)
            : new Date();
          release.seen = false;
          release.repository = repository;
          release.repositoryId = repository.id;

          // Save the release
          await this.releasesRepository.save(release);
          hasNewReleases = true;
        }
      }

      // Update repository metadata
      repository.lastSyncedAt = new Date();
      if (hasNewReleases) {
        repository.hasUnseenReleases = true;
      }

      await this.repositoriesRepository.save(repository);

      // Return updated repository with releases
      return this.findOne(repositoryId);
    } catch (error) {
      this.logger.error(
        `Failed to sync releases for ${repository.fullName}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Mark all releases of a repository as seen
   */
  async markAllReleasesSeen(repositoryId: string): Promise<Repository> {
    const repository = await this.repositoriesRepository.findOne({
      where: { id: repositoryId },
      relations: ['releases'],
    });

    if (!repository) {
      throw new NotFoundException(
        `Repository with ID ${repositoryId} not found`,
      );
    }

    // Update all releases to seen
    if (repository.releases && repository.releases.length > 0) {
      await this.releasesRepository.update({ repositoryId }, { seen: true });

      // Update repository flag
      repository.hasUnseenReleases = false;
      await this.repositoriesRepository.save(repository);
    }

    return this.findOne(repositoryId);
  }

  /**
   * Mark a specific release as seen
   */
  async markReleaseSeen(releaseId: string): Promise<Release> {
    const release = await this.releasesRepository.findOne({
      where: { id: releaseId },
    });

    if (!release) {
      throw new NotFoundException(`Release with ID ${releaseId} not found`);
    }

    release.seen = true;
    await this.releasesRepository.save(release);

    // Check if all releases are now seen
    const unseenReleases = await this.releasesRepository.count({
      where: {
        repositoryId: release.repositoryId,
        seen: false,
      },
    });

    if (unseenReleases === 0) {
      await this.repositoriesRepository.update(
        { id: release.repositoryId },
        { hasUnseenReleases: false },
      );
    }

    return release;
  }

  /**
   * Sync all repositories
   */
  async syncAllRepositories(): Promise<void> {
    const repositories = await this.repositoriesRepository.find();

    for (const repository of repositories) {
      try {
        await this.syncReleases(repository.id);
        this.logger.log(
          `Successfully synced releases for ${repository.fullName}`,
        );
      } catch (error) {
        this.logger.error(
          `Failed to sync releases for ${repository.fullName}: ${error.message}`,
        );
      }
    }
  }
}
