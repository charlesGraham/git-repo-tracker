import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RepositoriesService } from './repositories.service';
import { RepositoriesResolver } from './repositories.resolver';
import { Repository } from './entities/repository.entity';
import { Release } from './entities/release.entity';
import { GitHubModule } from '../github/github.module';

@Module({
  imports: [TypeOrmModule.forFeature([Repository, Release]), GitHubModule],
  providers: [RepositoriesService, RepositoriesResolver],
  exports: [RepositoriesService],
})
export class RepositoriesModule {}
