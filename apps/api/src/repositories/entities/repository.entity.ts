import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Release } from './release.entity';

@ObjectType()
@Entity()
export class Repository {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column({ unique: true })
  fullName: string;

  @Field()
  @Column()
  owner: string;

  @Field()
  @Column()
  name: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  description: string;

  @Field()
  @Column({ default: 0 })
  stargazersCount: number;

  @Field()
  @Column({ default: 0 })
  forksCount: number;

  @Field()
  @Column({ default: 0 })
  watchersCount: number;

  @Field()
  @Column({ default: 0 })
  openIssuesCount: number;

  @Field(() => [Release], { nullable: true })
  @OneToMany(() => Release, (release: Release) => release.repository, {
    eager: true,
    cascade: true,
  })
  releases: Release[];

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;

  @Field()
  @Column({ default: false })
  hasUnseenReleases: boolean;

  @Field()
  @Column({ default: new Date() })
  lastSyncedAt: Date;
}
