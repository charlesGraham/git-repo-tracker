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

  async findAll(): Promise<Repository[]> {
    return this.repositoriesRepository.find();
  }

  async findOne(id: string): Promise<Repository> {
    const repository = await this.repositoriesRepository.findOne({
      where: { id },
    });
    if (!repository) {
      throw new NotFoundException(`Repository with ID ${id} not found`);
    }
    return repository;
  }

  async findByOwnerAndName(
    owner: string,
    name: string,
  ): Promise<Repository | null> {
    return this.repositoriesRepository.findOne({
      where: { owner, name },
    });
  }

  async trackRepository(owner: string, name: string): Promise<Repository> {
    // check if already exists
    const existingRepo = await this.findByOwnerAndName(owner, name);
    if (existingRepo) {
      return existingRepo;
    }

    // fetch repo from GH
    const ghRepo: GitHubRepository = await this.githubService.getRepository(
      owner,
      name,
    );

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

    const savedRepo = await this.repositoriesRepository.save(repository);

    try {
      const ghReleases: GitHubRelease[] = await this.githubService.getReleases(
        owner,
        name,
      );

      for (const ghRelease of ghReleases) {
        const release = new Release();
        release.tagName = ghRelease.tag_name;
        release.name = ghRelease.name || '';
        release.body = ghRelease.body || '';
        release.htmlUrl = ghRelease.html_url;
        release.publishedAt = ghRelease.published_at
          ? new Date(ghRelease.published_at)
          : new Date();
        release.seen = false;
        release.repositoryId = savedRepo.id;

        // save
        await this.releasesRepository.save(release);
      }

      // mark the repo if there are releases
      if (ghReleases.length > 0) {
        savedRepo.hasUnseenReleases = true;
        await this.repositoriesRepository.save(savedRepo);
      }
    } catch (error) {
      this.logger.error(
        `Failed to fetch releases for ${savedRepo.fullName}: ${error.message}`,
      );
    } // don't rethrow - don't want it to crash just because we don't have release data.

    return this.findOne(savedRepo.id);
  }

  async removeRepository(id: string): Promise<boolean> {
    const result = await this.repositoriesRepository.delete(id);
    return result.affected ? result.affected > 0 : false;
  }

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
      const ghReleases: GitHubRelease[] = await this.githubService.getReleases(
        repository.owner,
        repository.name,
      );

      // map of existing releases by tag name for quick lookup
      const existingReleasesByTag = new Map(
        (repository.releases || []).map((release) => [
          release.tagName,
          release,
        ]),
      );

      // check for any new releases
      let hasNewReleases = false;

      for (const ghRelease of ghReleases) {
        const existingRelease = existingReleasesByTag.get(ghRelease.tag_name);

        if (!existingRelease) {
          const release = new Release();
          release.tagName = ghRelease.tag_name;
          release.name = ghRelease.name || '';
          release.body = ghRelease.body || '';
          release.htmlUrl = ghRelease.html_url;
          release.publishedAt = ghRelease.published_at
            ? new Date(ghRelease.published_at)
            : new Date();
          release.seen = false;
          release.repositoryId = repositoryId;

          await this.releasesRepository.save(release);
          hasNewReleases = true;
        }
      }

      // update repo metadata
      repository.lastSyncedAt = new Date();
      if (hasNewReleases) {
        repository.hasUnseenReleases = true;
      }

      await this.repositoriesRepository.save(repository);

      // return updated repo
      return this.findOne(repositoryId);
    } catch (error) {
      this.logger.error(
        `Failed to sync releases for ${repository.fullName}: ${error.message}`,
      );
      throw error;
    }
  }

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

    if (repository.releases && repository.releases.length > 0) {
      await this.releasesRepository.update({ repositoryId }, { seen: true });

      repository.hasUnseenReleases = false;
      await this.repositoriesRepository.save(repository);
    }

    return this.findOne(repositoryId);
  }

  async markReleaseSeen(releaseId: string): Promise<Release> {
    const release = await this.releasesRepository.findOne({
      where: { id: releaseId },
    });

    if (!release) {
      throw new NotFoundException(`Release with ID ${releaseId} not found`);
    }

    release.seen = true;
    await this.releasesRepository.save(release);

    // check if all releases are seen
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
