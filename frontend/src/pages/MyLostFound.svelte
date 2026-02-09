<script lang="ts">
  import { createQuery, useQueryClient } from '@tanstack/svelte-query'
  import { onMount } from 'svelte'
  import { route } from '@mateothegreat/svelte5-router'
  import {
    getMyLostFoundClaims,
    getMyLostFoundItems,
    updateLostFoundItemStatus,
  } from '../lib/api'
  import { authClient } from '../lib/auth-client'
  import LoadingSpinner from '../components/LoadingSpinner.svelte'

  const queryClient = useQueryClient()
  const session = authClient.useSession()
  const role = $derived(($session.data?.user as any)?.role as string | undefined)
  const isGuest = $derived(role === 'guest')
  const isAuthorized = $derived(!!$session.data?.user && !isGuest)

  let tab = $state<'posts' | 'claims'>('posts')
  let submitting = $state(false)

  const myItemsQuery = createQuery(() => ({
    queryKey: ['my-lost-found-items', ($session.data?.user as any)?.id ?? 'anon'],
    enabled: isAuthorized,
    queryFn: async () => {
      const result = await getMyLostFoundItems()
      if (!result.success || !result.data) {
        throw new Error(result.message || 'Failed to load your posts.')
      }
      return result.data
    },
    staleTime: 20_000,
    gcTime: 5 * 60_000,
  }))

  const myClaimsQuery = createQuery(() => ({
    queryKey: ['my-lost-found-claims', ($session.data?.user as any)?.id ?? 'anon'],
    enabled: isAuthorized,
    queryFn: async () => {
      const result = await getMyLostFoundClaims()
      if (!result.success || !result.data) {
        throw new Error(result.message || 'Failed to load your claims.')
      }
      return result.data
    },
    staleTime: 20_000,
    gcTime: 5 * 60_000,
  }))

  const myItems = $derived(myItemsQuery.data ?? [])
  const myClaims = $derived(myClaimsQuery.data ?? [])
  const loading = $derived((isAuthorized && (myItemsQuery.isLoading || myClaimsQuery.isLoading)) || false)
  const errorMessage = $derived(
    (myItemsQuery.error as Error | null)?.message || (myClaimsQuery.error as Error | null)?.message || null,
  )

  async function markResolved(itemId: number) {
    submitting = true
    const result = await updateLostFoundItemStatus(itemId, 'resolved')
    submitting = false
    if (!result.success) {
      alert(result.message || 'Failed to update status')
      return
    }

    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['my-lost-found-items'] }),
      queryClient.invalidateQueries({ queryKey: ['lost-found'] }),
      queryClient.invalidateQueries({ queryKey: ['lost-found-item', itemId] }),
    ])
  }

  onMount(() => {
    tab = 'posts'
  })
</script>

<div class="min-h-[calc(100vh-4rem)] px-4 py-5 sm:px-6 lg:px-8">
  <div class="mx-auto max-w-6xl space-y-4">
    <section class="rounded-3xl border border-cyan-100 bg-white/80 p-4 shadow-sm backdrop-blur-sm sm:p-5">
      <h1 class="text-3xl font-black tracking-tight text-slate-900">My Lost &amp; Found</h1>
      <p class="mt-1 text-sm text-slate-600">Manage posted items and claim activity in compact view.</p>
    </section>

    {#if !$session.data?.user || isGuest}
      <div class="rounded-3xl border border-cyan-200 bg-cyan-50 p-4 text-cyan-800">
        Sign in with a non-guest account to manage lost/found posts.
      </div>
    {:else}
      <section class="rounded-3xl border border-cyan-100 bg-white/80 p-3.5 shadow-sm backdrop-blur-sm">
        <div class="flex gap-2">
          <button
            class="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-semibold transition {tab === 'posts'
              ? 'bg-linear-to-r from-blue-600 to-cyan-600 text-white shadow-sm'
              : 'border border-cyan-200 bg-white text-slate-700 hover:bg-cyan-50'}"
            onclick={() => (tab = 'posts')}
          >
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 7a2 2 0 012-2h5l2 2h3a2 2 0 012 2v8a2 2 0 01-2 2H7a2 2 0 01-2-2V7z" />
            </svg>
            My Posts ({myItems.length})
          </button>

          <button
            class="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-semibold transition {tab === 'claims'
              ? 'bg-linear-to-r from-blue-600 to-cyan-600 text-white shadow-sm'
              : 'border border-cyan-200 bg-white text-slate-700 hover:bg-cyan-50'}"
            onclick={() => (tab = 'claims')}
          >
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.94 9.94 0 01-4.255-.949L3 20l1.245-3.113A7.927 7.927 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            My Claims ({myClaims.length})
          </button>
        </div>
      </section>

      {#if loading}
        <div class="rounded-3xl border border-cyan-100 bg-white/80 p-8 shadow-sm backdrop-blur-sm">
          <LoadingSpinner text="Loading your data..." />
        </div>
      {:else if errorMessage}
        <div class="rounded-3xl border border-rose-200 bg-rose-50 p-5 text-rose-700">{errorMessage}</div>
      {:else if tab === 'posts'}
        <div class="space-y-2.5">
          {#if myItems.length === 0}
            <div class="rounded-3xl border border-cyan-100 bg-white/80 p-8 text-center text-slate-500 shadow-sm backdrop-blur-sm">
              No posts yet.
            </div>
          {:else}
            {#each myItems as item}
              <article class="rounded-2xl border border-cyan-100 bg-white/85 p-3.5 shadow-sm backdrop-blur-sm">
                <div class="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <a
                      use:route
                      href={`/lost-found/${item.id}`}
                      class="text-base font-bold text-slate-900 transition hover:text-cyan-800"
                    >
                      {item.title}
                    </a>
                    <p class="mt-1 text-sm text-slate-500">{item.itemType} • {item.category.replace('_', ' ')} • {item.status}</p>
                  </div>

                  {#if item.status !== 'resolved' && item.status !== 'closed'}
                    <button
                      class="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 disabled:opacity-60"
                      onclick={() => markResolved(item.id)}
                      disabled={submitting}
                    >
                      <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Mark Resolved
                    </button>
                  {/if}
                </div>
              </article>
            {/each}
          {/if}
        </div>
      {:else}
        <div class="space-y-2.5">
          {#if myClaims.length === 0}
            <div class="rounded-3xl border border-cyan-100 bg-white/80 p-8 text-center text-slate-500 shadow-sm backdrop-blur-sm">
              No claims yet.
            </div>
          {:else}
            {#each myClaims as claim}
              <article class="rounded-2xl border border-cyan-100 bg-white/85 p-3.5 shadow-sm backdrop-blur-sm">
                <div class="flex items-center justify-between gap-2">
                  <a
                    use:route
                    href={`/lost-found/${claim.itemId}`}
                    class="text-sm font-semibold text-slate-900 transition hover:text-cyan-800"
                  >
                    {claim.item?.title || `Item #${claim.itemId}`}
                  </a>
                  <span class="rounded-full bg-cyan-50 px-2 py-0.5 text-xs font-semibold text-cyan-800">{claim.status}</span>
                </div>
                <p class="mt-1 text-sm text-slate-600">{claim.message}</p>
              </article>
            {/each}
          {/if}
        </div>
      {/if}
    {/if}
  </div>
</div>

