import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { RepositoriesService } from './repositories.service';
import { Repository } from './entities/repository.entity';
import { Release } from './entities/release.entity';

@Resolver(() => Repository)
export class RepositoriesResolver {
  constructor(private readonly repositoriesService: RepositoriesService) {}

  @Query(() => [Repository], { name: 'repositories' })
  async findAll(): Promise<Repository[]> {
    return this.repositoriesService.findAll();
  }

  @Query(() => Repository, { name: 'repository' })
  async findOne(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<Repository> {
    return this.repositoriesService.findOne(id);
  }

  @Mutation(() => Repository, { name: 'trackRepository' })
  async trackRepository(
    @Args('owner') owner: string,
    @Args('name') name: string,
  ): Promise<Repository> {
    return this.repositoriesService.trackRepository(owner, name);
  }

  @Mutation(() => Boolean, { name: 'removeRepository' })
  async removeRepository(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<boolean> {
    return this.repositoriesService.removeRepository(id);
  }

  @Mutation(() => Repository, { name: 'syncRepository' })
  async syncRepository(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<Repository> {
    return this.repositoriesService.syncReleases(id);
  }

  @Mutation(() => Repository, { name: 'markAllReleasesSeen' })
  async markAllReleasesSeen(
    @Args('repositoryId', { type: () => ID }) repositoryId: string,
  ): Promise<Repository> {
    return this.repositoriesService.markAllReleasesSeen(repositoryId);
  }

  @Mutation(() => Release, { name: 'markReleaseSeen' })
  async markReleaseSeen(
    @Args('releaseId', { type: () => ID }) releaseId: string,
  ): Promise<Release> {
    return this.repositoriesService.markReleaseSeen(releaseId);
  }

  @Mutation(() => Boolean, { name: 'syncAllRepositories' })
  async syncAllRepositories(): Promise<boolean> {
    await this.repositoriesService.syncAllRepositories();
    return true;
  }
}
