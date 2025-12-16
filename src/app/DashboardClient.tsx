'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { MainLayout } from '@/components/layout'
import { Card, CardContent, KPICard, IndexCard, Badge, LoadingPage } from '@/components/ui'
import { createClient } from '@/lib/supabase'
import { Hotel, STRData } from '@/lib/types'
import { formatCurrency, formatPercent, getBrandDisplayName, getHotelImage } from '@/lib/utils'
import {
  Building2,
  TrendingUp,
  DollarSign,
  BarChart3,
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
      <div className="flex flex-wrap gap-2 mb-6">
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

      {/* Property Performance Header */}
      <div className="flex items-center gap-2 mb-6">
        <BarChart3 className="h-5 w-5 text-virgin-red" />
        <h2 className="text-xl font-bold text-virgin-black">Property Performance</h2>
      </div>

      {/* Hotels Grid */}
      {filteredHotels.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-virgin-gray-500">
            <Building2 className="h-12 w-12 mx-auto mb-4 text-virgin-gray-300" />
            <p className="text-lg font-medium">No hotels found</p>
            <p className="text-sm mt-1">Hotels will appear here once data is loaded.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredHotels.map((hotel) => (
            <Link
              key={hotel.id}
              href={`/hotels/${hotel.id}`}
              className="group block"
            >
              <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-virgin-gray-200 hover:shadow-lg hover:border-virgin-gray-300 transition-all duration-300">
                {/* Hero Image */}
                <div className="relative h-48 overflow-hidden">
                  <Image
                    src={getHotelImage(hotel.name)}
                    alt={hotel.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

                  {/* Hotel Name on Image */}
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="text-lg font-bold text-white mb-1">{hotel.name}</h3>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-white/80" />
                      <span className="text-sm text-white/80">{hotel.location}</span>
                    </div>
                  </div>

                  {/* Brand Badge */}
                  <div className="absolute top-3 right-3">
                    <Badge
                      variant={hotel.brand === 'virgin_hotels' ? 'danger' : 'default'}
                      className="bg-white/90 backdrop-blur-sm text-xs"
                    >
                      {getBrandDisplayName(hotel.brand)}
                    </Badge>
                  </div>
                </div>

                {/* Metrics */}
                <div className="p-4">
                  {hotel.latestSTR ? (
                    <div className="grid grid-cols-4 gap-2">
                      <div className="text-center">
                        <p className="text-[10px] uppercase tracking-wide text-virgin-gray-500 mb-0.5">Occ</p>
                        <p className="text-sm font-bold text-virgin-black">
                          {formatPercent(hotel.latestSTR.occupancy_actual, 0)}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] uppercase tracking-wide text-virgin-gray-500 mb-0.5">ADR</p>
                        <p className="text-sm font-bold text-virgin-black">
                          {formatCurrency(hotel.latestSTR.adr_actual)}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] uppercase tracking-wide text-virgin-gray-500 mb-0.5">RevPAR</p>
                        <p className="text-sm font-bold text-virgin-black">
                          {formatCurrency(hotel.latestSTR.revpar_actual)}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] uppercase tracking-wide text-virgin-gray-500 mb-0.5">RGI</p>
                        <p className={`text-sm font-bold ${
                          hotel.latestSTR.rgi >= 100 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {hotel.latestSTR.rgi.toFixed(1)}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-virgin-gray-400 text-center py-2">No data available</p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </MainLayout>
  )
}
