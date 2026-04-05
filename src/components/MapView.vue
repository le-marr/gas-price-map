<template>
  <div id="map-wrap"></div>
</template>

<script lang="ts" setup>
import { onMounted, ref, watch, computed } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';
import '@fortawesome/fontawesome-free/css/all.css';

// Fix for default Leaflet icons with Vite and base path
// This prevents Leaflet from trying to guess the icon URL based on its CSS,
// which often leads to incorrect paths with bundlers and custom base paths.
delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).href,
  iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url).href,
  shadowUrl: new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).href,
});


import { Station } from '../services/DataService';
import { iconService } from '../services/IconService';
import { FuelType, DisplayMode } from '../types';

type PriceCategory = 'low' | 'medium' | 'high' | 'none';

// --- Props and Emits ---
const props = defineProps<{
  stations: Station[],
  fuelType: FuelType,
  radius: number,
  displayMode: DisplayMode,
}>();

const emit = defineEmits(['location-found']);

// --- Map and Layers ---
let map: L.Map;
const userLocation = ref<L.LatLng | null>(null);
const markersLayer = L.markerClusterGroup({
  showCoverageOnHover: true,
  spiderfyOnMaxZoom: true,
  maxClusterRadius: (zoom: number) => {
    if (zoom >= 13) return 8;
    if (zoom >= 4) return 80;
    return 120;
  },
});

// --- Utility Functions ---
const getQuantiles = (prices: number[]): { q1: number, q3: number } => {
  if (prices.length === 0) return { q1: 0, q3: 0 };
  const sorted = [...prices].sort((a, b) => a - b);
  const q1Index = Math.floor(sorted.length * 0.25);
  const q3Index = Math.floor(sorted.length * 0.75);
  return { q1: sorted[q1Index], q3: sorted[q3Index] };
};

// --- Computed Properties for Filtering ---
const stationDataWithCategory = computed(() => {
  let baseStations = props.stations.filter(s => s[props.fuelType] !== null);
  if (userLocation.value) {
    baseStations = baseStations.filter(s => {
      const stationLatLng = L.latLng(s.latitude, s.longitude);
      return userLocation.value!.distanceTo(stationLatLng) <= props.radius * 1000;
    });
  }
  const prices = baseStations.map(s => s[props.fuelType]!).filter(p => p !== null);
  const { q1, q3 } = getQuantiles(prices);
  return baseStations.map(station => {
    const price = station[props.fuelType];
    let category: PriceCategory = 'none';
    if (price !== null) {
      if (price <= q1) category = 'low';
      else if (price > q1 && price <= q3) category = 'medium';
      else category = 'high';
    }
    return { ...station, category };
  });
});

const filteredStations = computed(() => {
  if (props.displayMode === 'ALL') return stationDataWithCategory.value;
  if (props.displayMode === 'LOW_MED') return stationDataWithCategory.value.filter(s => s.category === 'low' || s.category === 'medium');
  if (props.displayMode === 'LOW') return stationDataWithCategory.value.filter(s => s.category === 'low');
  return [];
});

// --- Marker and Popup Creation ---
const createMarkerIcon = (station: { category: PriceCategory } & Station) => {
  const iconUrl = iconService.getIcon(station.banniere);
  const price = station[props.fuelType];
  const priceText = price ? Math.round(price) : 'N/A';
  return L.divIcon({
    className: `custom-div-icon price-${station.category}`,
    html: `<div class="marker-pin"><img src="${iconUrl}" alt="${station.banniere}" /><div class="price-badge">${priceText}</div></div>`,
    iconSize: [40, 55],
    iconAnchor: [20, 55],
  });
};

