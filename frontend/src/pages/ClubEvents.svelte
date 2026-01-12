<script lang="ts">
    import { route, goto } from "@mateothegreat/svelte5-router";
    import { authClient } from "../lib/auth-client";
    import {
        getClubEvents,
        getClub,
        type ClubEvent,
        type Club,
    } from "../lib/api";
    import LoadingSpinner from "../components/LoadingSpinner.svelte";
    import EventCard from "../components/EventCard.svelte";
    import { fade, fly, slide } from "svelte/transition";

    interface Props {
        route?: { params: { clubId: string } };
    }

    
    let { route: routeData }: Props = $props();

    const session = authClient.useSession();

    let club = $state<Club | null>(null);
    let events = $state<ClubEvent[]>([]);
    let loading = $state(true);
    let error = $state<string | null>(null);
    let isClubOwner = $state(false);

    // Get clubId from route params - handle named, indexed, or manual fallback
    let clubId = $derived.by(() => {
        const params = routeData?.params as any;
        if (params?.clubId) return params.clubId;
        if (params?.[1]) return params[1];

        // Manual fallback from URL
        const match = window.location.pathname.match(/\/clubs\/(\d+)\/events/);
        return match ? match[1] : "";
    });

    $effect(() => {
        if (clubId) {
            loadClubAndEvents();
        }
        if (!$session.isPending && !$session.data?.user) {
            goto("/register?message=login_required");
            return;
        }
    });

    async function loadClubAndEvents() {
        loading = true;
        error = null;
        try {
            const clubResult = await getClub(parseInt(clubId));
            if (clubResult.success && clubResult.clubData) {
                club = clubResult.clubData;
            } else {
                error = clubResult.message || "Club not found";
                return;
            }

            if ($session.data?.user && club) {
                isClubOwner = club.authClubId === $session.data.user.id;
            }

            const eventsResult = await getClubEvents(parseInt(clubId));
            if (eventsResult.success && eventsResult.clubEvents) {
                events = eventsResult.clubEvents;
            } else if (eventsResult.message === "No events yet") {
                events = [];
            } else {
                error = eventsResult.message || "Failed to load events";
            }
        } catch (err: any) {
            error = err.message || "An error occurred";
        } finally {
            loading = false;
        }
    }

    function formatDate(dateStr: string): string {
        return new Date(dateStr).toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    }

    function formatTime(dateStr: string): string {
        return new Date(dateStr).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
        });
    }

    function getStatusColor(status: string): string {
        switch (status) {
            case "published":
                return "bg-emerald-100 text-emerald-800 border-emerald-200";
            case "draft":
                return "bg-amber-100 text-amber-800 border-amber-200";
            case "cancelled":
                return "bg-rose-100 text-rose-800 border-rose-200";
            case "completed":
                return "bg-slate-100 text-slate-800 border-slate-200";
            case "ongoing":
                return "bg-blue-100 text-blue-800 border-blue-200";
            default:
                return "bg-gray-100 text-gray-800 border-gray-200";
        }
    }

    // Categorization logic
    const categorizedEvents = $derived.by(
        (): {
            ongoing: ClubEvent[];
            upcoming: ClubEvent[];
            completed: ClubEvent[];
        } => {
            const now = new Date();
            const sorted: ClubEvent[] = [...events].sort(
                (a, b) =>
                    new Date(b.eventStartTime).getTime() -
                    new Date(a.eventStartTime).getTime(),
            );

            return {
                ongoing: sorted.filter((e) => {
                    const start = new Date(e.eventStartTime);
                    const end = new Date(e.eventEndTime);
                    return (
                        (e.status === "ongoing" ||
                            (start <= now && end >= now)) &&
                        e.status !== "completed" &&
                        e.status !== "cancelled"
                    );
                }),
                upcoming: sorted.filter((e) => {
                    const start = new Date(e.eventStartTime);
                    return (
                        start > now &&
                        e.status !== "completed" &&
                        e.status !== "cancelled" &&
                        e.status !== "ongoing"
                    );
                }),
                completed: sorted.filter((e) => {
                    const end = new Date(e.eventEndTime);
                    return (
                        e.status === "completed" ||
                        end < now ||
                        e.status === "cancelled"
                    );
                }),
            };
        },
    );
</script>

