import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('klaviyo_event_log')
export class KlaviyoEventLog {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: true })
    eventName: string;

    @Column({ type: 'jsonb', nullable: true })
    eventAttributes: any;

    @Column({ type: 'jsonb', nullable: true })
    profileAttributes: any;

    @Column({ nullable: true })
    timestamp: Date;

    @Column({ type: 'float', nullable: true })
    value: number;

    @Column({ nullable: true })
    uniqueId: string;

    @CreateDateColumn()
    createdAt: Date;
}
