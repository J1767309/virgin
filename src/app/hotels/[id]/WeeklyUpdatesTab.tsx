'use client'

import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent, LoadingCard, Button, Modal, Input, Textarea } from '@/components/ui'
import { createClient } from '@/lib/supabase'
import { WeeklyUpdate } from '@/lib/types'
import { formatDateRange } from '@/lib/utils'
import { FileText, Plus, Calendar, CheckCircle, XCircle, ArrowRight, Megaphone } from 'lucide-react'
import toast from 'react-hot-toast'

interface WeeklyUpdatesTabProps {
  hotelId: string
}

export function WeeklyUpdatesTab({ hotelId }: WeeklyUpdatesTabProps) {
  const [updates, setUpdates] = useState<WeeklyUpdate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const supabase = createClient()

  const [formData, setFormData] = useState({
    week_start: '',
    week_end: '',
    str_summary: '',
    web_analytics_summary: '',
    paid_media_summary: '',
    tactics_deployed: '',
    whats_working: '',
    whats_not_working: '',
    adjustments_planned: '',
    promotions_in_market: '',
  })

  useEffect(() => {
    fetchData()
  }, [hotelId])

  const fetchData = async () => {
    setIsLoading(true)
    const { data, error } = await supabase
      .from('weekly_updates')
      .select('*')
      .eq('hotel_id', hotelId)
      .order('week_start', { ascending: false })
      .limit(12)

    if (error) {
      console.error('Error fetching weekly updates:', error)
    } else {
      setUpdates((data || []) as any)
    }
    setIsLoading(false)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const { error } = await supabase.from('weekly_updates').insert({
        hotel_id: hotelId,
        ...formData,
      })

      if (error) throw error

      toast.success('Weekly update saved successfully')
      setIsModalOpen(false)
      fetchData()
      setFormData({
        week_start: '',
        week_end: '',
        str_summary: '',
        web_analytics_summary: '',
        paid_media_summary: '',
        tactics_deployed: '',
        whats_working: '',
        whats_not_working: '',
        adjustments_planned: '',
        promotions_in_market: '',
      })
    } catch (error) {
      toast.error('Failed to save weekly update')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <LoadingCard />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-virgin-black">5:15 Weekly Updates</h3>
          <p className="text-sm text-virgin-gray-600">Weekly performance summaries and insights</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Update
        </Button>
      </div>

      {/* Updates List */}
      {updates.length > 0 ? (
        <div className="space-y-6">
          {updates.map((update) => (
            <Card key={update.id}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-virgin-red" />
                  <CardTitle>
                    Week of {formatDateRange(update.week_start, update.week_end)}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Performance Summaries */}
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-virgin-gray-700 flex items-center gap-2 mb-2">
                        <FileText className="h-4 w-4" />
                        STR Summary
                      </h4>
                      <p className="text-sm text-virgin-gray-600 bg-virgin-gray-50 p-3 rounded-lg">
                        {update.str_summary || 'No summary provided'}
                      </p>
                    </div>

                    <div>
                      <h4 className="font-medium text-virgin-gray-700 flex items-center gap-2 mb-2">
                        <FileText className="h-4 w-4" />
                        Web Analytics Summary
                      </h4>
                      <p className="text-sm text-virgin-gray-600 bg-virgin-gray-50 p-3 rounded-lg">
                        {update.web_analytics_summary || 'No summary provided'}
                      </p>
                    </div>

                    <div>
                      <h4 className="font-medium text-virgin-gray-700 flex items-center gap-2 mb-2">
                        <FileText className="h-4 w-4" />
                        Paid Media Summary
                      </h4>
                      <p className="text-sm text-virgin-gray-600 bg-virgin-gray-50 p-3 rounded-lg">
                        {update.paid_media_summary || 'No summary provided'}
                      </p>
                    </div>
                  </div>

                  {/* Insights */}
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-green-700 flex items-center gap-2 mb-2">
                        <CheckCircle className="h-4 w-4" />
                        What's Working
                      </h4>
                      <p className="text-sm text-virgin-gray-600 bg-green-50 p-3 rounded-lg border border-green-200">
                        {update.whats_working || 'No insights provided'}
                      </p>
                    </div>

                    <div>
                      <h4 className="font-medium text-red-700 flex items-center gap-2 mb-2">
                        <XCircle className="h-4 w-4" />
                        What's Not Working
                      </h4>
                      <p className="text-sm text-virgin-gray-600 bg-red-50 p-3 rounded-lg border border-red-200">
                        {update.whats_not_working || 'No insights provided'}
                      </p>
                    </div>

                    <div>
                      <h4 className="font-medium text-blue-700 flex items-center gap-2 mb-2">
                        <ArrowRight className="h-4 w-4" />
                        Adjustments Planned
                      </h4>
                      <p className="text-sm text-virgin-gray-600 bg-blue-50 p-3 rounded-lg border border-blue-200">
                        {update.adjustments_planned || 'No adjustments planned'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Bottom Row */}
                <div className="grid grid-cols-2 gap-6 mt-6 pt-6 border-t border-virgin-gray-200">
                  <div>
                    <h4 className="font-medium text-virgin-gray-700 mb-2">Tactics Deployed</h4>
                    <p className="text-sm text-virgin-gray-600">
                      {update.tactics_deployed || 'None specified'}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-virgin-gray-700 flex items-center gap-2 mb-2">
                      <Megaphone className="h-4 w-4" />
                      Promotions in Market
                    </h4>
                    <p className="text-sm text-virgin-gray-600">
                      {update.promotions_in_market || 'None specified'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-virgin-gray-300" />
            <p className="text-lg font-medium text-virgin-gray-600">No weekly updates yet</p>
            <p className="text-sm text-virgin-gray-500 mt-1">Add your first 5:15 update to track weekly performance</p>
          </CardContent>
        </Card>
      )}

      {/* Add Update Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Weekly Update" size="xl">
        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Week Start"
              type="date"
              value={formData.week_start}
              onChange={(e) => setFormData({ ...formData, week_start: e.target.value })}
            />
            <Input
              label="Week End"
              type="date"
              value={formData.week_end}
              onChange={(e) => setFormData({ ...formData, week_end: e.target.value })}
            />
          </div>

          <div className="border-t border-virgin-gray-200 pt-4">
            <h4 className="font-medium text-virgin-black mb-3">Performance Summaries</h4>
            <div className="space-y-4">
              <Textarea
                label="STR Summary"
                value={formData.str_summary}
                onChange={(e) => setFormData({ ...formData, str_summary: e.target.value })}
                placeholder="Key STR insights for the week..."
                rows={2}
              />
              <Textarea
                label="Web Analytics Summary"
                value={formData.web_analytics_summary}
                onChange={(e) => setFormData({ ...formData, web_analytics_summary: e.target.value })}
                placeholder="Key web analytics insights..."
                rows={2}
              />
              <Textarea
                label="Paid Media Summary"
                value={formData.paid_media_summary}
                onChange={(e) => setFormData({ ...formData, paid_media_summary: e.target.value })}
                placeholder="Key paid media insights..."
                rows={2}
              />
            </div>
          </div>

          <div className="border-t border-virgin-gray-200 pt-4">
            <h4 className="font-medium text-virgin-black mb-3">Insights & Actions</h4>
            <div className="space-y-4">
              <Textarea
                label="What's Working"
                value={formData.whats_working}
                onChange={(e) => setFormData({ ...formData, whats_working: e.target.value })}
                placeholder="What strategies and tactics are performing well..."
                rows={2}
              />
              <Textarea
                label="What's Not Working"
                value={formData.whats_not_working}
                onChange={(e) => setFormData({ ...formData, whats_not_working: e.target.value })}
                placeholder="What needs improvement..."
                rows={2}
              />
              <Textarea
                label="Adjustments Planned"
                value={formData.adjustments_planned}
                onChange={(e) => setFormData({ ...formData, adjustments_planned: e.target.value })}
                placeholder="What changes are being made..."
                rows={2}
              />
            </div>
          </div>

          <div className="border-t border-virgin-gray-200 pt-4">
            <h4 className="font-medium text-virgin-black mb-3">Tactics & Promotions</h4>
            <div className="space-y-4">
              <Textarea
                label="Tactics Deployed"
                value={formData.tactics_deployed}
                onChange={(e) => setFormData({ ...formData, tactics_deployed: e.target.value })}
                placeholder="Tactics implemented this week..."
                rows={2}
              />
              <Textarea
                label="Promotions in Market"
                value={formData.promotions_in_market}
                onChange={(e) => setFormData({ ...formData, promotions_in_market: e.target.value })}
                placeholder="Active promotions and offers..."
                rows={2}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-virgin-gray-200 sticky bottom-0 bg-white">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} isLoading={isSaving}>
              Save Update
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