<div class="min-h-[calc(100vh-4rem)] bg-gray-50/30 px-4 py-8 sm:px-6 lg:px-8">
    <div class="max-w-7xl mx-auto">
        <!-- Breadcrumb -->
        <nav class="flex items-center gap-2 text-sm text-gray-500 mb-8" in:fade>
            <a
                href="/clubs"
                use:route
                class="hover:text-blue-600 transition-colors hover:underline"
                >Clubs</a
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
                ></path>
            </svg>
            <a
                href="/clubs/{clubId}"
                use:route
                class="hover:text-blue-600 transition-colors hover:underline max-w-[200px] truncate"
                >{club?.name || "Club Details"}</a
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
                ></path>
            </svg>
            <span class="text-gray-900 font-medium tracking-tight">Events</span>
        </nav>

        {#if loading}
            <div class="flex items-center justify-center py-20" in:fade>
                <LoadingSpinner size="lg" text="Loading events..." />
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
                        ></path>
                    </svg>
                </div>
                <p class="text-red-600 font-medium mb-4">{error}</p>
                <button
                    onclick={loadClubAndEvents}
                    class="px-6 py-2 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-colors shadow-sm"
                >
                    Try Again
                </button>
            </div>
        {:else}
            <!-- Club Header -->
            <div
                class="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 mb-12 relative overflow-hidden"
                in:fly={{ y: 20, duration: 600 }}
            >
                <!-- Decorative background elements -->
                <div
                    class="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-60"
                ></div>
                <div
                    class="absolute bottom-0 left-0 w-48 h-48 bg-purple-50 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4 opacity-60"
                ></div>

                <div
                    class="relative flex flex-col md:flex-row gap-8 items-start md:items-center"
                >
                    <div class="shrink-0 relative">
                        <div
                            class="w-32 h-32 md:w-40 md:h-40 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg flex items-center justify-center overflow-hidden transform rotate-3 hover:rotate-0 transition-transform duration-300"
                        >
                            {#if club?.logoUrl}
                                <img
                                    src={club.logoUrl}
                                    alt={club.name}
                                    class="w-full h-full object-cover"
                                />
                            {:else}
                                <span class="text-5xl font-bold text-white/90">
                                    {club?.name?.charAt(0).toUpperCase() || "C"}
                                </span>
                            {/if}
                        </div>
                    </div>

                    <div class="flex-1 min-w-0">
                        <h1
                            class="text-3xl md:text-4xl font-extrabold text-gray-900 mb-3 tracking-tight"
                        >
                            {club?.name}
                            <span class="text-blue-600">Events</span>
                        </h1>
                        <p
                            class="text-lg text-gray-600 leading-relaxed max-w-2xl"
                        >
                            Explore all past and upcoming events organized by {club?.name}.
                        </p>
                    </div>

                    {#if isClubOwner}
                        <div class="shrink-0 w-full md:w-auto mt-4 md:mt-0">
                            <a
                                href="/clubs/{clubId}/events/create"
                                use:route
                                class="inline-flex items-center justify-center gap-2 w-full md:w-auto px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-xl transition-all hover:shadow-lg active:scale-95"
                            >
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
                                        d="M12 4v16m8-8H4"
                                    ></path>
                                </svg>
                                Create New Event
                            </a>
                        </div>
                    {/if}
                </div>
            </div>

            <!-- Events Sections -->
            <div class="space-y-16">
                <!-- Ongoing Events -->
                {#if categorizedEvents.ongoing.length > 0}
                    <section in:fade>
                        <div class="flex items-center gap-4 mb-8">
                            <h2
                                class="text-2xl font-black text-gray-900 tracking-tight"
                            >
                                Ongoing Events
                            </h2>
                            <div
                                class="h-1 flex-1 bg-gradient-to-r from-blue-500/20 to-transparent rounded-full"
                            ></div>
                            <span
                                class="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full uppercase"
                                >Live Now</span
                            >
                        </div>
                        <div
                            class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                        >
                            {#each categorizedEvents.ongoing as event, i (event.id)}
                                <EventCard
                                    {event}
                                    {clubId}
                                    index={i}
                                    isOngoing={true}
                                />
                            {/each}
                        </div>
                    </section>
                {/if}

                <!-- Upcoming Events -->
                <section in:fade>
                    <div class="flex items-center gap-4 mb-8">
                        <h2
                            class="text-2xl font-black text-gray-900 tracking-tight"
                        >
                            Upcoming Events
                        </h2>
                        <div
                            class="h-1 flex-1 bg-gradient-to-r from-emerald-500/20 to-transparent rounded-full"
                        ></div>
                        <span
                            class="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full uppercase"
                            >{categorizedEvents.upcoming.length} Events</span
                        >
                    </div>

                    {#if categorizedEvents.upcoming.length === 0}
                        <div
                            class="bg-white rounded-3xl p-12 text-center border border-dashed border-gray-200"
                        >
                            <p class="text-gray-400 font-medium">
                                No upcoming events scheduled yet.
                            </p>
                        </div>
                    {:else}
                        <div
                            class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                        >
                            {#each categorizedEvents.upcoming as event, i (event.id)}
                                <EventCard {event} {clubId} index={i} />
                            {/each}
                        </div>
                    {/if}
                </section>

                <!-- Completed Events -->
                {#if categorizedEvents.completed.length > 0}
                    <section in:fade>
                        <div class="flex items-center gap-4 mb-8 text-gray-400">
                            <h2 class="text-2xl font-black tracking-tight">
                                Completed Events
                            </h2>
                            <div
                                class="h-1 flex-1 bg-gray-100 rounded-full"
                            ></div>
                        </div>
                        <div
                            class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                        >
                            {#each categorizedEvents.completed as event, i (event.id)}
                                <EventCard
                                    {event}
                                    {clubId}
                                    index={i}
                                    isCompleted={true}
                                />
                            {/each}
                        </div>
                    </section>
                {/if}
            </div>
        {/if}
    </div>
</div>

<style>
    .line-clamp-2 {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }
</style>
