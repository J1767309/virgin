'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { MainLayout } from '@/components/layout'
import { Tabs, TabsList, TabsTrigger, TabsContent, Badge, LoadingPage } from '@/components/ui'
import { createClient } from '@/lib/supabase'
import { Hotel } from '@/lib/types'
import { getBrandDisplayName, getHotelImage } from '@/lib/utils'
import { MapPin, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
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

  const heroImage = getHotelImage(hotel.name)

  return (
    <MainLayout>
      {/* Hero Image */}
      <div className="relative -mx-6 -mt-6 mb-6 h-64 md:h-80 overflow-hidden">
        <Image
          src={heroImage}
          alt={hotel.name}
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

        {/* Back Button - positioned over image */}
        <Link
          href="/"
          className="absolute top-4 left-4 inline-flex items-center gap-2 text-sm text-white/90 hover:text-white transition-colors bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-full"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        {/* Hotel Info - positioned at bottom of image */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{hotel.name}</h1>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-white/90">
              <MapPin className="h-4 w-4" />
              <span>{hotel.location}</span>
            </div>
            <Badge
              variant={hotel.brand === 'virgin_hotels' ? 'danger' : 'default'}
              className="bg-white/20 backdrop-blur-sm border-white/30"
            >
              {getBrandDisplayName(hotel.brand)}
            </Badge>
            <Badge variant="secondary" className="bg-white/20 backdrop-blur-sm border-white/30 text-white">
              {hotel.region}
            </Badge>
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
