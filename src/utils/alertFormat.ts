export interface AlertMetricMeta {
  label: string;
  unit: string;
}

export const ALERT_METRIC_META: Record<string, AlertMetricMeta> = {
  dissolvedoxygen: { label: 'Oxy hòa tan (DO)', unit: 'mg/L' },
  do: { label: 'Oxy hòa tan (DO)', unit: 'mg/L' },
  ph: { label: 'Độ pH nước ao', unit: '' },
  temperature: { label: 'Nhiệt độ nước', unit: '°C' },
  temp: { label: 'Nhiệt độ nước', unit: '°C' },
  salinity: { label: 'Độ mặn', unit: 'ppt' },
  turbidity: { label: 'Độ đục', unit: 'NTU' },
  waterlevel: { label: 'Mực nước', unit: 'm' },
  nh3: { label: 'Khí độc NH3', unit: 'mg/L' },
  no2: { label: 'Khí độc NO2', unit: 'mg/L' },
};

export function formatAlertTitle(
  metricName?: string | null,
  triggeredValue?: number | null
): string {
  const key = (metricName || '').trim().toLowerCase();
  if (key === 'device_status' || key === 'device_offline') {
    return 'Mất kết nối trạm cảm biến';
  }
  const meta = ALERT_METRIC_META[key];
  const label = meta?.label || metricName || 'Cảnh báo ao nuôi';
  if (triggeredValue === null || triggeredValue === undefined || isNaN(Number(triggeredValue))) {
    return label;
  }
  const formattedVal = String(Number(triggeredValue)).replace('.', ',');
  return meta?.unit ? `${label}: ${formattedVal} ${meta.unit}` : `${label}: ${formattedVal}`;
}

export function formatAlertMessage(msg?: string | null): string {
  if (!msg) return '';
  return msg
    .replace(/\bdissolvedOxygen\b/gi, 'Oxy hòa tan (DO)')
    .replace(/\btemperature\b/gi, 'Nhiệt độ')
    .replace(/\bsalinity\b/gi, 'Độ mặn')
    .replace(/\bturbidity\b/gi, 'Độ đục')
    .replace(/\bwaterLevel\b/gi, 'Mực nước')
    .replace(/\bdevice_status\b/gi, 'Trạng thái trạm cảm biến')
    .replace(/\bnh3\b/gi, 'NH3')
    .replace(/\bno2\b/gi, 'NO2');
}
