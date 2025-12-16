'use client'

import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent, KPICard, Select, LoadingCard, Button, Modal, Input } from '@/components/ui'
import { createClient } from '@/lib/supabase'
import { WebAnalyticsData, PeriodType } from '@/lib/types'
import { formatCurrency, formatPercent, formatNumber, formatDateRange } from '@/lib/utils'
import { Globe, Users, MousePointer, DollarSign, Plus } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts'
import toast from 'react-hot-toast'

interface WebAnalyticsTabProps {
  hotelId: string
}

const COLORS = ['#E1001A', '#1A1A1A', '#757575', '#BDBDBD']

export function WebAnalyticsTab({ hotelId }: WebAnalyticsTabProps) {
  const [data, setData] = useState<WebAnalyticsData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [periodType, setPeriodType] = useState<PeriodType>('weekly')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const supabase = createClient()

  const [formData, setFormData] = useState({
    period_start: '',
    period_end: '',
    sessions: '',
    users: '',
    bounce_rate: '',
    booking_engine_conversion_rate: '',
    revenue_direct_bookings: '',
    traffic_organic: '',
    traffic_paid: '',
    traffic_direct: '',
    traffic_referral: '',
  })

  useEffect(() => {
    fetchData()
  }, [hotelId, periodType])

  const fetchData = async () => {
    setIsLoading(true)
    const { data: analyticsData, error } = await supabase
      .from('web_analytics_data')
      .select('*')
      .eq('hotel_id', hotelId)
      .eq('period_type', periodType)
      .order('period_start', { ascending: false })
      .limit(12)

    if (error) {
      console.error('Error fetching web analytics:', error)
    } else {
      setData((analyticsData || []) as any)
    }
    setIsLoading(false)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const { error } = await supabase.from('web_analytics_data').insert({
        hotel_id: hotelId,
        period_type: periodType,
        period_start: formData.period_start,
        period_end: formData.period_end,
        sessions: parseInt(formData.sessions),
        users: parseInt(formData.users),
        bounce_rate: parseFloat(formData.bounce_rate),
        booking_engine_conversion_rate: parseFloat(formData.booking_engine_conversion_rate),
        revenue_direct_bookings: parseFloat(formData.revenue_direct_bookings),
        traffic_organic: parseInt(formData.traffic_organic),
        traffic_paid: parseInt(formData.traffic_paid),
        traffic_direct: parseInt(formData.traffic_direct),
        traffic_referral: parseInt(formData.traffic_referral),
      })

      if (error) throw error

      toast.success('Web analytics data saved successfully')
      setIsModalOpen(false)
      fetchData()
      setFormData({
        period_start: '',
        period_end: '',
        sessions: '',
        users: '',
        bounce_rate: '',
        booking_engine_conversion_rate: '',
        revenue_direct_bookings: '',
        traffic_organic: '',
        traffic_paid: '',
        traffic_direct: '',
        traffic_referral: '',
      })
    } catch (error) {
      toast.error('Failed to save web analytics data')
    } finally {
      setIsSaving(false)
    }
  }

  const latestData = data[0]

  const chartData = [...data].reverse().map((d) => ({
    period: formatDateRange(d.period_start, d.period_end),
    Sessions: d.sessions,
    'Conversion Rate': d.booking_engine_conversion_rate,
  }))

  const trafficData = latestData ? [
    { name: 'Organic', value: latestData.traffic_organic },
    { name: 'Paid', value: latestData.traffic_paid },
    { name: 'Direct', value: latestData.traffic_direct },
    { name: 'Referral', value: latestData.traffic_referral },
  ] : []

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

      {latestData ? (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              title="Sessions"
              value={latestData.sessions}
              format="number"
              icon={<Globe className="h-6 w-6 text-virgin-red" />}
            />
            <KPICard
              title="Users"
              value={latestData.users}
              format="number"
              icon={<Users className="h-6 w-6 text-virgin-red" />}
            />
            <KPICard
              title="Conversion Rate"
              value={latestData.booking_engine_conversion_rate}
              format="percent"
              icon={<MousePointer className="h-6 w-6 text-virgin-red" />}
            />
            <KPICard
              title="Direct Revenue"
              value={latestData.revenue_direct_bookings}
              format="currency"
              icon={<DollarSign className="h-6 w-6 text-virgin-red" />}
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sessions Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Sessions Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
                      <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="Sessions"
                        stroke="#E1001A"
                        strokeWidth={2}
                        dot={{ fill: '#E1001A' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Traffic Sources */}
            <Card>
              <CardHeader>
                <CardTitle>Traffic Sources</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={trafficData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {trafficData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Metrics Table */}
          <Card>
            <CardHeader>
              <CardTitle>Detailed Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-virgin-gray-50 rounded-lg">
                  <p className="text-sm text-virgin-gray-600">Bounce Rate</p>
                  <p className="text-xl font-bold text-virgin-black">{formatPercent(latestData.bounce_rate)}</p>
                </div>
                <div className="p-4 bg-virgin-gray-50 rounded-lg">
                  <p className="text-sm text-virgin-gray-600">Organic Traffic</p>
                  <p className="text-xl font-bold text-virgin-black">{formatNumber(latestData.traffic_organic)}</p>
                </div>
                <div className="p-4 bg-virgin-gray-50 rounded-lg">
                  <p className="text-sm text-virgin-gray-600">Paid Traffic</p>
                  <p className="text-xl font-bold text-virgin-black">{formatNumber(latestData.traffic_paid)}</p>
                </div>
                <div className="p-4 bg-virgin-gray-50 rounded-lg">
                  <p className="text-sm text-virgin-gray-600">Direct Traffic</p>
                  <p className="text-xl font-bold text-virgin-black">{formatNumber(latestData.traffic_direct)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Globe className="h-12 w-12 mx-auto mb-4 text-virgin-gray-300" />
            <p className="text-lg font-medium text-virgin-gray-600">No web analytics data available</p>
            <p className="text-sm text-virgin-gray-500 mt-1">Add data to see analytics metrics</p>
          </CardContent>
        </Card>
      )}

      {/* Add Data Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Web Analytics Data" size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Sessions"
              type="number"
              value={formData.sessions}
              onChange={(e) => setFormData({ ...formData, sessions: e.target.value })}
            />
            <Input
              label="Users"
              type="number"
              value={formData.users}
              onChange={(e) => setFormData({ ...formData, users: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Bounce Rate (%)"
              type="number"
              step="0.1"
              value={formData.bounce_rate}
              onChange={(e) => setFormData({ ...formData, bounce_rate: e.target.value })}
            />
            <Input
              label="Conversion Rate (%)"
              type="number"
              step="0.01"
              value={formData.booking_engine_conversion_rate}
              onChange={(e) => setFormData({ ...formData, booking_engine_conversion_rate: e.target.value })}
            />
            <Input
              label="Direct Revenue ($)"
              type="number"
              step="0.01"
              value={formData.revenue_direct_bookings}
              onChange={(e) => setFormData({ ...formData, revenue_direct_bookings: e.target.value })}
            />
          </div>

          <div className="border-t border-virgin-gray-200 pt-4">
            <h4 className="font-medium text-virgin-black mb-3">Traffic by Source</h4>
            <div className="grid grid-cols-4 gap-4">
              <Input
                label="Organic"
                type="number"
                value={formData.traffic_organic}
                onChange={(e) => setFormData({ ...formData, traffic_organic: e.target.value })}
              />
              <Input
                label="Paid"
                type="number"
                value={formData.traffic_paid}
                onChange={(e) => setFormData({ ...formData, traffic_paid: e.target.value })}
              />
              <Input
                label="Direct"
                type="number"
                value={formData.traffic_direct}
                onChange={(e) => setFormData({ ...formData, traffic_direct: e.target.value })}
              />
              <Input
                label="Referral"
                type="number"
                value={formData.traffic_referral}
                onChange={(e) => setFormData({ ...formData, traffic_referral: e.target.value })}
              />
            </div>
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
