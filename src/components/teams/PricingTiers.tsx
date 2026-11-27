'use client';

import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface PricingTier {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  ctaLabel: string;
  popular?: boolean;
}

interface PricingTiersProps {
  onSelectTier?: (tierName: string) => void;
  className?: string;
}

const tiers: PricingTier[] = [
  {
    name: 'Starter Team',
    price: '$29',
    period: '/month',
    description: 'For small teams getting started with collaborative play.',
    features: [
      'Up to 5 team members',
      'Shared playbooks',
      'Basic analytics',
      'Email support',
    ],
    ctaLabel: 'Get Starter Quote',
  },
  {
    name: 'Pro Team',
    price: '$79',
    period: '/month',
    description: 'For growing teams that need deeper insights and control.',
    features: [
      'Up to 20 team members',
      'Advanced playbooks',
      'Full analytics suite',
      'Priority support',
      'Custom integrations',
    ],
    ctaLabel: 'Get Pro Quote',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'For organizations with advanced security and scale needs.',
    features: [
      'Unlimited team members',
      'Dedicated success manager',
      'SSO & audit logs',
      'SLA guarantees',
      'Custom onboarding',
    ],
    ctaLabel: 'Get Enterprise Quote',
  },
];

export function PricingTiers({ onSelectTier, className }: PricingTiersProps) {
  return (
    <section
      aria-labelledby="pricing-tiers-heading"
      className={cn('w-full', className)}
    >
      <h2 id="pricing-tiers-heading" className="sr-only">
        Team pricing tiers
      </h2>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {tiers.map((tier) => {
          const badgeId = `pricing-tier-${tier.name
            .toLowerCase()
            .replace(/\s+/g, '-')}-badge`;

          return (
            <div
              key={tier.name}
              aria-describedby={tier.popular ? badgeId : undefined}
              className={cn(
                'relative flex flex-col rounded-2xl border p-6 shadow-sm',
                tier.popular
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-card'
              )}
            >
              {tier.popular && (
                <span
                  id={badgeId}
                  className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground"
                >
                  Most Popular
                </span>
              )}
              <h3 className="text-lg font-semibold">{tier.name}</h3>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-3xl font-bold">{tier.price}</span>
                {tier.period && (
                  <span className="text-sm text-muted-foreground">
                    {tier.period}
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {tier.description}
              </p>
              <ul className="mt-4 flex-1 space-y-2">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                aria-label={`${tier.ctaLabel} for ${tier.name}`}
                onClick={() => onSelectTier?.(tier.name)}
                className={cn(
                  'mt-6 w-full rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                  tier.popular
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'border border-border bg-background hover:bg-muted'
                )}
              >
                {tier.ctaLabel}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
