# GIS Field Operations & Asset Tracking Dashboard

An interactive, production-ready geospatial dashboard for tracking field infrastructure assets, monitoring service tickets, and dispatching field technicians. This application showcases GIS visualization, high-performance data filtering, custom interactive SVG analytics, and clean operational dashboard layout design.

Designed as a **freelance portfolio project** to demonstrate expertise in geospatial data visualization (GIS), modern dashboard design, operations management platforms, and client-side data parsing (CSV/JSON).

---

## 🚀 Key Features

* **Interactive GIS Map Layer**: Renders geographic coordinates using Leaflet with custom, status-coded neon indicators and pulsing emergency markers. Panning/zooming synchronized between the map, charts, and asset table.
* **Operational KPI Indicators**: Computes real-time summaries of total active assets, critical alerts, pending work orders, and overall system health completion rate.
* **Context-Aware Filters**: Search by ID, name, description, or technician, with multi-select filter pills for priority/status and quick selectors for region (neighborhoods) and sector (water, gas, electrical, telecom).
* **SCADA Alarm Simulation**: Simulates a live SCADA alert that randomizes an equipment warning, updates status variables, adds alert log entry, shifts map viewport focus, and triggers a real-time floating notification bubble.
* **Dispatch & Operations Portal**: Select any asset to view its maintenance ledger timeline. Cycle states, dispatch technicians (random assignment logic), or report field emergencies.
* **SVG Analytic Widgets**: Lightweight, native React/SVG charts:
  * Status Breakdown: Interactive donut chart segmenting assets by health status.
  * Sector Density: Vertical column graph tracking utility densities.
* **High-Performance Table**: Custom-built table featuring page indexing, column header sorting, and row click callbacks syncing the map.
* **CSV/JSON Data Import & Export**:
  * Drag-and-drop CSV/JSON loader with coordinate-number schema parsing and format checks.
  * Active state exports of currently filtered query results to CSV or JSON reports.

---

## 🛠️ Technology Stack

* **Core Framework**: React with Next.js (App Router, built on TypeScript)
* **GIS Mapping**: Leaflet.js (initialized browser-only via dynamic imports to avoid SSR hydration mismatches)
* **Icons**: Lucide React
* **Styling**: Vanilla CSS (using native CSS variables, flexbox grids, and glassmorphic translucent panels)
* **Bundler & Tooling**: ESLint, TS compiler, npm package manager

---

## 📦 Local Development Setup

### 1. Prerequisites
Ensure you have Node.js (version 18.0 or above) and npm installed.

### 2. Install Dependencies
Run the following command inside the project root:
```bash
npm install
```

### 3. Run Development Server
Start the Next.js local server:
```bash
npm run dev
```
Open your browser and navigate to [http://localhost:3000](http://localhost:3000) to see the dashboard.

### 4. Build Production Bundle
To compile, lint, and run standard TypeScript tests on the project:
```bash
npm run build
```

---

## 📊 Data Schema
Assets in the dashboard conform to the following JSON structure:
```typescript
interface FieldAsset {
  id: string;          // Format: AST-XXXX (e.g., AST-1002)
  name: string;        // e.g., "Ballard Flow Regulator 14"
  category: string;    // "Water" | "Electrical" | "Telecom" | "Gas"
  status: 'active' | 'pending' | 'repaired' | 'urgent' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  latitude: number;    // Coordinates (Seattle Metro Area)
  longitude: number;   // Coordinates (Seattle Metro Area)
  neighborhood: string;// e.g., "Ballard", "Capitol Hill", "Downtown"
  technician: string;  // e.g., "Elena Rostova"
  lastServiced: string;// ISO Timestamp
  description: string; // Explanatory text
  history: Array<{    // Maintenance ledger timeline
    date: string;
    action: string;
    technician: string;
  }>;
}
```

---

## 📸 Screenshots to Capture (For Freelance Profile)

For platforms like **Contra**, **Upwork**, or **PeoplePerHour**, capture these three visual state flows to maximize client interest:

1. **Dashboard Overview (The "Hero" Shot)**:
   * Keep filters reset, select an active asset (e.g. `AST-1001`) to show the populated map, charts, and detailed side drawer. 
2. **Emergency Response View**:
   * Click **"Trigger SCADA Alarm"** at the top right. This triggers a neon red pulsing warning bubble, centers the map viewport on a failed asset, and displays the red details log.
3. **Data Pipeline View**:
   * Switch the right panel to **"Data Import/Export"**. Export a CSV file, then import it back to show client-side data parsing, validation warnings, and file upload capabilities.
