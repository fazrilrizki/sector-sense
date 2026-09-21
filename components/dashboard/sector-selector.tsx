'use client'

import * as React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Check, ChevronsUpDown, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SectorSelectorProps {
  sectors: { id: string; label: string }[]
}

export function SectorSelector({ sectors }: SectorSelectorProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentSectorId = searchParams.get('sector') || 'banks'

  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState('')
  const containerRef = React.useRef<HTMLDivElement>(null)

  // Handle clicking outside to close
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filteredSectors = sectors.filter(s => 
    s.label.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const selectedSector = sectors.find(s => s.id === currentSectorId) || sectors[0]

  const handleSelect = (sectorId: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('sector', sectorId)
    router.push(`/dashboard?${params.toString()}`, { scroll: false })
    setOpen(false)
    setSearchQuery('')
  }

  return (
    <div className="relative w-full max-w-sm mb-4 z-50" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
      >
        <span className="truncate">{selectedSector.label}</span>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </button>

      {open && (
        <div className="absolute top-full mt-2 w-full rounded-md border border-zinc-200 bg-white shadow-lg outline-none dark:border-zinc-800 dark:bg-zinc-950 overflow-hidden animate-in fade-in-0 zoom-in-95">
          <div className="flex items-center border-b border-zinc-200 px-3 dark:border-zinc-800">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <input
              className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Cari sub-sektor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
          </div>
          <div className="max-h-60 overflow-y-auto p-1 scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-700">
            {filteredSectors.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Sektor tidak ditemukan.
              </p>
            ) : (
              filteredSectors.map((sector) => (
                <div
                  key={sector.id}
                  onClick={() => handleSelect(sector.id)}
                  className={cn(
                    "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-zinc-100 hover:text-zinc-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 dark:hover:bg-zinc-800 dark:hover:text-zinc-50 transition-colors",
                    currentSectorId === sector.id && "bg-zinc-100 dark:bg-zinc-800 font-medium"
                  )}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      currentSectorId === sector.id ? "opacity-100 text-primary" : "opacity-0"
                    )}
                  />
                  {sector.label}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
