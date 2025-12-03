import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  Settings as SettingsIcon,
  MapPin,
  Tag,
  Users,
  Plus,
  Trash2,
  Save
} from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function Settings() {
  const [activeTab, setActiveTab] = useState('cities')

  const tabs = [
    { id: 'cities', name: 'ערים', icon: MapPin },
    { id: 'support-types', name: 'סוגי תמיכה', icon: Tag },
    { id: 'communities', name: 'קהילות', icon: Users },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-hebrew font-bold text-gray-900">הגדרות</h1>
        <p className="text-gray-500 mt-1">ניהול הגדרות המערכת</p>
      </div>

      {/* Tabs */}
      <div className="card p-2">
        <div className="flex gap-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${
                activeTab === tab.id 
                  ? 'bg-primary-600 text-white' 
                  : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.name}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {activeTab === 'cities' && <CitiesSettings />}
      {activeTab === 'support-types' && <SupportTypesSettings />}
      {activeTab === 'communities' && <CommunitiesSettings />}
    </div>
  )
}

function CitiesSettings() {
  const queryClient = useQueryClient()
  const [newCity, setNewCity] = useState('')

  const { data: cities, isLoading } = useQuery({
    queryKey: ['cities'],
    queryFn: async () => {
      const { data } = await supabase.from('cities').select('*').order('name')
      return data || []
    }
  })

  const addMutation = useMutation({
    mutationFn: async (name: string) => {
      const { error } = await supabase.from('cities').insert({ name })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cities'] })
      setNewCity('')
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('cities').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cities'] })
    }
  })

  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <MapPin className="w-5 h-5 text-primary-500" />
        ערים
      </h2>

      {/* Add Form */}
      <form 
        onSubmit={(e) => { e.preventDefault(); if (newCity.trim()) addMutation.mutate(newCity.trim()) }}
        className="flex gap-2 mb-6"
      >
        <input
          type="text"
          className="input flex-1"
          placeholder="שם העיר החדשה"
          value={newCity}
          onChange={(e) => setNewCity(e.target.value)}
        />
        <button type="submit" className="btn btn-primary" disabled={addMutation.isPending}>
          <Plus className="w-4 h-4" />
          הוסף
        </button>
      </form>

      {/* List */}
      {isLoading ? (
        <div className="text-center py-4">טוען...</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {cities?.map((city: any) => (
            <div 
              key={city.id} 
              className="flex items-center justify-between p-3 bg-gray-50 rounded-xl group"
            >
              <span>{city.name}</span>
              <button
                onClick={() => {
                  if (confirm(`למחוק את ${city.name}?`)) {
                    deleteMutation.mutate(city.id)
                  }
                }}
                className="p-1 hover:bg-red-100 text-red-500 rounded opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function SupportTypesSettings() {
  const queryClient = useQueryClient()
  const [newType, setNewType] = useState('')

  const { data: types, isLoading } = useQuery({
    queryKey: ['support-types'],
    queryFn: async () => {
      const { data } = await supabase.from('support_types').select('*').order('name')
      return data || []
    }
  })

  const addMutation = useMutation({
    mutationFn: async (name: string) => {
      const { error } = await supabase.from('support_types').insert({ name })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-types'] })
      setNewType('')
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('support_types').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-types'] })
    }
  })

  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Tag className="w-5 h-5 text-primary-500" />
        סוגי תמיכה
      </h2>

      <form 
        onSubmit={(e) => { e.preventDefault(); if (newType.trim()) addMutation.mutate(newType.trim()) }}
        className="flex gap-2 mb-6"
      >
        <input
          type="text"
          className="input flex-1"
          placeholder="סוג תמיכה חדש"
          value={newType}
          onChange={(e) => setNewType(e.target.value)}
        />
        <button type="submit" className="btn btn-primary" disabled={addMutation.isPending}>
          <Plus className="w-4 h-4" />
          הוסף
        </button>
      </form>

      {isLoading ? (
        <div className="text-center py-4">טוען...</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {types?.map((type: any) => (
            <div 
              key={type.id} 
              className="flex items-center justify-between p-3 bg-gray-50 rounded-xl group"
            >
              <span>{type.name}</span>
              <button
                onClick={() => {
                  if (confirm(`למחוק את ${type.name}?`)) {
                    deleteMutation.mutate(type.id)
                  }
                }}
                className="p-1 hover:bg-red-100 text-red-500 rounded opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function CommunitiesSettings() {
  const queryClient = useQueryClient()
  const [newCommunity, setNewCommunity] = useState('')

  const { data: communities, isLoading } = useQuery({
    queryKey: ['communities'],
    queryFn: async () => {
      const { data } = await supabase.from('communities').select('*').order('name')
      return data || []
    }
  })

  const addMutation = useMutation({
    mutationFn: async (name: string) => {
      const { error } = await supabase.from('communities').insert({ name })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communities'] })
      setNewCommunity('')
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('communities').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communities'] })
    }
  })

  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Users className="w-5 h-5 text-primary-500" />
        קהילות
      </h2>

      <form 
        onSubmit={(e) => { e.preventDefault(); if (newCommunity.trim()) addMutation.mutate(newCommunity.trim()) }}
        className="flex gap-2 mb-6"
      >
        <input
          type="text"
          className="input flex-1"
          placeholder="שם הקהילה החדשה"
          value={newCommunity}
          onChange={(e) => setNewCommunity(e.target.value)}
        />
        <button type="submit" className="btn btn-primary" disabled={addMutation.isPending}>
          <Plus className="w-4 h-4" />
          הוסף
        </button>
      </form>

      {isLoading ? (
        <div className="text-center py-4">טוען...</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {communities?.map((community: any) => (
            <div 
              key={community.id} 
              className="flex items-center justify-between p-3 bg-gray-50 rounded-xl group"
            >
              <span>{community.name}</span>
              <button
                onClick={() => {
                  if (confirm(`למחוק את ${community.name}?`)) {
                    deleteMutation.mutate(community.id)
                  }
                }}
                className="p-1 hover:bg-red-100 text-red-500 rounded opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

