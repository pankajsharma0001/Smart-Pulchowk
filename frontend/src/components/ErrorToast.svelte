<script lang="ts">
  import type { Snippet } from "svelte";

  let {
    show = $bindable(false),
    title = "Error",
    children,
  }: {
    show: boolean;
    title?: string;
    children: Snippet;
  } = $props();
</script>

{#if show}
  <div
    class="fixed top-24 right-4 z-50 animate-in fade-in slide-in-from-right-8 duration-300 max-w-md w-full"
  >
    <div
      class="bg-white border-l-4 border-red-500 rounded-r-lg shadow-xl p-4 flex items-start gap-3"
    >
      <div class="p-1 bg-red-50 rounded-full text-red-500 shrink-0">
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
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          ></path>
        </svg>
      </div>
      <div class="flex-1">
        <h3 class="text-sm font-semibold text-gray-900">
          {title}
        </h3>
        <div class="text-sm text-gray-600 mt-1">
          {@render children()}
        </div>
      </div>
      <button
        aria-label="Close error message"
        onclick={() => (show = false)}
        class="text-gray-400 hover:text-gray-600 transition-colors"
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
            d="M6 18L18 6M6 6l12 12"
          ></path>
        </svg>
      </button>
    </div>
  </div>
{/if}
