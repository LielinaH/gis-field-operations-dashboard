'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
import mockData from '@/data/assets-mock.json';
import SVGCharts from '@/components/SVGCharts';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Download, 
  FileSpreadsheet, 
  Filter, 
  Info, 
  MapPin, 
  Plus, 
  RefreshCw, 
  Search, 
  Upload, 
  User, 
  Wrench,
  X,
  Sun,
  Moon
} from 'lucide-react';

// Define the interface for our Field Asset
interface FieldAsset {
  id: string;
  name: string;
  category: string;
  status: 'active' | 'pending' | 'repaired' | 'urgent' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  latitude: number;
  longitude: number;
  neighborhood: string;
  technician: string;
  lastServiced: string;
  description: string;
  history: Array<{
    date: string;
    action: string;
    technician: string;
  }>;
}

// Dynamically import OperationsMap with SSR disabled to prevent Leaflet window errors
const OperationsMap = dynamic(() => import('@/components/OperationsMap'), {
  ssr: false,
  loading: () => (
    <div className="empty-state">
      <Activity style={{ color: 'var(--accent)', animation: 'pulse 1.5s infinite' }} size={32} />
      <span>Initializing geospatial engine...</span>
    </div>
  )
});

export default function Dashboard() {
  // Global States
  const [assets, setAssets] = useState<FieldAsset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<FieldAsset | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  
  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState('All');

  // Tab State: 'filters' (charts/filters) | 'details' | 'utility' (import/export)
  const [activeTab, setActiveTab] = useState<'filters' | 'details' | 'utility'>('filters');

  // Pagination & Sort States
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const [sortField, setSortField] = useState<keyof FieldAsset>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Floating Notification Bubble State
  const [notification, setNotification] = useState<{ title: string; desc: string } | null>(null);
  const notifTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Assets list and theme preference from local storage on mount
  useEffect(() => {
    setAssets(JSON.parse(JSON.stringify(mockData)));
    
    const savedTheme = localStorage.getItem('gis-theme') as 'dark' | 'light';
    if (savedTheme === 'light' || savedTheme === 'dark') {
      setTheme(savedTheme);
    }
    
    showNotification(
      "GIS Hub Activated", 
      "Geospatial operations dashboard initialized with 50 Seattle metro assets."
    );
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('gis-theme', nextTheme);
    showNotification("Theme Changed", `Dashboard switched to ${nextTheme.toUpperCase()} mode.`);
  };

  // Utility to show temporary notifications
  const showNotification = (title: string, desc: string) => {
    if (notifTimeoutRef.current) {
      clearTimeout(notifTimeoutRef.current);
    }
    setNotification({ title, desc });
    notifTimeoutRef.current = setTimeout(() => {
      setNotification(null);
    }, 6000);
  };

  // Reset all filters to default
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedStatuses([]);
    setSelectedPriorities([]);
    setSelectedCategory('All');
    setSelectedNeighborhood('All');
    setCurrentPage(1);
    showNotification("Filters Reset", "All search filters have been cleared.");
  };

  // Toggle Multi-select Pills
  const toggleStatusFilter = (status: string) => {
    setSelectedStatuses(prev => 
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
    setCurrentPage(1);
  };

  const togglePriorityFilter = (priority: string) => {
    setSelectedPriorities(prev => 
      prev.includes(priority) ? prev.filter(p => p !== priority) : [...prev, priority]
    );
    setCurrentPage(1);
  };

  // List of neighborhoods for dropdown selection
  const neighborhoodList = useMemo(() => {
    const list = new Set(assets.map(a => a.neighborhood));
    return Array.from(list).sort();
  }, [assets]);

  // --- FILTER & SEARCH IMPLEMENTATION ---
  const filteredAssets = useMemo(() => {
    return assets.filter(asset => {
      // 1. Text Search query
      const matchQuery = searchQuery.trim().toLowerCase();
      const matchText = matchQuery === '' || 
        asset.id.toLowerCase().includes(matchQuery) ||
        asset.name.toLowerCase().includes(matchQuery) ||
        asset.technician.toLowerCase().includes(matchQuery) ||
        asset.description.toLowerCase().includes(matchQuery);

      // 2. Status Filters
      const matchStatus = selectedStatuses.length === 0 || selectedStatuses.includes(asset.status);

      // 3. Priority Filters
      const matchPriority = selectedPriorities.length === 0 || selectedPriorities.includes(asset.priority);

      // 4. Category Filter
      const matchCategory = selectedCategory === 'All' || asset.category === selectedCategory;

      // 5. Neighborhood Filter
      const matchNeighborhood = selectedNeighborhood === 'All' || asset.neighborhood === selectedNeighborhood;

      return matchText && matchStatus && matchPriority && matchCategory && matchNeighborhood;
    });
  }, [assets, searchQuery, selectedStatuses, selectedPriorities, selectedCategory, selectedNeighborhood]);

  // --- SORT & PAGINATION IMPLEMENTATION ---
  const sortedAndPaginatedAssets = useMemo(() => {
    // Clone and Sort
    const sorted = [...filteredAssets].sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      // Handle nested arrays or objects if any, though all here are primitive string/number
      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = (valB as string).toLowerCase();
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    // Paginate
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sorted.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAssets, currentPage, sortField, sortDirection]);

  // Calculate Total Pages
  const totalPages = Math.max(Math.ceil(filteredAssets.length / itemsPerPage), 1);

  // Sync CurrentPage if filters shrink dataset
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [filteredAssets.length, totalPages, currentPage]);

  const handleSort = (field: keyof FieldAsset) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // --- KPI CALCULATIONS ---
  const kpis = useMemo(() => {
    const totalCount = assets.length;
    const urgentCount = assets.filter(a => a.status === 'urgent').length;
    const pendingCount = assets.filter(a => a.status === 'pending').length;
    const repairedCount = assets.filter(a => a.status === 'repaired' || a.status === 'active').length;
    
    const rate = totalCount > 0 ? Math.round((repairedCount / totalCount) * 100) : 0;
    
    return {
      total: totalCount,
      urgent: urgentCount,
      pending: pendingCount,
      completionRate: rate
    };
  }, [assets]);

  // --- OPERATIONAL PANEL ACTIONS (MUTATIONS) ---
  const handleUpdateStatus = (newStatus: 'active' | 'pending' | 'repaired' | 'urgent' | 'closed') => {
    if (!selectedAsset) return;

    const actionDescription = `Status updated manually to ${newStatus.toUpperCase()}`;
    const newLog = {
      date: new Date().toISOString(),
      action: actionDescription,
      technician: "HQ Dispatcher"
    };

    const updatedAssets = assets.map(a => {
      if (a.id === selectedAsset.id) {
        const updated = {
          ...a,
          status: newStatus,
          lastServiced: newLog.date,
          history: [newLog, ...a.history]
        };
        // Update selected asset reference
        setSelectedAsset(updated);
        return updated;
      }
      return a;
    });

    setAssets(updatedAssets);
    showNotification(
      `${selectedAsset.id} Updated`, 
      `Asset status changed to ${newStatus.toUpperCase()}. History log recorded.`
    );
  };

  const handleDispatchTechnician = () => {
    if (!selectedAsset) return;

    const techniciansList = ["Marcus Vance", "Elena Rostova", "Sarah Jenkins", "David K.", "Kenji Takahashi"];
    const randomTech = techniciansList[Math.floor(Math.random() * techniciansList.length)];

    const actionDescription = `Technician dispatched to site for field inspection`;
    const newLog = {
      date: new Date().toISOString(),
      action: actionDescription,
      technician: randomTech
    };

    const updatedAssets = assets.map(a => {
      if (a.id === selectedAsset.id) {
        const updated = {
          ...a,
          technician: randomTech,
          status: 'pending' as const, // Change status to pending once tech is dispatched
          history: [newLog, ...a.history]
        };
        setSelectedAsset(updated);
        return updated;
      }
      return a;
    });

    setAssets(updatedAssets);
    showNotification(
      "Technician Dispatched", 
      `${randomTech} has been assigned to ${selectedAsset.name} (${selectedAsset.id}).`
    );
  };

  // --- SIMULATION OF EMERGENCY FIELD EVENT ---
  const handleSimulateEmergency = () => {
    // Select a random asset that is currently active or repaired
    const eligibleAssets = assets.filter(a => a.status !== 'urgent');
    if (eligibleAssets.length === 0) return;

    const randomAsset = eligibleAssets[Math.floor(Math.random() * eligibleAssets.length)];
    const failureLogs = [
      "Telemetry alerts pipeline pressure drop",
      "Thermal sensor detects critical temperature threshold exceedance",
      "Power fluctuations reported by automated SCADA sensors",
      "Gas sniffer triggers concentration alarm threshold"
    ];
    const randomLog = failureLogs[Math.floor(Math.random() * failureLogs.length)];

    const newLog = {
      date: new Date().toISOString(),
      action: `CRITICAL ALERT: ${randomLog}`,
      technician: "Automated SCADA Sensor"
    };

    const updatedAssets = assets.map(a => {
      if (a.id === randomAsset.id) {
        const updated = {
          ...a,
          status: 'urgent' as const,
          priority: 'critical' as const,
          history: [newLog, ...a.history]
        };
        // Auto-select and show detail
        setSelectedAsset(updated);
        setActiveTab('details');
        return updated;
      }
      return a;
    });

    setAssets(updatedAssets);
    showNotification(
      "CRITICAL SCADA ALERT", 
      `Emergency event triggered on ${randomAsset.id} - ${randomAsset.name}. Dispatch technician immediately.`
    );
  };

  // Reset to original mock data
  const handleResetDatabase = () => {
    setAssets(JSON.parse(JSON.stringify(mockData)));
    setSelectedAsset(null);
    setActiveTab('filters');
    showNotification("Database Reset", "The dashboard dataset has been reset to original mock operational records.");
  };

  // --- DATA IMPORT / EXPORT LOGIC ---
  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filteredAssets, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `gis_filtered_assets_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showNotification("Data Exported", `${filteredAssets.length} filtered assets downloaded in JSON format.`);
  };

  const handleExportCSV = () => {
    // Construct CSV header
    const headers = ["id", "name", "category", "status", "priority", "latitude", "longitude", "neighborhood", "technician", "lastServiced", "description"];
    const csvRows = [
      headers.join(','),
      ...filteredAssets.map(asset => {
        return headers.map(header => {
          const val = asset[header as keyof FieldAsset];
          // Escape quotes in descriptions or names
          if (typeof val === 'string') {
            return `"${val.replace(/"/g, '""')}"`;
          }
          return val;
        }).join(',');
      })
    ];

    const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(csvRows.join('\n'));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", csvContent);
    downloadAnchor.setAttribute("download", `gis_filtered_assets_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showNotification("Data Exported", `${filteredAssets.length} filtered assets downloaded in CSV format.`);
  };

  // Custom File Import Handler (CSV / JSON)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileReader = new FileReader();
    fileReader.onload = (event) => {
      const content = event.target?.result as string;
      try {
        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(content);
          if (!Array.isArray(parsed)) throw new Error("JSON must be an array of asset objects.");
          
          // Verify basic schema
          parsed.forEach((item, index) => {
            if (!item.id || !item.name || !item.latitude || !item.longitude || !item.status) {
              throw new Error(`Item at index ${index} is missing required fields (id, name, latitude, longitude, status).`);
            }
          });

          setAssets(parsed);
          setSelectedAsset(null);
          setActiveTab('filters');
          showNotification("Import Successful", `Loaded ${parsed.length} assets from JSON config.`);
        } else if (file.name.endsWith('.csv')) {
          const parsed = parseCSV(content);
          setAssets(parsed);
          setSelectedAsset(null);
          setActiveTab('filters');
          showNotification("Import Successful", `Loaded ${parsed.length} assets from CSV database.`);
        } else {
          throw new Error("Unsupported file format. Please upload .json or .csv files.");
        }
      } catch (err: any) {
        showNotification("Import Failed", err.message || "Could not parse files. Check file structures.");
      }
    };
    fileReader.readAsText(file);
    // Clear input selection
    e.target.value = '';
  };

  // CSV Parser implementation
  const parseCSV = (text: string): FieldAsset[] => {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    if (lines.length < 2) throw new Error("Invalid CSV format. Missing rows.");
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
    
    // Validate required headers
    const required = ['id', 'name', 'category', 'status', 'priority', 'latitude', 'longitude', 'neighborhood'];
    required.forEach(col => {
      if (!headers.includes(col)) throw new Error(`Missing required CSV header: ${col}`);
    });

    return lines.slice(1).map((line, idx) => {
      const values: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim());

      const record: any = {};
      headers.forEach((header, index) => {
        let val = values[index] ? values[index].replace(/^["']|["']$/g, '') : '';
        record[header] = val;
      });

      const lat = parseFloat(record.latitude);
      const lng = parseFloat(record.longitude);
      if (isNaN(lat) || isNaN(lng)) {
        throw new Error(`Row ${idx + 2}: Coordinates (latitude/longitude) must be numbers.`);
      }

      return {
        id: record.id || `AST-${1050 + idx}`,
        name: record.name || 'Unnamed Asset',
        category: record.category || 'Water',
        status: (record.status || 'active') as any,
        priority: (record.priority || 'medium') as any,
        latitude: lat,
        longitude: lng,
        neighborhood: record.neighborhood || 'Unknown Area',
        technician: record.technician || 'Unassigned',
        lastServiced: record.lastServiced || new Date().toISOString(),
        description: record.description || 'No description provided.',
        history: record.history ? JSON.parse(record.history) : [
          { date: new Date().toISOString(), action: 'Imported via CSV portal', technician: 'System dispatcher' }
        ]
      };
    });
  };

  // Sync dynamic tab switches: if selectedAsset is selected, auto-switch tab to Details
  const handleSelectAsset = (asset: FieldAsset) => {
    setSelectedAsset(asset);
    setActiveTab('details');
  };

  return (
    <div className={theme === 'light' ? 'light-theme' : ''} style={{ minHeight: '100vh', background: 'var(--bg-main)', color: 'var(--text-primary)', transition: 'background var(--transition-normal), color var(--transition-normal)' }}>
      <div className="dashboard-wrapper">
        {/* HEADER SECTION */}
        <header className="dashboard-header">
          <div className="brand-section">
            <h1 className="brand-title">
              <Activity style={{ color: 'var(--accent)' }} size={24} />
              GIS Field Operations & Asset Tracking
            </h1>
            <span className="brand-subtitle">Dispatcher Console v1.2.0 • Real-time Infrastructure Monitoring</span>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button 
              className="btn" 
              onClick={toggleTheme} 
              title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'} 
              style={{ width: '40px', height: '40px', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', flex: 'none' }}
            >
              {theme === 'dark' ? <Sun size={18} style={{ color: '#eab308' }} /> : <Moon size={18} style={{ color: '#2563eb' }} />}
            </button>
            <button className="btn" onClick={handleSimulateEmergency} style={{ borderColor: 'var(--status-urgent)' }}>
              <AlertTriangle style={{ color: 'var(--status-urgent)' }} size={16} />
              Trigger SCADA Alarm
            </button>
            <button className="btn" onClick={handleResetDatabase}>
              <RefreshCw size={16} />
              Reset Data
            </button>
          </div>
        </header>

      {/* KPI WIDGETS DECK */}
      <section className="kpi-deck">
        <div className="kpi-card active-kpi">
          <div className="kpi-info">
            <span className="kpi-label">TOTAL ASSETS</span>
            <span className="kpi-value">{kpis.total}</span>
          </div>
          <div className="kpi-icon-wrapper">
            <MapPin size={20} />
          </div>
        </div>

        <div className="kpi-card urgent">
          <div className="kpi-info">
            <span className="kpi-label">URGENT CASES</span>
            <span className="kpi-value">{kpis.urgent}</span>
          </div>
          <div className="kpi-icon-wrapper">
            <AlertTriangle size={20} />
          </div>
        </div>

        <div className="kpi-card pending">
          <div className="kpi-info">
            <span className="kpi-label">PENDING WORK ORDERS</span>
            <span className="kpi-value">{kpis.pending}</span>
          </div>
          <div className="kpi-icon-wrapper">
            <Clock size={20} />
          </div>
        </div>

        <div className="kpi-card repaired">
          <div className="kpi-info">
            <span className="kpi-label">OPERATIONAL UPTIME</span>
            <span className="kpi-value">{kpis.completionRate}%</span>
          </div>
          <div className="kpi-icon-wrapper">
            <CheckCircle size={20} />
          </div>
        </div>
      </section>

      {/* HORIZONTAL OPERATIONAL FILTERS TOOLBAR */}
      <section className="filters-toolbar-box">
        {/* Search Input */}
        <div className="toolbar-item search">
          <span className="toolbar-label">Search Index</span>
          <div className="search-input-wrapper">
            <Search className="search-icon" size={14} />
            <input 
              type="text" 
              className="search-input" 
              placeholder="Search ID, name, technician..."
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              style={{ padding: '8px 10px 8px 34px', fontSize: '0.8rem' }}
            />
          </div>
        </div>

        {/* Category Sector Selector */}
        <div className="toolbar-item select-field">
          <span className="toolbar-label">Utility Sector</span>
          <select 
            className="filter-select"
            value={selectedCategory}
            onChange={e => { setSelectedCategory(e.target.value); setCurrentPage(1); }}
            style={{ padding: '8px 10px', fontSize: '0.8rem' }}
          >
            <option value="All">All Sectors</option>
            <option value="Water">Water</option>
            <option value="Electrical">Electrical</option>
            <option value="Telecom">Telecom</option>
            <option value="Gas">Gas</option>
          </select>
        </div>

        {/* Neighborhood Selector */}
        <div className="toolbar-item select-field">
          <span className="toolbar-label">Neighborhood</span>
          <select 
            className="filter-select"
            value={selectedNeighborhood}
            onChange={e => { setSelectedNeighborhood(e.target.value); setCurrentPage(1); }}
            style={{ padding: '8px 10px', fontSize: '0.8rem' }}
          >
            <option value="All">All Regions</option>
            {neighborhoodList.map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>

        {/* Status Pills */}
        <div className="toolbar-item pills-field">
          <div className="toolbar-label" style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <span>Status</span>
            {selectedStatuses.length > 0 && <span style={{ color: 'var(--accent)', cursor: 'pointer', fontSize: '0.65rem' }} onClick={() => setSelectedStatuses([])}>Clear</span>}
          </div>
          <div className="toolbar-pills">
            {['active', 'pending', 'repaired', 'urgent', 'closed'].map(st => (
              <button 
                key={st} 
                className={`toolbar-pill ${selectedStatuses.includes(st) ? `active status-${st}` : ''}`}
                onClick={() => toggleStatusFilter(st)}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Priority Pills */}
        <div className="toolbar-item pills-field" style={{ flex: 1.5 }}>
          <div className="toolbar-label" style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <span>Priority</span>
            {selectedPriorities.length > 0 && <span style={{ color: 'var(--accent)', cursor: 'pointer', fontSize: '0.65rem' }} onClick={() => setSelectedPriorities([])}>Clear</span>}
          </div>
          <div className="toolbar-pills">
            {['low', 'medium', 'high', 'critical'].map(pr => (
              <button 
                key={pr} 
                className={`toolbar-pill ${selectedPriorities.includes(pr) ? 'active' : ''}`}
                onClick={() => togglePriorityFilter(pr)}
              >
                {pr}
              </button>
            ))}
          </div>
        </div>

        {/* Reset Button */}
        {(searchQuery || selectedStatuses.length > 0 || selectedPriorities.length > 0 || selectedCategory !== 'All' || selectedNeighborhood !== 'All') && (
          <button className="btn" onClick={handleResetFilters} style={{ padding: '8px 12px', fontSize: '0.8rem', alignSelf: 'flex-end', height: '36px' }}>
            Clear Filters
          </button>
        )}
      </section>

      {/* MAIN MIDDLE CONTENT SPLIT */}
      <section className="middle-grid">
        {/* MAP COMPONENT BOX */}
        <div className="map-container-box">
          <OperationsMap 
            assets={filteredAssets} 
            selectedAsset={selectedAsset} 
            onSelectAsset={handleSelectAsset} 
            theme={theme}
          />
        </div>

        {/* RIGHT SIDE DETAILS / FILTERS TABBED BOX */}
        <div className="right-panel-box">
          {/* TABS */}
          <nav className="panel-tabs">
            <button 
              className={`panel-tab ${activeTab === 'filters' ? 'active' : ''}`}
              onClick={() => setActiveTab('filters')}
            >
              <Activity size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
              System Analytics
            </button>
            <button 
              className={`panel-tab ${activeTab === 'details' ? 'active' : ''}`}
              onClick={() => setActiveTab('details')}
            >
              <Info size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
              Asset Details
            </button>
            <button 
              className={`panel-tab ${activeTab === 'utility' ? 'active' : ''}`}
              onClick={() => setActiveTab('utility')}
            >
              <Upload size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
              Data Import/Export
            </button>
          </nav>

          {/* TAB CONTENTS */}
          <div className="panel-content">
            {/* TAB 1: SYSTEM ANALYTICS */}
            {activeTab === 'filters' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-secondary)' }}>System Metrics & Telemetry</h3>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Real-time spatial aggregates</span>
                </div>
                <SVGCharts 
                  assets={filteredAssets} 
                  selectedCategory={selectedCategory} 
                  onSelectCategory={setSelectedCategory} 
                />
                
                {/* Enterprise diagnostic indicators - fits cleanly without scroll */}
                <div style={{ 
                  background: 'rgba(255, 255, 255, 0.02)', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: 'var(--radius-md)', 
                  padding: '10px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  marginTop: '4px'
                }}>
                  <span style={{ fontSize: '0.65rem', fontWeight: '700', color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>DIAGNOSTIC STATUS LEDGER</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>SCADA Network Integrity:</span>
                      <span style={{ color: 'var(--status-active)', fontWeight: '600' }}>99.98% (Online)</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Active Technicians in Field:</span>
                      <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>5 Dispatched</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Avg Incident Resolution Time:</span>
                      <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>34 mins</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: SELECTED ASSET DETAIL PANEL */}
            {activeTab === 'details' && (
              selectedAsset ? (
                <div className="asset-detail-card">
                  <div className="detail-header">
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <div className="detail-id-category">
                        <span className="asset-id-badge">{selectedAsset.id}</span>
                        <span className="category-badge">{selectedAsset.category}</span>
                      </div>
                      <h2 className="detail-title">{selectedAsset.name}</h2>
                    </div>
                    <span className={`status-indicator ${selectedAsset.status}`}>
                      {selectedAsset.status}
                    </span>
                  </div>

                  <p className="detail-desc">{selectedAsset.description}</p>

                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="detail-item-label">REGION AREA</span>
                      <span className="detail-item-value">{selectedAsset.neighborhood}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-item-label">PRIORITY LEVEL</span>
                      <span className={`detail-item-value priority-${selectedAsset.priority}`}>
                        {selectedAsset.priority}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-item-label">FIELD TECHNICIAN</span>
                      <span className="detail-item-value" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <User size={12} />
                        {selectedAsset.technician || 'Unassigned'}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-item-label">COORDINATES</span>
                      <span className="detail-item-value" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                        {selectedAsset.latitude.toFixed(4)}, {selectedAsset.longitude.toFixed(4)}
                      </span>
                    </div>
                  </div>

                  {/* ACTION TRIGGER BUTTONS */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div className="detail-item-label" style={{ marginBottom: '-4px' }}>OPERATIONAL ACTIONS</div>
                    <div className="detail-actions">
                      <button className="btn btn-primary" onClick={handleDispatchTechnician}>
                        <Wrench size={14} />
                        Dispatch Technician
                      </button>
                      
                      {selectedAsset.status === 'urgent' ? (
                        <button className="btn btn-primary" style={{ backgroundColor: 'var(--status-active)', borderColor: 'var(--status-active)' }} onClick={() => handleUpdateStatus('repaired')}>
                          <CheckCircle size={14} />
                          Resolve / Repair
                        </button>
                      ) : (
                        <button className="btn btn-danger" onClick={() => handleUpdateStatus('urgent')}>
                          <AlertTriangle size={14} />
                          Report Emergency
                        </button>
                      )}
                    </div>
                    {selectedAsset.status !== 'active' && selectedAsset.status !== 'urgent' && selectedAsset.status !== 'repaired' && (
                      <button className="btn" onClick={() => handleUpdateStatus('active')}>
                        Set Status: Active
                      </button>
                    )}
                    {selectedAsset.status === 'repaired' && (
                      <button className="btn" onClick={() => handleUpdateStatus('active')}>
                        Complete Cycle (Set Active)
                      </button>
                    )}
                  </div>

                  {/* MAINTENANCE LOG TIMELINE */}
                  <div className="timeline-section">
                    <div className="detail-item-label">MAINTENANCE HISTORY</div>
                    <div className="timeline-list">
                      {selectedAsset.history.map((log, index) => (
                        <div className="timeline-node" key={index}>
                          <div className="timeline-dot"></div>
                          <div className="timeline-meta">
                            <span>{new Date(log.date).toLocaleDateString()} {new Date(log.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            <span>{log.technician}</span>
                          </div>
                          <div className="timeline-action">{log.action}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="empty-state">
                  <MapPin size={32} style={{ color: 'var(--text-muted)' }} />
                  <span>Select an asset from the map or table to view operations logs and dispatch field staff.</span>
                </div>
              )
            )}

            {/* TAB 3: DATA IMPORT/EXPORT UTILITY PANEL */}
            {activeTab === 'utility' && (
              <div className="import-export-card">
                <div className="filter-group">
                  <div className="filter-label">Import Asset Configuration Database</div>
                  <div className="upload-zone">
                    <Upload className="upload-icon" size={24} />
                    <span className="upload-text">Drag & drop database file, or <strong>browse files</strong></span>
                    <span className="upload-sub">Supports CSV or JSON (Seattle bounds recommended)</span>
                    <input 
                      type="file" 
                      className="file-input" 
                      accept=".json,.csv"
                      onChange={handleFileUpload} 
                    />
                  </div>
                </div>

                <div className="filter-group" style={{ marginTop: '10px' }}>
                  <div className="filter-label">Export Filtered Operations Report</div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                    Downloads current list ({filteredAssets.length} matching rows) formatted with geographic coords and active status logs.
                  </p>
                  <div className="export-grid">
                    <button className="btn" onClick={handleExportJSON}>
                      <Download size={14} />
                      Export JSON
                    </button>
                    <button className="btn" onClick={handleExportCSV}>
                      <FileSpreadsheet size={14} />
                      Export CSV
                    </button>
                  </div>
                </div>

                <div className="filter-group" style={{ marginTop: '10px' }}>
                  <div className="filter-label" style={{ color: 'var(--status-urgent)' }}>Factory Diagnostic Clean</div>
                  <button className="btn" onClick={handleResetDatabase} style={{ alignSelf: 'flex-start' }}>
                    <RefreshCw size={14} />
                    Reset to Factory Mock Data
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* LOWER SECTION: ASSETS DATA TABLE */}
      <section className="table-section-box">
        <div className="table-header-row">
          <div className="table-title-count">
            <h2 className="table-title">Operational Asset Records</h2>
            <span className="table-count-badge">
              Showing {filteredAssets.length} of {assets.length} assets
            </span>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn" onClick={handleExportCSV} style={{ padding: '6px 12px', fontSize: '0.75rem' }}>
              <Download size={12} />
              Quick CSV
            </button>
          </div>
        </div>

        <div className="table-scroll-container">
          <table className="assets-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('id')}>
                  ASSET ID {sortField === 'id' && (sortDirection === 'asc' ? '▲' : '▼')}
                </th>
                <th onClick={() => handleSort('name')}>
                  NAME {sortField === 'name' && (sortDirection === 'asc' ? '▲' : '▼')}
                </th>
                <th onClick={() => handleSort('category')}>
                  CATEGORY {sortField === 'category' && (sortDirection === 'asc' ? '▲' : '▼')}
                </th>
                <th onClick={() => handleSort('status')}>
                  OPERATIONAL STATUS {sortField === 'status' && (sortDirection === 'asc' ? '▲' : '▼')}
                </th>
                <th onClick={() => handleSort('priority')}>
                  PRIORITY {sortField === 'priority' && (sortDirection === 'asc' ? '▲' : '▼')}
                </th>
                <th onClick={() => handleSort('neighborhood')}>
                  AREA {sortField === 'neighborhood' && (sortDirection === 'asc' ? '▲' : '▼')}
                </th>
                <th onClick={() => handleSort('technician')}>
                  TECHNICIAN {sortField === 'technician' && (sortDirection === 'asc' ? '▲' : '▼')}
                </th>
                <th onClick={() => handleSort('lastServiced')}>
                  LAST SERVICED {sortField === 'lastServiced' && (sortDirection === 'asc' ? '▲' : '▼')}
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedAndPaginatedAssets.map(asset => {
                const isSelected = selectedAsset && selectedAsset.id === asset.id;
                return (
                  <tr 
                    key={asset.id} 
                    className={isSelected ? 'selected' : ''}
                    onClick={() => handleSelectAsset(asset)}
                  >
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: '600' }}>{asset.id}</td>
                    <td style={{ fontWeight: '500' }}>{asset.name}</td>
                    <td>{asset.category}</td>
                    <td>
                      <div className="status-dot-text">
                        <span className={`status-dot ${asset.status}`}></span>
                        {asset.status}
                      </div>
                    </td>
                    <td>
                      <span className={`priority-badge ${asset.priority}`}>
                        {asset.priority}
                      </span>
                    </td>
                    <td>{asset.neighborhood}</td>
                    <td>{asset.technician || 'Unassigned'}</td>
                    <td>{new Date(asset.lastServiced).toLocaleDateString()}</td>
                  </tr>
                );
              })}
              {sortedAndPaginatedAssets.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '30px' }}>
                    No matching asset configurations found matching current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION PANEL */}
        <div className="pagination-row">
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <div className="pagination-controls">
            <button 
              className="page-btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
            >
              ◀
            </button>
            <button 
              className="page-btn"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => prev + 1)}
            >
              ▶
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer-text">
        GIS Field Operations & Asset Tracking Console • Created for Freelance Demo Showcase • Built using Next.js & Leaflet GIS
      </footer>

      {/* FLOATING REAL-TIME NOTIFICATION BUBBLE */}
      {notification && (
        <div className="notif-bubble">
          <Activity size={18} style={{ color: 'var(--accent)', marginTop: '2px', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div className="notif-title">{notification.title}</div>
            <div className="notif-desc">{notification.desc}</div>
          </div>
          <button 
            onClick={() => setNotification(null)}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  </div>
);
}
