export type Brand = 'virgin_hotels' | 'virgin_limited_edition'
export type UserRole = 'administrator' | 'editor' | 'viewer'
export type UserScope = 'corporate' | 'property'
export type HotelStatus = 'active' | 'inactive'
export type PeriodType = 'weekly' | 'monthly'
export type Discipline = 'sales' | 'revenue_management' | 'ecommerce'
export type TacticStatus = 'not_started' | 'in_progress' | 'completed'

export interface Hotel {
  id: string
  name: string
  location: string
  brand: Brand
  region: string
  status: HotelStatus
  created_at: string
}

export interface User {
  id: string
  email: string
  full_name: string
  role: UserRole
  scope: UserScope
  created_at: string
}

export interface UserHotelAssignment {
  id: string
  user_id: string
  hotel_id: string
  created_at: string
}

export interface STRData {
  id: string
  hotel_id: string
  period_type: PeriodType
  period_start: string
  period_end: string
  occupancy_actual: number
  occupancy_budget: number
  occupancy_prior_year: number
  occupancy_comp_set: number
  adr_actual: number
  adr_budget: number
  adr_prior_year: number
  adr_comp_set: number
  revpar_actual: number
  revpar_budget: number
  revpar_prior_year: number
  revpar_comp_set: number
  mpi: number
  ari: number
  rgi: number
  created_at: string
  updated_by: string
}

export interface WebAnalyticsData {
  id: string
  hotel_id: string
  period_type: PeriodType
  period_start: string
  period_end: string
  sessions: number
  users: number
  bounce_rate: number
  booking_engine_conversion_rate: number
  revenue_direct_bookings: number
  traffic_organic: number
  traffic_paid: number
  traffic_direct: number
  traffic_referral: number
  created_at: string
  updated_by: string
}

export interface PaidMediaData {
  id: string
  hotel_id: string
  period_type: PeriodType
  period_start: string
  period_end: string
  channel: string
  spend: number
  roas: number
  cpa: number
  impressions: number
  clicks: number
  ctr: number
  created_at: string
  updated_by: string
}

export interface AnnualStrategy {
  id: string
  hotel_id: string
  year: number
  strategy_summary: string
  sales_strategy: string
  rm_strategy: string
  ecommerce_strategy: string
  revenue_goal: number
  revpar_goal: number
  market_share_goal: number
  created_at: string
  updated_by: string
}

export interface QuarterlyStrategy {
  id: string
  hotel_id: string
  annual_strategy_id: string
  year: number
  quarter: number
  strategy_summary: string
  sales_initiatives: string
  rm_initiatives: string
  ecommerce_initiatives: string
  created_at: string
  updated_by: string
}

export interface Tactic {
  id: string
  hotel_id: string
  quarterly_strategy_id: string
  discipline: Discipline
  description: string
  owner_id: string
  due_date: string
  status: TacticStatus
  kpi_target: string
  created_at: string
  updated_at: string
  owner?: User
}

export interface WeeklyUpdate {
  id: string
  hotel_id: string
  week_start: string
  week_end: string
  str_summary: string
  web_analytics_summary: string
  paid_media_summary: string
  tactics_deployed: string
  whats_working: string
  whats_not_working: string
  adjustments_planned: string
  promotions_in_market: string
  created_at: string
  updated_by: string
}

// Extended types with relations
export interface HotelWithMetrics extends Hotel {
  latestSTR?: STRData
}

export interface TacticWithOwner extends Tactic {
  owner: User
}
