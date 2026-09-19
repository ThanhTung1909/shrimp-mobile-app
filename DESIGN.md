---
name: Telemetry Industrial
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#43474e'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#74777f'
  outline-variant: '#c4c6cf'
  surface-tint: '#485f82'
  primary: '#00152f'
  on-primary: '#ffffff'
  primary-container: '#0f2a4a'
  on-primary-container: '#7a92b7'
  inverse-primary: '#b0c8f0'
  secondary: '#006a61'
  on-secondary: '#ffffff'
  secondary-container: '#86f2e4'
  on-secondary-container: '#006f66'
  tertiary: '#290d00'
  on-tertiary: '#ffffff'
  tertiary-container: '#491c00'
  on-tertiary-container: '#df732d'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d4e3ff'
  primary-fixed-dim: '#b0c8f0'
  on-primary-fixed: '#001c3a'
  on-primary-fixed-variant: '#304869'
  secondary-fixed: '#89f5e7'
  secondary-fixed-dim: '#6bd8cb'
  on-secondary-fixed: '#00201d'
  on-secondary-fixed-variant: '#005049'
  tertiary-fixed: '#ffdbca'
  tertiary-fixed-dim: '#ffb68e'
  on-tertiary-fixed: '#331200'
  on-tertiary-fixed-variant: '#763300'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  headline-xl:
    fontFamily: IBM Plex Sans
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: IBM Plex Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: IBM Plex Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: IBM Plex Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.005em
  headline-sm:
    fontFamily: IBM Plex Sans
    fontSize: 15px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0em
  body-lg:
    fontFamily: IBM Plex Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: IBM Plex Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: IBM Plex Sans
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  telemetry-value-lg:
    fontFamily: JetBrains Mono
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.03em
  telemetry-value-md:
    fontFamily: JetBrains Mono
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 22px
    letterSpacing: -0.02em
  telemetry-value-sm:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0em
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.04em
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.06em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-mobile: 0.75rem
  margin: 1.5rem
  margin-mobile: 0.75rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
---

## Brand & Style

This design system serves mission-critical aquaculture operations, specifically shrimp farming environments where operators balance continuous biological risk with mechanical infrastructure management. The visual tone is utilitarian, authoritative, and industrial-grade. It prioritizes rapid information ingestion under harsh field lighting conditions, such as outdoor pond dikes under direct sunlight, as well as control-room desktop environments.

The style merges modern industrial SCADA systems with enterprise telemetry consoles:
- **Utilitarian Precision:** Visual flourish is eliminated in favor of information density, predictable visual parsing, and operational clarity.
- **Structural Integrity:** Heavy reliance on clear structural demarcations, monospaced tabular figures, and crisp boundary definition.
- **Critical Contrast:** Color is reserved strictly for operational telemetry states (sensor levels, operational faults, power drops, critical biological thresholds).
- **Physical Machine Metaphor:** Inputs and controls mimic reliable switchgear and durable instrumentation rather than consumer apps.

## Colors

The palette balances a commanding marine industrial base with calibrated status and telemetry pigments:

- **Primary (`#0F2A4A`):** Deep Marine Navy. Used for command surfaces, primary navigation rails, top app headers, primary structural frames, and main interactive actions. Communicates depth, stability, and maritime infrastructure.
- **Secondary (`#0D9488`):** Aeration Cyan/Teal. Anchors telemetry streams, water circulation states, and nominal physical actuators (paddlewheels, automated feeders, blowers).
- **Tertiary (`#B45309`):** Industrial Amber. Reserved for pre-alarm thresholds, maintenance warnings, dissolved oxygen (DO) advisory drifts, and sensor recalibration states.
- **Neutral (`#0F172A`):** Deep Slate Ink. Primary typography and structural linework, preventing washed-out legibility across daylight-viewable tablets.

