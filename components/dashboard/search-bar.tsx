'use client'

import * as React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'

export function SearchBar() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultSymbol = searchParams.get('symbol') || ''
  
  const [symbol, setSymbol] = React.useState(defaultSymbol)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!symbol.trim()) return

    const cleanSymbol = symbol.toUpperCase().trim()
    router.push(`/dashboard?symbol=${cleanSymbol}`)
  }

  return (
    <Card className="p-1 border-primary/20 bg-primary/5 shadow-sm">
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            placeholder="Ketik kode saham incaran (Misal: BBCA, TLKM, BMRI)..."
            className="pl-9 border-none bg-white dark:bg-zinc-950 focus-visible:ring-1"
            maxLength={4}
          />
        </div>
        <Button type="submit" className="px-6">
          Analisis
        </Button>
      </form>
    </Card>
  )
}
