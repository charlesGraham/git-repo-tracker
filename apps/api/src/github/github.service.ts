import { Injectable, Logger } from '@nestjs/common';
import { Octokit } from 'octokit';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GitHubService {
  private readonly octokit: Octokit;
  private readonly logger = new Logger(GitHubService.name);

  constructor(private configService: ConfigService) {
    const token = this.configService.get<string>('github.token');
    if (!token) {
      this.logger.warn(
        'GitHub token not provided. API rate limits will be restricted.',
      );
    }

    this.octokit = new Octokit({
      auth: token,
    });
  }

  /**
   * Fetches repository information from GitHub
   * @param owner The owner of the repository
   * @param repo The name of the repository
   * @returns Repository information from GitHub
   */
  async getRepository(owner: string, repo: string) {
    try {
      const { data } = await this.octokit.rest.repos.get({
        owner,
        repo,
      });

      return data;
    } catch (error) {
      this.logger.error(
        `Failed to fetch repository ${owner}/${repo}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Fetches the releases for a repository
   * @param owner The owner of the repository
   * @param repo The name of the repository
   * @returns Array of releases from GitHub
   */
  async getReleases(owner: string, repo: string) {
    try {
      const { data } = await this.octokit.rest.repos.listReleases({
        owner,
        repo,
        per_page: 100, // Get the maximum number of releases per page
      });

      return data;
    } catch (error) {
      this.logger.error(
        `Failed to fetch releases for ${owner}/${repo}: ${error.message}`,
      );
      throw error;
    }
  }
}
