import { ComparisonPanel } from '@/components/comparison/comparison-panel';
import type { Metadata } from 'next';
import { getAuthStatus } from '@/lib/auth/session';

export const metadata: Metadata = {
  title: 'Stock Comparison — Sector Sense',
  description: 'Head-to-head comparison of corporate metrics and investment decision recommendations.',
};

export default async function ComparisonPage() {
  const { state } = await getAuthStatus();
  const initialCapital = state.profile?.base_capital ? Number(state.profile.base_capital) : undefined;

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Stock Comparison</h1>
        <p className="text-muted-foreground mt-1">
          Compare target stock with competitors and get AI-based decision recommendations.
        </p>
      </div>
      <ComparisonPanel initialCapital={initialCapital} />
    </div>
  );
}
