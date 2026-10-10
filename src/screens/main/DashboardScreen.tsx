import React, { useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { PondCard } from '../../components/pond/PondCard';
import { selectPond, toggleAeratorMode, fetchPonds, fetchPondDetail } from '../../store/slices/pondSlice';

import { socketService } from '../../services/socketService';

export const DashboardScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const {
    clusterName,
    connectedPonds,
    totalPonds,
    lastSyncTime,
    ponds,
    aeratorsOn,
    totalAerators,
    aeratorMode,
    biomassTons,
    biomassCapPercent,
    aggregateTotalFeedKg,
    aggregateAvgDo,
    sensorsOk,
    totalSensors,
    loading,
    refreshing,
    error,
  } = useAppSelector((state) => state.pond);

  useEffect(() => {
    dispatch(fetchPonds());
  }, [dispatch]);

  // Tự động đăng ký WebSocket room cho tất cả các đầm tôm của nông dân
  useEffect(() => {
    if (ponds && ponds.length > 0) {
      ponds.forEach((pond) => {
        if (pond.id) {
          socketService.subscribePond(pond.id);
        }
      });
    }
  }, [ponds]);

  const handleRefresh = useCallback(() => {
    dispatch(fetchPonds());
  }, [dispatch]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primaryContainer} />

      {/* Persistent Top Header */}
      <View style={styles.topHeader}>
        <View style={styles.topHeaderLeft}>
          <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7}>
            <MaterialIcons name="menu" size={24} color={colors.onPrimary} />
          </TouchableOpacity>
          <View style={styles.logoTitleRow}>
            <MaterialCommunityIcons name="waves" size={24} color={colors.secondaryFixedDim} />
            <View style={styles.brandTextCol}>
              <Text style={styles.topHeaderBrand}>PondLogs</Text>
              <Text style={styles.topHeaderSub}>TELEMETRY OS</Text>
            </View>
          </View>
        </View>

        <View style={styles.topHeaderRight}>
          <TouchableOpacity
            style={styles.iconBtn}
            activeOpacity={0.7}
            onPress={handleRefresh}
          >
            {loading ? (
              <ActivityIndicator size="small" color={colors.onPrimary} />
            ) : (
              <MaterialIcons name="sync" size={22} color={colors.onPrimary} />
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7}>
            <MaterialIcons name="notifications" size={22} color={colors.onPrimary} />
            <View style={styles.notificationDot} />
          </TouchableOpacity>
          <View style={styles.profileAvatar}>
            <MaterialIcons name="person" size={18} color={colors.onPrimary} />
          </View>
        </View>
      </View>

      {/* Error notification banner if API connection fails */}
      {error ? (
        <View style={styles.errorBanner}>
          <MaterialIcons name="cloud-off" size={16} color={colors.onErrorContainer} />
          <Text style={styles.errorBannerText}>
            {error} • Đang hiển thị dữ liệu hoạt động ngoại tuyến
          </Text>
        </View>
      ) : null}

      {/* Main Scroll Content */}
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing || loading}
            onRefresh={handleRefresh}
            colors={[colors.secondary]}
            tintColor={colors.secondary}
          />
        }
      >
        {/* Farm Cluster Selector Sub-bar */}
        <View style={styles.clusterCard}>
          <View style={styles.clusterTopRow}>
            <View style={styles.clusterTitleGroup}>
              <MaterialIcons
                name="hub"
                size={20}
                color={colors.secondary}
                style={styles.clusterIcon}
              />
              <Text style={styles.clusterName}>{clusterName}</Text>
              <TouchableOpacity activeOpacity={0.7}>
                <MaterialIcons name="arrow-drop-down" size={20} color={colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>

            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          </View>

          <View style={styles.clusterBottomRow}>
            <View style={styles.connectedGroup}>
              <Text style={styles.connectedNum}>
                {connectedPonds}/{totalPonds}
              </Text>
              <Text style={styles.connectedLabel}>Ao Kết Nối</Text>
            </View>
            <View style={styles.syncGroup}>
              <MaterialIcons name="sync" size={14} color={colors.onSurfaceVariant} />
              <Text style={styles.syncText}>Đồng bộ: {lastSyncTime}</Text>
            </View>
          </View>
        </View>

        {/* Filter & Quick Action Strip */}
        <View style={styles.filterStrip}>
          <View style={styles.matrixLabelRow}>
            <Text style={styles.matrixLabel}>MA TRẬN GIÁM SÁT AO NUÔI</Text>
            <View style={styles.unitsBadge}>
              <Text style={styles.unitsBadgeText}>{totalPonds} Ao</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.filterBtn} activeOpacity={0.7}>
            <MaterialIcons name="filter-list" size={16} color={colors.onSurfaceVariant} />
            <Text style={styles.filterBtnText}>Mật độ</Text>
          </TouchableOpacity>
        </View>

        {/* Pond Telemetry Card List */}
        <View style={styles.pondList}>
          {ponds.length > 0 ? (
            ponds.map((pond) => (
              <PondCard
                key={pond.id}
                item={pond}
                onPress={() => {
                  dispatch(selectPond(pond.id));
                  dispatch(fetchPondDetail(pond.id));
                  navigation.navigate('Ponds');
                }}
              />
            ))
          ) : (
            <View style={styles.emptyCard}>
              <MaterialIcons name="water-damage" size={32} color={colors.onSurfaceVariant} />
              <Text style={styles.emptyTitle}>Chưa có dữ liệu ao nuôi trong Database</Text>
              <Text style={styles.emptySub}>
                Kéo xuống để làm mới hoặc kiểm tra tài khoản phân công trên máy chủ.
              </Text>
            </View>
          )}
        </View>

        {/* Operational Context Panel (Aerator Grid & Biomass Status) */}
        <View style={styles.contextGrid}>
          {/* Card 1: Aerator Grid */}
          <View style={styles.contextCard}>
            <View style={styles.contextCardHeader}>
              <Text style={styles.contextLabel}>HỆ THỐNG SỤC KHÍ</Text>
              <Text style={styles.aeratorStatus}>
                {aeratorsOn}/{totalAerators} BẬT
              </Text>
            </View>
            <View style={styles.contextActionsRow}>
              <TouchableOpacity
                style={styles.autoHighBtn}
                activeOpacity={0.8}
                onPress={() => dispatch(toggleAeratorMode())}
              >
                <Text style={styles.autoHighText}>{aeratorMode}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.specsBtn} activeOpacity={0.7}>
                <Text style={styles.specsText}>Thông số</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Card 2: Biomass Status */}
          <View style={styles.contextCard}>
            <View style={styles.contextCardHeader}>
              <Text style={styles.contextLabel}>SINH KHỐI DỰ KIẾN</Text>
              <Text style={styles.biomassValue}>{biomassTons} Tấn</Text>
            </View>
            <View style={styles.progressRow}>
              <View style={styles.progressBarBg}>
                <View
                  style={[styles.progressBarFill, { width: `${biomassCapPercent}%` }]}
                />
              </View>
              <Text style={styles.progressLabel}>{biomassCapPercent}% tải</Text>
            </View>
          </View>
        </View>

        {/* Bottom Quick Summary Strip: Daily Aggregate */}
        <View style={styles.aggregateCard}>
          <View style={styles.aggregateHeader}>
            <View style={styles.aggregateTitleRow}>
              <MaterialIcons name="query-stats" size={18} color={colors.secondaryFixedDim} />
              <Text style={styles.aggregateTitle}>Tổng Quan Trong Ngày</Text>
            </View>
            <Text style={styles.updatedText}>Real-Time Telemetry</Text>
          </View>

          <View style={styles.aggregateGrid}>
            <View style={styles.aggregateTile}>
              <Text style={styles.aggregateTileLabel}>TỔNG THỨC ĂN</Text>
              <View style={styles.aggregateTileValueRow}>
                <Text style={styles.aggregateTileValue}>{aggregateTotalFeedKg}</Text>
                <Text style={styles.aggregateTileUnit}>kg</Text>
              </View>
            </View>

            <View style={styles.aggregateTile}>
              <Text style={styles.aggregateTileLabel}>DO TRUNG BÌNH</Text>
              <View style={styles.aggregateTileValueRow}>
                <Text style={[styles.aggregateTileValue, styles.tealValue]}>
                  {aggregateAvgDo}
                </Text>
                <Text style={styles.aggregateTileUnit}>mg/L</Text>
              </View>
            </View>

            <View style={styles.aggregateTile}>
              <Text style={styles.aggregateTileLabel}>CẢM BIẾN</Text>
              <View style={styles.aggregateTileValueRow}>
                <Text style={styles.aggregateTileValue}>
                  {sensorsOk}/{totalSensors}
                </Text>
                <Text style={styles.sensorsOkText}>OK</Text>
              </View>
            </View>
          </View>
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
  },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    position: 'relative',
  },
  logoTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandTextCol: {
    flexDirection: 'column',
  },
  topHeaderBrand: {
    ...typography.headlineSm,
    color: colors.onPrimary,
    lineHeight: 18,
  },
  topHeaderSub: {
    ...typography.labelSm,
    fontSize: 9,
    color: colors.onPrimaryContainer,
    letterSpacing: 0.8,
  },
  topHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  notificationDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.error,
    borderWidth: 1.5,
    borderColor: colors.primaryContainer,
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
  errorBanner: {
    backgroundColor: colors.errorContainer,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  errorBannerText: {
    ...typography.labelSm,
    color: colors.onErrorContainer,
    fontSize: 11,
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 24,
    gap: 10,
  },
  clusterCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 12,
    padding: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  clusterTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  clusterTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  clusterIcon: {
    marginRight: 2,
  },
  clusterName: {
    ...typography.headlineSm,
    color: colors.onSurface,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(134, 242, 228, 0.4)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.secondary,
  },
  liveText: {
    ...typography.labelSm,
    color: colors.onSecondaryContainer,
    fontWeight: '700',
  },
  clusterBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 2,
  },
  connectedGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  connectedNum: {
    ...typography.telemetryValueSm,
    color: colors.secondary,
    fontWeight: '700',
  },
  connectedLabel: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
  },
  syncGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  syncText: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
  },
  filterStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  matrixLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  matrixLabel: {
    ...typography.labelMd,
    color: colors.onSurfaceVariant,
    fontWeight: '700',
  },
  unitsBadge: {
    backgroundColor: colors.surfaceContainerHigh,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  unitsBadgeText: {
    ...typography.labelSm,
    color: colors.onSurface,
    fontWeight: '600',
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  filterBtnText: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
  },
  pondList: {
    gap: 4,
  },
  contextGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  contextCard: {
    flex: 1,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 12,
    padding: 10,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  contextCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  contextLabel: {
    ...typography.labelSm,
    fontSize: 10,
    color: colors.onSurfaceVariant,
  },
  aeratorStatus: {
    ...typography.labelSm,
    color: colors.secondary,
    fontWeight: '700',
  },
  contextActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  autoHighBtn: {
    flex: 1,
    paddingVertical: 6,
    backgroundColor: colors.primaryContainer,
    borderRadius: 6,
    alignItems: 'center',
  },
  autoHighText: {
    ...typography.labelSm,
    color: colors.onPrimary,
    fontWeight: '600',
  },
  specsBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: colors.surfaceContainer,
    borderRadius: 6,
  },
  specsText: {
    ...typography.labelSm,
    color: colors.onSurface,
  },
  biomassValue: {
    ...typography.labelSm,
    color: colors.onSurface,
    fontWeight: '700',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  progressBarBg: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.surfaceContainer,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: colors.secondary,
  },
  progressLabel: {
    ...typography.labelSm,
    fontSize: 10,
    color: colors.onSurfaceVariant,
  },
  aggregateCard: {
    backgroundColor: colors.primaryContainer,
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  aggregateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  aggregateTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  aggregateTitle: {
    ...typography.headlineSm,
    color: colors.onPrimary,
  },
  updatedText: {
    ...typography.labelSm,
    color: colors.primaryFixedDim,
  },
  aggregateGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  aggregateTile: {
    flex: 1,
    backgroundColor: 'rgba(0, 21, 47, 0.4)',
    padding: 8,
    borderRadius: 8,
  },
  aggregateTileLabel: {
    ...typography.labelSm,
    fontSize: 10,
    color: colors.primaryFixedDim,
  },
  aggregateTileValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
    marginTop: 2,
  },
  aggregateTileValue: {
    ...typography.telemetryValueMd,
    color: colors.onPrimary,
    fontWeight: '700',
  },
  tealValue: {
    color: colors.secondaryFixed,
  },
  aggregateTileUnit: {
    ...typography.labelSm,
    color: colors.primaryFixedDim,
    fontSize: 10,
  },
  sensorsOkText: {
    ...typography.labelSm,
    color: colors.secondaryFixed,
    fontSize: 10,
    fontWeight: '700',
  },
  emptyCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderStyle: 'dashed',
  },
  emptyTitle: {
    ...typography.headlineSm,
    color: colors.onSurface,
    textAlign: 'center',
  },
  emptySub: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    fontSize: 12,
  },
});
