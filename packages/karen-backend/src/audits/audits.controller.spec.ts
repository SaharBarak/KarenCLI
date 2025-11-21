import { Test, TestingModule } from '@nestjs/testing';
import { AuditsController } from './audits.controller';
import { AuditsService } from './audits.service';
import { AuditProcessorService } from './audit-processor.service';
import { ok, err } from 'neverthrow';
import { ServiceError } from '../common/result';

describe('AuditsController', () => {
  let controller: AuditsController;
  let auditsService: jest.Mocked<AuditsService>;
  let auditProcessor: jest.Mocked<AuditProcessorService>;

  beforeEach(async () => {
    const mockAuditsService = {
      createAudit: jest.fn(),
      getAudit: jest.fn(),
      getUserAudits: jest.fn(),
    };

    const mockAuditProcessor = {
      processAudit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuditsController],
      providers: [
        { provide: AuditsService, useValue: mockAuditsService },
        { provide: AuditProcessorService, useValue: mockAuditProcessor },
      ],
    }).compile();

    controller = module.get<AuditsController>(AuditsController);
    auditsService = module.get(AuditsService);
    auditProcessor = module.get(AuditProcessorService);
  });

  describe('createAudit', () => {
    it('should create an audit and return correct response', async () => {
      const dto = { siteUrl: 'https://example.com' };
      const mockAudit = {
        id: 'test-uuid',
        user_id: 'user-id',
        site_url: 'https://example.com',
        status: 'pending' as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      auditsService.createAudit.mockResolvedValue(ok(mockAudit));

      const result = await controller.createAudit(dto, { user: { id: 'user-id' } });

      expect(result).toEqual({
        id: 'test-uuid',
        status: 'pending',
      });
      expect(auditsService.createAudit).toHaveBeenCalledWith('user-id', dto);
      expect(auditProcessor.processAudit).toHaveBeenCalledWith('test-uuid');
    });

    it('should throw HttpException on error', async () => {
      const dto = { siteUrl: 'https://example.com' };
      auditsService.createAudit.mockResolvedValue(
        err(ServiceError.databaseError('Database error'))
      );

      await expect(
        controller.createAudit(dto, { user: { id: 'user-id' } })
      ).rejects.toThrow();
    });
  });

  describe('getAudit', () => {
    it('should return audit by id', async () => {
      const mockAudit = {
        id: 'test-uuid',
        user_id: 'user-id',
        site_url: 'https://example.com',
        status: 'completed' as const,
        results: { issues: [], summary: { total: 0 } },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      auditsService.getAudit.mockResolvedValue(ok(mockAudit));

      const result = await controller.getAudit('test-uuid', { user: { id: 'user-id' } });

      expect(result).toEqual(mockAudit);
      expect(auditsService.getAudit).toHaveBeenCalledWith('test-uuid', 'user-id');
    });
  });
});
