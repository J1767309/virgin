'use client'

import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent, Badge, LoadingCard, Button, Modal, Input, Textarea, Select } from '@/components/ui'
import { createClient } from '@/lib/supabase'
import { AnnualStrategy, QuarterlyStrategy, Tactic, Discipline, TacticStatus } from '@/lib/types'
import { formatCurrency, getDisciplineDisplayName, getStatusBadgeColor } from '@/lib/utils'
import { Target, ChevronDown, ChevronRight, Plus, Calendar, User } from 'lucide-react'
import toast from 'react-hot-toast'

interface StrategyTabProps {
  hotelId: string
}

export function StrategyTab({ hotelId }: StrategyTabProps) {
  const [annualStrategy, setAnnualStrategy] = useState<AnnualStrategy | null>(null)
  const [quarterlyStrategies, setQuarterlyStrategies] = useState<QuarterlyStrategy[]>([])
  const [tactics, setTactics] = useState<Tactic[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedQuarters, setExpandedQuarters] = useState<number[]>([])
  const [disciplineFilter, setDisciplineFilter] = useState<string>('all')
  const [isTacticModalOpen, setIsTacticModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const supabase = createClient()

  const [tacticForm, setTacticForm] = useState({
    description: '',
    discipline: 'sales' as Discipline,
    due_date: '',
    kpi_target: '',
  })

  useEffect(() => {
    fetchData()
  }, [hotelId])

  const fetchData = async () => {
    setIsLoading(true)

    // Fetch annual strategy
    const { data: annual } = await supabase
      .from('annual_strategies')
      .select('*')
      .eq('hotel_id', hotelId)
      .eq('year', 2025)
      .single()

    if (annual) {
      const annualData = annual as unknown as AnnualStrategy
      setAnnualStrategy(annualData)

      // Fetch quarterly strategies
      const { data: quarterly } = await supabase
        .from('quarterly_strategies')
        .select('*')
        .eq('annual_strategy_id', annualData.id)
        .order('quarter')

      setQuarterlyStrategies((quarterly || []) as unknown as QuarterlyStrategy[])
    }

    // Fetch tactics
    const { data: tacticsData } = await supabase
      .from('tactics')
      .select('*')
      .eq('hotel_id', hotelId)
      .order('due_date')

    setTactics((tacticsData || []) as unknown as Tactic[])
    setIsLoading(false)
  }

  const toggleQuarter = (quarter: number) => {
    setExpandedQuarters((prev) =>
      prev.includes(quarter)
        ? prev.filter((q) => q !== quarter)
        : [...prev, quarter]
    )
  }

  const handleSaveTactic = async () => {
    setIsSaving(true)
    try {
      const { error } = await supabase.from('tactics').insert({
        hotel_id: hotelId,
        description: tacticForm.description,
        discipline: tacticForm.discipline,
        due_date: tacticForm.due_date,
        kpi_target: tacticForm.kpi_target,
        status: 'not_started',
      })

      if (error) throw error

      toast.success('Tactic added successfully')
      setIsTacticModalOpen(false)
      fetchData()
      setTacticForm({
        description: '',
        discipline: 'sales',
        due_date: '',
        kpi_target: '',
      })
    } catch (error) {
      toast.error('Failed to add tactic')
    } finally {
      setIsSaving(false)
    }
  }

  const updateTacticStatus = async (tacticId: string, status: TacticStatus) => {
    const { error } = await supabase
      .from('tactics')
      .update({ status })
      .eq('id', tacticId)

    if (error) {
      toast.error('Failed to update tactic status')
    } else {
      fetchData()
    }
  }

  const filteredTactics = tactics.filter(
    (t) => disciplineFilter === 'all' || t.discipline === disciplineFilter
  )

  if (isLoading) {
    return <LoadingCard />
  }

  return (
    <div className="space-y-6">
      {/* Annual Strategy */}
      {annualStrategy ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-virgin-red" />
                2025 Annual Strategy
              </CardTitle>
              <div className="flex gap-4 text-sm">
                <div>
                  <span className="text-virgin-gray-500">Revenue Goal:</span>
                  <span className="ml-2 font-semibold">{formatCurrency(annualStrategy.revenue_goal)}</span>
                </div>
                <div>
                  <span className="text-virgin-gray-500">RevPAR Goal:</span>
                  <span className="ml-2 font-semibold">{formatCurrency(annualStrategy.revpar_goal)}</span>
                </div>
                <div>
                  <span className="text-virgin-gray-500">Market Share:</span>
                  <span className="ml-2 font-semibold">{annualStrategy.market_share_goal?.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-virgin-gray-700 mb-1">Strategy Summary</h4>
                <p className="text-virgin-gray-600">{annualStrategy.strategy_summary}</p>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-virgin-gray-50 rounded-lg">
                  <h5 className="font-medium text-virgin-black mb-2">Sales Strategy</h5>
                  <p className="text-sm text-virgin-gray-600">{annualStrategy.sales_strategy}</p>
                </div>
                <div className="p-4 bg-virgin-gray-50 rounded-lg">
                  <h5 className="font-medium text-virgin-black mb-2">Revenue Management</h5>
                  <p className="text-sm text-virgin-gray-600">{annualStrategy.rm_strategy}</p>
                </div>
                <div className="p-4 bg-virgin-gray-50 rounded-lg">
                  <h5 className="font-medium text-virgin-black mb-2">E-commerce Strategy</h5>
                  <p className="text-sm text-virgin-gray-600">{annualStrategy.ecommerce_strategy}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-virgin-gray-500">No annual strategy defined for 2025</p>
          </CardContent>
        </Card>
      )}

      {/* Quarterly Strategies */}
      <Card>
        <CardHeader>
          <CardTitle>Quarterly Strategies</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {quarterlyStrategies.length > 0 ? (
            <div className="divide-y divide-virgin-gray-200">
              {quarterlyStrategies.map((qs) => (
                <div key={qs.id}>
                  <button
                    onClick={() => toggleQuarter(qs.quarter)}
                    className="w-full flex items-center justify-between px-6 py-4 hover:bg-virgin-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {expandedQuarters.includes(qs.quarter) ? (
                        <ChevronDown className="h-5 w-5 text-virgin-gray-400" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-virgin-gray-400" />
                      )}
                      <span className="font-semibold text-virgin-black">Q{qs.quarter} 2025</span>
                    </div>
                    <span className="text-sm text-virgin-gray-600">{qs.strategy_summary}</span>
                  </button>
                  {expandedQuarters.includes(qs.quarter) && (
                    <div className="px-6 pb-4 bg-virgin-gray-50">
                      <div className="grid grid-cols-3 gap-4 pt-4">
                        <div>
                          <h5 className="font-medium text-virgin-gray-700 mb-1">Sales Initiatives</h5>
                          <p className="text-sm text-virgin-gray-600">{qs.sales_initiatives}</p>
                        </div>
                        <div>
                          <h5 className="font-medium text-virgin-gray-700 mb-1">RM Initiatives</h5>
                          <p className="text-sm text-virgin-gray-600">{qs.rm_initiatives}</p>
                        </div>
                        <div>
                          <h5 className="font-medium text-virgin-gray-700 mb-1">E-commerce Initiatives</h5>
                          <p className="text-sm text-virgin-gray-600">{qs.ecommerce_initiatives}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-virgin-gray-500">
              No quarterly strategies defined
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tactics */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Tactics</CardTitle>
            <div className="flex items-center gap-3">
              <Select
                value={disciplineFilter}
                onChange={(e) => setDisciplineFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'All Disciplines' },
                  { value: 'sales', label: 'Sales' },
                  { value: 'revenue_management', label: 'Revenue Management' },
                  { value: 'ecommerce', label: 'E-commerce' },
                ]}
                className="w-48"
              />
              <Button onClick={() => setIsTacticModalOpen(true)} size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add Tactic
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredTactics.length > 0 ? (
            <div className="divide-y divide-virgin-gray-200">
              {filteredTactics.map((tactic) => (
                <div key={tactic.id} className="px-6 py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={
                          tactic.discipline === 'sales' ? 'danger' :
                          tactic.discipline === 'revenue_management' ? 'info' : 'success'
                        }>
                          {getDisciplineDisplayName(tactic.discipline)}
                        </Badge>
                        <Badge className={getStatusBadgeColor(tactic.status)}>
                          {tactic.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-virgin-black font-medium">{tactic.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-virgin-gray-500">
                        {tactic.due_date && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>Due: {new Date(tactic.due_date).toLocaleDateString()}</span>
                          </div>
                        )}
                        {tactic.kpi_target && (
                          <span>KPI: {tactic.kpi_target}</span>
                        )}
                      </div>
                    </div>
                    <Select
                      value={tactic.status}
                      onChange={(e) => updateTacticStatus(tactic.id, e.target.value as TacticStatus)}
                      options={[
                        { value: 'not_started', label: 'Not Started' },
                        { value: 'in_progress', label: 'In Progress' },
                        { value: 'completed', label: 'Completed' },
                      ]}
                      className="w-36"
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-virgin-gray-500">
              No tactics found
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Tactic Modal */}
      <Modal isOpen={isTacticModalOpen} onClose={() => setIsTacticModalOpen(false)} title="Add New Tactic">
        <div className="space-y-4">
          <Textarea
            label="Description"
            value={tacticForm.description}
            onChange={(e) => setTacticForm({ ...tacticForm, description: e.target.value })}
            placeholder="Describe the tactic..."
            rows={3}
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Discipline"
              value={tacticForm.discipline}
              onChange={(e) => setTacticForm({ ...tacticForm, discipline: e.target.value as Discipline })}
              options={[
                { value: 'sales', label: 'Sales' },
                { value: 'revenue_management', label: 'Revenue Management' },
                { value: 'ecommerce', label: 'E-commerce' },
              ]}
            />
            <Input
              label="Due Date"
              type="date"
              value={tacticForm.due_date}
              onChange={(e) => setTacticForm({ ...tacticForm, due_date: e.target.value })}
            />
          </div>
          <Input
            label="KPI Target"
            value={tacticForm.kpi_target}
            onChange={(e) => setTacticForm({ ...tacticForm, kpi_target: e.target.value })}
            placeholder="e.g., Increase RevPAR by 5%"
          />
          <div className="flex justify-end gap-3 pt-4 border-t border-virgin-gray-200">
            <Button variant="ghost" onClick={() => setIsTacticModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTactic} isLoading={isSaving}>
              Add Tactic
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