### Functional & Telemetry Tints
- **Canvas Base:** `#F8FAFC` (Slate 50) for reduced glare compared to pure paper white.
- **Surface Cards:** `#FFFFFF` (Solid Clean White) with dedicated structural borders.
- **Surface Accent/Header:** `#0A1C33` (Midnight Navy) for persistent top navigation and persistent lateral pond selection rails.
- **Status Normal / Active:** Text `#15803D`, Surface `#DCFCE7`, Border `#86EFAC`.
- **Status Offline / Standby:** Text `#475569`, Surface `#F1F5F9`, Border `#CBD5E1`.
- **Status Warning / Advisory:** Text `#B45309`, Surface `#FEF3C7`, Border `#FCD34D`.
- **Status Alarm / Critical:** Text `#B91C1C`, Surface `#FEE2E2`, Border `#FCA5A5`.
- **Border Structural Base:** `#CBD5E1` (Slate 300) on standard elements; `#94A3B8` (Slate 400) on high-contrast data dividers.

## Typography

The type system implements **IBM Plex Sans** for human interface communication and structural headings, complemented by **JetBrains Mono** for numerical telemetry data, timestamps, sensor hardware IDs, and status tagging.

Key rules:
- **Tabular Lining Numbers:** Monospaced figures must be enforced across all telemetry displays (Dissolved Oxygen, Salinity, pH, Temperature, ORP, Turbidity) to eliminate visual stutter during live WebSocket sensor updates.
- **Metric Unit Anchoring:** Sensor units (e.g., `mg/L`, `ppt`, `°C`, `ppm`) must always use `label-sm` in neutral secondary color, positioned alongside or subscripted to `telemetry-value-*` tokens.
- **Uppercase Data Labels:** All parameter labels, table column headers, and pond zone designations utilize uppercase treatment with expanded letter tracking via `label-sm` or `label-md`.

## Layout & Spacing

The layout is architected around high-density operational views:

- **Desktop & Control Room (>1200px):** 12-column fluid grid. A persistent 260px dark navy left navigation drawer anchors pond clusters and facility infrastructure. The main telemetry dashboard utilizes strict multi-column layouts (4, 3, or 2 pond grids) with `1rem` gutters to pack maximum sensor metrics above the scroll fold.
- **Field Tablet (768px - 1199px):** 8-column layout. The persistent drawer collapses to a 64px icon rail. Metric grids transition to 2 columns for comfortable thumb interaction while walking pond dikes.
- **Mobile Handheld (<767px):** 4-column layout. Horizontal scrolling sensor ribbons for secondary metrics, stacked card lists for pond overview, and sticky bottom control sheets for manual aerator/feeder overrides.

### Spacing Discipline
A disciplined 4px base increment governs all layouts. Telemetry modules prioritize compressed vertical padding (`space-sm` to `space-md`) to ensure high density, allowing simultaneous visibility of multiple ponds without context switching.

## Elevation & Depth

This design system avoids soft dropshadows and fuzzy blurs, which perform poorly on ruggedized field devices under ambient sunlight. Visual hierarchy relies on **crisp structural borders, subtle surface tone shifts, and high-contrast zoning**:

- **Layer 0 (Canvas Base):** Ground color `#F8FAFC`.
- **Layer 1 (Cards & Data Panels):** Solid `#FFFFFF` enclosed by a 1px uniform border of `#CBD5E1`. No box shadow is applied in default state.
- **Layer 1 Hover / Active:** Border shifts to `#0F2A4A` with a hard, technical 1px offset accent or an ambient 2px `#0F2A4A` outline. No diffused blur.
- **Layer 2 (Popovers, Tooltips, Metric Flyouts):** Solid `#FFFFFF` with a 1px border of `#94A3B8` and a focused, low-deflection shadow (`0 2px 4px -1px rgba(15, 42, 74, 0.12)`).
- **Layer Command (Header & Navigation Rail):** Deep Midnight Navy (`#0A1C33`) creating immediate visual containment around the working canvas.
- **Fault/Alarm Priority Elevation:** Critical alert cards override standard borders with a 2px high-contrast `#B91C1C` perimeter and a faint `#FEE2E2` flood.

