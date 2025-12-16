'use client'

import { useEffect, useState } from 'react'
import { MainLayout } from '@/components/layout'
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Modal, Input, Select, LoadingPage } from '@/components/ui'
import { createClient } from '@/lib/supabase'
import { User, UserRole, UserScope } from '@/lib/types'
import { Users, Plus, Edit, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function UsersClient() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const supabase = createClient()

  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    role: 'viewer' as UserRole,
    scope: 'property' as UserScope,
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setIsLoading(true)

    const { data: usersData } = await supabase.from('users').select('*').order('full_name')

    if (usersData) setUsers(usersData as unknown as User[])

    setIsLoading(false)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      if (editingUser) {
        const { error } = await supabase
          .from('users')
          .update({
            full_name: formData.full_name,
            role: formData.role,
            scope: formData.scope,
          })
          .eq('id', editingUser.id)

        if (error) throw error
        toast.success('User updated successfully')
      } else {
        const { error } = await supabase.from('users').insert({
          email: formData.email,
          full_name: formData.full_name,
          role: formData.role,
          scope: formData.scope,
        })

        if (error) throw error
        toast.success('User created successfully')
      }

      setIsModalOpen(false)
      setEditingUser(null)
      fetchData()
      resetForm()
    } catch (error: any) {
      toast.error(error.message || 'Failed to save user')
    } finally {
      setIsSaving(false)
    }
  }

  const handleEdit = (user: User) => {
    setEditingUser(user)
    setFormData({
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      scope: user.scope,
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return

    const { error } = await supabase.from('users').delete().eq('id', userId)

    if (error) {
      toast.error('Failed to delete user')
    } else {
      toast.success('User deleted successfully')
      fetchData()
    }
  }

  const resetForm = () => {
    setFormData({
      email: '',
      full_name: '',
      role: 'viewer',
      scope: 'property',
    })
  }

  const openNewUserModal = () => {
    setEditingUser(null)
    resetForm()
    setIsModalOpen(true)
  }

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case 'administrator':
        return 'danger'
      case 'editor':
        return 'info'
      default:
        return 'default'
    }
  }

  if (isLoading) {
    return <LoadingPage />
  }

  return (
    <MainLayout title="User Management" subtitle="Manage portal users and permissions">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-virgin-red" />
              Users ({users.length})
            </CardTitle>
            <Button onClick={openNewUserModal}>
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {users.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-virgin-gray-200 bg-virgin-gray-50">
                    <th className="text-left py-3 px-6 font-medium text-virgin-gray-600">Name</th>
                    <th className="text-left py-3 px-6 font-medium text-virgin-gray-600">Email</th>
                    <th className="text-left py-3 px-6 font-medium text-virgin-gray-600">Role</th>
                    <th className="text-left py-3 px-6 font-medium text-virgin-gray-600">Scope</th>
                    <th className="text-left py-3 px-6 font-medium text-virgin-gray-600">Created</th>
                    <th className="text-right py-3 px-6 font-medium text-virgin-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-virgin-gray-100 hover:bg-virgin-gray-50">
                      <td className="py-4 px-6 font-medium text-virgin-black">{user.full_name}</td>
                      <td className="py-4 px-6 text-virgin-gray-600">{user.email}</td>
                      <td className="py-4 px-6">
                        <Badge variant={getRoleBadgeVariant(user.role)}>
                          {user.role}
                        </Badge>
                      </td>
                      <td className="py-4 px-6">
                        <Badge variant="secondary">{user.scope}</Badge>
                      </td>
                      <td className="py-4 px-6 text-virgin-gray-600">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(user)}
                            className="p-2 hover:bg-virgin-gray-100 rounded-lg transition-colors"
                          >
                            <Edit className="h-4 w-4 text-virgin-gray-600" />
                          </button>
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-virgin-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 text-virgin-gray-300" />
              <p className="text-lg font-medium">No users found</p>
              <p className="text-sm mt-1">Add your first user to get started</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingUser(null)
        }}
        title={editingUser ? 'Edit User' : 'Add New User'}
      >
        <div className="space-y-4">
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            disabled={!!editingUser}
            placeholder="user@example.com"
          />
          <Input
            label="Full Name"
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            placeholder="John Doe"
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Role"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
              options={[
                { value: 'viewer', label: 'Viewer' },
                { value: 'editor', label: 'Editor' },
                { value: 'administrator', label: 'Administrator' },
              ]}
            />
            <Select
              label="Scope"
              value={formData.scope}
              onChange={(e) => setFormData({ ...formData, scope: e.target.value as UserScope })}
              options={[
                { value: 'property', label: 'Property' },
                { value: 'corporate', label: 'Corporate' },
              ]}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-virgin-gray-200">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} isLoading={isSaving}>
              {editingUser ? 'Update User' : 'Create User'}
            </Button>
          </div>
        </div>
      </Modal>
    </MainLayout>
  )
}
