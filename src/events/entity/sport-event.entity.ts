import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { EventStatus } from "../enums/event-status.enum";
import { SportType } from "../enums/sport-type.enum";

@Entity()
export class SportEvent {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({
    type: "varchar",
    enum: SportType,
  })
  sport: SportType;

  @Column({
    type: "varchar",
    enum: EventStatus,
    default: EventStatus.INACTIVE,
  })
  status: EventStatus;

  @Column()
  startTime: Date;

  @Column()
  finishTime: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
