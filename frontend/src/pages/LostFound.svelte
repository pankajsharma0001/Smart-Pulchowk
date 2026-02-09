<script lang="ts">
  import { createQuery, useQueryClient } from "@tanstack/svelte-query";
  import { route } from "@mateothegreat/svelte5-router";
  import {
    getLostFoundItems,
    type LostFoundCategory,
    type LostFoundItem,
    type LostFoundStatus,
    type LostFoundItemType,
  } from "../lib/api";
  import { authClient } from "../lib/auth-client";
  import LoadingSpinner from "../components/LoadingSpinner.svelte";

  const queryClient = useQueryClient();
  const session = authClient.useSession();
  const isGuest = $derived(($session.data?.user as any)?.role === "guest");
  const canManage = $derived(!!$session.data?.user && !isGuest);

  const categories: Array<{ value: LostFoundCategory | "all"; label: string }> =
    [
      { value: "all", label: "All categories" },
      { value: "documents", label: "Documents" },
      { value: "electronics", label: "Electronics" },
      { value: "accessories", label: "Accessories" },
      { value: "ids_cards", label: "ID Cards" },
      { value: "keys", label: "Keys" },
      { value: "bags", label: "Bags" },
      { value: "other", label: "Other" },
    ];

  const statuses: Array<{ value: LostFoundStatus | "all"; label: string }> = [
    { value: "all", label: "Open + Claimed" },
    { value: "open", label: "Open" },
    { value: "claimed", label: "Claimed" },
    { value: "resolved", label: "Resolved" },
    { value: "closed", label: "Closed" },
  ];

  let itemType = $state<LostFoundItemType>("lost");
  let category = $state<LostFoundCategory | "all">("all");
  let status = $state<LostFoundStatus | "all">("all");
  let search = $state("");

  let loadingMore = $state(false);
  let extraPages = $state<
    Array<{
      items: LostFoundItem[];
      nextCursor: string | null;
      hasMore: boolean;
    }>
  >([]);

  const trimmedSearch = $derived(search.trim());
  const filterSignature = $derived(
    `${itemType}|${category}|${status}|${trimmedSearch}`,
  );

  const listQuery = createQuery(() => ({
    queryKey: ["lost-found", itemType, category, status, trimmedSearch],
    queryFn: async () => {
      const result = await getLostFoundItems({
        itemType,
        category: category === "all" ? undefined : category,
        status: status === "all" ? undefined : status,
        q: trimmedSearch || undefined,
        limit: 8,
      });

      if (!result.success || !result.data) {
        throw new Error(result.message || "Failed to load lost/found items.");
      }

      return result;
    },
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  }));

  let lastSignature = $state("");
  $effect(() => {
    const current = filterSignature;
    if (current !== lastSignature) {
      lastSignature = current;
      extraPages = [];
      loadingMore = false;
    }
  });

  const initialPage = $derived(listQuery.data?.data ?? null);
  const pages = $derived(initialPage ? [initialPage, ...extraPages] : []);
  const items = $derived(pages.flatMap((page) => page.items));
  const total = $derived(
    (listQuery.data?.meta?.total as number | undefined) ?? items.length,
  );
  const hasMore = $derived(
    pages.length > 0 ? pages[pages.length - 1].hasMore : false,
  );
  const nextCursor = $derived(
    pages.length > 0 ? pages[pages.length - 1].nextCursor : null,
  );

  function formatDate(dateLike: string) {
    const date = new Date(dateLike);
    if (Number.isNaN(date.getTime())) return "Unknown date";
    return date.toLocaleDateString();
  }

  function statusClass(value: LostFoundStatus) {
    if (value === "open") return "bg-emerald-100 text-emerald-700";
    if (value === "claimed") return "bg-amber-100 text-amber-700";
    if (value === "resolved") return "bg-blue-100 text-blue-700";
    return "bg-slate-100 text-slate-700";
  }

  async function loadMore() {
    if (!hasMore || loadingMore || !nextCursor) return;

    loadingMore = true;
    try {
      const nextPage = await queryClient.fetchQuery({
        queryKey: [
          "lost-found",
          itemType,
          category,
          status,
          trimmedSearch,
          "cursor",
          nextCursor,
        ],
        queryFn: async () => {
          const result = await getLostFoundItems({
            itemType,
            category: category === "all" ? undefined : category,
            status: status === "all" ? undefined : status,
            q: trimmedSearch || undefined,
            limit: 8,
            cursor: nextCursor,
          });

          if (!result.success || !result.data) {
            throw new Error(result.message || "Failed to load more items.");
          }

          return result.data;
        },
        staleTime: 60_000,
        gcTime: 5 * 60_000,
      });

      if (nextPage.items.length > 0) {
        extraPages = [...extraPages, nextPage];
      }
    } catch {
      // keep existing list stable and show fetch error through query cache retries only
    } finally {
      loadingMore = false;
    }
  }
