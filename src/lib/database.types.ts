export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      families: {
        Row: {
          id: string
          nedarim_id: string | null
          status: 'active' | 'inactive' | 'pending'
          husband_first_name: string | null
          husband_last_name: string
          husband_id_number: string | null
          husband_birth_date: string | null
          husband_phone: string | null
          husband_email: string | null
          husband_marital_status: 'married' | 'divorced' | 'widower' | 'single' | null
          wife_first_name: string | null
          wife_last_name: string | null
          wife_id_number: string | null
          wife_birth_date: string | null
          wife_phone: string | null
          wife_email: string | null
          wife_marital_status: 'married' | 'divorced' | 'widow' | 'single' | null
          city_id: string | null
          street_id: string | null
          house_number: string | null
          entrance: string | null
          floor: string | null
          apartment_code: string | null
          synagogue: string | null
          community_id: string | null
          bank_account_name: string | null
          bank_number: string | null
          bank_branch: string | null
          bank_account: string | null
          home_phone: string | null
          additional_phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['families']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['families']['Insert']>
      }
      children: {
        Row: {
          id: string
          family_id: string
          first_name: string
          last_name: string | null
          id_number: string | null
          birth_date: string | null
          gender: 'male' | 'female' | null
          school: string | null
          tuition_fee: number | null
          is_married: boolean
          married_last_name: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['children']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['children']['Insert']>
      }
      financial_status: {
        Row: {
          id: string
          family_id: string
          year: number
          record_date: string
          husband_occupation: 'kollel' | 'employed' | 'self_employed' | 'unemployed' | null
          husband_workplace: string | null
          husband_income: number
          kollel_type: 'full_day' | 'half_day' | null
          kollel_two_sessions: boolean
          kollel_name: string | null
          kollel_stipend: number
          kollel_name_2: string | null
          kollel_stipend_2: number
          other_kollel_income: number
          wife_occupation: 'employed' | 'self_employed' | 'housewife' | null
          wife_workplace: string | null
          wife_income: number
          child_allowance: number
          income_support: number
          rent_assistance: number
          disability_allowance: number
          unemployment: number
          alimony: number
          survivors: number
          senior_allowance: number
          other_allowance: number
          rental_income: number
          scholarship_income: number
          food_vouchers: number
          charity_support: number
          charity_support_name: string | null
          family_support: number
          other_income: number
          other_income_description: string | null
          owns_home: boolean
          rent_amount: number
          mortgage_amount: number
          has_additional_property: boolean
          additional_property_mortgage: number
          additional_property_income: number
          bank_debts: number
          bank_monthly_payment: number
          gmach_debts: number
          gmach_monthly_payment: number
          private_debts: number
          debt_reason: string | null
          medical_expenses: number
          medical_details: string | null
          has_vehicle: boolean
          has_savings: boolean
          savings_amount: number
          savings_details: string | null
          total_monthly_income: number
          total_monthly_expenses: number
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['financial_status']['Row'], 'id' | 'created_at' | 'updated_at' | 'total_monthly_income' | 'total_monthly_expenses'>
        Update: Partial<Database['public']['Tables']['financial_status']['Insert']>
      }
      support_requests: {
        Row: {
          id: string
          family_id: string
          request_date: string
          description: string | null
          purpose: string | null
          requested_amount: number | null
          status: 'new' | 'in_review' | 'approved' | 'rejected' | 'completed' | 'cancelled'
          needs_rights_assistance: boolean
          needs_financial_coaching: boolean
          submitted_by: string | null
          submitter_relation: string | null
          submitter_phone: string | null
          submitter_email: string | null
          is_self_request: boolean
          signature: string | null
          approved_amount: number | null
          approved_by: string | null
          approval_date: string | null
          rejection_reason: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['support_requests']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['support_requests']['Insert']>
      }
      supports: {
        Row: {
          id: string
          family_id: string
          request_id: string | null
          project_id: string | null
          donor_id: string | null
          support_type_id: string | null
          amount: number
          support_date: string
          description: string | null
          payment_method: 'transfer' | 'check' | 'cash' | 'voucher' | 'other' | null
          status: 'pending' | 'completed' | 'cancelled'
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['supports']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['supports']['Insert']>
      }
      notes: {
        Row: {
          id: string
          family_id: string
          content: string
          created_by: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['notes']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['notes']['Insert']>
      }
      cities: {
        Row: {
          id: string
          name: string
          name_en: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['cities']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['cities']['Insert']>
      }
      streets: {
        Row: {
          id: string
          city_id: string | null
          name: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['streets']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['streets']['Insert']>
      }
      communities: {
        Row: {
          id: string
          name: string
          city_id: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['communities']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['communities']['Insert']>
      }
      support_types: {
        Row: {
          id: string
          name: string
          description: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['support_types']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['support_types']['Insert']>
      }
      projects: {
        Row: {
          id: string
          name: string
          description: string | null
          budget: number
          start_date: string | null
          end_date: string | null
          status: 'planned' | 'active' | 'completed' | 'cancelled'
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['projects']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['projects']['Insert']>
      }
      donors: {
        Row: {
          id: string
          name: string
          phone: string | null
          email: string | null
          address: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['donors']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['donors']['Insert']>
      }
    }
  }
}

// Helper types
export type Family = Database['public']['Tables']['families']['Row']
export type FamilyInsert = Database['public']['Tables']['families']['Insert']
export type FamilyUpdate = Database['public']['Tables']['families']['Update']

export type Child = Database['public']['Tables']['children']['Row']
export type ChildInsert = Database['public']['Tables']['children']['Insert']

export type FinancialStatus = Database['public']['Tables']['financial_status']['Row']
export type FinancialStatusInsert = Database['public']['Tables']['financial_status']['Insert']

export type SupportRequest = Database['public']['Tables']['support_requests']['Row']
export type SupportRequestInsert = Database['public']['Tables']['support_requests']['Insert']

export type Support = Database['public']['Tables']['supports']['Row']
export type SupportInsert = Database['public']['Tables']['supports']['Insert']

export type Note = Database['public']['Tables']['notes']['Row']
export type NoteInsert = Database['public']['Tables']['notes']['Insert']

export type City = Database['public']['Tables']['cities']['Row']
export type Street = Database['public']['Tables']['streets']['Row']
export type Community = Database['public']['Tables']['communities']['Row']
export type SupportType = Database['public']['Tables']['support_types']['Row']
export type Project = Database['public']['Tables']['projects']['Row']
export type Donor = Database['public']['Tables']['donors']['Row']

