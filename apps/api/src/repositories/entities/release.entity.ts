import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Repository } from './repository.entity';

@ObjectType()
@Entity()
export class Release {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  tagName: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  name: string;

  @Field({ nullable: true })
  @Column({ nullable: true, type: 'text' })
  body: string;

  @Field()
  @Column()
  htmlUrl: string;

  @Field()
  @Column({ type: 'timestamp' })
  publishedAt: Date;

  @Field()
  @Column({ default: false })
  seen: boolean;

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Repository, (repository) => repository.releases, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'repositoryId' })
  repository: Repository;

  @Field()
  @Column()
  repositoryId: string;
}
