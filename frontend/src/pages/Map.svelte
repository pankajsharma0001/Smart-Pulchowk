<script lang="ts">
	import {
		MapLibre,
		Marker,
		GeolocateControl,
		FullScreenControl,
		GeoJSONSource,
		FillLayer
	} from 'svelte-maplibre-gl'
	import type { FeatureCollection } from 'geojson'
	import LoadingSpinner from '../components/LoadingSpinner.svelte'

	let nepal = $state<FeatureCollection | null>(null)
	let isLoading = $state(true)
	let error = $state<string | null>(null)

	import('./nepal.json')
		.then((module) => {
			nepal = module.default as FeatureCollection
			isLoading = false
		})
		.catch((err) => {
			error = 'Failed to load map data'
			isLoading = false
			console.error('Error loading GeoJSON:', err)
		})
</script>

<div class="relative w-full h-full min-h-[80vh]">
	{#if isLoading}
		<div
			class="absolute inset-0 flex items-center justify-center bg-white z-10"
		>
			<LoadingSpinner size="lg" text="Loading map data..." />
		</div>
	{:else if error}
		<div
			class="absolute inset-0 flex items-center justify-center bg-gray-50 z-10"
		>
			<div class="text-center p-8">
				<svg
					class="w-16 h-16 text-red-500 mx-auto mb-4"
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
				<p class="text-red-600 font-semibold text-lg">{error}</p>
				<button
					onclick={() => window.location.reload()}
					class="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
				>
					Reload Page
				</button>
			</div>
		</div>
	{/if}

	<MapLibre
		zoom={5}
		center={[85.319319, 27.682102]}
		class="size-150 mx-auto"
		style="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
	>
		{#if nepal}
			<GeoJSONSource data={nepal} maxzoom={22}>
				<FillLayer
					paint={{
						'fill-color': '#fff',
						'fill-opacity': 1,
						'fill-outline-color': '#333'
					}}
				/>
			</GeoJSONSource>
		{/if}

		<Marker lnglat={[85.319319, 27.682102]} />

		<GeolocateControl
			position="top-right"
			positionOptions={{ enableHighAccuracy: true }}
			trackUserLocation={true}
			showAccuracyCircle={true}
			fitBoundsOptions={{ zoom: 18 }}
		/>

		<FullScreenControl position="top-right" />
	</MapLibre>
</div>
