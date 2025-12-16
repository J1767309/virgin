import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Hotels data
const virginHotels = [
  { name: 'Virgin Hotels Dallas', location: 'Dallas, TX', brand: 'virgin_hotels', region: 'US', status: 'active' },
  { name: 'Virgin Hotels Edinburgh', location: 'Edinburgh', brand: 'virgin_hotels', region: 'UK', status: 'active' },
  { name: 'Virgin Hotels London-Shoreditch', location: 'London', brand: 'virgin_hotels', region: 'UK', status: 'active' },
  { name: 'Virgin Hotels Nashville', location: 'Nashville, TN', brand: 'virgin_hotels', region: 'US', status: 'active' },
  { name: 'Virgin Hotels New Orleans', location: 'New Orleans, LA', brand: 'virgin_hotels', region: 'US', status: 'active' },
  { name: 'Virgin Hotels New York', location: 'New York, NY', brand: 'virgin_hotels', region: 'US', status: 'active' },
]

const virginLimitedEdition = [
  { name: 'Necker Island', location: 'British Virgin Islands', brand: 'virgin_limited_edition', region: 'Caribbean', status: 'active' },
  { name: 'The Branson Beach Estate', location: 'British Virgin Islands', brand: 'virgin_limited_edition', region: 'Caribbean', status: 'active' },
  { name: 'Kasbah Tamadot', location: 'Morocco', brand: 'virgin_limited_edition', region: 'Africa', status: 'active' },
  { name: 'Mahali Mzuri', location: 'Kenya', brand: 'virgin_limited_edition', region: 'Africa', status: 'active' },
  { name: 'Finch Hattons', location: 'Kenya', brand: 'virgin_limited_edition', region: 'Africa', status: 'active' },
  { name: 'Ulusaba', location: 'South Africa', brand: 'virgin_limited_edition', region: 'Africa', status: 'active' },
  { name: 'Mont Rochelle', location: 'South Africa', brand: 'virgin_limited_edition', region: 'Africa', status: 'active' },
  { name: 'Son Bunyola', location: 'Mallorca', brand: 'virgin_limited_edition', region: 'Europe', status: 'active' },
  { name: 'The Lodge', location: 'Switzerland', brand: 'virgin_limited_edition', region: 'Europe', status: 'active' },
]

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min
}

function randomInt(min: number, max: number) {
  return Math.floor(randomBetween(min, max + 1))
}

function getWeekDates(weeksAgo: number) {
  const now = new Date()
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - now.getDay() - (weeksAgo * 7))
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)
  return {
    start: weekStart.toISOString().split('T')[0],
    end: weekEnd.toISOString().split('T')[0]
  }
}

function getMonthDates(monthsAgo: number) {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() - monthsAgo + 1, 0)
  return {
    start: monthStart.toISOString().split('T')[0],
    end: monthEnd.toISOString().split('T')[0]
  }
}

function generateSTRData(hotelId: string, isVLE: boolean, periodType: string, periodStart: string, periodEnd: string) {
  const baseOccupancy = isVLE ? randomBetween(40, 70) : randomBetween(70, 85)
  const baseADR = isVLE ? randomBetween(800, 2500) : randomBetween(200, 350)

  const occupancyActual = baseOccupancy + randomBetween(-5, 5)
  const occupancyBudget = baseOccupancy
  const occupancyPriorYear = baseOccupancy + randomBetween(-3, 3)
  const occupancyCompSet = baseOccupancy + randomBetween(-8, 8)

  const adrActual = baseADR + randomBetween(-20, 30)
  const adrBudget = baseADR
  const adrPriorYear = baseADR * 0.95
  const adrCompSet = baseADR + randomBetween(-50, 50)

  const revparActual = (occupancyActual / 100) * adrActual
  const revparBudget = (occupancyBudget / 100) * adrBudget
  const revparPriorYear = (occupancyPriorYear / 100) * adrPriorYear
  const revparCompSet = (occupancyCompSet / 100) * adrCompSet

  const mpi = (occupancyActual / occupancyCompSet) * 100
  const ari = (adrActual / adrCompSet) * 100
  const rgi = (revparActual / revparCompSet) * 100

  return {
    hotel_id: hotelId,
    period_type: periodType,
    period_start: periodStart,
    period_end: periodEnd,
    occupancy_actual: Math.round(occupancyActual * 100) / 100,
    occupancy_budget: Math.round(occupancyBudget * 100) / 100,
    occupancy_prior_year: Math.round(occupancyPriorYear * 100) / 100,
    occupancy_comp_set: Math.round(occupancyCompSet * 100) / 100,
    adr_actual: Math.round(adrActual * 100) / 100,
    adr_budget: Math.round(adrBudget * 100) / 100,
    adr_prior_year: Math.round(adrPriorYear * 100) / 100,
    adr_comp_set: Math.round(adrCompSet * 100) / 100,
    revpar_actual: Math.round(revparActual * 100) / 100,
    revpar_budget: Math.round(revparBudget * 100) / 100,
    revpar_prior_year: Math.round(revparPriorYear * 100) / 100,
    revpar_comp_set: Math.round(revparCompSet * 100) / 100,
    mpi: Math.round(mpi * 100) / 100,
    ari: Math.round(ari * 100) / 100,
    rgi: Math.round(rgi * 100) / 100,
  }
}

