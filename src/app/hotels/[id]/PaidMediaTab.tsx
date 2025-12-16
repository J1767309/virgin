'use client'

import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent, KPICard, Select, LoadingCard, Button, Modal, Input } from '@/components/ui'
import { createClient } from '@/lib/supabase'
import { PaidMediaData, PeriodType } from '@/lib/types'
import { formatCurrency, formatPercent, formatNumber } from '@/lib/utils'
import { Megaphone, DollarSign, MousePointer, TrendingUp, Plus } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import toast from 'react-hot-toast'

interface PaidMediaTabProps {
  hotelId: string
}

export function PaidMediaTab({ hotelId }: PaidMediaTabProps) {
  const [data, setData] = useState<PaidMediaData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [periodType, setPeriodType] = useState<PeriodType>('weekly')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const supabase = createClient()

  const [formData, setFormData] = useState({
    period_start: '',
    period_end: '',
    channel: 'Google',
    spend: '',
    roas: '',
    cpa: '',
    impressions: '',
    clicks: '',
    ctr: '',
  })

  useEffect(() => {
    fetchData()
  }, [hotelId, periodType])

  const fetchData = async () => {
    setIsLoading(true)
    const { data: mediaData, error } = await supabase
      .from('paid_media_data')
      .select('*')
      .eq('hotel_id', hotelId)
      .eq('period_type', periodType)
      .order('period_start', { ascending: false })
      .limit(48)

    if (error) {
      console.error('Error fetching paid media:', error)
    } else {
      setData((mediaData || []) as any)
    }
    setIsLoading(false)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const { error } = await supabase.from('paid_media_data').insert({
        hotel_id: hotelId,
        period_type: periodType,
        period_start: formData.period_start,
        period_end: formData.period_end,
        channel: formData.channel,
        spend: parseFloat(formData.spend),
        roas: parseFloat(formData.roas),
        cpa: parseFloat(formData.cpa),
        impressions: parseInt(formData.impressions),
        clicks: parseInt(formData.clicks),
        ctr: parseFloat(formData.ctr),
      })

      if (error) throw error

      toast.success('Paid media data saved successfully')
      setIsModalOpen(false)
      fetchData()
      setFormData({
        period_start: '',
        period_end: '',
        channel: 'Google',
        spend: '',
        roas: '',
        cpa: '',
        impressions: '',
        clicks: '',
        ctr: '',
      })
    } catch (error) {
      toast.error('Failed to save paid media data')
    } finally {
      setIsSaving(false)
    }
  }

  // Aggregate by channel for the latest period
  const channels = ['Google', 'Meta', 'Bing', 'TripAdvisor']
  const latestPeriodData = data.filter(d =>
    d.period_start === data[0]?.period_start
  )

  const channelData = channels.map(channel => {
    const channelItems = latestPeriodData.filter(d => d.channel === channel)
    return {
      channel,
      spend: channelItems.reduce((sum, d) => sum + d.spend, 0),
      roas: channelItems.length > 0 ? channelItems.reduce((sum, d) => sum + d.roas, 0) / channelItems.length : 0,
      cpa: channelItems.length > 0 ? channelItems.reduce((sum, d) => sum + d.cpa, 0) / channelItems.length : 0,
      clicks: channelItems.reduce((sum, d) => sum + d.clicks, 0),
      impressions: channelItems.reduce((sum, d) => sum + d.impressions, 0),
    }
  }).filter(c => c.spend > 0)

  const totalSpend = channelData.reduce((sum, c) => sum + c.spend, 0)
  const avgROAS = channelData.length > 0 ? channelData.reduce((sum, c) => sum + c.roas, 0) / channelData.length : 0
  const avgCPA = channelData.length > 0 ? channelData.reduce((sum, c) => sum + c.cpa, 0) / channelData.length : 0
  const totalClicks = channelData.reduce((sum, c) => sum + c.clicks, 0)

  if (isLoading) {
    return <LoadingCard />
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <Select
          value={periodType}
          onChange={(e) => setPeriodType(e.target.value as PeriodType)}
          options={[
            { value: 'weekly', label: 'Weekly' },
            { value: 'monthly', label: 'Monthly' },
          ]}
          className="w-40"
        />
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Data
        </Button>
      </div>

      {channelData.length > 0 ? (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              title="Total Spend"
              value={totalSpend}
              format="currency"
              icon={<DollarSign className="h-6 w-6 text-virgin-red" />}
            />
            <KPICard
              title="Average ROAS"
              value={`${avgROAS.toFixed(1)}x`}
              icon={<TrendingUp className="h-6 w-6 text-virgin-red" />}
            />
            <KPICard
              title="Average CPA"
              value={avgCPA}
              format="currency"
              icon={<Megaphone className="h-6 w-6 text-virgin-red" />}
            />
            <KPICard
              title="Total Clicks"
              value={totalClicks}
              format="number"
              icon={<MousePointer className="h-6 w-6 text-virgin-red" />}
            />
          </div>

          {/* Channel Performance Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Spend by Channel</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={channelData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
                    <XAxis dataKey="channel" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    <Bar dataKey="spend" fill="#E1001A" name="Spend" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Channel Details Table */}
          <Card>
            <CardHeader>
              <CardTitle>Channel Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-virgin-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-virgin-gray-600">Channel</th>
                      <th className="text-right py-3 px-4 font-medium text-virgin-gray-600">Spend</th>
                      <th className="text-right py-3 px-4 font-medium text-virgin-gray-600">ROAS</th>
                      <th className="text-right py-3 px-4 font-medium text-virgin-gray-600">CPA</th>
                      <th className="text-right py-3 px-4 font-medium text-virgin-gray-600">Impressions</th>
                      <th className="text-right py-3 px-4 font-medium text-virgin-gray-600">Clicks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {channelData.map((channel) => (
                      <tr key={channel.channel} className="border-b border-virgin-gray-100">
                        <td className="py-3 px-4 font-medium">{channel.channel}</td>
                        <td className="text-right py-3 px-4">{formatCurrency(channel.spend)}</td>
                        <td className={`text-right py-3 px-4 font-medium ${channel.roas >= 4 ? 'text-green-600' : channel.roas >= 2 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {channel.roas.toFixed(1)}x
                        </td>
                        <td className="text-right py-3 px-4">{formatCurrency(channel.cpa)}</td>
                        <td className="text-right py-3 px-4">{formatNumber(channel.impressions)}</td>
                        <td className="text-right py-3 px-4">{formatNumber(channel.clicks)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Megaphone className="h-12 w-12 mx-auto mb-4 text-virgin-gray-300" />
            <p className="text-lg font-medium text-virgin-gray-600">No paid media data available</p>
            <p className="text-sm text-virgin-gray-500 mt-1">Add data to see paid media metrics</p>
          </CardContent>
        </Card>
      )}

      {/* Add Data Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Paid Media Data" size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Period Start"
              type="date"
              value={formData.period_start}
              onChange={(e) => setFormData({ ...formData, period_start: e.target.value })}
            />
            <Input
              label="Period End"
              type="date"
              value={formData.period_end}
              onChange={(e) => setFormData({ ...formData, period_end: e.target.value })}
            />
            <Select
              label="Channel"
              value={formData.channel}
              onChange={(e) => setFormData({ ...formData, channel: e.target.value })}
              options={[
                { value: 'Google', label: 'Google' },
                { value: 'Meta', label: 'Meta' },
                { value: 'Bing', label: 'Bing' },
                { value: 'TripAdvisor', label: 'TripAdvisor' },
              ]}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Spend ($)"
              type="number"
              step="0.01"
              value={formData.spend}
              onChange={(e) => setFormData({ ...formData, spend: e.target.value })}
            />
            <Input
              label="ROAS"
              type="number"
              step="0.1"
              value={formData.roas}
              onChange={(e) => setFormData({ ...formData, roas: e.target.value })}
            />
            <Input
              label="CPA ($)"
              type="number"
              step="0.01"
              value={formData.cpa}
              onChange={(e) => setFormData({ ...formData, cpa: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Impressions"
              type="number"
              value={formData.impressions}
              onChange={(e) => setFormData({ ...formData, impressions: e.target.value })}
            />
            <Input
              label="Clicks"
              type="number"
              value={formData.clicks}
              onChange={(e) => setFormData({ ...formData, clicks: e.target.value })}
            />
            <Input
              label="CTR (%)"
              type="number"
              step="0.01"
              value={formData.ctr}
              onChange={(e) => setFormData({ ...formData, ctr: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-virgin-gray-200">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} isLoading={isSaving}>
              Save Data
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
