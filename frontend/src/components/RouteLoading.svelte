<script lang="ts">
	import LoadingSpinner from './LoadingSpinner.svelte'
</script>

<div
	class="min-h-[60vh] flex items-center justify-center bg-linear-to-br from-gray-50 via-white to-gray-50"
>
	<div class="text-center">
		<LoadingSpinner size="lg" text="Loading page..." />
	</div>
</div>
