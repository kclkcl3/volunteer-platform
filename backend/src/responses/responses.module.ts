import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { ResponsesController } from './responses.controller';
import { ResponsesService } from './responses.service';

@Module({ imports: [NotificationsModule], controllers: [ResponsesController], providers: [ResponsesService] })
export class ResponsesModule {}
