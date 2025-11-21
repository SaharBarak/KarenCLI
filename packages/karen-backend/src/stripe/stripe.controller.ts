import {
  Controller,
  Post,
  Body,
  Headers,
  RawBodyRequest,
  Req,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { StripeService } from './stripe.service';
import { Request } from 'express';

@Controller('api/stripe')
export class StripeController {
  constructor(private stripeService: StripeService) {}

  @Post('webhooks')
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string
  ) {
    if (!signature) {
      throw new HttpException('Missing stripe signature', HttpStatus.BAD_REQUEST);
    }

    const payload = req.rawBody;
    if (!payload) {
      throw new HttpException('Missing request body', HttpStatus.BAD_REQUEST);
    }

    const result = await this.stripeService.handleWebhook(payload, signature);

    if (result.isErr()) {
      throw new HttpException(result.error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return { received: true };
  }
}
