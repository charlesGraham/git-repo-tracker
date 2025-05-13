import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  watchers_count: number;
  forks_count: number;
  open_issues_count: number;
  [key: string]: any;
}

export interface GitHubRelease {
  id: number;
  tag_name: string;
  name: string | null;
  body: string | null;
  html_url: string;
  published_at: string | null;
  [key: string]: any;
}

@Injectable()
export class GitHubService {
  private readonly baseUrl = 'https://api.github.com';
  private readonly headers: Record<string, string>;
  private readonly logger = new Logger(GitHubService.name);

  constructor(private configService: ConfigService) {
    const token = this.configService.get<string>('github.token');

    if (!token) {
      this.logger.warn(
        'GitHub token not provided. Rate limits will be restricted.',
      );
    }

    this.headers = {
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'NestJS-GitHub-Tracker',
      ...(token ? { Authorization: `token ${token}` } : {}),
    };
  }

  private async request<T>(endpoint: string): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        headers: this.headers,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `GitHub API error: ${response.status} - ${errorData.message || 'Unknown error'}`,
        );
      }

      return (await response.json()) as T;
    } catch (error) {
      this.logger.error(`Failed to fetch ${url}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Fetches repository information from GitHub
   * @param owner The owner of the repository
   * @param repo The name of the repository
   * @returns Repository information from GitHub
   */
  async getRepository(owner: string, repo: string): Promise<GitHubRepository> {
    return await this.request<GitHubRepository>(`/repos/${owner}/${repo}`);
  }

  /**
   * Fetches the releases for a repository
   * @param owner The owner of the repository
   * @param repo The name of the repository
   * @returns Array of releases from GitHub
   */
  async getReleases(owner: string, repo: string): Promise<GitHubRelease[]> {
    return await this.request<GitHubRelease[]>(
      `/repos/${owner}/${repo}/releases?per_page=100`, // arbitrary limit
    );
  }
}
