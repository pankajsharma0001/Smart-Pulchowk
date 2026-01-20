<script lang="ts">
  interface Props {
    size?: "sm" | "md" | "lg";
    text?: string;
  }

  let { size = "md", text = "" }: Props = $props();

  const sizes: Record<"sm" | "md" | "lg", string> = {
    sm: "w-6 h-6 border-2",
    md: "w-10 h-10 border-3",
    lg: "w-16 h-16 border-4",
  };
</script>

<div class="flex flex-col items-center justify-center gap-4 p-8">
  <div
    class="{sizes[
      size
    ]} border-blue-200 border-t-blue-600 rounded-full animate-spin"
  ></div>
  {#if text}
    <p class="text-gray-600 font-medium animate-pulse">{text}</p>
  {/if}
</div>
