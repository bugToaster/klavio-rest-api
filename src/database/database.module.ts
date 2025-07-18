import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getTypeOrmConfig } from './typeorm.config';

@Module({
  imports: [TypeOrmModule.forRoot(getTypeOrmConfig())],
})
export class DatabaseModule {}