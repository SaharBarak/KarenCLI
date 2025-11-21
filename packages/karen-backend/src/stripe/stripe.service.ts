import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { type ServiceResult, ServiceError, resultify } from '../common/result';

@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor(private configService: ConfigService) {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!secretKey) {
      throw new Error('Stripe secret key is not configured');
    }

    this.stripe = new Stripe(secretKey, {
      apiVersion: '2025-02-24.acacia',
    });
  }

  async createCheckoutSession(
    userId: string,
    priceId: string,
    type: 'subscription' | 'payment'
  ): Promise<ServiceResult<{ url: string }>> {
    return resultify(
      async () => {
        const session = await this.stripe.checkout.sessions.create({
          mode: type === 'subscription' ? 'subscription' : 'payment',
          line_items: [
            {
              price: priceId,
              quantity: 1,
            },
          ],
          success_url: `${this.configService.get('FRONTEND_URL')}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${this.configService.get('FRONTEND_URL')}/pricing`,
          metadata: {
            userId,
          },
        });

        if (!session.url) {
          throw new Error('Failed to create checkout session URL');
        }

        return { url: session.url };
      },
      (error) => ServiceError.stripeError('Failed to create checkout session', error)
    );
  }

  async handleWebhook(payload: Buffer, signature: string): Promise<ServiceResult<void>> {
    return resultify(
      async () => {
        const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
        if (!webhookSecret) {
          throw new Error('Stripe webhook secret is not configured');
        }

        const event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);

        switch (event.type) {
          case 'checkout.session.completed':
            await this.handleCheckoutCompleted(event.data.object);
            break;
          case 'customer.subscription.updated':
            await this.handleSubscriptionUpdated(event.data.object);
            break;
          case 'customer.subscription.deleted':
            await this.handleSubscriptionDeleted(event.data.object);
            break;
        }
      },
      (error) => ServiceError.stripeError('Failed to process webhook', error)
    );
  }

  private async handleCheckoutCompleted(session: any): Promise<void> {
    // TODO: Update subscription in database
    console.log('Checkout completed:', session.id);
  }

  private async handleSubscriptionUpdated(subscription: any): Promise<void> {
    // TODO: Update subscription in database
    console.log('Subscription updated:', subscription.id);
  }

  private async handleSubscriptionDeleted(subscription: any): Promise<void> {
    // TODO: Update subscription in database
    console.log('Subscription deleted:', subscription.id);
  }
}
