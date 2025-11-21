import { Module } from '@nestjs/common';
import { AuditsController } from './audits.controller';
import { AuditsService } from './audits.service';
import { AuditProcessorService } from './audit-processor.service';

@Module({
  controllers: [AuditsController],
  providers: [AuditsService, AuditProcessorService],
  exports: [AuditsService, AuditProcessorService],
})
export class AuditsModule {}
