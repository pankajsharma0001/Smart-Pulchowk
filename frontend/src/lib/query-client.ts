import { QueryClient } from '@tanstack/svelte-query'

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            enabled: true,
            staleTime: 60 * 1000, // 1 minute
            retry: 1,
        },
    },
})
