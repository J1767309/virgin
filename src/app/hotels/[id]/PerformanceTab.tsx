'use client'

import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent, KPICard, IndexCard, Select, LoadingCard, Button, Modal, Input } from '@/components/ui'
import { createClient } from '@/lib/supabase'
import { STRData, PeriodType } from '@/lib/types'
import { formatCurrency, formatPercent, formatDateRange } from '@/lib/utils'
import { BarChart3, TrendingUp, DollarSign, Building2, Plus } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import toast from 'react-hot-toast'

interface PerformanceTabProps {
  hotelId: string
}

export function PerformanceTab({ hotelId }: PerformanceTabProps) {
  const [strData, setStrData] = useState<STRData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [periodType, setPeriodType] = useState<PeriodType>('weekly')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const supabase = createClient()

  const [formData, setFormData] = useState({
    period_start: '',
    period_end: '',
    occupancy_actual: '',
    occupancy_budget: '',
    occupancy_prior_year: '',
    occupancy_comp_set: '',
    adr_actual: '',
    adr_budget: '',
    adr_prior_year: '',
    adr_comp_set: '',
  })

  useEffect(() => {
    fetchData()
  }, [hotelId, periodType])

  const fetchData = async () => {
    setIsLoading(true)
    const { data, error } = await supabase
      .from('str_data')
      .select('*')
      .eq('hotel_id', hotelId)
      .eq('period_type', periodType)
      .order('period_start', { ascending: false })
      .limit(12)

    if (error) {
      console.error('Error fetching STR data:', error)
    } else {
      setStrData((data || []) as any)
    }
    setIsLoading(false)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const occupancy_actual = parseFloat(formData.occupancy_actual)
      const adr_actual = parseFloat(formData.adr_actual)
      const occupancy_comp_set = parseFloat(formData.occupancy_comp_set) || occupancy_actual
      const adr_comp_set = parseFloat(formData.adr_comp_set) || adr_actual

      const revpar_actual = (occupancy_actual / 100) * adr_actual
      const revpar_budget = (parseFloat(formData.occupancy_budget) / 100) * parseFloat(formData.adr_budget)
      const revpar_prior_year = (parseFloat(formData.occupancy_prior_year) / 100) * parseFloat(formData.adr_prior_year)
      const revpar_comp_set = (occupancy_comp_set / 100) * adr_comp_set

      const mpi = (occupancy_actual / occupancy_comp_set) * 100
      const ari = (adr_actual / adr_comp_set) * 100
      const rgi = (revpar_actual / revpar_comp_set) * 100

      const { error } = await supabase.from('str_data').insert({
        hotel_id: hotelId,
        period_type: periodType,
        period_start: formData.period_start,
        period_end: formData.period_end,
        occupancy_actual,
        occupancy_budget: parseFloat(formData.occupancy_budget),
        occupancy_prior_year: parseFloat(formData.occupancy_prior_year),
        occupancy_comp_set,
        adr_actual,
        adr_budget: parseFloat(formData.adr_budget),
        adr_prior_year: parseFloat(formData.adr_prior_year),
        adr_comp_set,
        revpar_actual,
        revpar_budget,
        revpar_prior_year,
        revpar_comp_set,
        mpi,
        ari,
        rgi,
      })

      if (error) throw error

      toast.success('Performance data saved successfully')
      setIsModalOpen(false)
      fetchData()
      setFormData({
        period_start: '',
        period_end: '',
        occupancy_actual: '',
        occupancy_budget: '',
        occupancy_prior_year: '',
        occupancy_comp_set: '',
        adr_actual: '',
        adr_budget: '',
        adr_prior_year: '',
        adr_comp_set: '',
      })
    } catch (error) {
      toast.error('Failed to save performance data')
    } finally {
      setIsSaving(false)
    }
  }

  const latestData = strData[0]

  const chartData = [...strData].reverse().map((d) => ({
    period: formatDateRange(d.period_start, d.period_end),
    Occupancy: d.occupancy_actual,
    ADR: d.adr_actual,
    RevPAR: d.revpar_actual,
  }))

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

      {/* KPI Cards */}
      {latestData ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              title="Occupancy"
              value={latestData.occupancy_actual}
              format="percent"
              trend={latestData.occupancy_actual > latestData.occupancy_prior_year ? 'up' : 'down'}
              change={((latestData.occupancy_actual - latestData.occupancy_prior_year) / latestData.occupancy_prior_year) * 100}
              changeLabel="vs PY"
              icon={<Building2 className="h-6 w-6 text-virgin-red" />}
            />
            <KPICard
              title="ADR"
              value={latestData.adr_actual}
              format="currency"
              trend={latestData.adr_actual > latestData.adr_prior_year ? 'up' : 'down'}
              change={((latestData.adr_actual - latestData.adr_prior_year) / latestData.adr_prior_year) * 100}
              changeLabel="vs PY"
              icon={<DollarSign className="h-6 w-6 text-virgin-red" />}
            />
            <KPICard
              title="RevPAR"
              value={latestData.revpar_actual}
              format="currency"
              trend={latestData.revpar_actual > latestData.revpar_prior_year ? 'up' : 'down'}
              change={((latestData.revpar_actual - latestData.revpar_prior_year) / latestData.revpar_prior_year) * 100}
              changeLabel="vs PY"
              icon={<TrendingUp className="h-6 w-6 text-virgin-red" />}
            />
            <div className="grid grid-cols-3 gap-2">
              <IndexCard title="MPI" value={latestData.mpi} />
              <IndexCard title="ARI" value={latestData.ari} />
              <IndexCard title="RGI" value={latestData.rgi} />
            </div>
          </div>

          {/* Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-virgin-red" />
                Performance Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
                    <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="Occupancy"
                      stroke="#E1001A"
                      strokeWidth={2}
                      dot={{ fill: '#E1001A' }}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="RevPAR"
                      stroke="#1A1A1A"
                      strokeWidth={2}
                      dot={{ fill: '#1A1A1A' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Comparison Table */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-virgin-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-virgin-gray-600">Metric</th>
                      <th className="text-right py-3 px-4 font-medium text-virgin-gray-600">Actual</th>
                      <th className="text-right py-3 px-4 font-medium text-virgin-gray-600">Budget</th>
                      <th className="text-right py-3 px-4 font-medium text-virgin-gray-600">vs Budget</th>
                      <th className="text-right py-3 px-4 font-medium text-virgin-gray-600">Prior Year</th>
                      <th className="text-right py-3 px-4 font-medium text-virgin-gray-600">vs PY</th>
                      <th className="text-right py-3 px-4 font-medium text-virgin-gray-600">Comp Set</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-virgin-gray-100">
                      <td className="py-3 px-4 font-medium">Occupancy</td>
                      <td className="text-right py-3 px-4">{formatPercent(latestData.occupancy_actual)}</td>
                      <td className="text-right py-3 px-4">{formatPercent(latestData.occupancy_budget)}</td>
                      <td className={`text-right py-3 px-4 font-medium ${latestData.occupancy_actual >= latestData.occupancy_budget ? 'text-green-600' : 'text-red-600'}`}>
                        {((latestData.occupancy_actual - latestData.occupancy_budget) / latestData.occupancy_budget * 100).toFixed(1)}%
                      </td>
                      <td className="text-right py-3 px-4">{formatPercent(latestData.occupancy_prior_year)}</td>
                      <td className={`text-right py-3 px-4 font-medium ${latestData.occupancy_actual >= latestData.occupancy_prior_year ? 'text-green-600' : 'text-red-600'}`}>
                        {((latestData.occupancy_actual - latestData.occupancy_prior_year) / latestData.occupancy_prior_year * 100).toFixed(1)}%
                      </td>
                      <td className="text-right py-3 px-4">{formatPercent(latestData.occupancy_comp_set)}</td>
                    </tr>
                    <tr className="border-b border-virgin-gray-100">
                      <td className="py-3 px-4 font-medium">ADR</td>
                      <td className="text-right py-3 px-4">{formatCurrency(latestData.adr_actual)}</td>
                      <td className="text-right py-3 px-4">{formatCurrency(latestData.adr_budget)}</td>
                      <td className={`text-right py-3 px-4 font-medium ${latestData.adr_actual >= latestData.adr_budget ? 'text-green-600' : 'text-red-600'}`}>
                        {((latestData.adr_actual - latestData.adr_budget) / latestData.adr_budget * 100).toFixed(1)}%
                      </td>
                      <td className="text-right py-3 px-4">{formatCurrency(latestData.adr_prior_year)}</td>
                      <td className={`text-right py-3 px-4 font-medium ${latestData.adr_actual >= latestData.adr_prior_year ? 'text-green-600' : 'text-red-600'}`}>
                        {((latestData.adr_actual - latestData.adr_prior_year) / latestData.adr_prior_year * 100).toFixed(1)}%
                      </td>
                      <td className="text-right py-3 px-4">{formatCurrency(latestData.adr_comp_set)}</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-medium">RevPAR</td>
                      <td className="text-right py-3 px-4">{formatCurrency(latestData.revpar_actual)}</td>
                      <td className="text-right py-3 px-4">{formatCurrency(latestData.revpar_budget)}</td>
                      <td className={`text-right py-3 px-4 font-medium ${latestData.revpar_actual >= latestData.revpar_budget ? 'text-green-600' : 'text-red-600'}`}>
                        {((latestData.revpar_actual - latestData.revpar_budget) / latestData.revpar_budget * 100).toFixed(1)}%
                      </td>
                      <td className="text-right py-3 px-4">{formatCurrency(latestData.revpar_prior_year)}</td>
                      <td className={`text-right py-3 px-4 font-medium ${latestData.revpar_actual >= latestData.revpar_prior_year ? 'text-green-600' : 'text-red-600'}`}>
                        {((latestData.revpar_actual - latestData.revpar_prior_year) / latestData.revpar_prior_year * 100).toFixed(1)}%
                      </td>
                      <td className="text-right py-3 px-4">{formatCurrency(latestData.revpar_comp_set)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 text-virgin-gray-300" />
            <p className="text-lg font-medium text-virgin-gray-600">No performance data available</p>
            <p className="text-sm text-virgin-gray-500 mt-1">Add STR data to see performance metrics</p>
          </CardContent>
        </Card>
      )}

      {/* Add Data Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Performance Data" size="lg">
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

          <div className="border-t border-virgin-gray-200 pt-4">
            <h4 className="font-medium text-virgin-black mb-3">Occupancy (%)</h4>
            <div className="grid grid-cols-4 gap-4">
              <Input
                label="Actual"
                type="number"
                step="0.1"
                value={formData.occupancy_actual}
                onChange={(e) => setFormData({ ...formData, occupancy_actual: e.target.value })}
              />
              <Input
                label="Budget"
                type="number"
                step="0.1"
                value={formData.occupancy_budget}
                onChange={(e) => setFormData({ ...formData, occupancy_budget: e.target.value })}
              />
              <Input
                label="Prior Year"
                type="number"
                step="0.1"
                value={formData.occupancy_prior_year}
                onChange={(e) => setFormData({ ...formData, occupancy_prior_year: e.target.value })}
              />
              <Input
                label="Comp Set"
                type="number"
                step="0.1"
                value={formData.occupancy_comp_set}
                onChange={(e) => setFormData({ ...formData, occupancy_comp_set: e.target.value })}
              />
            </div>
          </div>

          <div className="border-t border-virgin-gray-200 pt-4">
            <h4 className="font-medium text-virgin-black mb-3">ADR ($)</h4>
            <div className="grid grid-cols-4 gap-4">
              <Input
                label="Actual"
                type="number"
                step="0.01"
                value={formData.adr_actual}
                onChange={(e) => setFormData({ ...formData, adr_actual: e.target.value })}
              />
              <Input
                label="Budget"
                type="number"
                step="0.01"
                value={formData.adr_budget}
                onChange={(e) => setFormData({ ...formData, adr_budget: e.target.value })}
              />
              <Input
                label="Prior Year"
                type="number"
                step="0.01"
                value={formData.adr_prior_year}
                onChange={(e) => setFormData({ ...formData, adr_prior_year: e.target.value })}
              />
              <Input
                label="Comp Set"
                type="number"
                step="0.01"
                value={formData.adr_comp_set}
                onChange={(e) => setFormData({ ...formData, adr_comp_set: e.target.value })}
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
