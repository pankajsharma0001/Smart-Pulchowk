<script lang="ts">
    import { getAllEvents, type ClubEvent } from "../lib/api";
    import LoadingSpinner from "../components/LoadingSpinner.svelte";
    import EventCard from "../components/EventCard.svelte";
    import { fade } from "svelte/transition";
    import { authClient } from "../lib/auth-client";
    import { goto } from "@mateothegreat/svelte5-router";

    const session = authClient.useSession();

    let events = $state<ClubEvent[]>([]);
    let loading = $state(true);
    let error = $state<string | null>(null);

    $effect(() => {
        loadEvents();
        if (!$session.isPending && !$session.data?.user) {
            goto("/register?message=login_required");
        }
    });

    async function loadEvents() {
        loading = true;
        error = null;
        try {
            const result = await getAllEvents();
            if (result.success && result.allEvents) {
                events = result.allEvents;
            } else {
                error = result.message || "Failed to load events";
            }
        } catch (err: any) {
            error = err.message || "An error occurred";
        } finally {
            loading = false;
        }
    }

    
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
        <!-- Header -->
        <div class="text-center mb-16" in:fade>
            <h1
                class="text-4xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight"
            >
                Campus <span class="text-blue-600">Events</span>
            </h1>
            <p class="text-lg text-gray-600 max-w-2xl mx-auto">
                Discover workshops, seminars, and social gatherings from all
                clubs at Pulchowk Campus.
            </p>
        </div>

        {#if loading}
            <div class="flex items-center justify-center py-20" in:fade>
                <LoadingSpinner size="lg" text="Loading campus events..." />
            </div>
        {:else if error}
            <div
                class="max-w-md mx-auto p-6 bg-white border border-red-100 rounded-2xl shadow-lg text-center"
                in:fade
            >
                <p class="text-red-600 font-medium mb-4">{error}</p>
                <button
                    onclick={loadEvents}
                    class="px-6 py-2 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-colors"
                    >Try Again</button
                >
            </div>
        {:else}
            <!-- Events Sections -->
            <div class="space-y-20">
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
                                    clubId={event.clubId.toString()}
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
                                <EventCard
                                    {event}
                                    clubId={event.clubId.toString()}
                                    index={i}
                                />
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
                            class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 opacity-75 grayscale-[0.5] hover:opacity-100 hover:grayscale-0 transition-all duration-500"
                        >
                            {#each categorizedEvents.completed as event, i (event.id)}
                                <EventCard
                                    {event}
                                    clubId={event.clubId.toString()}
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