## Shapes

The geometric approach is squared and industrial (`roundedness: 1`):
- Standard cards, interactive controls, inputs, and tables use an authoritative `0.25rem` (4px) corner radius.
- System tags, status indicators, and pond badges employ the same sharp `0.25rem` radius or strict `0px` chamfered geometry; organic pill shapes are prohibited.
- Iconography must follow geometric, square-ended, consistent stroke weights (1.5px to 2px) to match the instrument-grade UI.

## Components

### 1. Buttons
- **Primary Industrial:** Solid `#0F2A4A` background, white text (`body-sm` font-weight 600), 1px border `#0A1C33`, `0.25rem` radius. Height: 36px (compact) or 44px (field/touch). Focus: 2px offset ring in `#0D9488`.
- **Secondary / Technical:** Surface `#FFFFFF`, text `#0F2A4A`, 1px border `#CBD5E1`. Hover: `#F1F5F9` background, border `#0F2A4A`.
- **Danger / Kill-Switch:** Solid `#B91C1C` background, white text. Dedicated to emergency aerator halts or critical threshold silences.
- **Icon Actions:** 32x32px or 40x40px bordered squares with centered SVG icons.

### 2. Status Tags & Badges
- Strict rectangular tags with `0.25rem` radius and monospaced typography (`label-sm`).
- **ACTIVE:** `#DCFCE7` background, `#15803D` text, 1px `#86EFAC` border. Prefixed with a 6px solid green dot.
- **OFFLINE:** `#F1F5F9` background, `#475569` text, 1px `#CBD5E1` border. Prefixed with a 6px hollow gray circle.
- **WARNING:** `#FEF3C7` background, `#B45309` text, 1px `#FCD34D` border.
- **ALARM / CRITICAL:** `#FEE2E2` background, `#B91C1C` text, 1px `#FCA5A5` border. Pulsing indicator dot allowed only during unacknowledged telemetry breach.

### 3. Telemetry Metric Tiles & Cards
- **Construction:** Crisp `#FFFFFF` card, 1px `#CBD5E1` border, 12px internal padding.
- **Header Slot:** Parameter name (`label-sm`, `#64748B`, uppercase) paired with hardware channel ID (`CH-01`).
- **Value Slot:** Large telemetry number (`telemetry-value-lg`) in `#0F172A`, immediate right-aligned unit indicator.
- **Sparkline / Delta Slot:** 32px height micro-chart baseline showing 4-hour trend line with explicit min/max technical limits.
- **Card States:** If an individual parameter breaches threshold (e.g., Dissolved Oxygen < 3.5 mg/L), the tile's left border thickens to a 4px solid `#B91C1C` strip.

### 4. Tabular Data (Telemetry Grids)
- Dense, tabular data presentation for pond multi-sensor arrays.
- **Header Row:** Solid `#F1F5F9`, border-bottom 1px `#94A3B8`, text `label-md` uppercase in `#475569`.
- **Cell Format:** Height 40px, padding `0 12px`, numeric values right-aligned using `JetBrains Mono`.
- **Row Borders:** 1px `#E2E8F0` horizontal divider. Alternating row zebra striping (`#FFFFFF` to `#F8FAFC`) to assist horizontal scanning across wide sensor lists.

### 5. Input Fields & Selectors
- **Input Elements:** Surface `#FFFFFF`, height 36px, 1px border `#CBD5E1`, text `body-md` in `#0F172A`.
- **Active / Focus:** 1px `#0F2A4A` border with 1px outer `#0F2A4A` hairline highlight.
- **Telemetry Threshold Steppers:** Paired text and increment buttons allowing precise manual threshold setting under wet-finger conditions.

### 6. Hardware Actuator Toggles (Feeders / Aerators)
- Segmented switches rather than fluid toggles: Dual-state bordered button groups labeled `MANUAL ON` / `AUTO` / `OFF` with unmistakable high-contrast active fill (`#0F2A4A` for on, `#475569` for off).