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
	import NepalData from './nepal.json'

	const nepal = NepalData as FeatureCollection
</script>

<MapLibre
	zoom={16}
	center={[85.319319, 27.682102]}
	class="size-150 mx-auto"
	style="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
>
	<GeoJSONSource data={nepal} maxzoom={22}>
		<FillLayer
			paint={{
				'fill-color': '#fff',
				'fill-opacity': 1,
				'fill-outline-color': '#333'
			}}
		/>
	</GeoJSONSource>

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
