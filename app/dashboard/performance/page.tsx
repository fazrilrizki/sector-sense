import { Metadata } from 'next';
import { PerformanceDashboard } from '@/components/performance/performance-dashboard';

export const metadata: Metadata = {
  title: 'Model Performance Analytics - Sector Sense',
  description: 'Validasi dan performa ilmiah model prediksi machine learning.',
};

export default function PerformancePage() {
  return <PerformanceDashboard />;
}
