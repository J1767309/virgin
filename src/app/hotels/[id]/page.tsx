'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { MainLayout } from '@/components/layout'
import { Tabs, TabsList, TabsTrigger, TabsContent, Badge, LoadingPage } from '@/components/ui'
import { createClient } from '@/lib/supabase'
import { Hotel } from '@/lib/types'
import { getBrandDisplayName } from '@/lib/utils'
import { MapPin, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { PerformanceTab } from './PerformanceTab'
import { WebAnalyticsTab } from './WebAnalyticsTab'
import { PaidMediaTab } from './PaidMediaTab'
import { StrategyTab } from './StrategyTab'
import { WeeklyUpdatesTab } from './WeeklyUpdatesTab'

export default function HotelDetailPage() {
  const params = useParams()
  const hotelId = params.id as string
  const [hotel, setHotel] = useState<Hotel | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchHotel = async () => {
      const { data, error } = await supabase
        .from('hotels')
        .select('*')
        .eq('id', hotelId)
        .single()

      if (error) {
        console.error('Error fetching hotel:', error)
      } else {
        setHotel(data as unknown as Hotel)
      }
      setIsLoading(false)
    }

    if (hotelId) {
      fetchHotel()
    }
  }, [hotelId, supabase])

  if (isLoading) {
    return <LoadingPage />
  }

  if (!hotel) {
    return (
      <MainLayout title="Hotel Not Found">
        <div className="text-center py-12">
          <p className="text-virgin-gray-600">The requested hotel could not be found.</p>
          <Link href="/" className="text-virgin-red hover:underline mt-4 inline-block">
            Return to Dashboard
          </Link>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-virgin-gray-600 hover:text-virgin-red transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-virgin-black">{hotel.name}</h1>
            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-1 text-virgin-gray-600">
                <MapPin className="h-4 w-4" />
                <span>{hotel.location}</span>
              </div>
              <Badge
                variant={hotel.brand === 'virgin_hotels' ? 'danger' : 'default'}
              >
                {getBrandDisplayName(hotel.brand)}
              </Badge>
              <Badge variant="secondary">{hotel.region}</Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="performance">
        <TabsList className="mb-6">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="analytics">Web Analytics</TabsTrigger>
          <TabsTrigger value="media">Paid Media</TabsTrigger>
          <TabsTrigger value="strategy">Strategy</TabsTrigger>
          <TabsTrigger value="updates">5:15 Updates</TabsTrigger>
        </TabsList>

        <TabsContent value="performance">
          <PerformanceTab hotelId={hotelId} />
        </TabsContent>

        <TabsContent value="analytics">
          <WebAnalyticsTab hotelId={hotelId} />
        </TabsContent>

        <TabsContent value="media">
          <PaidMediaTab hotelId={hotelId} />
        </TabsContent>

        <TabsContent value="strategy">
          <StrategyTab hotelId={hotelId} />
        </TabsContent>

        <TabsContent value="updates">
          <WeeklyUpdatesTab hotelId={hotelId} />
        </TabsContent>
      </Tabs>
    </MainLayout>
  )
}
