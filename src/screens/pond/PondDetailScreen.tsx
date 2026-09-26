import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { SensorCard } from '../../components/pond/SensorCard';
import {
  resolveDoAlert,
  toggleAeratorActivation,
  pingSensor,
  pingHardware,
  acknowledgeHardware,
  setDiagnosticStatus,
} from '../../store/slices/pondSlice';

export const PondDetailScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();

  const {
    ponds,
    selectedPondId,
    pondASensors,
    doAlertResolved,
    aeratorActivated,
    sensorPingSuccess,
    hardwarePingSuccess,
    hardwareAcknowledged,
    diagnosticStatus,
  } = useAppSelector((state) => state.pond);

  const selectedPond =
    ponds.find((p) => p.id === selectedPondId) || ponds[0];

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 800);
  };

  const handleRunDiagnostic = () => {
    dispatch(setDiagnosticStatus('running'));
    setTimeout(() => {
      dispatch(setDiagnosticStatus('passed'));
      setTimeout(() => {
        dispatch(setDiagnosticStatus('idle'));
      }, 2500);
    }, 1500);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primaryContainer} />

      {/* Top Header */}
      <View style={styles.topHeader}>
        <View style={styles.topHeaderLeft}>
          <TouchableOpacity
            style={styles.iconBtn}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Overview')}
          >
            <MaterialIcons name="arrow-back" size={24} color={colors.onPrimary} />
          </TouchableOpacity>
          <View style={styles.logoTitleRow}>
            <MaterialCommunityIcons name="waves" size={24} color={colors.secondaryFixedDim} />
            <Text style={styles.headerTitle} numberOfLines={1}>
              Pond Detail Telemetry
            </Text>
          </View>
        </View>

        <View style={styles.topHeaderRight}>
          <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7}>
            <MaterialIcons name="tune" size={22} color={colors.onPrimary} />
          </TouchableOpacity>
          <View style={styles.profileAvatar}>
            <MaterialIcons name="person" size={18} color={colors.onPrimary} />
          </View>
        </View>
      </View>

      {/* Main Content ScrollView */}
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Context / Identification Block */}
        <View style={styles.contextCard}>
          <View style={styles.contextTopRow}>
            <View style={styles.pondTitleGroup}>
              <View style={styles.pondNameRow}>
                <Text style={styles.pondTitle}>
                  {selectedPond.nameVi} ({selectedPond.nameEn})
                </Text>
                <View style={styles.activeBadge}>
                  <View style={styles.activeDot} />
                  <Text style={styles.activeBadgeText}>{selectedPond.status}</Text>
                </View>
              </View>
              <View style={styles.locationRow}>
                <MaterialIcons name="navigation" size={14} color={colors.secondary} />
                <Text style={styles.locationText}>
                  {selectedPond.cluster} • {selectedPond.zone}
                </Text>
              </View>
            </View>

            <View style={styles.contextActions}>
              <TouchableOpacity
                style={[styles.smallActionBtn, isRefreshing && styles.rotating]}
                activeOpacity={0.7}
                onPress={handleRefresh}
              >
                <MaterialIcons name="sync" size={18} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.smallActionBtn} activeOpacity={0.7}>
                <MaterialIcons name="more-vert" size={18} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Health summary strip */}
          <View style={styles.healthStrip}>
            <View style={styles.healthStripLeft}>
              <View style={styles.sensorIconBox}>
                <MaterialIcons name="sensors" size={16} color={colors.primary} />
              </View>
              <View>
                <Text style={styles.healthStripLabel}>Gateway Stream</Text>
                <Text style={styles.healthStripVal}>{selectedPond.gatewayStreamStatus}</Text>
              </View>
            </View>
            <View style={styles.healthStripRight}>
              <View style={styles.linkDot} />
              <Text style={styles.linkQualityText}>{selectedPond.linkQuality}</Text>
            </View>
          </View>
        </View>

        {/* Section Title: Realtime Telemetry */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeaderTitleRow}>
            <MaterialIcons name="show-chart" size={18} color={colors.primary} />
            <Text style={styles.sectionTitle}>PondGuard Telemetry</Text>
          </View>
          <View style={styles.nodesBadge}>
            <Text style={styles.nodesBadgeText}>6 NODES ONLINE</Text>
          </View>
        </View>

        {/* Telemetry Metric Grid (6 Sensor Cards in 2 columns) */}
        <View style={styles.sensorGrid}>
          {pondASensors.map((sensor) => (
            <View key={sensor.id} style={styles.sensorGridCol}>
              <SensorCard sensor={sensor} />
            </View>
          ))}
        </View>

        {/* Dedicated Local Alerts Integration for Pond A */}
        <View style={styles.alertsCard}>
          <View style={styles.alertsHeader}>
            <View style={styles.alertsTitleRow}>
              <MaterialIcons name="warning" size={20} color={colors.error} />
              <Text style={styles.alertsTitle}>Cảnh Báo Cục Bộ {selectedPond.nameVi}</Text>
            </View>
            <View style={styles.alertCountBadge}>
              <Text style={styles.alertCountText}>2 Cảnh Báo Môi Trường</Text>
            </View>
          </View>

          <View style={styles.alertsList}>
            {/* Alert 1: DO Low Breach */}
            <View style={[styles.alertItem, doAlertResolved && styles.resolvedOpacity]}>
              <View style={styles.alertItemHeader}>
                <View style={styles.alertIconBoxRed}>
                  <MaterialIcons name="air" size={18} color={colors.onErrorContainer} />
                </View>
                <View style={styles.alertItemContent}>
                  <View style={styles.alertBadgeRow}>
                    <Text style={styles.alertRedTag}>CẢNH BÁO KHẨN CẤP</Text>
                    <Text style={styles.alertValueHighlight}>DO: 3.8 mg/L</Text>
                  </View>
                  <Text style={styles.alertMainText}>
                    Oxy hòa tan dưới ngưỡng an toàn (DO &lt; 4.0 mg/L)
                  </Text>
                  <Text style={styles.alertSubText}>
                    Phát hiện lúc 15:40 • Xu hướng tiếp tục giảm nhanh
                  </Text>
                </View>
              </View>

              <View style={styles.alertItemActions}>
                <TouchableOpacity
                  style={[
                    styles.resolveBtn,
                    doAlertResolved && styles.resolvedBtnActive,
                  ]}
                  activeOpacity={0.8}
                  onPress={() => dispatch(resolveDoAlert())}
                >
                  <MaterialIcons
                    name={doAlertResolved ? 'check-circle' : 'check-circle-outline'}
                    size={14}
                    color={colors.onError}
                  />
                  <Text style={styles.resolveBtnText}>
                    {doAlertResolved ? 'Đã Xử Lý' : 'Acknowledge & Resolve'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.aeratorBtn,
                    aeratorActivated && styles.aeratorBtnActive,
                  ]}
                  activeOpacity={0.8}
                  onPress={() => dispatch(toggleAeratorActivation())}
                >
                  <Text style={styles.aeratorBtnText}>
                    {aeratorActivated ? 'Quạt nước: ĐÃ BẬT' : 'Kích hoạt sục khí'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Alert 2: Sensor Fault */}
            <View style={styles.alertItem}>
              <View style={styles.alertItemHeader}>
                <View style={styles.alertIconBoxRed}>
                  <MaterialIcons name="sensors-off" size={18} color={colors.onErrorContainer} />
                </View>
                <View style={styles.alertItemContent}>
                  <View style={styles.alertBadgeRow}>
                    <Text style={styles.alertRedTag}>LỖI CẢM BIẾN</Text>
                    <Text style={styles.alertTimeTag}>Mất tín hiệu 12p</Text>
                  </View>
                  <Text style={styles.alertMainText}>
                    Trạm cảm biến Oxy tầng đáy ESP32 #SN-04
                  </Text>
                  <Text style={styles.alertSubText}>
                    Đang tự động chuyển sang trạm dự phòng probe B
                  </Text>
                </View>
              </View>

              <View style={styles.alertItemActions}>
                <TouchableOpacity
                  style={[
                    styles.pingSensorBtn,
                    sensorPingSuccess && styles.pingSuccessBtn,
                  ]}
                  activeOpacity={0.8}
                  onPress={() => dispatch(pingSensor())}
                >
                  <MaterialIcons
                    name={sensorPingSuccess ? 'check' : 'cell-tower'}
                    size={14}
                    color={colors.onPrimary}
                  />
                  <Text style={styles.pingSensorText}>
                    {sensorPingSuccess
                      ? 'ACK Khôi Phục (12ms)'
                      : 'Ping & Khôi phục kết nối'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* Dedicated Hardware Alerts for Pond A */}
        <View style={styles.alertsCard}>
          <View style={styles.alertsHeader}>
            <View style={styles.alertsTitleRow}>
              <MaterialIcons name="warning" size={20} color={colors.error} />
              <Text style={styles.alertsTitle}>Alerts for {selectedPond.nameEn}</Text>
            </View>
            <View style={styles.alertCountBadge}>
              <Text style={styles.alertCountText}>1 Critical Fault</Text>
            </View>
          </View>

          <View style={styles.alertsList}>
            {/* Hardware Fault Item */}
            <View
              style={[
                styles.alertItem,
                hardwareAcknowledged && styles.resolvedOpacity,
              ]}
            >
              <View style={styles.alertItemHeader}>
                <View style={styles.alertIconBoxRed}>
                  <MaterialIcons name="wifi-off" size={18} color={colors.onErrorContainer} />
                </View>
                <View style={styles.alertItemContent}>
                  <View style={styles.alertBadgeRow}>
                    <Text style={styles.alertRedTag}>HARDWARE ALERT</Text>
                    <Text style={styles.alertTimeTag}>Offline 42m</Text>
                  </View>
                  <Text style={styles.alertMainText}>
                    No comms: ShrimpTalk #ST09101
                  </Text>
                  <Text style={styles.alertSubText}>
                    14 May, 24 15:29 • LoRa Ch 4 packet loss
                  </Text>
                </View>
              </View>

              <View style={styles.alertItemActions}>
                <TouchableOpacity
                  style={[
                    styles.pingSensorBtn,
                    hardwarePingSuccess && styles.pingSuccessBtn,
                  ]}
                  activeOpacity={0.8}
                  onPress={() => dispatch(pingHardware())}
                >
                  <MaterialIcons
                    name={hardwarePingSuccess ? 'check' : 'cell-tower'}
                    size={14}
                    color={colors.onPrimary}
                  />
                  <Text style={styles.pingSensorText}>
                    {hardwarePingSuccess
                      ? 'Packet ACK (14ms)'
                      : 'Ping Device'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.ackSecondaryBtn}
                  activeOpacity={0.7}
                  onPress={() => dispatch(acknowledgeHardware())}
                >
                  <Text style={styles.ackSecondaryText}>
                    {hardwareAcknowledged ? 'Acknowledged' : 'Acknowledge'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Info Item: Feeder Status */}
            <View style={styles.infoItem}>
              <View style={styles.infoIconBox}>
                <MaterialIcons name="set-meal" size={18} color={colors.onSecondaryContainer} />
              </View>
              <View style={styles.alertItemContent}>
                <View style={styles.alertBadgeRow}>
                  <Text style={styles.infoGreenTag}>OPERATIONAL INFO</Text>
                  <Text style={styles.infoBatteryText}>92% Battery</Text>
                </View>
                <Text style={styles.alertMainText}>
                  PondMother Feeder #A0D35E
                </Text>
                <Text style={styles.alertSubText}>
                  Dispense Cycle #4 completed • Schedule Active
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Bottom Actions */}
        <View style={styles.bottomActionsCol}>
          <TouchableOpacity
            style={[
              styles.runDiagBtn,
              diagnosticStatus === 'passed' && styles.diagPassedBtn,
            ]}
            activeOpacity={0.9}
            onPress={handleRunDiagnostic}
            disabled={diagnosticStatus === 'running'}
          >
            <MaterialIcons
              name={
                diagnosticStatus === 'passed'
                  ? 'verified'
                  : diagnosticStatus === 'running'
                  ? 'sync'
                  : 'play-circle'
              }
              size={20}
              color={colors.onPrimary}
            />
            <Text style={styles.runDiagText}>
              {diagnosticStatus === 'running'
                ? 'Running Probe Suite...'
                : diagnosticStatus === 'passed'
                ? 'Calibration Passed (6/6)'
                : 'Run Diagnostic Test'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.historyCurvesBtn} activeOpacity={0.8}>
            <MaterialIcons name="trending-up" size={18} color={colors.secondary} />
            <Text style={styles.historyCurvesText}>View Historical Curves</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  topHeader: {
    height: 56,
    backgroundColor: colors.primaryContainer,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  logoTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  headerTitle: {
    ...typography.headlineSm,
    color: colors.onPrimary,
    flex: 1,
  },
  topHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  profileAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 28,
    gap: 12,
  },
  contextCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 12,
    padding: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  contextTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  pondTitleGroup: {
    flex: 1,
  },
  pondNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  pondTitle: {
    ...typography.headlineLg,
    color: colors.onSurface,
    fontWeight: '700',
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.secondaryContainer,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.secondary,
  },
  activeBadgeText: {
    ...typography.labelSm,
    color: colors.onSecondaryContainer,
    fontWeight: '700',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  locationText: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
  },
  contextActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  smallActionBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rotating: {
    opacity: 0.6,
  },
  healthStrip: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 8,
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  healthStripLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  sensorIconBox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: 'rgba(0, 21, 47, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  healthStripLabel: {
    ...typography.labelSm,
    fontSize: 10,
    color: colors.onSurfaceVariant,
    textTransform: 'uppercase',
  },
  healthStripVal: {
    ...typography.bodySm,
    fontWeight: '500',
    color: colors.onSurface,
  },
  healthStripRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  linkDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.secondary,
  },
  linkQualityText: {
    ...typography.labelSm,
    color: colors.secondary,
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  sectionHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    ...typography.headlineSm,
    color: colors.onSurface,
    textTransform: 'uppercase',
  },
  nodesBadge: {
    backgroundColor: colors.surfaceContainer,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  nodesBadgeText: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
  },
  sensorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  sensorGridCol: {
    width: '50%',
    paddingHorizontal: 4,
  },
  alertsCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 12,
    padding: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  alertsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  alertsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  alertsTitle: {
    ...typography.headlineSm,
    color: colors.onSurface,
  },
  alertCountBadge: {
    backgroundColor: colors.errorContainer,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  alertCountText: {
    ...typography.labelSm,
    color: colors.onErrorContainer,
    fontWeight: '600',
  },
  alertsList: {
    gap: 10,
  },
  alertItem: {
    backgroundColor: 'rgba(255, 218, 214, 0.2)',
    borderColor: 'rgba(186, 26, 26, 0.3)',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    gap: 8,
  },
  resolvedOpacity: {
    opacity: 0.6,
  },
  alertItemHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  alertIconBoxRed: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: colors.errorContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  alertItemContent: {
    flex: 1,
  },
  alertBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  alertRedTag: {
    ...typography.labelSm,
    fontSize: 10,
    color: colors.error,
    fontWeight: '700',
  },
  alertValueHighlight: {
    ...typography.labelSm,
    fontSize: 10,
    color: colors.error,
    fontWeight: '700',
  },
  alertTimeTag: {
    ...typography.labelSm,
    fontSize: 10,
    color: colors.onSurfaceVariant,
  },
  alertMainText: {
    ...typography.bodySm,
    fontWeight: '600',
    color: colors.onSurface,
    marginTop: 2,
  },
  alertSubText: {
    ...typography.labelSm,
    fontSize: 11,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  alertItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 4,
  },
  resolveBtn: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    backgroundColor: colors.error,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  resolvedBtnActive: {
    backgroundColor: colors.secondary,
  },
  resolveBtnText: {
    ...typography.labelSm,
    color: colors.onError,
    fontWeight: '600',
  },
  aeratorBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.surfaceContainer,
    borderRadius: 6,
  },
  aeratorBtnActive: {
    backgroundColor: colors.secondaryContainer,
  },
  aeratorBtnText: {
    ...typography.labelSm,
    color: colors.onSurface,
    fontWeight: '600',
  },
  pingSensorBtn: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    backgroundColor: colors.primaryContainer,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  pingSuccessBtn: {
    backgroundColor: colors.secondary,
  },
  pingSensorText: {
    ...typography.labelSm,
    color: colors.onPrimary,
    fontWeight: '600',
  },
  ackSecondaryBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.surfaceContainer,
    borderRadius: 6,
  },
  ackSecondaryText: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
    fontWeight: '600',
  },
  infoItem: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 8,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  infoIconBox: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: colors.secondaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  infoGreenTag: {
    ...typography.labelSm,
    fontSize: 10,
    color: colors.secondary,
    fontWeight: '700',
  },
  infoBatteryText: {
    ...typography.labelSm,
    fontSize: 10,
    color: colors.secondary,
    fontWeight: '600',
  },
  bottomActionsCol: {
    gap: 8,
    marginTop: 4,
  },
  runDiagBtn: {
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.primary,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  diagPassedBtn: {
    backgroundColor: colors.secondary,
  },
  runDiagText: {
    ...typography.headlineSm,
    color: colors.onPrimary,
  },
  historyCurvesBtn: {
    width: '100%',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  historyCurvesText: {
    ...typography.headlineSm,
    color: colors.primary,
  },
});
