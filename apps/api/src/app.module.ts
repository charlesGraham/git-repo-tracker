import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { join } from 'path';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GitHubModule } from './github/github.module';
import { RepositoriesModule } from './repositories/repositories.module';
import { Repository } from './repositories/entities/repository.entity';
import { Release } from './repositories/entities/release.entity';
import { RepositoriesTask } from './repositories/repositories.task';

import configuration from './config/configuration';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),

    // GraphQL
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      playground: true,
    }),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('database.host'),
        port: configService.get('database.port'),
        username: configService.get('database.username'),
        password: configService.get('database.password'),
        database: configService.get('database.database'),
        entities: [Repository, Release],
        synchronize: true, // Only use this for development
        autoLoadEntities: true,
        connectTimeoutMS: 10000, // Increase connection timeout
        extra: {
          max: 5, // Limit pool connections
        },
        logging: ['error', 'warn'], // Log errors and warnings
      }),
    }),

    // Schedule tasks
    ScheduleModule.forRoot(),

    // Serve static frontend
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '../..', 'client', 'dist'),
    }),

    // App modules
    GitHubModule,
    RepositoriesModule,
  ],
  controllers: [AppController],
  providers: [AppService, RepositoriesTask],
})
export class AppModule {}
