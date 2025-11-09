export interface StripeProduct {
  id: string;
  priceId: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  mode: 'payment' | 'subscription';
}

export const stripeProducts: StripeProduct[] = [
  {
    id: 'prod_TJEoMaiaVszDj8',
    priceId: 'price_1SMcKn2LrLnCKq8ePwFXtj87',
    name: 'Test',
    description: 'Test',
    price: 1.00,
    currency: 'eur',
    mode: 'payment'
  }
];