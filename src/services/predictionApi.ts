import { apiClient, unwrapApiResponse } from './apiClient';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface WaterQualityCurrentMetrics {
  currentDO: number | null;
  currentPH: number | null;
  currentTemp: number | null;
  salinity: number | null;
  turbidity: number | null;
  recordedAt: string | null;
}

export interface WaterQualityForecastSummary {
  minDO: number;
  maxDO: number;
  avgDO: number;
  minPH: number;
  maxPH: number;
  minTemperature: number;
  maxTemperature: number;
  peakRiskScore: number;
  peakRiskOffsetHours: number;
  peakRiskTime: string;
}

export interface WaterQualityForecastPoint {
  offsetHours: number;
  predictedTime: string;
  predictedDO: number;
  predictedPH: number;
  predictedTemperature: number;
  riskScore: number;
  riskLevel: RiskLevel;
}

export interface WaterQualityForecastResponse {
  predictionId: string;
  pondId: string;
  predictionType: string;
  generatedAt: string;
  predictedTime: string;
  horizonHours: number;
  stepHours: number;
  cached: boolean;
  isFallback: boolean;
  predictionSource: string;
  riskScore: number;
  riskLevel: RiskLevel;
  currentMetrics: WaterQualityCurrentMetrics;
  summary: WaterQualityForecastSummary;
  series: WaterQualityForecastPoint[];
  factors: string[];
  recommendations: string[];
}

export interface DiseaseRiskItem {
  diseaseCode: string;
  diseaseName: string;
  riskScore: number;
  riskLevel: RiskLevel;
  indicators: string[];
  recommendations: string[];
}

export interface DiseaseRiskInputSnapshot {
  currentDO: number | null;
  currentPH: number | null;
  currentTemp: number | null;
  salinity: number | null;
  turbidity: number | null;
  nh3: number | null;
  no2: number | null;
  temperatureDelta24h: number | null;
  phDelta24h: number | null;
  minDO24h: number | null;
  minTemp24h: number | null;
  maxTemp24h: number | null;
  daysOfCulture: number | null;
  shrimpSpecies: string | null;
  shrimpDensity: number | null;
}

export interface DiseaseRiskResponse {
  predictionId: string;
  pondId: string;
  predictionType: string;
  assessedAt: string;
  validUntil: string;
  cached: boolean;
  isFallback: boolean;
  predictionSource: string;
  overallRiskScore: number;
  overallRiskLevel: RiskLevel;
  diseases: DiseaseRiskItem[];
  inputSnapshot: DiseaseRiskInputSnapshot;
  recommendations: string[];
}

export const predictionApi = {
  getWaterQualityForecast: async (
    pondId: string,
    opts?: { horizonHours?: number; stepHours?: number; refresh?: boolean }
  ): Promise<WaterQualityForecastResponse> => {
    const response = await apiClient.get<any>(`/predictions/ponds/${pondId}/water-quality`, {
      params: {
        horizonHours: opts?.horizonHours ?? 24,
        stepHours: opts?.stepHours ?? 2,
        refresh: opts?.refresh ?? false,
      },
    });
    return unwrapApiResponse<WaterQualityForecastResponse>(response.data);
  },

  getDiseaseRisk: async (
    pondId: string,
    opts?: { refresh?: boolean }
  ): Promise<DiseaseRiskResponse> => {
    const response = await apiClient.get<any>(`/predictions/ponds/${pondId}/disease-risk`, {
      params: {
        refresh: opts?.refresh ?? false,
      },
    });
    return unwrapApiResponse<DiseaseRiskResponse>(response.data);
  },
};
