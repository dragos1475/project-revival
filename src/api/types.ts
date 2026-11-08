// Response shapes of the LifeWatch FastAPI service and of the LTSER contract (docs/API_CONTRACT.md).

export type StationKind = "meteorological" | "eddy-covariance" | null;

export interface LwStation {
  id: number;
  name: string;
  kind: StationKind;
  has_ch4: boolean | null;
}
export interface LwVariableEntry {
  name: string;
  label: string;
  units: string;
  description: string;
}
export interface LwStationInfo extends LwStation {
  location: { latitude: number; longitude: number };
  variables: LwVariableEntry[];
}
export interface LwVariable {
  id: string;
  name: string;
  kind: Exclude<StationKind, null>;
  units: string;
  description: string;
}
export interface LwMeasurementsBody {
  variables: string[];
  timestamps: Record<string, string[]>;
  measurements: Record<string, (number | null)[]>;
}
export interface LwSnapshot {
  stations: { id: number; name: string; location: { latitude: number; longitude: number }; count: number }[];
}
export interface LwMeasurementsQuery {
  variables?: string[];
  since?: string;
  until?: string;
}
/** Normalised measurements: instants in ms, NaN for missing values. */
export interface Series {
  t: Float64Array;
  v: Float64Array;
}
export interface Measurements {
  variables: string[];
  series: Record<string, Series>;
}

export interface RsIndicatorDates {
  id: string;
  dates: string[];
}
export interface RsGridBody {
  indicator: string;
  date: string;
  west: number;
  south: number;
  east: number;
  north: number;
  width: number;
  height: number;
  values?: (number | null)[];
  values_b64?: string;
}
export interface Grid {
  indicator: string;
  date: string;
  west: number;
  south: number;
  east: number;
  north: number;
  width: number;
  height: number;
  dx: number;
  dy: number;
  values: Float32Array;
  domain: [number, number] | null;
}
export interface RsPoint {
  indicator: string;
  lon: number;
  lat: number;
  series: { date: string; value: number | null }[];
}
export interface IdValue {
  id: string;
  value: number | null;
}
export interface DateValue {
  date: string;
  value: number | null;
}
export interface TimeRange {
  min: string;
  max: string;
  latest: string;
}
export interface MeteoRow {
  time: string;
  variable: string;
  value: number | null;
}
export interface TimeValue {
  time: string;
  value: number | null;
}
export interface UatValue {
  uat: string;
  value: number | null;
}
export interface YearValue {
  year: number;
  value: number | null;
}
export interface SocialParams {
  year?: number;
  sex?: number;
  age?: number;
  uat?: string;
}