</script>

<div class="min-h-[calc(100vh-4rem)] px-4 py-5 sm:px-6 lg:px-8">
  <div class="mx-auto max-w-7xl space-y-4">
    <section
      class="rounded-3xl border border-cyan-100 bg-white/80 p-4 shadow-[0_14px_40px_rgba(14,116,144,0.08)] backdrop-blur-sm sm:p-5"
    >
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div class="space-y-1.5">
          <p
            class="inline-flex rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-cyan-700"
          >
            Campus Support
          </p>
          <h1 class="text-3xl font-black tracking-tight text-slate-900">
            Lost &amp; Found
          </h1>
          <p class="max-w-2xl text-sm text-slate-600">
            Report and track campus items quickly. Compact feed, fast filters,
            and claim workflow in one place.
          </p>
        </div>
        {#if canManage}
          <div class="flex flex-wrap items-center gap-2">
            <a
              use:route
              href="/lost-found/my"
              class="inline-flex h-9 items-center gap-1.5 rounded-xl border border-cyan-200 bg-cyan-50 px-3.5 text-sm font-semibold text-cyan-800 transition hover:border-cyan-300 hover:bg-cyan-100"
            >
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 7a2 2 0 012-2h5l2 2h3a2 2 0 012 2v8a2 2 0 01-2 2H7a2 2 0 01-2-2V7z" />
              </svg>
              My Posts
            </a>
            <a
              use:route
              href="/lost-found/report"
              class="inline-flex h-9 items-center gap-1.5 rounded-xl bg-linear-to-r from-cyan-600 to-blue-600 px-3.5 text-sm font-semibold text-white shadow-sm transition hover:from-cyan-500 hover:to-blue-500"
            >
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v14m-7-7h14" />
              </svg>
              Report Item
            </a>
          </div>
        {/if}
      </div>
    </section>

    <section
      class="rounded-3xl border border-cyan-100 bg-white/75 p-3.5 shadow-sm backdrop-blur-sm"
    >
      <div class="flex flex-wrap gap-2">
        <button
          class="inline-flex h-10 items-center rounded-xl px-3.5 text-sm font-semibold transition-colors whitespace-nowrap {itemType ===
          'lost'
            ? 'border border-cyan-200 bg-cyan-50 text-cyan-700'
            : 'border border-slate-200 bg-white text-slate-700 hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700'}"
          onclick={() => (itemType = "lost")}
        >
          <svg class="mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V7a2 2 0 00-2-2h-3V3H9v2H6a2 2 0 00-2 2v6m16 0v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6m16 0H4" />
          </svg>
          Lost
        </button>
        <button
          class="inline-flex h-10 items-center rounded-xl px-3.5 text-sm font-semibold transition-colors whitespace-nowrap {itemType ===
          'found'
            ? 'border border-cyan-200 bg-cyan-50 text-cyan-700'
            : 'border border-slate-200 bg-white text-slate-700 hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700'}"
          onclick={() => (itemType = "found")}
        >
          <svg class="mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Found
        </button>

        <div class="relative min-w-55 flex-1">
          <svg
            class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-4.35-4.35M10.8 18a7.2 7.2 0 100-14.4 7.2 7.2 0 000 14.4z" />
          </svg>
          <input
            type="text"
            placeholder="Search title, location, description"
            bind:value={search}
            class="h-10 w-full rounded-xl border border-cyan-100 bg-white pl-9 pr-3 text-sm text-slate-700 focus:border-cyan-300 focus:outline-hidden focus:ring-2 focus:ring-cyan-100"
          />
        </div>

        <div class="relative">
          <select
            bind:value={category}
            class="h-10 rounded-xl border border-cyan-100 bg-none bg-white pl-3 pr-9 text-sm text-slate-700 focus:border-cyan-300 focus:outline-hidden focus:ring-2 focus:ring-cyan-100"
          >
            {#each categories as option}
              <option value={option.value}>{option.label}</option>
            {/each}
          </select>
          <svg
            class="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>

        <div class="relative">
          <select
            bind:value={status}
            class="h-10 rounded-xl border border-cyan-100 bg-none bg-white pl-3 pr-9 text-sm text-slate-700 focus:border-cyan-300 focus:outline-hidden focus:ring-2 focus:ring-cyan-100"
          >
            {#each statuses as option}
              <option value={option.value}>{option.label}</option>
            {/each}
          </select>
          <svg
            class="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>
    </section>

    {#if listQuery.isLoading}
      <div class="rounded-3xl border border-cyan-100 bg-white/80 p-8">
        <LoadingSpinner text="Loading items..." />
      </div>
    {:else if listQuery.error}
      <div
        class="rounded-3xl border border-rose-200 bg-rose-50 p-5 text-rose-700"
      >
        <p class="font-semibold">Failed to load lost/found items</p>
        <p class="mt-1 text-sm">{listQuery.error.message}</p>
      </div>
    {:else}
      <div class="space-y-2.5">
        <p class="text-xs text-slate-500">{items.length} of {total} items</p>

        {#if items.length === 0}
          <div
            class="rounded-3xl border border-cyan-100 bg-white/80 p-10 text-center"
          >
            <p class="text-lg font-semibold text-slate-800">No items found</p>
            <p class="mt-1 text-sm text-slate-500">
              Try changing filters or search terms.
            </p>
          </div>
        {:else}
          {#each items as item (item.id)}
            <a
              use:route
              href={`/lost-found/${item.id}`}
              class="group block rounded-2xl border border-cyan-100 bg-white/85 p-3.5 shadow-sm transition hover:-translate-y-px hover:border-cyan-300 hover:shadow-[0_10px_28px_rgba(14,116,144,0.12)]"
            >
              <div class="flex items-start gap-3">
                <div
                  class="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-cyan-100 bg-cyan-50"
                >
                  {#if item.images?.[0]?.imageUrl}
                    <img
                      src={item.images[0].imageUrl}
                      alt={item.title}
                      class="h-full w-full object-cover"
                      loading="lazy"
                    />
                  {:else}
                    <div
                      class="flex h-full w-full items-center justify-center text-cyan-500"
                    >
                      <svg
                        class="h-4.5 w-4.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M3 7h18M7 3v4m10-4v4M5 11h14v8H5z"
                        />
                      </svg>
                    </div>
                  {/if}
                </div>

                <div class="min-w-0 flex-1">
                  <div class="flex flex-wrap items-center gap-1.5">
                    <h3
                      class="truncate text-base font-bold text-slate-900 transition group-hover:text-cyan-800"
                    >
                      {item.title}
                    </h3>
                    <span
                      class="inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold {statusClass(
                        item.status,
                      )}">{item.status}</span
                    >
                    <span
                      class="inline-flex rounded-full bg-cyan-50 px-2 py-0.5 text-[11px] font-semibold text-cyan-800"
                    >
                      {item.category.replace("_", " ")}
                    </span>
                  </div>

                  <p class="mt-1 text-sm text-slate-600 line-clamp-2">
                    {item.description}
                  </p>

                  <div
                    class="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-500"
                  >
                    <span
                      class="inline-flex items-center gap-1"
                      ><svg class="h-3.5 w-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10m-13 9h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v11a2 2 0 002 2z" />
                      </svg>{item.itemType === "lost" ? "Lost on" : "Found on"}
                      {formatDate(item.lostFoundDate)}</span
                    >
                    <span class="inline-flex items-center gap-1"
                      ><svg class="h-3.5 w-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.7 8.3A5.7 5.7 0 116.3 8.3c0 4.9 5.7 10.7 5.7 10.7s5.7-5.8 5.7-10.7z" />
                        <circle cx="12" cy="8.3" r="2.2" />
                      </svg>{item.locationText}</span
                    >
                    {#if item.owner?.name}
                      <span class="inline-flex items-center gap-1"
                        ><svg class="h-3.5 w-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.1 19a8 8 0 0113.8 0M12 11a4 4 0 100-8 4 4 0 000 8z" />
                        </svg>By {item.owner.name}</span
                      >
                    {/if}
                  </div>
                </div>
              </div>
            </a>
          {/each}
        {/if}
      </div>

      {#if hasMore}
        <div class="flex justify-center pt-1">
          <button
            class="rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-800 transition hover:border-cyan-300 hover:bg-cyan-100 disabled:opacity-60"
            onclick={loadMore}
            disabled={loadingMore}
          >
            {loadingMore ? "Loading..." : "Load more"}
          </button>
        </div>
      {/if}
    {/if}
  </div>
</div>

<style>
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