function generateWebAnalyticsData(hotelId: string, isVLE: boolean, periodType: string, periodStart: string, periodEnd: string) {
  const baseSessions = isVLE ? randomInt(5000, 15000) : randomInt(20000, 50000)
  const sessions = baseSessions + randomInt(-2000, 2000)
  const users = Math.round(sessions * randomBetween(0.7, 0.85))
  const bounceRate = randomBetween(35, 55)
  const conversionRate = isVLE ? randomBetween(0.5, 2) : randomBetween(1.5, 4)
  const revenue = isVLE ? randomBetween(50000, 200000) : randomBetween(100000, 500000)

  const organic = Math.round(sessions * randomBetween(0.3, 0.45))
  const paid = Math.round(sessions * randomBetween(0.15, 0.25))
  const direct = Math.round(sessions * randomBetween(0.2, 0.35))
  const referral = sessions - organic - paid - direct

  return {
    hotel_id: hotelId,
    period_type: periodType,
    period_start: periodStart,
    period_end: periodEnd,
    sessions,
    users,
    bounce_rate: Math.round(bounceRate * 100) / 100,
    booking_engine_conversion_rate: Math.round(conversionRate * 100) / 100,
    revenue_direct_bookings: Math.round(revenue * 100) / 100,
    traffic_organic: organic,
    traffic_paid: paid,
    traffic_direct: direct,
    traffic_referral: referral,
  }
}

function generatePaidMediaData(hotelId: string, isVLE: boolean, periodType: string, periodStart: string, periodEnd: string, channel: string) {
  const baseSpend = isVLE ? randomBetween(5000, 15000) : randomBetween(10000, 30000)
  const spend = baseSpend + randomBetween(-2000, 2000)
  const roas = randomBetween(3, 8)
  const impressions = randomInt(100000, 500000)
  const ctr = randomBetween(1.5, 4)
  const clicks = Math.round(impressions * (ctr / 100))
  const conversions = Math.round(clicks * randomBetween(0.02, 0.08))
  const cpa = conversions > 0 ? spend / conversions : 0

  return {
    hotel_id: hotelId,
    period_type: periodType,
    period_start: periodStart,
    period_end: periodEnd,
    channel,
    spend: Math.round(spend * 100) / 100,
    roas: Math.round(roas * 100) / 100,
    cpa: Math.round(cpa * 100) / 100,
    impressions,
    clicks,
    ctr: Math.round(ctr * 100) / 100,
  }
}

function generateAnnualStrategy(hotelId: string, isVLE: boolean, year: number) {
  return {
    hotel_id: hotelId,
    year,
    strategy_summary: isVLE
      ? 'Focus on ultra-luxury experiences, exclusive access, and personalized service to maintain premium positioning and attract high-net-worth travelers.'
      : 'Drive occupancy growth through strategic rate optimization, enhanced digital presence, and targeted corporate partnerships while maintaining brand standards.',
    sales_strategy: isVLE
      ? 'Develop relationships with luxury travel advisors and concierge services. Focus on exclusive packages and private buyouts.'
      : 'Expand corporate accounts, develop group business, and strengthen OTA partnerships while growing direct bookings.',
    rm_strategy: isVLE
      ? 'Maintain rate integrity with dynamic pricing based on demand patterns. Focus on length of stay optimization and premium add-ons.'
      : 'Implement aggressive yield management, optimize channel mix, and develop promotional strategies for low-demand periods.',
    ecommerce_strategy: isVLE
      ? 'Enhance digital storytelling, improve high-end booking experience, and leverage social proof from celebrity guests.'
      : 'Increase website conversion rates, expand retargeting campaigns, and optimize mobile booking experience.',
    revenue_goal: isVLE ? randomBetween(5000000, 20000000) : randomBetween(15000000, 50000000),
    revpar_goal: isVLE ? randomBetween(800, 2000) : randomBetween(180, 300),
    market_share_goal: randomBetween(18, 28),
  }
}

