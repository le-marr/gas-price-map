<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <h2>Settings</h2>

      <div class="setting-item">
        <label for="language-select">Language:</label>
        <select id="language-select" :value="locale" @change="onLocaleChange">
          <option value="fr">Français</option>
          <option value="en">English</option>
        </select>
      </div>

      <div class="setting-item">
        <label>Theme:</label>
        <button @click="toggleTheme">{{ t('theme.' + theme) }}</button>
      </div>

      <div class="setting-item">
        <label for="fuel-type-select">Preferred Fuel Type:</label>
        <select id="fuel-type-select" :value="fuelType" @change="onFuelTypeChange">
          <option value="prixRegulier">{{ t('fuelType.regular') }}</option>
          <option value="prixSuper">{{ t('fuelType.super') }}</option>
          <option value="prixDiesel">{{ t('fuelType.diesel') }}</option>
        </select>
      </div>

      <div class="setting-item">
        <label for="radius-select">Search Radius:</label>
        <select id="radius-select" :value="radius" @change="onRadiusChange">
          <option value="2">2 km</option>
          <option value="5">5 km</option>
          <option value="10">10 km</option>
        </select>
      </div>

      <div class="setting-item">
        <label>Total Stations:</label>
        <span>{{ metadata.totalStations || '...' }}</span>
      </div>

      <div class="setting-item">
        <label>Last Updated:</label>
        <span>{{ metadata.updatedAt }}</span>
      </div>

      <button class="ok-button" @click="$emit('close')">OK</button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { localeService } from '../services/LocaleService';
import { themeService } from '../services/ThemeService';
import { FuelType } from '../types';
import { FuelMetadata } from '../services/DataService';

export default defineComponent({
  name: 'SettingsModal',
  props: {
    fuelType: { type: String as PropType<FuelType>, required: true },
    radius: { type: Number, required: true },
    metadata: { type: Object as PropType<FuelMetadata>, required: true },
  },
  emits: ['close', 'update:fuelType', 'update:radius'],
  setup(props, { emit }) {
    const { locale, t, setLocale } = localeService;
    const { theme, toggleTheme } = themeService;

    const onLocaleChange = (event: Event) => {
      const newLocale = (event.target as HTMLSelectElement).value;
      if (newLocale === 'fr' || newLocale === 'en') {
        setLocale(newLocale);
      }
    };

    const onFuelTypeChange = (event: Event) => {
      emit('update:fuelType', (event.target as HTMLSelectElement).value);
    };

    const onRadiusChange = (event: Event) => {
      emit('update:radius', parseInt((event.target as HTMLSelectElement).value, 10));
    };

    return {
      locale,
      t,
      onLocaleChange,
      theme,
      toggleTheme,
      onFuelTypeChange,
      onRadiusChange,
    };
  },
});
</script>

<style scoped>
/* Styles remain the same */
.modal-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.6); display: flex; justify-content: center; align-items: center; z-index: 2000; }
.modal-content { background-color: #fff; padding: 30px; border-radius: 10px; box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3); width: 90%; max-width: 400px; display: flex; flex-direction: column; gap: 20px; }
body.dark .modal-content { background-color: #333; color: #fff; }
h2 { margin-top: 0; text-align: center; }
body.dark h2 { color: #eee; }
.setting-item { display: flex; justify-content: space-between; align-items: center; padding-bottom: 10px; border-bottom: 1px solid #eee; }
body.dark .setting-item { border-bottom: 1px solid #555; }
.setting-item:last-of-type { border-bottom: none; }
.setting-item label { font-weight: bold; flex-shrink: 0; margin-right: 15px; }
.setting-item select, .setting-item button { padding: 8px 12px; border-radius: 5px; border: 1px solid #ccc; background-color: #f9f9f9; cursor: pointer; font-size: 14px; flex-grow: 1; text-align: right; }
body.dark .setting-item select, body.dark .setting-item button { background-color: #444; border-color: #666; color: #fff; }
.ok-button { margin-top: 20px; padding: 12px 20px; background-color: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px; align-self: center; width: 100%; max-width: 150px; }
.ok-button:hover { background-color: #0056b3; }
</style>
