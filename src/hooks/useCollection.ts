import { useCallback, useEffect, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import type { User } from '@supabase/supabase-js'
import {
  deleteRemote,
  loadCollection,
  saveCollection,
  type CollectionName,
  type LocalCollections,
} from '../lib/data'

export function useCollection<K extends CollectionName>(name: K, user: User | null) {
  const [items, setItems] = useState<LocalCollections[K]>([] as unknown as LocalCollections[K])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    setLoading(true)
    loadCollection(name, user).then((next) => {
      if (!alive) return
      setItems(next)
      setLoading(false)
    })
    return () => { alive = false }
  }, [name, user])

  const update: Dispatch<SetStateAction<LocalCollections[K]>> = useCallback((value) => {
    setItems((current) => {
      const next = typeof value === 'function'
        ? (value as (previous: LocalCollections[K]) => LocalCollections[K])(current)
        : value
      void saveCollection(name, next, user)
      return next
    })
  }, [name, user])

  const remove = useCallback((id: string) => {
    setItems((current) => {
      const next = (current as unknown as Array<Record<string, unknown>>).filter((item) => (item.id ?? item.lessonId ?? item.word) !== id) as unknown as LocalCollections[K]
      void saveCollection(name, next, user)
      void deleteRemote(name, id, user)
      return next
    })
  }, [name, user])

  return { items, setItems: update, remove, loading }
}
