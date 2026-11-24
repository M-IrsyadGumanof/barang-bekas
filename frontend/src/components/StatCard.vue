<template>
  <div class="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition">
    <div class="flex items-center justify-between">
      <span class="text-xs font-medium text-slate-500 uppercase tracking-wider">{{ title }}</span>
      <div 
        class="w-9 h-9 rounded-lg flex items-center justify-center"
        :class="colorClass"
      >
        <component :is="icon" class="w-5 h-5" />
      </div>
    </div>
    <div class="mt-3">
      <div class="text-2xl font-bold text-slate-800">{{ value }}</div>
      <p v-if="subtitle" class="text-xs text-slate-500 mt-1">{{ subtitle }}</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  title: String,
  value: [String, Number],
  subtitle: String,
  icon: Object,
  color: {
    type: String,
    default: 'emerald' // emerald, blue, amber, purple, rose
  }
});

const colorClass = computed(() => {
  switch (props.color) {
    case 'blue': return 'bg-blue-50 text-blue-600';
    case 'amber': return 'bg-amber-50 text-amber-600';
    case 'purple': return 'bg-purple-50 text-purple-600';
    case 'rose': return 'bg-rose-50 text-rose-600';
    default: return 'bg-emerald-50 text-emerald-600';
  }
});
</script>

