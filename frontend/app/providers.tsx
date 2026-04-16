'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { useState } from 'react'
import Layout from '@/components/Layout'

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, retry: 1 },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <Layout>{children}</Layout>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { borderRadius: '10px', background: '#1e1e2e', color: '#fff' },
          success: { iconTheme: { primary: '#6366f1', secondary: '#fff' } },
        }}
      />
    </QueryClientProvider>
  )
}
