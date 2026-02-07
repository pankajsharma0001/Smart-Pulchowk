<script lang="ts">
  interface Props {
    size?: "sm" | "md" | "lg" | "xl";
    color?: "blue" | "white" | "gray";
    text?: string;
  }

  let { size = "md", color = "blue", text = "" }: Props = $props();

  const sizes: Record<"sm" | "md" | "lg" | "xl", string> = {
    sm: "w-4 h-4 border-2",
    md: "w-7 h-7 border-2",
    lg: "w-10 h-10 border-3",
    xl: "w-14 h-14 border-4",
  };

  const colors: Record<"blue" | "white" | "gray", string> = {
    blue: "border-blue-200 border-t-blue-600",
    white: "border-white/30 border-t-white",
    gray: "border-gray-200 border-t-gray-600",
  };
</script>

<div class="flex flex-col items-center justify-center gap-2 p-4">
  <div class="{sizes[size]} {colors[color]} rounded-full animate-spin"></div>
  {#if text}
    <p class="text-sm text-gray-600 font-medium animate-pulse">{text}</p>
  {/if}
</div>
