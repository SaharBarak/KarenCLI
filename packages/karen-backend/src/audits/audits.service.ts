import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { type ServiceResult, ok, err, ServiceError, resultify } from '../common/result';
import type { CreateAuditDto } from './dto/create-audit.dto';

export interface Audit {
  id: string;
  user_id: string;
  site_url: string;
  repo_url?: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  results?: any;
  created_at: string;
  updated_at: string;
}

@Injectable()
export class AuditsService {
  constructor(private supabase: SupabaseService) {}

  async createAudit(
    userId: string,
    dto: CreateAuditDto
  ): Promise<ServiceResult<Audit>> {
    return resultify(
      async () => {
        const { data, error } = await this.supabase
          .getClient()
          .from('audits')
          .insert({
            user_id: userId,
            site_url: dto.siteUrl,
            repo_url: dto.repoUrl,
            status: 'pending',
          })
          .select()
          .single();

        if (error) throw error;
        return data as Audit;
      },
      (error) => ServiceError.databaseError('Failed to create audit', error)
    );
  }

  async getAudit(auditId: string, userId: string): Promise<ServiceResult<Audit>> {
    return resultify(
      async () => {
        const { data, error } = await this.supabase
          .getClient()
          .from('audits')
          .select('*')
          .eq('id', auditId)
          .eq('user_id', userId)
          .single();

        if (error) throw error;
        if (!data) throw new Error('Audit not found');

        return data as Audit;
      },
      (error) => {
        if (error instanceof Error && error.message === 'Audit not found') {
          return ServiceError.notFound('Audit not found', error);
        }
        return ServiceError.databaseError('Failed to fetch audit', error);
      }
    );
  }

  async getUserAudits(userId: string): Promise<ServiceResult<Audit[]>> {
    return resultify(
      async () => {
        const { data, error } = await this.supabase
          .getClient()
          .from('audits')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        return (data || []) as Audit[];
      },
      (error) => ServiceError.databaseError('Failed to fetch audits', error)
    );
  }

  async updateAuditStatus(
    auditId: string,
    status: Audit['status'],
    results?: any
  ): Promise<ServiceResult<Audit>> {
    return resultify(
      async () => {
        const { data, error } = await this.supabase
          .getClient()
          .from('audits')
          .update({
            status,
            results,
            updated_at: new Date().toISOString(),
          })
          .eq('id', auditId)
          .select()
          .single();

        if (error) throw error;
        return data as Audit;
      },
      (error) => ServiceError.databaseError('Failed to update audit', error)
    );
  }

  async getPendingAudits(limit: number = 5): Promise<ServiceResult<Audit[]>> {
    return resultify(
      async () => {
        const { data, error } = await this.supabase
          .getClient()
          .from('audits')
          .select('*')
          .eq('status', 'pending')
          .limit(limit);

        if (error) throw error;
        return (data || []) as Audit[];
      },
      (error) => ServiceError.databaseError('Failed to fetch pending audits', error)
    );
  }
}
