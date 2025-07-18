import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('klaviyo_event_log')
export class KlaviyoEventLog {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    eventName: string;

    @Column({ type: 'jsonb' })
    eventAttributes: Record<string, any>;

    @Column({ type: 'jsonb' })
    profileAttributes: Record<string, any>;

    @CreateDateColumn()
    createdAt: Date;
}
