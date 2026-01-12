<script lang="ts">
    import { route, goto } from "@mateothegreat/svelte5-router";
    import { authClient } from "../lib/auth-client";
    import { createEvent, getClub, type Club } from "../lib/api";
    import LoadingSpinner from "../components/LoadingSpinner.svelte";
    import { fade, fly, slide } from "svelte/transition";

    interface Props {
        route?: { params: { clubId: string } };
    }

    let { route: routeData }: Props = $props();

    const session = authClient.useSession();

    let club = $state<Club | null>(null);
    let loading = $state(true);
    let submitting = $state(false);
    let error = $state<string | null>(null);
    let success = $state(false);
    let isAuthorized = $state(false);

 
    let clubId = $derived.by(() => {
        const params = routeData?.params as any;
        if (params?.clubId) return params.clubId;
        if (params?.[1]) return params[1];
        const match = window.location.pathname.match(
            /\/clubs\/(\d+)\/events\/create/,
        );
        return match ? match[1] : "";
    });

    
    let title = $state("");
    let description = $state("");
    let eventType = $state("workshop");
    let venue = $state("");
    let maxParticipants = $state<number | null>(null);
    let registrationDeadline = $state("");
    let eventStartTime = $state("");
    let eventEndTime = $state("");
    let bannerUrl = $state("");

    const eventTypes = [
        "workshop",
        "seminar",
        "competition",
        "hackathon",
        "meetup",
        "conference",
        "cultural",
        "sports",
        "other",
    ];

    $effect(() => {
        if (clubId) {
            checkAuthorization();
        }
    });

    async function checkAuthorization() {
        loading = true;
        try {
            const result = await getClub(parseInt(clubId));
            if (result.success && result.clubData) {
                club = result.clubData;

                if ($session.data?.user && club) {
                    isAuthorized = club.authClubId === $session.data.user.id;
                }
            } else {
                error = "Club not found";
            }
        } catch (err: any) {
            error = err.message || "An error occurred";
        } finally {
            loading = false;
        }
    }

    async function handleSubmit(e: Event) {
        e.preventDefault();

        if (!$session.data?.user) {
            error = "You must be logged in to create events";
            return;
        }

        if (!title || !eventType || !eventStartTime || !eventEndTime) {
            error = "Please fill in all required fields";
            return;
        }

        
        const start = new Date(eventStartTime);
        const end = new Date(eventEndTime);
        const deadline = registrationDeadline
            ? new Date(registrationDeadline)
            : null;

        if (end <= start) {
            error = "Event end time must be after start time";
            return;
        }

        if (deadline && deadline >= start) {
            error = "Registration deadline must be before event start time";
            return;
        }

        submitting = true;
        error = null;

        try {
            const result = await createEvent($session.data.user.id, {
                title,
                description,
                eventType,
                venue,
                maxParticipants: maxParticipants || 0,
                registrationDeadline: registrationDeadline,
                eventStartTime: eventStartTime,
                eventEndTime: eventEndTime,
                bannerUrl: bannerUrl || undefined,
            });

            if (result.success) {
                success = true;
                // Redirect to club events page after 1 seconds
                setTimeout(() => {
                    goto(`/clubs/${clubId}/events`);
                }, 1000);
            } else {
                error = result.message || "Failed to create event";
            }
        } catch (err: any) {
            error = err.message + "An error occurred";
        } finally {
            submitting = false;
        }
    }
</script>

