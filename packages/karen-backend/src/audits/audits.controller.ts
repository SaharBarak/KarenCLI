import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  Request,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { AuditsService } from './audits.service';
import { AuditProcessorService } from './audit-processor.service';
import { CreateAuditDto } from './dto/create-audit.dto';
import type { CreateAuditResponse, GetAuditResponse } from '../common/contracts';

@Controller('api/audits')
export class AuditsController {
  constructor(
    private auditsService: AuditsService,
    private auditProcessor: AuditProcessorService
  ) {}

  @Post('create')
  async createAudit(@Body() dto: CreateAuditDto, @Request() req: any): Promise<CreateAuditResponse> {
    // TODO: Add authentication guard
    const userId = req.user?.id || 'test-user-id';

    const result = await this.auditsService.createAudit(userId, dto);

    if (result.isErr()) {
      throw new HttpException(result.error.message, result.error.statusCode);
    }

    const audit = result.value;

    // Trigger background processing (in production, use a queue)
    this.auditProcessor.processAudit(audit.id);

    // Return contract-aligned response
    return {
      id: audit.id,
      status: audit.status,
    };
  }

  @Get(':id')
  async getAudit(@Param('id') id: string, @Request() req: any): Promise<GetAuditResponse> {
    const userId = req.user?.id || 'test-user-id';

    const result = await this.auditsService.getAudit(id, userId);

    if (result.isErr()) {
      throw new HttpException(result.error.message, result.error.statusCode);
    }

    // Return contract-aligned response
    return result.value;
  }

  @Get()
  async getUserAudits(@Request() req: any): Promise<GetAuditResponse[]> {
    const userId = req.user?.id || 'test-user-id';

    const result = await this.auditsService.getUserAudits(userId);

    if (result.isErr()) {
      throw new HttpException(result.error.message, result.error.statusCode);
    }

    // Return contract-aligned response
    return result.value;
  }
}
