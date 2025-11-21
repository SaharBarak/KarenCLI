import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuditsModule } from './audits/audits.module';
import { GithubModule } from './github/github.module';
import { StripeModule } from './stripe/stripe.module';
import { SupabaseModule } from './supabase/supabase.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 10,
      },
    ]),
    SupabaseModule,
    AuditsModule,
    GithubModule,
    StripeModule,
  ],
})
export class AppModule {}