function generateQuarterlyStrategy(hotelId: string, annualStrategyId: string, year: number, quarter: number) {
  const quarterNames = ['Q1', 'Q2', 'Q3', 'Q4']
  const seasonality = ['Peak winter season focus', 'Shoulder season optimization', 'Summer programming', 'Holiday season preparations']

  return {
    hotel_id: hotelId,
    annual_strategy_id: annualStrategyId,
    year,
    quarter,
    strategy_summary: `${quarterNames[quarter-1]} ${year}: ${seasonality[quarter-1]}`,
    sales_initiatives: `Focus on ${quarter === 1 || quarter === 4 ? 'corporate accounts' : 'leisure segments'} with targeted outreach and promotional packages.`,
    rm_initiatives: `${quarter === 2 || quarter === 3 ? 'Optimize weekend rates' : 'Drive midweek occupancy'} through strategic pricing and promotions.`,
    ecommerce_initiatives: `Launch ${quarter === 1 ? 'spring break' : quarter === 2 ? 'summer' : quarter === 3 ? 'fall' : 'holiday'} campaign with enhanced landing pages and retargeting.`,
  }
}

function generateTactics(hotelId: string, quarterlyStrategyId: string, quarter: number) {
  const tactics = [
    { discipline: 'sales', description: 'Execute targeted outreach to top 20 corporate accounts with Q' + quarter + ' promotional offers', status: quarter < 4 ? 'completed' : 'in_progress', kpi_target: 'Generate 50 new RFPs' },
    { discipline: 'sales', description: 'Host property showcase event for local travel advisors', status: quarter < 3 ? 'completed' : 'not_started', kpi_target: '25 advisor attendees, 10 follow-up bookings' },
    { discipline: 'revenue_management', description: 'Implement dynamic pricing model for weekend rates', status: 'completed', kpi_target: 'Increase weekend ADR by 8%' },
    { discipline: 'revenue_management', description: 'Develop length-of-stay restrictions for high-demand dates', status: 'in_progress', kpi_target: 'Improve RevPAR by 5%' },
    { discipline: 'ecommerce', description: 'Launch retargeting campaign for abandoned bookings', status: 'completed', kpi_target: 'Recover 15% of abandoned carts' },
    { discipline: 'ecommerce', description: 'A/B test new booking engine layout', status: quarter === 4 ? 'in_progress' : 'completed', kpi_target: 'Increase conversion rate by 0.5%' },
  ]

  return tactics.map((t, i) => ({
    hotel_id: hotelId,
    quarterly_strategy_id: quarterlyStrategyId,
    discipline: t.discipline,
    description: t.description,
    due_date: new Date(2025, (quarter - 1) * 3 + Math.floor(i / 2), 15 + (i % 15)).toISOString().split('T')[0],
    status: t.status,
    kpi_target: t.kpi_target,
  }))
}

