'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from './session';
import { isGuestUser } from './guest';
import type { AuthActionResult } from './types';
import type { RiskTolerance, InvestmentHorizon } from '@/types/database.types';

export interface UpdateProfileInput {
  base_capital: number;
  risk_tolerance: RiskTolerance;
  investment_horizon: InvestmentHorizon;
}

export async function updateUserProfile(
  input: UpdateProfileInput,
): Promise<AuthActionResult> {
  const user = await getCurrentUser();

  if (!user) return { success: false, error: 'Tidak terautentikasi.' };
  if (isGuestUser(user))
    return { success: false, error: 'Tamu tidak dapat menyimpan preferensi.' };

  if (!Number.isFinite(input.base_capital) || input.base_capital < 1_000_000) {
    return { success: false, error: 'Modal minimal Rp 1.000.000.' };
  }

  const VALID_RISK: RiskTolerance[] = ['CONSERVATIVE', 'MODERATE', 'AGGRESSIVE'];
  const VALID_HORIZON: InvestmentHorizon[] = ['SHORT', 'MEDIUM', 'LONG'];

  if (!VALID_RISK.includes(input.risk_tolerance)) {
    return { success: false, error: 'Nilai toleransi risiko tidak valid.' };
  }
  if (!VALID_HORIZON.includes(input.investment_horizon)) {
    return { success: false, error: 'Nilai horizon investasi tidak valid.' };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from('user_profiles')
      .update({
        base_capital: input.base_capital,
        risk_tolerance: input.risk_tolerance,
        investment_horizon: input.investment_horizon,
      })
      .eq('id', user.id);

    if (error) return { success: false, error: error.message };

    revalidatePath('/dashboard', 'layout');
    return { success: true };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Gagal menyimpan preferensi.';
    return { success: false, error: message };
  }
}
