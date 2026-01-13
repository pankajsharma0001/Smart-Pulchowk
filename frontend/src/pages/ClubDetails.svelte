<script lang="ts">
  import { route as routeAction, goto } from "@mateothegreat/svelte5-router";
  import { getClub, type Club } from "../lib/api";
  import LoadingSpinner from "../components/LoadingSpinner.svelte";
  import { fade, fly } from "svelte/transition";
  import { authClient } from "../lib/auth-client";

  const { route } = $props();
  const clubId = $derived(route.result.path.params.clubId);

  const session = authClient.useSession();

  let club = $state<Club | null>(null);
  let loading = $state(true);
  let error = $state<string | null>(null);

  $effect(() => {
    if (clubId) {
      loadClub();
    }
    if (!$session.isPending && !$session.data?.user) {
      goto("/register?message=login_required");
    }
  });

  async function loadClub() {
    loading = true;
    error = null;
    try {
      const result = await getClub(parseInt(clubId));
      if (result.success && result.clubData) {
        club = result.clubData;
      } else {
        error = result.message || "Club not found";
      }
    } catch (err: any) {
      error = err.message || "An error occurred";
    } finally {
      loading = false;
    }
  }
</script>

<div class="min-h-[calc(100vh-4rem)] bg-gray-50/30 px-4 py-8 sm:px-6 lg:px-8">
  <div class="max-w-7xl mx-auto">
    <!-- Breadcrumb -->
    <nav class="flex items-center gap-2 text-sm text-gray-500 mb-8" in:fade>
      <a
        href="/clubs"
        use:routeAction
        class="hover:text-blue-600 transition-colors hover:underline">Clubs</a
      >
      <svg
        class="w-4 h-4 text-gray-300"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M9 5l7 7-7 7"
        />
      </svg>
      <span class="text-gray-900 font-medium"
        >{club?.name || "Club Details"}</span
      >
    </nav>

    {#if loading}
      <div class="flex items-center justify-center py-20" in:fade>
        <LoadingSpinner size="lg" text="Loading club details..." />
      </div>
    {:else if error}
      <div
        class="max-w-md mx-auto p-6 bg-white border border-red-100 rounded-2xl shadow-lg text-center"
        in:fly={{ y: 20, duration: 400 }}
      >
        <div
          class="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4"
        >
          <svg
            class="w-8 h-8 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <p class="text-red-600 font-medium mb-4">{error}</p>
        <button
          onclick={loadClub}
          class="px-6 py-2 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-colors"
          >Try Again</button
        >
      </div>
    {:else if club}
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Left Column: Club Info -->
        <div class="lg:col-span-2 space-y-8">
          <div
            class="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 relative overflow-hidden"
            in:fly={{ y: 20, duration: 600 }}
          >
            <div
              class="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-60"
            ></div>

            <div class="relative flex flex-col md:flex-row gap-8 items-start">
              <div class="shrink-0">
                <div
                  class="w-32 h-32 md:w-48 md:h-48 bg-linear-to-br from-blue-500 to-indigo-600 rounded-3xl shadow-xl flex items-center justify-center overflow-hidden transform rotate-3"
                >
                  {#if club.logoUrl}
                    <img
                      src={club.logoUrl}
                      alt={club.name}
                      class="w-full h-full object-cover"
                    />
                  {:else}
                    <span class="text-6xl font-bold text-white"
                      >{club.name.charAt(0)}</span
                    >
                  {/if}
                </div>
              </div>

              <div class="flex-1">
                <h1
                  class="text-4xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight"
                >
                  {club.name}
                </h1>
                <div class="flex flex-wrap gap-3 mb-6">
                  <span
                    class="px-4 py-1.5 bg-blue-50 text-blue-700 text-xs font-bold rounded-full uppercase tracking-wider border border-blue-100"
                    >Official Club</span
                  >
                  {#if club.isActive}
                    <span
                      class="px-4 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full uppercase tracking-wider border border-emerald-100"
                      >Active</span
                    >
                  {/if}
                </div>
                <p class="text-lg text-gray-600 leading-relaxed mb-8">
                  {club.description ||
                    "No description available for this club yet."}
                </p>

                <div class="flex gap-4">
                  <a
                    href="/clubs/{club.id}/events"
                    use:routeAction
                    class="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-blue-600/20 hover:-translate-y-1 active:scale-95"
                  >
                    View Events
                    <svg
                      class="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M17 8l4 4m0 0l-4 4m4-4H3"
                      />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>

          <!-- Club Details/About Section -->
          <div
            class="bg-white rounded-3xl shadow-sm border border-gray-100 p-8"
            in:fly={{ y: 20, duration: 600, delay: 200 }}
          >
            <h2 class="text-2xl font-bold text-gray-900 mb-6">
              About the Club
            </h2>
            <div class="prose prose-blue max-w-none text-gray-600">
              <p>
                Welcome to the official page of {club.name}. Our club is a place
                where creativity, innovation, and community come together. We
                host various events throughout the year, from workshops and
                seminars to social gatherings and competitions.
              </p>
              <p class="mt-4">
                Members of {club.name} gain access to a network of like-minded individuals,
                hands-on experience in various projects, and the opportunity to lead
                and organize campus-wide events.
              </p>
            </div>
          </div>
        </div>

        <!-- Right Column: Stats & Secondary Info -->
        <div class="space-y-8">
          <!-- Stats Card -->
          <div
            class="bg-white rounded-3xl shadow-sm border border-gray-100 p-8"
            in:fly={{ x: 20, duration: 600, delay: 400 }}
          >
            <h3 class="text-lg font-bold text-gray-900 mb-6">
              Club Statistics
            </h3>
            <div class="grid grid-cols-1 gap-6">
              <div
                class="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-center gap-4"
              >
                <div
                  class="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-600/20"
                >
                  <svg
                    class="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div>
                  <div class="text-2xl font-black text-blue-700">
                    {club.upcomingEvents || 0}
                  </div>
                  <div
                    class="text-xs font-bold text-blue-500 uppercase tracking-tighter"
                  >
                    Upcoming Events
                  </div>
                </div>
              </div>

              <div
                class="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-4"
              >
                <div
                  class="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-600/20"
                >
                  <svg
                    class="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <div>
                  <div class="text-2xl font-black text-emerald-700">
                    {club.completedEvents || 0}
                  </div>
                  <div
                    class="text-xs font-bold text-emerald-500 uppercase tracking-tighter"
                  >
                    Completed Events
                  </div>
                </div>
              </div>

              <div
                class="p-4 bg-purple-50 rounded-2xl border border-purple-100 flex items-center gap-4"
              >
                <div
                  class="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-purple-600/20"
                >
                  <svg
                    class="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                </div>
                <div>
                  <div class="text-2xl font-black text-purple-700">
                    {club.totalParticipants || 0}
                  </div>
                  <div
                    class="text-xs font-bold text-purple-500 uppercase tracking-tighter"
                  >
                    Total Participants
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Contact Card -->
          <div
            class="bg-white rounded-3xl shadow-sm border border-gray-100 p-8"
            in:fly={{ x: 20, duration: 600, delay: 600 }}
          >
            <h3 class="text-lg font-bold text-gray-900 mb-6">Contact Info</h3>
            <div class="space-y-4">
              <div class="flex items-center gap-3 text-gray-600">
                <svg
                  class="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span class="text-sm font-medium"
                  >{club.email || "No email provided"}</span
                >
              </div>
              <div class="flex items-center gap-3 text-gray-600">
                <svg
                  class="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span class="text-sm font-medium">IOE Pulchowk Campus</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>