function generateWeeklyUpdate(hotelId: string, isVLE: boolean, weekStart: string, weekEnd: string, weekNum: number) {
  return {
    hotel_id: hotelId,
    week_start: weekStart,
    week_end: weekEnd,
    str_summary: `Week ${weekNum}: ${isVLE ? 'Strong luxury demand' : 'Solid performance'} with occupancy ${isVLE ? 'above 60%' : 'above 78%'}. ADR ${randomBetween(0.95, 1.05) > 1 ? 'exceeded' : 'tracking to'} budget. RGI at ${randomInt(95, 108)}.`,
    web_analytics_summary: `Sessions ${randomBetween(0.95, 1.1) > 1 ? 'up' : 'down'} ${randomInt(2, 12)}% WoW. Conversion rate at ${randomBetween(1.8, 3.2).toFixed(1)}%. Direct booking revenue ${isVLE ? '$' + randomInt(30, 80) + 'K' : '$' + randomInt(80, 150) + 'K'}.`,
    paid_media_summary: `ROAS at ${randomBetween(4, 7).toFixed(1)}x across channels. Google performing ${randomBetween(0.9, 1.1) > 1 ? 'above' : 'at'} benchmark. Meta campaigns driving awareness.`,
    tactics_deployed: `Launched ${randomInt(2, 4)} new initiatives this week including rate promotions and email campaigns.`,
    whats_working: `${isVLE ? 'Exclusive experiences driving premium ADR' : 'Corporate rate programs generating volume'}. Email campaigns showing strong engagement.`,
    whats_not_working: `${isVLE ? 'Social media reach declining' : 'OTA reliance still high'}. Need to address underperforming paid channels.`,
    adjustments_planned: `Reallocating ${randomInt(10, 25)}% of paid media budget to higher-performing channels. Testing new promotional offers.`,
    promotions_in_market: `${isVLE ? 'Exclusive package with spa credits' : 'Book 3+ nights save 20% promotion'}. Early bird rates for upcoming events.`,
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    // Check if hotels already exist
    const { data: existingHotels } = await supabase.from('hotels').select('id').limit(1)

    if (existingHotels && existingHotels.length > 0) {
      return NextResponse.json({ message: 'Database already seeded' }, { status: 200 })
    }

    // Insert hotels
    const allHotels = [...virginHotels, ...virginLimitedEdition]
    const { data: hotels, error: hotelsError } = await supabase.from('hotels').insert(allHotels).select()

    if (hotelsError) {
      console.error('Error inserting hotels:', hotelsError)
      return NextResponse.json({ error: 'Failed to insert hotels', details: hotelsError }, { status: 500 })
    }

    // Create admin user via Supabase Auth
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: 'Jimenez.john09@gmail.com',
      password: 'VirginRevenue2024!',
      email_confirm: true,
    })

    if (authError && !authError.message.includes('already been registered')) {
      console.error('Error creating auth user:', authError)
    }

    // Insert user record
    await supabase.from('users').upsert({
      id: authUser?.user?.id,
      email: 'Jimenez.john09@gmail.com',
      full_name: 'John Jimenez',
      role: 'administrator',
      scope: 'corporate',
    })

    // Generate data for each hotel
    for (const hotel of hotels || []) {
      const isVLE = hotel.brand === 'virgin_limited_edition'

      // Generate STR data (12 weeks + 3 months)
      const strData = []
      for (let i = 0; i < 12; i++) {
        const { start, end } = getWeekDates(i)
        strData.push(generateSTRData(hotel.id, isVLE, 'weekly', start, end))
      }
      for (let i = 0; i < 3; i++) {
        const { start, end } = getMonthDates(i)
        strData.push(generateSTRData(hotel.id, isVLE, 'monthly', start, end))
      }
      await supabase.from('str_data').insert(strData)

      // Generate web analytics
      const webData = []
      for (let i = 0; i < 12; i++) {
        const { start, end } = getWeekDates(i)
        webData.push(generateWebAnalyticsData(hotel.id, isVLE, 'weekly', start, end))
      }
      for (let i = 0; i < 3; i++) {
        const { start, end } = getMonthDates(i)
        webData.push(generateWebAnalyticsData(hotel.id, isVLE, 'monthly', start, end))
      }
      await supabase.from('web_analytics_data').insert(webData)

      // Generate paid media
      const channels = ['Google', 'Meta', 'Bing', 'TripAdvisor']
      const paidMediaData = []
      for (const channel of channels) {
        for (let i = 0; i < 12; i++) {
          const { start, end } = getWeekDates(i)
          paidMediaData.push(generatePaidMediaData(hotel.id, isVLE, 'weekly', start, end, channel))
        }
        for (let i = 0; i < 3; i++) {
          const { start, end } = getMonthDates(i)
          paidMediaData.push(generatePaidMediaData(hotel.id, isVLE, 'monthly', start, end, channel))
        }
      }
      await supabase.from('paid_media_data').insert(paidMediaData)

      // Generate annual strategy
      const annualStrategy = generateAnnualStrategy(hotel.id, isVLE, 2025)
      const { data: annualData } = await supabase.from('annual_strategies').insert(annualStrategy).select().single()

      // Generate quarterly strategies and tactics
      if (annualData) {
        for (let q = 1; q <= 4; q++) {
          const quarterlyStrategy = generateQuarterlyStrategy(hotel.id, annualData.id, 2025, q)
          const { data: quarterlyData } = await supabase.from('quarterly_strategies').insert(quarterlyStrategy).select().single()

          if (quarterlyData) {
            const tactics = generateTactics(hotel.id, quarterlyData.id, q)
            await supabase.from('tactics').insert(tactics)
          }
        }
      }

      // Generate weekly updates
      for (let i = 0; i < 4; i++) {
        const { start, end } = getWeekDates(i)
        const weeklyUpdate = generateWeeklyUpdate(hotel.id, isVLE, start, end, 4 - i)
        await supabase.from('weekly_updates').insert(weeklyUpdate)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully',
      hotels: hotels?.length || 0
    })

  } catch (error: any) {
    console.error('Setup error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'POST to this endpoint to seed the database',
    warning: 'This will only work if the database tables exist and are empty'
  })
}
