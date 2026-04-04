<template>
  <div id="app-container">
    <MapView
      v-if="fuelData"
      ref="mapViewRef"
      :stations="fuelData.stations"
      :fuel-type="fuelType"
      :radius="radius"
      :display-mode="displayMode"
      @location-found="hasLocation = $event"
    />

    <ControlPanel
      v-if="fuelData"
      v-model:display-mode="displayMode"
      :has-location="hasLocation"
      @open-settings="isSettingsOpen = true"
      @recenter="recenterMap"
    />

    <SettingsModal
      v-if="isSettingsOpen"
      v-model:fuel-type="fuelType"
      v-model:radius="radius"
      :metadata="fuelData.metadata"
      @close="isSettingsOpen = false"
    />

    <div v-if="isLoading" class="loading-overlay">
      <p>{{ t('loading') }}</p>
    </div>
    <div v-if="error" class="error-overlay">
      <p>{{ t('error') }}: {{ error }}</p>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref, watch } from 'vue';
import { dataServiceFacade } from './services/DataServiceFacade';
import { FuelData } from './services/DataService';
import MapView from './components/MapView.vue';
import ControlPanel from './components/ControlPanel.vue';
import SettingsModal from './components/SettingsModal.vue';
import { localeService } from './services/LocaleService';
import { FuelType, DisplayMode } from './types';

const getStoredValue = <T>(key: string, defaultValue: T): T => {
  const stored = localStorage.getItem(key);
  if (stored === null) return defaultValue;
  try {
    const parsedValue = JSON.parse(stored);
    if (key === 'fuelType' && !['prixRegulier', 'prixSuper', 'prixDiesel'].includes(parsedValue)) return defaultValue;
    if (key === 'radius' && ![2, 5, 10].includes(parsedValue)) return defaultValue;
    if (key === 'displayMode' && !['LOW', 'LOW_MED', 'ALL'].includes(parsedValue)) return defaultValue;
    return parsedValue;
  } catch (e) {
    return defaultValue;
  }
};

export default defineComponent({
  name: 'App',
  components: {
    MapView,
    ControlPanel,
    SettingsModal,
  },
  setup() {
    const fuelData = ref<FuelData | null>(null);
    const isLoading = ref(true);
    const error = ref<string | null>(null);
    const { t } = localeService;

    const isSettingsOpen = ref(false);
    const hasLocation = ref(false);
    const mapViewRef = ref<InstanceType<typeof MapView> | null>(null);

    const fuelType = ref<FuelType>(getStoredValue('fuelType', 'prixRegulier'));
    const radius = ref<number>(getStoredValue('radius', 5));
    const displayMode = ref<DisplayMode>(getStoredValue('displayMode', 'ALL'));

    watch(fuelType, (newValue) => localStorage.setItem('fuelType', JSON.stringify(newValue)));
    watch(radius, (newValue) => localStorage.setItem('radius', JSON.stringify(newValue)));
    watch(displayMode, (newValue) => localStorage.setItem('displayMode', JSON.stringify(newValue)));

    const recenterMap = () => {
      mapViewRef.value?.recenterMap();
    };

    onMounted(async () => {
      try {
        isLoading.value = true;
        // Updated call to use the new signature
        const service = dataServiceFacade.getService(true, 'json');
        // const service = dataServiceFacade.getService(true, "excel");
        fuelData.value = await service.getFuelData();
      } catch (e: any) {
        error.value = e.message || 'Произошла неизвестная ошибка';
      } finally {
        isLoading.value = false;
      }
    });

    return {
      fuelData,
      isLoading,
      error,
      t,
      isSettingsOpen,
      hasLocation,
      mapViewRef,
      fuelType,
      radius,
      displayMode,
      recenterMap,
    };
  },
});
</script>

<style scoped>
#app-container { position: relative; height: 100%; width: 100%; }
.loading-overlay, .error-overlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(0, 0, 0, 0.7); color: white; display: flex; justify-content: center; align-items: center; z-index: 1000; }
.error-overlay { background-color: rgba(189, 33, 33, 0.8); }
</style>
