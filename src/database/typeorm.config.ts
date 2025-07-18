import * as dotenv from 'dotenv';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import {KlaviyoEventLog} from '../modules/event/entities/klaviyo-event-log.entity'

const commonConfig = {
  entities: [KlaviyoEventLog],
  synchronize: process.env.APPLICATION_MODE === 'dev',
  autoLoadEntities: true,
  logging: true,
};


export function getTypeOrmConfig(): TypeOrmModuleOptions {
  
  console.log('DB Loaded:', process.env.DB_NAME);

  if (!process.env.DB_NAME) {
    throw new Error('DB_NAME is missing! Did you load .env.test?');
  } 

  switch (process.env.DB_TYPE) {
    case 'mysql':
      return {
        type: 'mysql',
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT) || 3306,
        username: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME,
        ...commonConfig,
      };
    case 'sqlite':
      return {
        type: 'sqlite',
        database: `./data/${process.env.DB_NAME}`,
        ...commonConfig,
      };
    default:
      return {
        type: 'postgres',
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT) || 5432,
        username: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME,
        ...commonConfig,
      };
  }
}
