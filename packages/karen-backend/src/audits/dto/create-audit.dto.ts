import { IsString, IsUrl, IsOptional, IsObject } from 'class-validator';

export class CreateAuditDto {
  @IsUrl()
  siteUrl: string;

  @IsOptional()
  @IsUrl()
  repoUrl?: string;

  @IsOptional()
  @IsObject()
  config?: Record<string, any>;
}