const updateMarkers = () => {
  markersLayer.clearLayers();
  filteredStations.value.forEach(station => {
    const marker = L.marker([station.latitude, station.longitude], {
      icon: createMarkerIcon(station),
    });
    const popupEl = document.createElement('div');
    popupEl.className = 'station-popup';
    popupEl.innerHTML = `
      <div class="popup-header"><b>${station.banniere}</b><i>${station.nom}</i></div>
      <div class="popup-address">${station.adresse}<button class="copy-btn" title="Copy Address"><i class="fas fa-copy"></i></button></div>
      <div class="popup-price"><b>${props.fuelType}:</b> ${station[props.fuelType]}¢</div>
      <button class="navigate-btn"><i class="fas fa-location-arrow"></i> Navigate</button>
    `;
    marker.bindPopup(popupEl);
    marker.on('popupopen', () => {
      const copyBtn = popupEl.querySelector('.copy-btn');
      const navigateBtn = popupEl.querySelector('.navigate-btn');
      L.DomEvent.on(copyBtn as HTMLElement, 'click', () => {
        navigator.clipboard.writeText(station.adresse).then(() => {
          copyBtn!.innerHTML = '<i class="fas fa-check"></i>';
          setTimeout(() => { copyBtn!.innerHTML = '<i class="fas fa-copy"></i>'; }, 1500);
        });
      });
      L.DomEvent.on(navigateBtn as HTMLElement, 'click', () => {
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${station.latitude},${station.longitude}`, '_blank');
      });
    });
    markersLayer.addLayer(marker);
  });
};

watch(filteredStations, updateMarkers);

// --- Exposed Methods ---
const recenterMap = () => {
  if (userLocation.value) {
    map.setView(userLocation.value, 13);
  } else if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        userLocation.value = L.latLng(position.coords.latitude, position.coords.longitude);
        map.setView(userLocation.value, 13);
        L.marker(userLocation.value).addTo(map).bindPopup('You are here');
        emit('location-found', true);
      },
      () => {
        alert('Location permission is denied. Please enable it in your browser settings.');
        emit('location-found', false);
      }
    );
  }
};

defineExpose({ recenterMap });

// --- Lifecycle Hooks ---
onMounted(() => {
  map = L.map('map-wrap').setView([46.8139, -71.2080], 9);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);
  map.addLayer(markersLayer);

  map.on('zoomend', () => console.log('Current Zoom Level:', map.getZoom()));

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        userLocation.value = L.latLng(position.coords.latitude, position.coords.longitude);
        map.setView(userLocation.value, 13);
        // The default Leaflet marker is used here, which is now correctly configured
        L.marker(userLocation.value).addTo(map).bindPopup('You are here');
        emit('location-found', true);
      },
      () => {
        console.warn('Could not get geolocation.');
        emit('location-found', false);
      }
    );
  } else {
    emit('location-found', false);
  }
  updateMarkers();
});
</script>

<style scoped>
#map-wrap { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 1; }
</style>

<style>
/* Global icon styles */
.custom-div-icon { background: none; border: none; }
.marker-pin { position: relative; width: 40px; height: 55px; display: flex; flex-direction: column; align-items: center; }
.marker-pin img { width: 40px; height: 40px; border-radius: 50%; border: 2px solid #fff; box-shadow: 0 2px 5px rgba(0,0,0,0.3); transition: border-color 0.3s; }
.price-badge { background-color: rgba(0, 0, 0, 0.7); color: white; padding: 2px 6px; border-radius: 10px; font-size: 12px; font-weight: bold; position: absolute; bottom: 0; transform: translateX(50%); right: 50%; border: 1px solid white; transition: background-color 0.3s; }

/* Color coding */
.price-low .price-badge { background-color: #1a9850; }
.price-medium .price-badge { background-color: #fec107; }
.price-high .price-badge { background-color: #d73027; }
.price-none .price-badge { background-color: #888; }
.price-low .marker-pin img { border-color: #1a9850; }
.price-medium .marker-pin img { border-color: #fec107; }
.price-high .marker-pin img { border-color: #d73027; }

/* Popup styles */
.station-popup { display: flex; flex-direction: column; gap: 8px; }
.popup-header { display: flex; flex-direction: column; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
.popup-header b { font-size: 16px; }
.popup-header i { font-size: 12px; color: #555; }
.popup-address { display: flex; align-items: center; justify-content: space-between; }
.copy-btn { background: none; border: none; cursor: pointer; color: #007bff; font-size: 14px; padding: 0 5px; }
.copy-btn:hover { color: #0056b3; }
.navigate-btn { background-color: #007bff; color: white; border: none; border-radius: 5px; padding: 8px 12px; cursor: pointer; text-align: center; }
.navigate-btn:hover { background-color: #0056b3; }
.navigate-btn i { margin-right: 5px; }
</style>