<div class="min-h-[calc(100vh-4rem)] bg-gray-50/30 px-4 py-8 sm:px-6 lg:px-8">
    <div class="max-w-3xl mx-auto">
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
                href="/clubs/{clubId}/events"
                use:route
                class="hover:text-blue-600 transition-colors hover:underline"
                >{club?.name || "Club"}</a
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
            <span class="text-gray-900 font-medium">Create Event</span>
        </nav>

        {#if loading}
            <div class="flex items-center justify-center py-20" in:fade>
                <LoadingSpinner size="lg" text="Checking permissions..." />
            </div>
        {:else if !isAuthorized}
            <div
                class="max-w-md mx-auto p-8 bg-white border border-red-100 rounded-3xl shadow-lg text-center"
                in:fly={{ y: 20, duration: 400 }}
            >
                <div
                    class="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6"
                >
                    <svg
                        class="w-10 h-10 text-red-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        ></path>
                    </svg>
                </div>
                <h2 class="text-2xl font-bold text-gray-900 mb-2">
                    Access Denied
                </h2>
                <p class="text-red-600 mb-6 font-medium">
                    {error ||
                        "You are not authorized to create events for this club"}
                </p>
                <a
                    href="/clubs/{clubId}/events"
                    use:route
                    class="inline-block px-6 py-3 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 transition-colors shadow-sm"
                >
                    Back to Events
                </a>
            </div>
        {:else if success}
            <div
                class="max-w-md mx-auto p-12 bg-white border border-green-100 rounded-3xl shadow-lg text-center"
                in:fly={{ y: 20, duration: 400 }}
            >
                <div
                    class="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6"
                >
                    <svg
                        class="w-12 h-12 text-green-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M5 13l4 4L19 7"
                        ></path>
                    </svg>
                </div>
                <h2 class="text-3xl font-bold text-gray-900 mb-4">
                    Event Created!
                </h2>
                <p class="text-gray-600 text-lg">
                    Redirecting you to the event list...
                </p>
            </div>
        {:else}
            <div
                class="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden"
                in:fly={{ y: 20, duration: 600 }}
            >
                <div
                    class="p-8 border-b border-gray-100 bg-gradient-to-r from-blue-50/50 to-purple-50/50"
                >
                    <h1
                        class="text-3xl font-extrabold text-gray-900 tracking-tight"
                    >
                        Create New Event
                    </h1>
                    <p class="text-gray-600 mt-2 text-lg">
                        Fill in the details to create a new event for <span
                            class="font-semibold text-blue-600"
                            >{club?.name}</span
                        >
                    </p>
                </div>

                <form onsubmit={handleSubmit} class="p-8 space-y-8">
                    {#if error}
                        <div
                            class="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 animate-pulse"
                            in:slide
                        >
                            <svg
                                class="w-5 h-5 text-red-500 shrink-0 mt-0.5"
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
                            <p class="text-red-600 font-medium">{error}</p>
                        </div>
                    {/if}

                    <div class="grid gap-8">
                        <!-- Basic Info Section -->
                        <div class="space-y-6">
                            <h3
                                class="text-lg font-semibold text-gray-900 border-b pb-2"
                            >
                                Basic Information
                            </h3>

                            <div class="grid sm:grid-cols-2 gap-6">
                                <div class="col-span-2">
                                    <label
                                        for="title"
                                        class="block text-sm font-semibold text-gray-700 mb-2"
                                    >
                                        Event Title <span class="text-red-500"
                                            >*</span
                                        >
                                    </label>
                                    <input
                                        type="text"
                                        id="title"
                                        bind:value={title}
                                        placeholder="e.g., Annual Tech Symposium 2024"
                                        class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                                        required
                                    />
                                </div>

                                <div>
                                    <label
                                        for="eventType"
                                        class="block text-sm font-semibold text-gray-700 mb-2"
                                    >
                                        Event Type <span class="text-red-500"
                                            >*</span
                                        >
                                    </label>
                                    <div class="relative">
                                        <select
                                            id="eventType"
                                            bind:value={eventType}
                                            class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none appearance-none bg-white"
                                            required
                                        >
                                            {#each eventTypes as type}
                                                <option value={type}
                                                    >{type
                                                        .charAt(0)
                                                        .toUpperCase() +
                                                        type.slice(1)}</option
                                                >
                                            {/each}
                                        </select>
                                        <div
                                            class="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500"
                                        >
                                            <svg
                                                class="w-4 h-4"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    stroke-linecap="round"
                                                    stroke-linejoin="round"
                                                    stroke-width="2"
                                                    d="M19 9l-7 7-7-7"
                                                ></path>
                                            </svg>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label
                                        for="venue"
                                        class="block text-sm font-semibold text-gray-700 mb-2"
                                    >
                                        Venue
                                    </label>
                                    <input
                                        type="text"
                                        id="venue"
                                        bind:value={venue}
                                        placeholder="e.g., Block A, Room 101"
                                        class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label
                                    for="description"
                                    class="block text-sm font-semibold text-gray-700 mb-2"
                                >
                                    Description
                                </label>
                                <textarea
                                    id="description"
                                    bind:value={description}
                                    placeholder="Describe what your event is about..."
                                    rows="4"
                                    class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none resize-y"
                                ></textarea>
                            </div>
                        </div>

                        <!-- Logistics Section -->
                        <div class="space-y-6">
                            <h3
                                class="text-lg font-semibold text-gray-900 border-b pb-2"
                            >
                                Date & Logistics
                            </h3>

                            <div class="grid sm:grid-cols-2 gap-6">
                                <div>
                                    <label
                                        for="eventStartTime"
                                        class="block text-sm font-semibold text-gray-700 mb-2"
                                    >
                                        Start Date & Time <span
                                            class="text-red-500">*</span
                                        >
                                    </label>
                                    <input
                                        type="datetime-local"
                                        id="eventStartTime"
                                        bind:value={eventStartTime}
                                        class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none text-gray-600"
                                        required
                                    />
                                </div>
                                <div>
                                    <label
                                        for="eventEndTime"
                                        class="block text-sm font-semibold text-gray-700 mb-2"
                                    >
                                        End Date & Time <span
                                            class="text-red-500">*</span
                                        >
                                    </label>
                                    <input
                                        type="datetime-local"
                                        id="eventEndTime"
                                        bind:value={eventEndTime}
                                        class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none text-gray-600"
                                        required
                                    />
                                </div>

                                <div>
                                    <label
                                        for="registrationDeadline"
                                        class="block text-sm font-semibold text-gray-700 mb-2"
                                    >
                                        Registration Deadline
                                    </label>
                                    <input
                                        type="datetime-local"
                                        id="registrationDeadline"
                                        bind:value={registrationDeadline}
                                        class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none text-gray-600"
                                        required
                                    />
                                </div>

                                <div>
                                    <label
                                        for="maxParticipants"
                                        class="block text-sm font-semibold text-gray-700 mb-2"
                                    >
                                        Max Participants
                                    </label>
                                    <input
                                        type="number"
                                        id="maxParticipants"
                                        bind:value={maxParticipants}
                                        placeholder="No limit"
                                        min="1"
                                        class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                                    />
                                </div>
                            </div>
                        </div>

                        <!-- Media Section -->
                        <div class="space-y-6">
                            <h3
                                class="text-lg font-semibold text-gray-900 border-b pb-2"
                            >
                                Media
                            </h3>

                            <div>
                                <label
                                    for="bannerUrl"
                                    class="block text-sm font-semibold text-gray-700 mb-2"
                                >
                                    Banner Image URL
                                </label>
                                <div class="flex gap-4 items-start">
                                    <div class="flex-1">
                                        <input
                                            type="url"
                                            id="bannerUrl"
                                            bind:value={bannerUrl}
                                            placeholder="https://example.com/image.jpg"
                                            class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                                        />
                                        <p class="text-xs text-gray-500 mt-2">
                                            Paste a direct link to an image to
                                            be displayed on the event card.
                                        </p>
                                    </div>
                                    {#if bannerUrl}
                                        <div
                                            class="w-24 h-24 rounded-lg border border-gray-200 overflow-hidden bg-gray-50 shrink-0"
                                        >
                                            <img
                                                src={bannerUrl}
                                                alt="Preview"
                                                class="w-full h-full object-cover"
                                                onerror={(e) =>
                                                    ((
                                                        e.currentTarget as HTMLImageElement
                                                    ).style.display = "none")}
                                            />
                                        </div>
                                    {/if}
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Submit Button -->
                    <div
                        class="flex items-center gap-4 pt-8 border-t border-gray-100 mt-8"
                    >
                        <button
                            type="submit"
                            disabled={submitting}
                            class="flex-1 sm:flex-none px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-blue-500/30"
                        >
                            {submitting ? "Creating..." : "Create Event"}
                        </button>
                        <a
                            href="/clubs/{clubId}/events"
                            use:route
                            class="px-8 py-3.5 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </a>
                    </div>
                </form>
            </div>
        {/if}
    </div>
</div>
