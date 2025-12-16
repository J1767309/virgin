'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { MainLayout } from '@/components/layout'
import { Card, CardHeader, CardTitle, CardContent, KPICard, IndexCard, Badge, LoadingPage } from '@/components/ui'
import { createClient } from '@/lib/supabase'
import { Hotel, STRData } from '@/lib/types'
import { formatCurrency, formatPercent, getBrandDisplayName } from '@/lib/utils'
import {
  Building2,
  TrendingUp,
  DollarSign,
  BarChart3,
  ChevronRight,
  MapPin,
} from 'lucide-react'

interface HotelWithLatestSTR extends Hotel {
  latestSTR?: STRData
}

export default function DashboardClient() {
  const [hotels, setHotels] = useState<HotelWithLatestSTR[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [brandFilter, setBrandFilter] = useState<'all' | 'virgin_hotels' | 'virgin_limited_edition'>('all')
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch hotels
        const { data: hotelsData, error: hotelsError } = await supabase
          .from('hotels')
          .select('*')
          .eq('status', 'active')
          .order('name')

        if (hotelsError) {
          console.error('Error fetching hotels:', hotelsError)
          setIsLoading(false)
          return
        }

        // Fetch latest STR data for each hotel
        const typedHotelsData = (hotelsData || []) as unknown as Hotel[]
        const hotelsWithSTR: HotelWithLatestSTR[] = await Promise.all(
          typedHotelsData.map(async (hotel) => {
            const { data: strData } = await supabase
              .from('str_data')
              .select('*')
              .eq('hotel_id', hotel.id)
              .eq('period_type', 'weekly')
              .order('period_end', { ascending: false })
              .limit(1)
              .single()

            return {
              ...hotel,
              latestSTR: (strData as unknown as STRData) || undefined,
            }
          })
        )

        setHotels(hotelsWithSTR)
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [supabase])

  const filteredHotels = hotels.filter(
    (hotel) => brandFilter === 'all' || hotel.brand === brandFilter
  )

  // Calculate portfolio metrics
  const portfolioMetrics = {
    avgOccupancy: filteredHotels.reduce((sum, h) => sum + (h.latestSTR?.occupancy_actual || 0), 0) / (filteredHotels.length || 1),
    avgADR: filteredHotels.reduce((sum, h) => sum + (h.latestSTR?.adr_actual || 0), 0) / (filteredHotels.length || 1),
    avgRevPAR: filteredHotels.reduce((sum, h) => sum + (h.latestSTR?.revpar_actual || 0), 0) / (filteredHotels.length || 1),
    avgRGI: filteredHotels.reduce((sum, h) => sum + (h.latestSTR?.rgi || 0), 0) / (filteredHotels.length || 1),
  }

  if (isLoading) {
    return <LoadingPage />
  }

  return (
    <MainLayout title="Portfolio Dashboard" subtitle="Revenue Management Overview">
      {/* Brand Filter */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setBrandFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            brandFilter === 'all'
              ? 'bg-virgin-red text-white'
              : 'bg-white text-virgin-gray-700 border border-virgin-gray-300 hover:bg-virgin-gray-50'
          }`}
        >
          All Properties ({hotels.length})
        </button>
        <button
          onClick={() => setBrandFilter('virgin_hotels')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            brandFilter === 'virgin_hotels'
              ? 'bg-virgin-red text-white'
              : 'bg-white text-virgin-gray-700 border border-virgin-gray-300 hover:bg-virgin-gray-50'
          }`}
        >
          Virgin Hotels ({hotels.filter(h => h.brand === 'virgin_hotels').length})
        </button>
        <button
          onClick={() => setBrandFilter('virgin_limited_edition')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            brandFilter === 'virgin_limited_edition'
              ? 'bg-virgin-red text-white'
              : 'bg-white text-virgin-gray-700 border border-virgin-gray-300 hover:bg-virgin-gray-50'
          }`}
        >
          Virgin Limited Edition ({hotels.filter(h => h.brand === 'virgin_limited_edition').length})
        </button>
      </div>

      {/* Portfolio KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KPICard
          title="Portfolio Occupancy"
          value={portfolioMetrics.avgOccupancy}
          format="percent"
          trend={portfolioMetrics.avgOccupancy > 75 ? 'up' : 'down'}
          change={3.2}
          changeLabel="vs LY"
          icon={<Building2 className="h-6 w-6 text-virgin-red" />}
        />
        <KPICard
          title="Average ADR"
          value={portfolioMetrics.avgADR}
          format="currency"
          trend="up"
          change={5.8}
          changeLabel="vs LY"
          icon={<DollarSign className="h-6 w-6 text-virgin-red" />}
        />
        <KPICard
          title="Portfolio RevPAR"
          value={portfolioMetrics.avgRevPAR}
          format="currency"
          trend="up"
          change={4.5}
          changeLabel="vs LY"
          icon={<TrendingUp className="h-6 w-6 text-virgin-red" />}
        />
        <IndexCard
          title="Revenue Generation Index"
          value={portfolioMetrics.avgRGI || 100}
        />
      </div>

      {/* Hotels List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-virgin-red" />
            Property Performance
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredHotels.length === 0 ? (
            <div className="p-8 text-center text-virgin-gray-500">
              <Building2 className="h-12 w-12 mx-auto mb-4 text-virgin-gray-300" />
              <p className="text-lg font-medium">No hotels found</p>
              <p className="text-sm mt-1">Hotels will appear here once data is loaded.</p>
            </div>
          ) : (
            <div className="divide-y divide-virgin-gray-200">
              {filteredHotels.map((hotel) => (
                <Link
                  key={hotel.id}
                  href={`/hotels/${hotel.id}`}
                  className="flex items-center justify-between p-4 hover:bg-virgin-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      hotel.brand === 'virgin_hotels' ? 'bg-virgin-red' : 'bg-virgin-black'
                    }`}>
                      <Building2 className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-virgin-black">{hotel.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-virgin-gray-600">
                        <MapPin className="h-3 w-3" />
                        <span>{hotel.location}</span>
                        <Badge variant="secondary" size="sm">
                          {getBrandDisplayName(hotel.brand)}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-8">
                    {hotel.latestSTR ? (
                      <>
                        <div className="text-right">
                          <p className="text-xs text-virgin-gray-500">Occupancy</p>
                          <p className="font-semibold text-virgin-black">
                            {formatPercent(hotel.latestSTR.occupancy_actual)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-virgin-gray-500">ADR</p>
                          <p className="font-semibold text-virgin-black">
                            {formatCurrency(hotel.latestSTR.adr_actual)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-virgin-gray-500">RevPAR</p>
                          <p className="font-semibold text-virgin-black">
                            {formatCurrency(hotel.latestSTR.revpar_actual)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-virgin-gray-500">RGI</p>
                          <p className={`font-semibold ${
                            hotel.latestSTR.rgi >= 100 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {hotel.latestSTR.rgi.toFixed(1)}
                          </p>
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-virgin-gray-400">No data available</p>
                    )}
                    <ChevronRight className="h-5 w-5 text-virgin-gray-400" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </MainLayout>
  )
}
