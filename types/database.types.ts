export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type RiskTolerance = 'CONSERVATIVE' | 'MODERATE' | 'AGGRESSIVE'
export type InvestmentHorizon = 'SHORT' | 'MEDIUM' | 'LONG'
export type ChosenOption = 'OPTION_A' | 'OPTION_B'

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          full_name: string | null
          risk_tolerance: RiskTolerance
          investment_horizon: InvestmentHorizon
          base_capital: number
          is_guest: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          risk_tolerance?: RiskTolerance
          investment_horizon?: InvestmentHorizon
          base_capital?: number
          is_guest?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          risk_tolerance?: RiskTolerance
          investment_horizon?: InvestmentHorizon
          base_capital?: number
          is_guest?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      simulations: {
        Row: {
          id: string
          user_id: string
          target_symbol: string
          competitor_symbol: string
          chosen_option: ChosenOption
          allocated_capital: number
          projected_pnl: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          target_symbol: string
          competitor_symbol: string
          chosen_option: ChosenOption
          allocated_capital: number
          projected_pnl: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          target_symbol?: string
          competitor_symbol?: string
          chosen_option?: ChosenOption
          allocated_capital?: number
          projected_pnl?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'simulations_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'user_profiles'
            referencedColumns: ['id']
          },
        ]
      }
      watchlists: {
        Row: {
          id: string
          user_id: string
          stock_symbol: string
          added_at: string
        }
        Insert: {
          id?: string
          user_id: string
          stock_symbol: string
          added_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          stock_symbol?: string
          added_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'watchlists_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'user_profiles'
            referencedColumns: ['id']
          },
        ]
      }
      model_metrics: {
        Row: {
          id: string
          model_name: string
          mape: number
          rmse: number
          accuracy: number
          f1_score: number
          evaluated_at: string
        }
        Insert: {
          id?: string
          model_name: string
          mape: number
          rmse: number
          accuracy: number
          f1_score: number
          evaluated_at?: string
        }
        Update: {
          id?: string
          model_name?: string
          mape?: number
          rmse?: number
          accuracy?: number
          f1_score?: number
          evaluated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      risk_tolerance_type: RiskTolerance
      investment_horizon_type: InvestmentHorizon
      chosen_option_type: ChosenOption
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
