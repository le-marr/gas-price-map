// This file tells TypeScript how to handle imports of various asset types.

declare module '*.xlsx' {
  const src: string;
  export default src;
}

declare module '*.geojson.gz' {
  const src: string;
  export default src;
}
