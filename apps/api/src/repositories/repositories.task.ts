import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { RepositoriesService } from './repositories.service';

@Injectable()
export class RepositoriesTask {
  private readonly logger = new Logger(RepositoriesTask.name);
  private syncCronExpression: string;

  constructor(
    private readonly repositoriesService: RepositoriesService,
    private readonly configService: ConfigService,
  ) {
    const syncIntervalMinutes =
      this.configService.get<number>('syncInterval') || 60;
    this.syncCronExpression = `0 */${syncIntervalMinutes} * * * *`;
    this.logger.log(
      `Repository sync scheduled to run every ${syncIntervalMinutes} minutes`,
    );
  }

  @Cron(CronExpression.EVERY_HOUR)
  async syncRepositories() {
    this.logger.log('Starting scheduled repositories sync...');

    try {
      await this.repositoriesService.syncAllRepositories();
      this.logger.log('Repositories sync completed successfully');
    } catch (error) {
      this.logger.error(`Repositories sync failed: ${error.message}`);
    }
  }
}
