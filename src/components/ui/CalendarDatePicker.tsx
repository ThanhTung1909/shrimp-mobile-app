import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { radii, shadows, touchTargets } from '../../constants/theme';
import { fontFamily } from '../../constants/typography';
import { useFontScale } from './useFontScale';

export interface CalendarDatePickerProps {
  label?: string;
  value: string;
  onChange: (ymd: string) => void;
  placeholder?: string;
  minDate?: string;
  maxDate?: string;
  showQuickShortcuts?: boolean;
  disabled?: boolean;
}

const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const VN_WEEKDAYS = [
  'Chủ nhật',
  'Thứ Hai',
  'Thứ Ba',
  'Thứ Tư',
  'Thứ Năm',
  'Thứ Sáu',
  'Thứ Bảy',
];

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function formatYmd(year: number, month: number, day: number): string {
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

function parseYmd(ymd?: string): { year: number; month: number; day: number } | null {
  if (!ymd || !/^\d{4}-\d{2}-\d{2}$/.test(ymd.trim())) return null;
  const [y, m, d] = ymd.trim().split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return null;
  return { year: y, month: m, day: d };
}

function formatDisplayVn(ymd?: string): string {
  const parsed = parseYmd(ymd);
  if (!parsed) return '';
  return `${pad2(parsed.day)}/${pad2(parsed.month)}/${parsed.year}`;
}

function getTodayYmd(): string {
  const now = new Date();
  return formatYmd(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

function getYesterdayYmd(): string {
  const dt = new Date();
  dt.setDate(dt.getDate() - 1);
  return formatYmd(dt.getFullYear(), dt.getMonth() + 1, dt.getDate());
}

function getRelativeBadge(ymd: string, todayYmd: string, yesterdayYmd: string): string {
  if (ymd === todayYmd) return 'Hôm nay';
  if (ymd === yesterdayYmd) return 'Hôm qua';
  const parsed = parseYmd(ymd);
  if (!parsed) return '';
  const dt = new Date(parsed.year, parsed.month - 1, parsed.day);
  return VN_WEEKDAYS[dt.getDay()] || '';
}

export const CalendarDatePicker: React.FC<CalendarDatePickerProps> = ({
  label,
  value,
  onChange,
  placeholder = 'Chọn ngày',
  minDate,
  maxDate,
  showQuickShortcuts = false,
  disabled = false,
}) => {
  const { fs } = useFontScale();
  const todayYmd = getTodayYmd();
  const yesterdayYmd = getYesterdayYmd();

  const initialAnchor = useMemo(() => {
    return parseYmd(value) || parseYmd(maxDate) || parseYmd(todayYmd)!;
  }, [value, maxDate, todayYmd]);

  const [open, setOpen] = useState(false);
  const [yearMode, setYearMode] = useState(false);
  const [viewYear, setViewYear] = useState(initialAnchor.year);
  const [viewMonth, setViewMonth] = useState(initialAnchor.month);
  const [yearRangeStart, setYearRangeStart] = useState(Math.floor(initialAnchor.year / 12) * 12);

  const toggleOpen = () => {
    if (disabled) return;
    if (!open) {
      const anchor = parseYmd(value) || parseYmd(maxDate) || parseYmd(todayYmd)!;
      setViewYear(anchor.year);
      setViewMonth(anchor.month);
      setYearRangeStart(Math.floor(anchor.year / 12) * 12);
      setYearMode(false);
    }
    setOpen((prev) => !prev);
  };

  const isDateDisabled = (ymd: string): boolean => {
    if (minDate && ymd < minDate) return true;
    if (maxDate && ymd > maxDate) return true;
    return false;
  };

  const minYear = parseYmd(minDate)?.year;
  const maxYear = parseYmd(maxDate)?.year;

  const isYearDisabled = (yr: number): boolean => {
    if (minYear !== undefined && yr < minYear) return true;
    if (maxYear !== undefined && yr > maxYear) return true;
    return false;
  };

  const shiftMonth = (delta: number) => {
    let nextMonth = viewMonth + delta;
    let nextYear = viewYear;
    if (nextMonth < 1) {
      nextMonth = 12;
      nextYear -= 1;
    } else if (nextMonth > 12) {
      nextMonth = 1;
      nextYear += 1;
    }
    setViewYear(nextYear);
    setViewMonth(nextMonth);
  };

  const weeks = useMemo(() => {
    const firstWeekday = (new Date(viewYear, viewMonth - 1, 1).getDay() + 6) % 7;
    const totalDays = new Date(viewYear, viewMonth, 0).getDate();
    const cells: Array<{ day: number | null; ymd: string | null }> = [];
    for (let i = 0; i < firstWeekday; i++) {
      cells.push({ day: null, ymd: null });
    }
    for (let d = 1; d <= totalDays; d++) {
      cells.push({ day: d, ymd: formatYmd(viewYear, viewMonth, d) });
    }
    while (cells.length % 7 !== 0) {
      cells.push({ day: null, ymd: null });
    }
    const rows: Array<typeof cells> = [];
    for (let i = 0; i < cells.length; i += 7) {
      rows.push(cells.slice(i, i + 7));
    }
    return rows;
  }, [viewYear, viewMonth]);

  const yearRows = useMemo(() => {
    const years = Array.from({ length: 12 }, (_, i) => yearRangeStart + i);
    const rows: number[][] = [];
    for (let i = 0; i < years.length; i += 3) {
      rows.push(years.slice(i, i + 3));
    }
    return rows;
  }, [yearRangeStart]);

  const handleSelectDate = (ymd: string) => {
    if (isDateDisabled(ymd)) return;
    onChange(ymd);
    setOpen(false);
    setYearMode(false);
  };

  const handleSelectYear = (yr: number) => {
    if (isYearDisabled(yr)) return;
    setViewYear(yr);
    setYearMode(false);
  };

  const displayDate = formatDisplayVn(value);
  const badgeText = displayDate ? getRelativeBadge(value, todayYmd, yesterdayYmd) : '';

  const rangeHint = useMemo(() => {
    const minStr = formatDisplayVn(minDate);
    const maxStr = formatDisplayVn(maxDate);
    if (minStr && maxStr) return `Từ ${minStr} đến ${maxStr}`;
    if (minStr) return `Từ ${minStr}`;
    if (maxStr) return `Đến ${maxStr}`;
    return null;
  }, [minDate, maxDate]);

  return (
    <View style={styles.wrapper}>
      {label ? <Text style={[styles.label, { fontSize: fs(13) }]}>{label}</Text> : null}

      <TouchableOpacity
        activeOpacity={0.8}
        disabled={disabled}
        onPress={toggleOpen}
        accessibilityRole="button"
        accessibilityLabel={label || placeholder}
        style={[
          styles.trigger,
          open && styles.triggerOpen,
          disabled && styles.triggerDisabled,
        ]}
      >
        <View style={styles.calendarIconBadge}>
          <MaterialIcons name="calendar-today" size={18} color={colors.primary} />
        </View>

        <View style={styles.triggerTextGroup}>
          {displayDate ? (
            <View style={styles.valueRow}>
              <Text style={[styles.valueText, { fontSize: fs(15) }]}>{displayDate}</Text>
              {badgeText ? (
                <View style={styles.relBadge}>
                  <Text style={styles.relBadgeText}>{badgeText}</Text>
                </View>
              ) : null}
            </View>
          ) : (
            <Text style={[styles.placeholderText, { fontSize: fs(15) }]}>{placeholder}</Text>
          )}
        </View>

        <MaterialIcons
          name={open ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
          size={22}
          color={colors.primaryDark}
        />
      </TouchableOpacity>

      {open ? (
        <View style={styles.calendarPanel}>
          {showQuickShortcuts ? (
            <View style={styles.shortcutRow}>
              {(
                [
                  { label: 'Hôm nay', ymd: todayYmd },
                  { label: 'Hôm qua', ymd: yesterdayYmd },
                ] as const
              ).map((item) => {
                const active = value === item.ymd;
                const itemDisabled = isDateDisabled(item.ymd);
                return (
                  <TouchableOpacity
                    key={item.ymd}
                    activeOpacity={0.8}
                    disabled={itemDisabled}
                    onPress={() => handleSelectDate(item.ymd)}
                    style={[
                      styles.shortcutChip,
                      active && styles.shortcutChipActive,
                      itemDisabled && styles.disabledOpacity,
                    ]}
                  >
                    {active ? (
                      <MaterialIcons name="check" size={15} color={colors.primaryDark} />
                    ) : null}
                    <Text
                      style={[
                        styles.shortcutText,
                        active && styles.shortcutTextActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : null}

          <View style={styles.navHeader}>
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() =>
                yearMode ? setYearRangeStart((y) => y - 12) : shiftMonth(-1)
              }
              style={styles.navArrowBtn}
              accessibilityLabel={yearMode ? '12 năm trước' : 'Tháng trước'}
            >
              <MaterialIcons name="chevron-left" size={22} color={colors.primaryDark} />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                if (!yearMode) {
                  setYearRangeStart(Math.floor(viewYear / 12) * 12);
                }
                setYearMode((prev) => !prev);
              }}
              style={styles.monthYearBtn}
            >
              <Text style={styles.monthYearText}>
                {yearMode
                  ? `${yearRangeStart} – ${yearRangeStart + 11}`
                  : `Tháng ${viewMonth} / ${viewYear}`}
              </Text>
              <MaterialIcons
                name={yearMode ? 'arrow-drop-up' : 'arrow-drop-down'}
                size={20}
                color={colors.primaryDark}
              />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() =>
                yearMode ? setYearRangeStart((y) => y + 12) : shiftMonth(1)
              }
              style={styles.navArrowBtn}
              accessibilityLabel={yearMode ? '12 năm sau' : 'Tháng sau'}
            >
              <MaterialIcons name="chevron-right" size={22} color={colors.primaryDark} />
            </TouchableOpacity>
          </View>

          {yearMode ? (
            <View style={styles.yearGrid}>
              {yearRows.map((row, rowIdx) => (
                <View key={rowIdx} style={styles.yearRow}>
                  {row.map((yr) => {
                    const active = yr === viewYear;
                    const yrDisabled = isYearDisabled(yr);
                    return (
                      <TouchableOpacity
                        key={yr}
                        activeOpacity={0.8}
                        disabled={yrDisabled}
                        onPress={() => handleSelectYear(yr)}
                        style={[
                          styles.yearCell,
                          active && styles.yearCellActive,
                          yrDisabled && styles.disabledOpacity,
                        ]}
                      >
                        <Text
                          style={[
                            styles.yearCellText,
                            active && styles.yearCellTextActive,
                          ]}
                        >
                          {yr}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.monthGrid}>
              <View style={styles.weekHeaderRow}>
                {WEEKDAYS.map((wd, idx) => (
                  <View key={wd} style={styles.weekHeaderCell}>
                    <Text
                      style={[
                        styles.weekHeaderText,
                        idx === 6 && styles.sundayHeaderText,
                      ]}
                    >
                      {wd}
                    </Text>
                  </View>
                ))}
              </View>

              {weeks.map((week, wIdx) => (
                <View key={wIdx} style={styles.weekRow}>
                  {week.map((cell, cIdx) => {
                    if (!cell.day || !cell.ymd) {
                      return <View key={cIdx} style={styles.dayCellOuter} />;
                    }
                    const ymd = cell.ymd;
                    const isSelected = value === ymd;
                    const isToday = ymd === todayYmd;
                    const cellDisabled = isDateDisabled(ymd);

                    return (
                      <View key={cIdx} style={styles.dayCellOuter}>
                        <TouchableOpacity
                          activeOpacity={0.75}
                          disabled={cellDisabled}
                          onPress={() => handleSelectDate(ymd)}
                          style={[
                            styles.dayCellBtn,
                            isToday && !isSelected && styles.dayCellToday,
                            isSelected && styles.dayCellSelected,
                            cellDisabled && styles.dayCellDisabled,
                          ]}
                        >
                          <Text
                            style={[
                              styles.dayCellText,
                              isToday && !isSelected && styles.dayCellTodayText,
                              isSelected && styles.dayCellSelectedText,
                            ]}
                          >
                            {cell.day}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
              ))}
            </View>
          )}

          <View style={styles.panelFooter}>
            <Text style={styles.rangeHintText} numberOfLines={1}>
              {rangeHint || 'Chạm tiêu đề tháng/năm để đổi năm nhanh'}
            </Text>
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => setOpen(false)}
              style={styles.closePanelBtn}
            >
              <Text style={styles.closePanelText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    gap: 8,
  },
  label: {
    fontFamily: fontFamily.semiBold,
    color: colors.ink,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 50,
    borderRadius: radii.control,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceContainerLow,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 10,
  },
  triggerOpen: {
    borderColor: colors.primary,
    borderWidth: 1.5,
    backgroundColor: colors.card,
    ...shadows.card,
  },
  triggerDisabled: {
    opacity: 0.55,
  },
  calendarIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  triggerTextGroup: {
    flex: 1,
    minWidth: 0,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  valueText: {
    fontFamily: fontFamily.bold,
    color: colors.ink,
    fontVariant: ['tabular-nums'],
  },
  relBadge: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.pill,
  },
  relBadgeText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 11,
    color: colors.primaryDark,
  },
  placeholderText: {
    fontFamily: fontFamily.regular,
    color: colors.subtle,
  },
  calendarPanel: {
    backgroundColor: colors.card,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 10,
    ...shadows.card,
  },
  shortcutRow: {
    flexDirection: 'row',
    gap: 8,
  },
  shortcutChip: {
    flex: 1,
    minHeight: 36,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceContainerLow,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 10,
  },
  shortcutChipActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  shortcutText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 12,
    color: colors.muted,
  },
  shortcutTextActive: {
    color: colors.primaryDark,
  },
  navHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  navArrowBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthYearBtn: {
    flex: 1,
    minHeight: 36,
    borderRadius: radii.pill,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: '#CBE7E9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingHorizontal: 12,
  },
  monthYearText: {
    fontFamily: fontFamily.bold,
    fontSize: 14,
    color: colors.primaryDark,
    fontVariant: ['tabular-nums'],
  },
  yearGrid: {
    gap: 8,
    paddingVertical: 4,
  },
  yearRow: {
    flexDirection: 'row',
    gap: 8,
  },
  yearCell: {
    flex: 1,
    height: 40,
    borderRadius: radii.control,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  yearCellActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  yearCellText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 14,
    color: colors.ink,
    fontVariant: ['tabular-nums'],
  },
  yearCellTextActive: {
    color: '#FFFFFF',
  },
  monthGrid: {
    gap: 4,
  },
  weekHeaderRow: {
    flexDirection: 'row',
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: 2,
  },
  weekHeaderCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  weekHeaderText: {
    fontFamily: fontFamily.bold,
    fontSize: 12,
    color: colors.muted,
  },
  sundayHeaderText: {
    color: colors.warnText,
  },
  weekRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dayCellOuter: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 2,
  },
  dayCellBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCellToday: {
    backgroundColor: colors.primarySoft,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  dayCellSelected: {
    backgroundColor: colors.primary,
  },
  dayCellDisabled: {
    opacity: 0.25,
  },
  dayCellText: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    color: colors.ink,
    fontVariant: ['tabular-nums'],
  },
  dayCellTodayText: {
    fontFamily: fontFamily.bold,
    color: colors.primaryDark,
  },
  dayCellSelectedText: {
    fontFamily: fontFamily.bold,
    color: '#FFFFFF',
  },
  disabledOpacity: {
    opacity: 0.35,
  },
  panelFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  rangeHintText: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: 11,
    color: colors.muted,
    fontVariant: ['tabular-nums'],
  },
  closePanelBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceContainer,
  },
  closePanelText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 12,
    color: colors.primaryDark,
  },
});
