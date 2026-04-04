<template>
  <div class="control-panel">
    <button class="control-button" @click="$emit('recenter')" title="Recenter on my location">
      <i class="fas" :class="hasLocation ? 'fa-location-crosshairs' : 'fa-crosshairs'"></i>
    </button>
    <button class="control-button" @click="$emit('open-settings')" title="Settings">
      <i class="fas fa-gear"></i>
    </button>
    <button class="control-button filter-button" @click="cycleDisplayMode" title="Cycle display mode">
      <i class="fas fa-filter"></i>
      <span>{{ displayModeText }}</span>
    </button>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from 'vue';
import { localeService } from '../services/LocaleService';
import { DisplayMode } from '../types';

export default defineComponent({
  name: 'ControlPanel',
  props: {
    displayMode: {
      type: String as PropType<DisplayMode>,
      required: true,
    },
    hasLocation: {
      type: Boolean,
      required: true,
    },
  },
  emits: ['update:displayMode', 'open-settings', 'recenter'],
  setup(props, { emit }) {
    const { t } = localeService;

    const displayModeText = computed(() => {
      switch (props.displayMode) {
        case 'LOW': return 'LOW';
        case 'LOW_MED': return 'LOW/MED';
        case 'ALL': return 'ALL';
        default: return 'ALL';
      }
    });

    const cycleDisplayMode = () => {
      let nextMode: DisplayMode;
      if (props.displayMode === 'ALL') nextMode = 'LOW';
      else if (props.displayMode === 'LOW') nextMode = 'LOW_MED';
      else nextMode = 'ALL';
      emit('update:displayMode', nextMode);
    };

    return {
      t,
      displayModeText,
      cycleDisplayMode,
    };
  },
});
</script>

<style scoped>
.control-panel {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 10px;
  z-index: 1000;
}

.control-button {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px;
  width: 50px;
  height: 50px;
  font-size: 20px;
  background-color: rgba(255, 255, 255, 0.9);
  border: 1px solid #ccc;
  border-radius: 50%;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.2s;
}

.control-button.filter-button {
  width: auto;
  padding: 10px 20px;
  border-radius: 25px;
  gap: 8px;
  font-size: 16px;
  font-weight: bold;
}

.control-button:hover {
  background-color: #fff;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

body.dark .control-button {
  background-color: rgba(40, 40, 40, 0.9);
  color: #fff;
  border-color: #555;
}

body.dark .control-button:hover {
  background-color: rgba(50, 50, 50, 1);
}
</style>
