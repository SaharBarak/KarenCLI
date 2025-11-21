import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuditsService } from './audits.service';
import { type ServiceResult, ok, err, ServiceError } from '../common/result';
import { spawn } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class AuditProcessorService {
  private readonly logger = new Logger(AuditProcessorService.name);

  constructor(
    private auditsService: AuditsService,
    private configService: ConfigService
  ) {}

  async processAudit(auditId: string): Promise<ServiceResult<void>> {
    this.logger.log(`Processing audit ${auditId}`);

    try {
      // Update status to running
      await this.auditsService.updateAuditStatus(auditId, 'running');

      // Get audit details
      const auditResult = await this.auditsService.getAudit(auditId, '');
      if (auditResult.isErr()) {
        return err(auditResult.error);
      }

      const audit = auditResult.value;

      // Run Karen CLI via Docker
      const results = await this.runKarenCLI(audit.site_url);

      if (results.isErr()) {
        await this.auditsService.updateAuditStatus(auditId, 'failed', {
          error: results.error.message,
        });
        return err(results.error);
      }

      // Update audit with results
      await this.auditsService.updateAuditStatus(auditId, 'completed', results.value);

      this.logger.log(`Audit ${auditId} completed successfully`);
      return ok(undefined);
    } catch (error) {
      this.logger.error(`Audit ${auditId} failed`, error);
      await this.auditsService.updateAuditStatus(auditId, 'failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return err(ServiceError.auditError('Audit processing failed', error));
    }
  }

  private async runKarenCLI(siteUrl: string): Promise<ServiceResult<any>> {
    return new Promise((resolve) => {
      const outputDir = path.join('/tmp', `karen-${Date.now()}`);
      const outputFile = path.join(outputDir, 'tasks.json');

      const dockerArgs = [
        'run',
        '--rm',
        '-e',
        `ANTHROPIC_API_KEY=${this.configService.get('ANTHROPIC_API_KEY')}`,
        '-v',
        `${outputDir}:/app/output`,
        'karen-cli',
        'audit',
        siteUrl,
        '--output',
        '/app/output/tasks.json',
      ];

      const docker = spawn('docker', dockerArgs);

      let stdout = '';
      let stderr = '';

      docker.stdout.on('data', (data) => {
        stdout += data.toString();
        this.logger.debug(data.toString());
      });

      docker.stderr.on('data', (data) => {
        stderr += data.toString();
        this.logger.error(data.toString());
      });

      docker.on('close', async (code) => {
        if (code === 0) {
          try {
            const resultsJson = await fs.readFile(outputFile, 'utf-8');
            const results = JSON.parse(resultsJson);
            resolve(ok(results));
          } catch (error) {
            resolve(
              err(ServiceError.auditError('Failed to read audit results', error))
            );
          }
        } else {
          resolve(
            err(
              ServiceError.auditError(`Docker exit code ${code}: ${stderr}`)
            )
          );
        }
      });
    });
  }
}
