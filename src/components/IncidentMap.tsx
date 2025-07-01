'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, useMap, useMapEvents, Polyline } from 'react-leaflet'
import L from 'leaflet'
import html2canvas from 'html2canvas'
import 'leaflet/dist/leaflet.css'

// Types
type IncidentType = 'auto' | 'persoon' | 'afzetting' | 'fiets' | 'motor' | 'vrachtwagen' | 'bus' | 'tram' | 'trein' | 'ambulance' | 'politie' | 'brandweer' | 'verkeersbord' | 'stoplicht' | 'verkeerslicht' | 'wegafsluiting' | 'omleiding' | 'file' | 'ongeval' | 'werkzaamheden' | 'haaitanden' | 'voorrang' | 'stopbord' | 'snelheidslimiet' | 'tekstblok' | 'scooter' | 'voetganger' | 'pion' | 'wegblokkade' | 'bord-werkzaamheden' | 'bord-voetganger' | 'bord-werk-uitvoering' | 'pijl-rechts' | 'pijl-links' | 'pijl-tweekanten' | 'pijl-basis' | 'hek' | 'snelweg-bord' | 'fietsverbod' | 'parkeerverbod' | 'no-parking' | 'lantaarn' | 'geslotenverklaring'

type MapLayer = 'street' | 'satellite' | 'hybrid'

type ToolbarCategory = 'snel' | 'voertuigen' | 'hulpdiensten' | 'mensen' | 'objecten' | 'verkeer' | 'situaties' | 'pijlen' | 'borden' | 'tekst' | 'tekenen'

interface Incident {
  type: IncidentType
  position: [number, number]
  id: string
  timestamp: string
  description?: string
  rotation: number
  scale: number
  text?: string // For text blocks
  flipped?: boolean // For mirroring/flipping icons
}

interface DrawnLine {
  id: string
  positions: [number, number][]
  color: string
  weight: number
  timestamp: string
}

interface SearchResult {
  display_name: string
  lat: string
  lon: string
  place_id: string
}

// Icon mapping voor alle beschikbare SVG iconen
const iconMap: Record<string, string> = {
  // VOERTUIGEN
  'auto': '/icons/Voertuig - auto.svg',
  'motor': '/icons/Voertuig - motor.svg',
  'scooter': '/icons/Voertuig - scooter.svg',
  'vrachtwagen': '/icons/Voertuigen - vrachtwagen.svg',
  'fiets': '/icons/voertuig - fiets.svg',
  'bus': '/icons/voertuig - bus.svg',
  'tram': '/icons/Voertuig - tram.svg',
  'trein': '/icons/voertuig - trein.svg',
  
  // MENSEN
  'persoon': '/icons/Voertuig - voetganger.svg',
  'voetganger': '/icons/Voertuig - voetganger.svg',
  
  // HULPDIENSTEN  
  'ambulance': '/icons/Ambulance.svg',
  'politie': '/icons/Hulpdienst - politie.svg',
  'brandweer': '/icons/Hulpdiensten - brandweer.svg',
  
  // OBJECTEN
  'pion': '/icons/Object Pion.svg',
  'verkeerslicht': '/icons/Object -verkeerslicht.svg',
  'hek': '/icons/object - Hek.svg',
  'afzetting': '/icons/Hekwerk.svg',
  'lantaarn': '/icons/Object - lantaarn.svg',
  'file': '/icons/Object - file.svg',
  'ongeval': '/icons/Object - ongeval.svg',
  
  // TRAFFIC SIGNS - Verkeersborden
  'haaitanden': '/icons/Sign - Bord haaientanden.svg',
  'voorrang': '/icons/Sign - bord voorrang.svg',
  'stopbord': '/icons/Sign - stop.svg',
  'snelheidslimiet': '/icons/Snelheid - 50.svg',
  'bord-voetganger': '/icons/sign - voetganger.svg',
  'bord-werkzaamheden': '/icons/Bord - wegwerkzaamheden.svg',
  'snelweg-bord': '/icons/Sign - snelweg.svg',
  'fietsverbod': '/icons/Sign - verboden te fietsen.svg',
  'parkeerverbod': '/icons/Sign - parkeerverbod.svg',
  'no-parking': '/icons/Sign - no parking.svg',
  'geslotenverklaring': '/icons/Sign - geslotenverklaring.svg',
  
  // PIJLEN - Echte SVG pijlen
  'pijl-rechts': '/icons/Pijlen - rechts.svg',
  'pijl-links': '/icons/Pijlen - links.svg', 
  'pijl-tweekanten': '/icons/Pijlen - tweekanten.svg',
  'pijl-basis': '/icons/Pijlen - pijl 1.svg'
}

// PNG Icon creator - Clean version with only the icon itself
const createPngIcon = (iconPath: string, rotation: number = 0, scale: number = 1, isSelected: boolean = false, flipped: boolean = false) => {
  const size = Math.round(32 * scale)
  const flipTransform = flipped ? 'scaleX(-1)' : 'scaleX(1)'
  const selectedOutline = isSelected ? '3px solid #2563eb' : 'none'
  const selectedShadow = isSelected ? '0 0 0 2px rgba(37,99,235,0.3)' : 'none'
  
  return L.divIcon({
    html: `<img src="${iconPath}" style="
      width: ${size}px; 
      height: ${size}px; 
      object-fit: contain; 
      transform: rotate(${rotation}deg) ${flipTransform};
      cursor: pointer;
      outline: ${selectedOutline};
      outline-offset: 2px;
      box-shadow: ${selectedShadow};
      ${isSelected ? 'filter: brightness(1.1) drop-shadow(0 2px 8px rgba(37,99,235,0.4));' : ''}
      transition: all 0.2s ease;
    " />`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    className: 'custom-div-icon'
  })
}

// Text block icon
const createTextIcon = (text: string = 'TEXT', rotation: number = 0, scale: number = 1, isSelected: boolean = false, flipped: boolean = false) => {
  const width = Math.max(80, text.length * 8) * scale
  const height = Math.round(40 * scale)
  const fontSize = Math.round(14 * scale)
  const flipTransform = flipped ? 'scaleX(-1)' : 'scaleX(1)'
  
  return L.divIcon({
    html: `<div style="
      background: white;
      border: 2px solid ${isSelected ? '#ff4444' : '#333'};
      border-radius: 4px;
      padding: 6px 8px;
      font-size: ${fontSize}px;
      font-weight: bold;
      color: #333;
      text-align: center;
      min-width: ${width}px;
      height: ${height}px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      transform: rotate(${rotation}deg) ${flipTransform};
      ${isSelected ? 'animation: pulse 2s infinite;' : ''}
      cursor: pointer;
      white-space: nowrap;
      overflow: hidden;
    ">${text}</div>`,
    iconSize: [width, height],
    iconAnchor: [width / 2, height / 2],
    className: 'custom-div-icon'
  })
}

// Uitgebreide icon set voor verkeerssituaties
const createIcon = (html: string, bgColor: string = 'white', borderColor: string = '#333', rotation: number = 0, scale: number = 1, isSelected: boolean = false, flipped: boolean = false) => {
  const size = Math.round(32 * scale)
  const selectedBorder = isSelected ? '#ff4444' : borderColor
  const selectedWidth = isSelected ? '3px' : '2px'
  const flipTransform = flipped ? 'scaleX(-1)' : 'scaleX(1)'
  
  return L.divIcon({
    html: `<div style="
      background: ${bgColor}; 
      border-radius: 50%; 
      padding: ${Math.round(4 * scale)}px; 
      border: ${selectedWidth} solid ${selectedBorder}; 
      box-shadow: 0 2px 4px rgba(0,0,0,0.3); 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      width: ${size}px; 
      height: ${size}px; 
      font-size: ${Math.round(16 * scale)}px;
      transform: rotate(${rotation}deg) ${flipTransform};
      ${isSelected ? 'animation: pulse 2s infinite;' : ''}
      cursor: pointer;
    ">${html}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    className: 'custom-div-icon'
  })
}

// Icon creator dispatcher
const createIconForIncident = (incident: Incident, isSelected: boolean = false) => {
  if (incident.type === 'tekstblok') {
    return createTextIcon(incident.text || 'TEKSTBLOK', incident.rotation, incident.scale, isSelected, incident.flipped)
  }
  
  if (incident.type.startsWith('pijl-')) {
    // Gebruik SVG pijlen via iconMap
    if (iconMap[incident.type]) {
      return createPngIcon(iconMap[incident.type], incident.rotation, incident.scale, isSelected, incident.flipped)
    }
  }
  
  // Voor alle andere types gebruik iconMap
  if (iconMap[incident.type]) {
    return createPngIcon(iconMap[incident.type], incident.rotation, incident.scale, isSelected, incident.flipped)
  }
  
  // Fallback
  return createIcon('?', '#f0f0f0', '#666', incident.rotation, incident.scale, isSelected, incident.flipped)
}

// Drawing Handler Component voor lijnen tekenen
function DrawingHandler({ 
  isDrawing, 
  onAddLine, 
  drawingColor,
  lineWeight 
}: { 
  isDrawing: boolean
  onAddLine: (line: DrawnLine) => void
  drawingColor: string
  lineWeight: number
}) {
  const [currentLine, setCurrentLine] = useState<[number, number][]>([])
  const [isDrawingActive, setIsDrawingActive] = useState(false)
  
  const map = useMapEvents({
    mousedown: (e) => {
      if (isDrawing) {
        // Disable map dragging during drawing
        map.dragging.disable()
        map.touchZoom.disable()
        map.doubleClickZoom.disable()
        map.scrollWheelZoom.disable()
        map.boxZoom.disable()
        map.keyboard.disable()
        
        setIsDrawingActive(true)
        setCurrentLine([[e.latlng.lat, e.latlng.lng] as [number, number]])
        
        // Prevent event propagation
        L.DomEvent.stopPropagation(e)
        e.originalEvent?.preventDefault()
      }
    },
    mousemove: (e) => {
      if (isDrawing && isDrawingActive) {
        setCurrentLine(prev => [...prev, [e.latlng.lat, e.latlng.lng] as [number, number]])
        L.DomEvent.stopPropagation(e)
      }
    },
    mouseup: (e) => {
      if (isDrawing && isDrawingActive) {
        // Re-enable map dragging
        map.dragging.enable()
        map.touchZoom.enable()
        map.doubleClickZoom.enable()
        map.scrollWheelZoom.enable()
        map.boxZoom.enable()
        map.keyboard.enable()
        
        if (currentLine.length > 1) {
          const newLine: DrawnLine = {
            id: `line-${Date.now()}-${Math.random()}`,
            positions: currentLine,
            color: drawingColor,
            weight: lineWeight,
            timestamp: new Date().toISOString()
          }
          onAddLine(newLine)
        }
        
        setCurrentLine([])
        setIsDrawingActive(false)
        L.DomEvent.stopPropagation(e)
      }
    }
  })

  // Use useEffect to manage cursor style
  useEffect(() => {
    if (map) {
      const container = map.getContainer()
      if (isDrawing) {
        container.style.cursor = 'crosshair'
      } else {
        container.style.cursor = ''
      }
    }
  }, [isDrawing, map])

  return (
    <>
      {/* Render current line being drawn */}
      {isDrawingActive && currentLine.length > 1 && (
        <Polyline
          positions={currentLine}
          color={drawingColor}
          weight={lineWeight}
          opacity={0.6}
          dashArray="5, 5"
        />
      )}
    </>
  )
}

// Color Picker Component
function ColorPicker({ 
  selectedColor, 
  onColorChange 
}: { 
  selectedColor: string
  onColorChange: (color: string) => void 
}) {
  const colors = [
    '#FF0000', // Red
    '#00FF00', // Green  
    '#0000FF', // Blue
    '#FFFF00', // Yellow
    '#FF00FF', // Magenta
    '#00FFFF', // Cyan
    '#FFA500', // Orange
    '#800080', // Purple
    '#000000', // Black
    '#808080', // Gray
    '#87CEEB', // Sky Blue
    '#FFB6C1', // Light Pink
  ]

  return (
    <div className="color-picker">
      <div className="color-grid">
        {colors.map((color) => (
          <button
            key={color}
            className={`color-swatch ${selectedColor === color ? 'selected' : ''}`}
            style={{ backgroundColor: color }}
            onClick={() => onColorChange(color)}
            title={color}
          />
        ))}
      </div>
    </div>
  )
}

// Enhanced map click handler with improved selection logic
function MapClickHandler({ 
  onAddIncident,
  onShowContextMenu,
  onSelectIncident,
  selectedIncident,
  incidents,
  selectedTool,
  isDrawingMode
}: { 
  onAddIncident: (incident: Incident) => void
  onShowContextMenu: (position: [number, number], clientX: number, clientY: number) => void
  onSelectIncident: (incident: Incident | null) => void
  selectedIncident: Incident | null
  incidents: Incident[]
  selectedTool: IncidentType | null
  isDrawingMode: boolean
}) {
  const map = useMapEvents({
    contextmenu: (e: L.LeafletMouseEvent) => {
      // Don't show context menu while drawing
      if (isDrawingMode) return
      
      e.originalEvent.preventDefault()
      onShowContextMenu(
        [e.latlng.lat, e.latlng.lng], 
        e.originalEvent.clientX, 
        e.originalEvent.clientY
      )
    },
    click: (e: L.LeafletMouseEvent) => {
      // Don't handle clicks while drawing
      if (isDrawingMode) return
      
      console.log('Map clicked:', { 
        selectedTool, 
        position: [e.latlng.lat, e.latlng.lng],
        isDrawingMode 
      })
      
      // Priority 1: If we have a tool selected, ALWAYS place a new incident
      if (selectedTool) {
        console.log('Placing new incident with tool:', selectedTool)
        const newIncident: Incident = {
          type: selectedTool,
          position: [e.latlng.lat, e.latlng.lng],
          id: `${selectedTool}-${Date.now()}-${Math.random()}`,
          timestamp: new Date().toISOString(),
          rotation: 0,
          scale: 1,
          flipped: false,
          text: selectedTool === 'tekstblok' ? 'NIEUW TEKSTBLOK' : undefined
        }
        onAddIncident(newIncident)
        console.log('New incident created:', newIncident)
        // Tool stays selected so user can place multiple icons
        return
      }

      // Priority 2: No tool selected - check if we clicked on an existing incident to edit
      const clickedIncident = incidents.find(incident => {
        const distance = map.distance(e.latlng, incident.position)
        const tolerance = incident.type === 'tekstblok' ? 30 : 15
        return distance < tolerance
      })
      
      if (clickedIncident) {
        console.log('Selecting existing incident:', clickedIncident)
        onSelectIncident(clickedIncident)
        return
      }
      
      // Priority 3: No tool selected and clicked empty space - deselect any selected incident
      console.log('Deselecting incident')
      onSelectIncident(null)
    },
  })

  return null
}

// Enhanced floating toolbar with new categories
function FloatingToolbar({ 
  onAddIncident, 
  selectedTool, 
  onSelectTool,
  currentCategory,
  onSelectCategory,
  onToggleDrawingMode
}: { 
  onAddIncident: (type: IncidentType, position: [number, number]) => void
  selectedTool: IncidentType | null
  onSelectTool: (type: IncidentType | null) => void
  currentCategory: ToolbarCategory
  onSelectCategory: (category: ToolbarCategory) => void
  onToggleDrawingMode: () => void
}) {
  const categories: Record<ToolbarCategory, { icon: string, tools: IncidentType[] }> = {
    snel: { 
      icon: '⚡', 
      tools: ['auto', 'persoon', 'pion', 'pijl-basis', 'tekstblok'] 
    },
    voertuigen: { 
      icon: '🚗', 
      tools: ['auto', 'fiets', 'motor', 'scooter', 'vrachtwagen', 'bus', 'tram', 'trein'] 
    },
    hulpdiensten: { 
      icon: '🚑', 
      tools: ['ambulance', 'politie', 'brandweer'] 
    },
    mensen: { 
      icon: '🚶', 
      tools: ['persoon', 'voetganger'] 
    },
    objecten: { 
      icon: '🎯', 
      tools: ['pion', 'verkeerslicht', 'hek', 'afzetting'] 
    },
    verkeer: { 
      icon: '🚥', 
      tools: ['verkeersbord', 'stoplicht', 'wegafsluiting', 'wegblokkade', 'omleiding'] 
    },
    borden: { 
      icon: '🛑', 
      tools: ['haaitanden', 'voorrang', 'stopbord', 'snelheidslimiet', 'bord-voetganger', 'bord-werkzaamheden', 'bord-werk-uitvoering', 'snelweg-bord', 'fietsverbod', 'parkeerverbod', 'no-parking'] 
    },
    situaties: { 
      icon: '💥', 
      tools: ['file', 'ongeval', 'werkzaamheden'] 
    },
    pijlen: { 
      icon: '➡️', 
      tools: ['pijl-basis', 'pijl-tweekanten'] 
    },
    tekst: { 
      icon: 'T', 
      tools: ['tekstblok'] 
    },
    tekenen: { 
      icon: '✏️', 
      tools: [] 
    }
  }

  const getIconDisplay = (type: IncidentType) => {
    if (type === 'tekstblok') return 'T'
    if (type.startsWith('pijl-')) {
      // Gebruik SVG pijlen via iconMap
      if (iconMap[type]) {
        return `<img src="${iconMap[type]}" style="width: 18px; height: 18px; object-fit: contain;" alt="${type}" />`
      }
      return '➡️'
    }
    
    // Gebruik de centrale icon mapping
    if (iconMap[type]) {
      return `<img src="${iconMap[type]}" style="width: 18px; height: 18px; object-fit: contain;" alt="${type}" />`
    }
    
    return '?'
  }

  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [dropdownOpen])

  return (
    <div className="floating-toolbar">
      {/* Category Dropdown */}
      <div className="category-dropdown-container" ref={dropdownRef}>
        <button
          className="category-dropdown-button"
          onClick={() => setDropdownOpen(!dropdownOpen)}
        >
          <span className="category-display">
            {categories[currentCategory].icon} {
              currentCategory === 'snel' ? 'Snel' :
              currentCategory === 'voertuigen' ? 'Voertuigen' :
              currentCategory === 'hulpdiensten' ? 'Hulpdiensten' :
              currentCategory === 'mensen' ? 'Mensen' :
              currentCategory === 'objecten' ? 'Objecten' :
              currentCategory === 'verkeer' ? 'Verkeer' :
              currentCategory === 'borden' ? 'Borden' :
              currentCategory === 'situaties' ? 'Situaties' :
              currentCategory === 'pijlen' ? 'Pijlen' :
              currentCategory === 'tekenen' ? 'Tekenen' :
              'Tekst'
            }
          </span>
          <span className={`dropdown-arrow ${dropdownOpen ? 'open' : ''}`}>▼</span>
        </button>
        
        {dropdownOpen && (
          <div className="category-dropdown-menu">
            {(Object.keys(categories) as ToolbarCategory[]).map(category => (
              <button
                key={category}
                className={`category-dropdown-item ${currentCategory === category ? 'active' : ''}`}
                onClick={() => {
                  if (category === 'tekenen') {
                    onToggleDrawingMode()
                    setDropdownOpen(false)
                  } else {
                    onSelectCategory(category)
                    setDropdownOpen(false)
                  }
                }}
              >
                <span className="category-icon">{categories[category].icon}</span>
                <span className="category-name">{
                  category === 'snel' ? 'Snel' :
                  category === 'voertuigen' ? 'Voertuigen' :
                  category === 'hulpdiensten' ? 'Hulpdiensten' :
                  category === 'mensen' ? 'Mensen' :
                  category === 'objecten' ? 'Objecten' :
                  category === 'verkeer' ? 'Verkeer' :
                  category === 'borden' ? 'Borden' :
                  category === 'situaties' ? 'Situaties' :
                  category === 'pijlen' ? 'Pijlen' :
                  category === 'tekenen' ? 'Tekenen' :
                  'Tekst'
                }</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Header */}
      <div className="toolbar-header">
        <span className="toolbar-title">Plaats tools</span>
        {selectedTool && (
          <button
            className="clear-selection"
            onClick={() => onSelectTool(null)}
            title="Deselecteer tool"
          >
            ×
          </button>
        )}
      </div>

      {/* Tools Grid - Verbeterde UI */}
      <div className="toolbar-grid">
        {currentCategory === 'tekenen' ? (
          <div className="tekenen-placeholder">
            <div className="tool-item" style={{cursor: 'default', border: '2px dashed #ccc', background: 'linear-gradient(145deg, #f0f8ff 0%, #e6f3ff 100%)'}}>
              <div className="tool-icon" style={{fontSize: '24px'}}>✏️</div>
              <span className="tool-label">Klik hier om de tekenfunctie te activeren</span>
            </div>
            <button
              className="btn-green mt-2"
              onClick={onToggleDrawingMode}
              style={{width: '100%'}}
            >
              🎨 Start tekenen
            </button>
          </div>
        ) : (
          categories[currentCategory].tools.map(tool => (
            <button
              key={tool}
              className={`tool-item ${selectedTool === tool ? 'selected' : ''}`}
              onClick={() => onSelectTool(selectedTool === tool ? null : tool)}
              title={tool.charAt(0).toUpperCase() + tool.slice(1)}
            >
              <div className="tool-icon" dangerouslySetInnerHTML={{ __html: getIconDisplay(tool) }} />
              <span className="tool-label">{
                tool === 'tekstblok' ? 'Tekst' :
                tool.startsWith('pijl-') 
                  ? tool.replace('pijl-', '').replace('-', ' ').charAt(0).toUpperCase() + tool.replace('pijl-', '').replace('-', ' ').slice(1)
                  : tool.charAt(0).toUpperCase() + tool.slice(1)
              }</span>
            </button>
          ))
        )}
      </div>

      {/* Info */}
      <div className="toolbar-info">
        {selectedTool ? (
          <>
            <div className="selected-tool">
              <span dangerouslySetInnerHTML={{ __html: getIconDisplay(selectedTool) }} /> {selectedTool.charAt(0).toUpperCase() + selectedTool.slice(1)}
            </div>
            <div className="instruction">Klik op de kaart om te plaatsen</div>
          </>
        ) : (
          <div className="instruction">Selecteer een tool om te plaatsen</div>
        )}
      </div>
    </div>
  )
}

// Enhanced Icon Editor with text editing
function IconEditor({ 
  incident, 
  onUpdate, 
  onDelete 
}: { 
  incident: Incident
  onUpdate: (updates: Partial<Incident>) => void
  onDelete: () => void
}) {
  const [localText, setLocalText] = useState(incident.text || '')

  const handleTextChange = (newText: string) => {
    setLocalText(newText)
    onUpdate({ text: newText })
  }

  const handleClose = () => {
    // Create a custom event to deselect the incident
    const event = new CustomEvent('deselectIncident')
    window.dispatchEvent(event)
  }

  return (
    <div className="icon-editor">
      <div className="editor-header">
        <span className="editor-title">✎ Bewerk Icon</span>
        <div className="editor-header-buttons">
          <button
            className="delete-btn"
            onClick={onDelete}
            title="Verwijder icon"
          >
            🗑️
          </button>
          <button
            className="close-btn"
            onClick={handleClose}
            title="Sluit editor"
          >
            ✕
          </button>
        </div>
      </div>
      
      <div className="editor-content">
        {/* Icon Preview */}
        <div className="editor-section">
          <label className="editor-label">🎨 Preview:</label>
          <div className="icon-preview">
            {incident.type === 'tekstblok' ? (
              <div className="preview-text">{localText || 'TEXT'}</div>
            ) : incident.type.startsWith('pijl-') ? (
              <div className="preview-arrow">
                {incident.type === 'pijl-basis' ? '➡️' :
                 incident.type === 'pijl-tweekanten' ? '↔️' :
                 '➡️'}
              </div>
            ) : iconMap[incident.type] ? (
              <img 
                src={iconMap[incident.type]} 
                alt={incident.type}
                className="preview-svg"
                style={{
                  transform: `rotate(${incident.rotation}deg) scaleX(${incident.flipped ? -1 : 1}) scale(${incident.scale})`,
                }}
              />
            ) : (
              <div className="preview-fallback">?</div>
            )}
          </div>
        </div>

        {/* Text editing for text blocks */}
        {incident.type === 'tekstblok' && (
          <div className="editor-section">
            <label className="editor-label">📝 Tekst:</label>
            <input
              type="text"
              value={localText}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder="Voer tekst in..."
              className="text-input"
            />
          </div>
        )}

        {/* Mirror control */}
        <div className="editor-section">
          <label className="editor-label">🪞 Spiegelen:</label>
          <div className="mirror-controls">
            <button
              className={`mirror-btn ${incident.flipped ? 'active' : ''}`}
              onClick={() => onUpdate({ flipped: !incident.flipped })}
              title="Spiegel horizontaal"
            >
              {incident.flipped ? '🔄 Gespiegeld' : '🔄 Normaal'}
            </button>
          </div>
        </div>

        {/* Rotation control */}
        <div className="editor-section">
          <label className="editor-label">🔄 Rotatie: {incident.rotation}°</label>
          <div className="rotation-controls">
            <input
              type="range"
              min="0"
              max="359"
              value={incident.rotation}
              onChange={(e) => onUpdate({ rotation: parseInt(e.target.value) })}
              className="rotation-slider"
            />
          </div>
          <div className="rotation-buttons">
            <button
              className="rotation-btn"
              onClick={() => onUpdate({ rotation: (incident.rotation - 15 + 360) % 360 })}
            >
              ↺ -15°
            </button>
            <button
              className="rotation-btn"
              onClick={() => onUpdate({ rotation: 0 })}
            >
              🎯 0°
            </button>
            <button
              className="rotation-btn"
              onClick={() => onUpdate({ rotation: (incident.rotation + 15) % 360 })}
            >
              ↻ +15°
            </button>
          </div>
        </div>

        {/* Scale control */}
        <div className="editor-section">
          <label className="editor-label">📏 Grootte: {Math.round(incident.scale * 100)}%</label>
          <div className="rotation-controls">
            <input
              type="range"
              min="0.5"
              max="3"
              step="0.1"
              value={incident.scale}
              onChange={(e) => onUpdate({ scale: parseFloat(e.target.value) })}
              className="rotation-slider"
            />
          </div>
          <div className="rotation-buttons">
            <button
              className="rotation-btn"
              onClick={() => onUpdate({ scale: Math.max(0.5, incident.scale - 0.1) })}
            >
              ➖ Klein
            </button>
            <button
              className="rotation-btn"
              onClick={() => onUpdate({ scale: 1 })}
            >
              🎯 100%
            </button>
            <button
              className="rotation-btn"
              onClick={() => onUpdate({ scale: Math.min(3, incident.scale + 0.1) })}
            >
              ➕ Groot
            </button>
          </div>
        </div>

        {/* Position info */}
        <div className="position-info">
          <div className="coordinates">
            📍 {incident.position[0].toFixed(6)}, {incident.position[1].toFixed(6)}
          </div>
          <div className="move-hint">
            💡 Sleep op kaart om te verplaatsen
          </div>
        </div>
      </div>
    </div>
  )
}

// Enhanced map click handler for toolbar mode
function ToolbarMapHandler({ 
  selectedTool, 
  onAddIncident 
}: { 
  selectedTool: IncidentType | null
  onAddIncident: (incident: Incident) => void 
}) {
  const map = require('react-leaflet').useMapEvents({
    click: (e: L.LeafletMouseEvent) => {
      if (selectedTool) {
        const newIncident: Incident = {
          type: selectedTool,
          position: [e.latlng.lat, e.latlng.lng],
          id: `${selectedTool}-${Date.now()}-${Math.random()}`,
          timestamp: new Date().toISOString(),
          rotation: 0,
          scale: 1,
          flipped: false,
          text: selectedTool === 'tekstblok' ? 'NIEUW TEKSTBLOK' : undefined
        }
        onAddIncident(newIncident)
      }
    },
  })

  return null
}

// Enhanced context menu with new categories
function ContextMenu({ 
  isVisible, 
  position, 
  screenPosition, 
  onSelectType, 
  onClose 
}: {
  isVisible: boolean
  position: [number, number] | null
  screenPosition: { x: number, y: number } | null
  onSelectType: (type: IncidentType) => void
  onClose: () => void
}) {
  if (!isVisible || !screenPosition) return null

  const categories = {
    'Snel': ['auto', 'persoon', 'pion', 'pijl-rechts', 'tekstblok'],
    'Voertuigen': ['auto', 'fiets', 'motor', 'scooter', 'vrachtwagen', 'bus', 'tram', 'trein'],
    'Hulpdiensten': ['ambulance', 'politie', 'brandweer'],
    'Mensen': ['persoon', 'voetganger'],
    'Objecten': ['pion', 'verkeerslicht', 'hek', 'afzetting', 'lantaarn', 'file', 'ongeval'],
    'Verkeer': ['verkeersbord', 'stoplicht', 'wegafsluiting', 'wegblokkade', 'omleiding'],
    'Verkeersborden': ['haaitanden', 'voorrang', 'stopbord', 'snelheidslimiet', 'bord-voetganger', 'bord-werkzaamheden', 'snelweg-bord', 'fietsverbod', 'parkeerverbod', 'no-parking', 'geslotenverklaring'],
    'Situaties': ['werkzaamheden'],
    'Pijlen': ['pijl-rechts', 'pijl-links', 'pijl-tweekanten', 'pijl-basis'],
    'Tekst': ['tekstblok']
  }

  const getIconDisplay = (type: IncidentType) => {
    if (type === 'tekstblok') return 'T'
    if (type.startsWith('pijl-')) {
      // Gebruik SVG pijlen via iconMap
      if (iconMap[type]) {
        return `<img src="${iconMap[type]}" style="width: 20px; height: 20px; object-fit: contain;" alt="${type}" />`
      }
      return '➡️'
    }
    
    // Gebruik de centrale icon mapping
    if (iconMap[type]) {
      return `<img src="${iconMap[type]}" style="width: 20px; height: 20px; object-fit: contain;" alt="${type}" />`
    }
    
    return '?'
  }

  return (
    <>
      <div className="context-menu-overlay" onClick={onClose} />
      <div 
        className="context-menu"
        style={{
          left: `${screenPosition.x}px`,
          top: `${screenPosition.y}px`,
        }}
      >
        <div className="context-menu-header">
          <span>Nieuw item plaatsen</span>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="context-menu-content">
          {Object.entries(categories).map(([categoryName, types]) => (
            <div key={categoryName} className="context-category">
              <div className="category-header">{categoryName}</div>
              <div className="category-items">
                {types.map(type => (
                  <button
                    key={type}
                    className="context-menu-item"
                    onClick={() => onSelectType(type as IncidentType)}
                  >
                    <span className="item-icon" dangerouslySetInnerHTML={{ __html: getIconDisplay(type as IncidentType) }} />
                    <span className="item-label">
                      {type === 'tekstblok' ? 'Tekstblok' : 
                       type.startsWith('pijl-') ? type.replace('pijl-', '').replace('-', ' ').charAt(0).toUpperCase() + type.replace('pijl-', '').replace('-', ' ').slice(1) :
                       type.charAt(0).toUpperCase() + type.slice(1)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

// Enhanced draggable marker with improved interaction
function DraggableMarker({ 
  incident, 
  isSelected, 
  onUpdate, 
  onSelect 
}: { 
  incident: Incident
  isSelected: boolean
  onUpdate: (updates: Partial<Incident>) => void
  onSelect: () => void
}) {
  const markerRef = useRef<L.Marker>(null)
  
  const eventHandlers = {
    dragend() {
      const marker = markerRef.current
      if (marker != null) {
        const newPos = marker.getLatLng()
        onUpdate({ position: [newPos.lat, newPos.lng] })
      }
    },
    click(e: L.LeafletMouseEvent) {
      // Stop the event from bubbling to the map
      e.originalEvent.stopPropagation()
      L.DomEvent.stopPropagation(e)
      
      // Select this incident
      onSelect()
    },
    mousedown(e: L.LeafletMouseEvent) {
      // Also handle mousedown for better responsiveness
      e.originalEvent.stopPropagation()
      L.DomEvent.stopPropagation(e)
    }
  }

  // Update the icon whenever selection or incident properties change
  React.useEffect(() => {
    const marker = markerRef.current
    if (marker) {
      marker.setIcon(createIconForIncident(incident, isSelected))
    }
  }, [incident, isSelected])

  return (
    <Marker
      ref={markerRef}
      position={incident.position}
      icon={createIconForIncident(incident, isSelected)}
      draggable={true}
      eventHandlers={eventHandlers}
    />
  )
}

// Zoek component (buiten de map)
function SearchControl({ onLocationSelect }: { onLocationSelect: (lat: number, lon: number) => void }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchCache, setSearchCache] = useState<Map<string, SearchResult[]>>(new Map())
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const searchLocation = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 3) {
      setSearchResults([])
      return
    }

    // Check cache first
    const cacheKey = query.toLowerCase().trim()
    if (searchCache.has(cacheKey)) {
      setSearchResults(searchCache.get(cacheKey) || [])
      return
    }

    setIsSearching(true)
    try {
      // Use CORS proxy to avoid CORS issues
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `format=json&` +
        `q=${encodeURIComponent(query + ', Nederland')}&` +
        `countrycodes=nl&` +
        `limit=10&` +
        `addressdetails=1&` +
        `accept-language=nl&` +
        `dedupe=1`
      )
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const results = await response.json()
      
      // More lenient filtering - show most results from Netherlands
      const filteredResults = results.filter((result: any) => {
        // Check if it's in Netherlands
        const displayName = result.display_name.toLowerCase()
        const hasNetherlands = displayName.includes('nederland') || 
                             displayName.includes('netherlands') ||
                             displayName.includes('holland') ||
                             displayName.includes(', nl') ||
                             result.address?.country_code === 'nl'
        
        // More inclusive location types
        const isUsefulLocation = result.class === 'highway' ||
                               result.class === 'place' ||
                               result.class === 'amenity' ||
                               result.class === 'boundary' ||
                               result.type === 'house' ||
                               result.type === 'house_number' ||
                               result.type === 'road' ||
                               result.type === 'residential' ||
                               result.type === 'commercial' ||
                               result.type === 'industrial' ||
                               result.type === 'city' ||
                               result.type === 'town' ||
                               result.type === 'village' ||
                               result.type === 'hamlet' ||
                               result.type === 'suburb' ||
                               result.type === 'postcode' ||
                               result.type === 'administrative'
        
        return hasNetherlands && isUsefulLocation
      }).slice(0, 8)
      
      // Cache the results
      setSearchCache(prev => new Map(prev.set(cacheKey, filteredResults)))
      setSearchResults(filteredResults)
    } catch (error) {
      console.error('Zoeken mislukt:', error)
      
      // Fallback: try a simpler search without forcing Nederland
      try {
        const fallbackResponse = await fetch(
          `https://nominatim.openstreetmap.org/search?` +
          `format=json&` +
          `q=${encodeURIComponent(query)}&` +
          `countrycodes=nl&` +
          `limit=5&` +
          `addressdetails=1`
        )
        
        if (fallbackResponse.ok) {
          const fallbackResults = await fallbackResponse.json()
          const results = fallbackResults.slice(0, 5)
          setSearchCache(prev => new Map(prev.set(cacheKey, results)))
          setSearchResults(results)
        } else {
          setSearchResults([])
        }
      } catch (fallbackError) {
        console.error('Fallback search ook mislukt:', fallbackError)
        setSearchResults([])
      }
    } finally {
      setIsSearching(false)
    }
  }, [searchCache])

  // Debounced search effect
  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }

    if (searchQuery.trim().length >= 3) {
      debounceTimeoutRef.current = setTimeout(() => {
        searchLocation(searchQuery)
      }, 400) // Wait 400ms after user stops typing
    } else {
      setSearchResults([])
      setIsSearching(false)
    }

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [searchQuery, searchLocation])

  const selectLocation = (result: SearchResult) => {
    const lat = parseFloat(result.lat)
    const lon = parseFloat(result.lon)
    onLocationSelect(lat, lon)
    setSearchResults([])
    setSearchQuery('')
  }

  return (
    <div className="relative">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-3 min-w-80">
        <div className="flex items-center gap-2">
          <span className="text-blue-600 text-lg">🔍</span>
          <input
            type="text"
            placeholder="Zoek straat, plaats of postcode..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
          {isSearching && (
            <div className="text-blue-500 animate-pulse">⏳</div>
          )}
        </div>
        
        {searchResults.length > 0 && (
          <div className="mt-2 max-h-60 overflow-y-auto">
            <div className="text-xs text-gray-500 mb-2 font-medium">Zoekresultaten:</div>
            {searchResults.map((result) => (
              <button
                key={result.place_id}
                onClick={() => selectLocation(result)}
                className="w-full text-left p-2 hover:bg-blue-50 rounded-md border-b border-gray-100 last:border-b-0 text-sm transition-colors"
              >
                <div className="font-medium text-gray-800">📍 {result.display_name.split(',')[0]}</div>
                <div className="text-gray-500 text-xs mt-1 truncate">{result.display_name}</div>
              </button>
            ))}
          </div>
        )}
        
        {searchQuery.length > 0 && searchQuery.length < 3 && (
          <div className="mt-2 text-xs text-gray-500">
            ℹ️ Type minimaal 3 karakters om te zoeken
          </div>
        )}
      </div>
    </div>
  )
}

// Map navigation component (binnen de map)
function MapController({ targetLocation }: { targetLocation: [number, number] | null }) {
  const map = useMap()
  
  useEffect(() => {
    if (targetLocation) {
      map.setView(targetLocation, 18) // Higher zoom when navigating to location
    }
  }, [targetLocation, map])
  
  return null
}

export default function IncidentMap() {
  const [incidenten, setIncidenten] = useState<Incident[]>([])
  const [currentLayer, setCurrentLayer] = useState<MapLayer>('street')
  const [targetLocation, setTargetLocation] = useState<[number, number] | null>(null)
  const [selectedTool, setSelectedTool] = useState<IncidentType | null>(null)
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null)
  const [toolbarCategory, setToolbarCategory] = useState<ToolbarCategory>('snel')
  
  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    isVisible: boolean
    position: [number, number] | null
    screenPosition: { x: number, y: number } | null
  }>({
    isVisible: false,
    position: null,
    screenPosition: null
  })
  
  // Drawing state
  const [drawnLines, setDrawnLines] = useState<DrawnLine[]>([])
  const [isDrawingMode, setIsDrawingMode] = useState(false)
  const [drawingColor, setDrawingColor] = useState('#FF0000')
  const [lineWeight, setLineWeight] = useState(3)

  // Auto-deselect incident when clicking outside
  useEffect(() => {
    const handleDeselectIncident = () => {
      setSelectedIncident(null)
    }

    window.addEventListener('deselectIncident', handleDeselectIncident)
    return () => {
      window.removeEventListener('deselectIncident', handleDeselectIncident)
    }
  }, [])

  const handleAddIncident = (incident: Incident) => {
    setIncidenten(prev => [...prev, incident])
  }

  const handleUpdateIncident = (id: string, updates: Partial<Incident>) => {
    setIncidenten(prev => prev.map(incident => 
      incident.id === id ? { ...incident, ...updates } : incident
    ))
  }

  const handleDeleteIncident = (id: string) => {
    setIncidenten(prev => prev.filter(incident => incident.id !== id))
    setSelectedIncident(null)
  }

  // Drawing handlers
  const handleAddLine = (line: DrawnLine) => {
    setDrawnLines(prev => [...prev, line])
  }

  const handleClearLines = () => {
    setDrawnLines([])
  }

  const handleToggleDrawingMode = () => {
    setIsDrawingMode(prev => !prev)
    setSelectedTool(null)
  }

  const handleSelectIncident = (incident: Incident | null) => {
    setSelectedIncident(incident)
  }

  const handleLocationSelect = (lat: number, lon: number) => {
    setTargetLocation([lat, lon])
  }

  const handleShowContextMenu = (position: [number, number], clientX: number, clientY: number) => {
    setContextMenu({
      isVisible: true,
      position,
      screenPosition: { x: clientX, y: clientY }
    })
  }

  const handleContextMenuSelect = (type: IncidentType) => {
    if (contextMenu.position) {
      const newIncident: Incident = {
        type,
        position: contextMenu.position,
        id: `${type}-${Date.now()}-${Math.random()}`,
        timestamp: new Date().toISOString(),
        rotation: 0,
        scale: 1,
        flipped: false,
        text: type === 'tekstblok' ? 'NIEUW TEKSTBLOK' : undefined
      }
      handleAddIncident(newIncident)
    }
    handleCloseContextMenu()
  }

  const handleCloseContextMenu = () => {
    setContextMenu({ isVisible: false, position: null, screenPosition: null })
  }

  const handleClearAll = () => {
    if (confirm('Weet je zeker dat je alles wilt wissen?')) {
      setIncidenten([])
      setDrawnLines([])
      setSelectedIncident(null)
      setSelectedTool(null)
    }
  }

  const handleTakeScreenshot = async () => {
    const mapElement = document.querySelector('.leaflet-container') as HTMLElement
    if (!mapElement) return

    try {
      // Hide UI elements temporarily
      const toolbar = document.querySelector('.floating-toolbar') as HTMLElement
      const editor = document.querySelector('.icon-editor-container') as HTMLElement
      
      if (toolbar) toolbar.style.display = 'none'
      if (editor) editor.style.display = 'none'

      // Wait a bit for DOM to update
      await new Promise(resolve => setTimeout(resolve, 100))

      const canvas = await html2canvas(mapElement, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: false,
        foreignObjectRendering: false
      })

      // Create download link
      const link = document.createElement('a')
      link.download = `verkeersschets-${new Date().toISOString().split('T')[0]}.png`
      link.href = canvas.toDataURL('image/png')
      
      // Trigger download
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // Show UI elements again
      if (toolbar) toolbar.style.display = 'block'
      if (editor) editor.style.display = 'block'
      
    } catch (error) {
      console.error('Screenshot error:', error)
      alert('Er ging iets mis bij het maken van de foto. Probeer opnieuw.')
    }
  }

  const getLayerUrl = () => {
    switch (currentLayer) {
      case 'satellite':
        return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
      case 'hybrid':
        return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
      default:
        return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
    }
  }

  const getLayerAttribution = () => {
    switch (currentLayer) {
      case 'satellite':
      case 'hybrid':
        return '&copy; <a href="https://www.esri.com/">Esri</a> &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community'
      default:
        return '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }
  }

  const incidentCategories = {
    'Snel': ['auto', 'persoon', 'pion', 'pijl-rechts', 'tekstblok'],
    'Voertuigen': ['auto', 'fiets', 'motor', 'scooter', 'vrachtwagen', 'bus', 'tram', 'trein'],
    'Hulpdiensten': ['ambulance', 'politie', 'brandweer'],
    'Mensen': ['persoon', 'voetganger'],
    'Objecten': ['pion', 'verkeerslicht', 'hek', 'afzetting', 'lantaarn', 'file', 'ongeval'],
    'Verkeer': ['verkeersbord', 'stoplicht', 'wegafsluiting', 'wegblokkade', 'omleiding'],
    'Verkeersborden': ['haaitanden', 'voorrang', 'stopbord', 'snelheidslimiet', 'bord-voetganger', 'bord-werkzaamheden', 'snelweg-bord', 'fietsverbod', 'parkeerverbod', 'no-parking', 'geslotenverklaring'],
    'Situaties': ['werkzaamheden'],
    'Pijlen': ['pijl-rechts', 'pijl-links', 'pijl-tweekanten', 'pijl-basis'],
    'Tekst': ['tekstblok']
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Inleidende tekst */}
      <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
        <h1 className="text-2xl font-bold text-blue-900 mb-4">Verkeerssituaties eenvoudig en duidelijk in beeld brengen</h1>
        <div className="grid md:grid-cols-2 gap-6 text-blue-800">
          <div>
            <h3 className="font-semibold mb-2">🚗 Plaats voertuigen & objecten</h3>
            <p className="text-sm">Gebruik de toolbar om auto's, personen, verkeersborden en andere objecten toe te voegen</p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">✏️ Teken lijnen & routes</h3>
            <p className="text-sm">Activeer tekenmode om omleidingen, verkeersstroom en routes in te tekenen</p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">📷 Maak schermafbeeldingen</h3>
            <p className="text-sm">Sla je verkeerssituatie op als afbeelding om te delen of af te drukken</p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">🔍 Zoek locaties</h3>
            <p className="text-sm">Zoek op adres of plaats om snel naar de juiste locatie te navigeren</p>
          </div>
        </div>
      </div>

      {/* Incident & Line Statistics */}
      {(incidenten.length > 0 || drawnLines.length > 0) && (
        <div className="mb-4 p-4 bg-white border rounded-lg shadow-sm">
          <div className="flex justify-between items-center">
            <div className="flex gap-6 text-sm text-gray-600">
              <span>📍 Objecten: {incidenten.length}</span>
              <span>✏️ Lijnen: {drawnLines.length}</span>
              <h4 className="font-medium text-gray-800">
                🗺️ Verkeerssituatie - {new Date().toLocaleDateString('nl-NL')}
              </h4>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleToggleDrawingMode}
                className={`text-sm px-3 py-1 rounded ${isDrawingMode ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}
              >
                {isDrawingMode ? '⏹️ Stop tekenen' : '✏️ Tekenen'}
              </button>
              <button
                onClick={handleTakeScreenshot}
                className="text-sm px-3 py-1 bg-blue-500 text-white rounded"
              >
                📷 Screenshot
              </button>
              <button
                onClick={handleClearAll}
                className="text-sm px-3 py-1 bg-red-500 text-white rounded"
              >
                🗑️ Alles wissen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Map Container */}
      <div className="relative border rounded-lg overflow-hidden mb-4">
        <MapContainer
          center={[52.09, 5.12]} // Utrecht centrum
          zoom={15}
          maxZoom={22}
          style={{ height: '600px', width: '100%' }}
        >
          <TileLayer
            attribution={getLayerAttribution()}
            url={getLayerUrl()}
            maxZoom={22}
          />
          
          {/* Map Navigation Controller */}
          <MapController targetLocation={targetLocation} />
          
          {/* Map Click Handler */}
          <MapClickHandler 
            onAddIncident={handleAddIncident}
            onShowContextMenu={handleShowContextMenu}
            onSelectIncident={handleSelectIncident}
            selectedIncident={selectedIncident}
            incidents={incidenten}
            selectedTool={selectedTool}
            isDrawingMode={isDrawingMode}
          />
          
          {/* Toolbar Map Handler */}
          <ToolbarMapHandler 
            selectedTool={selectedTool}
            onAddIncident={handleAddIncident}
          />
          
          {/* Drawing Handler */}
          <DrawingHandler 
            isDrawing={isDrawingMode}
            onAddLine={handleAddLine}
            drawingColor={drawingColor}
            lineWeight={lineWeight}
          />
          
          {/* Rendered incidents as draggable markers */}
          {incidenten.map((incident) => (
            <DraggableMarker
              key={incident.id}
              incident={incident}
              isSelected={selectedIncident?.id === incident.id}
              onUpdate={(updates) => handleUpdateIncident(incident.id, updates)}
              onSelect={() => handleSelectIncident(incident)}
            />
          ))}
          
          {/* Drawn Lines */}
          {drawnLines.map((line) => (
            <Polyline
              key={line.id}
              positions={line.positions}
              color={line.color}
              weight={line.weight}
              opacity={0.8}
            />
          ))}
        </MapContainer>

        {/* Search Control - Inside Map */}
        <div className="absolute top-4 left-4 z-1000">
          <SearchControl onLocationSelect={handleLocationSelect} />
        </div>

        {/* Floating Toolbar */}
        <FloatingToolbar 
          onAddIncident={(type, position) => {
            const newIncident: Incident = {
              type,
              position,
              id: `${type}-${Date.now()}-${Math.random()}`,
              timestamp: new Date().toISOString(),
              rotation: 0,
              scale: 1,
              flipped: false,
              text: type === 'tekstblok' ? 'NIEUW TEKSTBLOK' : undefined
            }
            handleAddIncident(newIncident)
          }}
          selectedTool={selectedTool}
          onSelectTool={setSelectedTool}
          currentCategory={toolbarCategory}
          onSelectCategory={setToolbarCategory}
          onToggleDrawingMode={handleToggleDrawingMode}
        />

        {/* Context Menu */}
        <ContextMenu 
          isVisible={contextMenu.isVisible}
          position={contextMenu.position}
          screenPosition={contextMenu.screenPosition}
          onSelectType={handleContextMenuSelect}
          onClose={handleCloseContextMenu}
        />

        {/* Drawing Panel - When drawing mode is active */}
        {isDrawingMode && (
          <div className="absolute top-4 right-4 bg-white p-4 rounded-lg shadow-lg z-1000 min-w-64 max-w-80">
            <div className="flex justify-between items-center mb-4">
              <span className="font-semibold text-blue-900">✏️ Lijnen tekenen</span>
              <button
                onClick={handleToggleDrawingMode}
                className="text-gray-500 hover:text-gray-700 font-bold text-lg"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Kleur:</label>
                <ColorPicker 
                  selectedColor={drawingColor}
                  onColorChange={setDrawingColor}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Lijndikte:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={lineWeight}
                    onChange={(e) => setLineWeight(Number(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-sm font-medium bg-gray-100 px-2 py-1 rounded">{lineWeight}px</span>
                </div>
              </div>
              
              <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
                💡 Sleep om lijnen te tekenen op de kaart
              </div>
              
              {drawnLines.length > 0 && (
                <button
                  onClick={handleClearLines}
                  className="w-full px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                >
                  🗑️ Wis alle lijnen ({drawnLines.length})
                </button>
              )}
            </div>
          </div>
        )}
        
        {/* Icon Editor - When incident is selected (and drawing mode is off) */}
        {selectedIncident && !isDrawingMode && (
          <div className="absolute top-4 right-4 z-1000">
            <IconEditor 
              incident={selectedIncident}
              onUpdate={(updates) => handleUpdateIncident(selectedIncident.id, updates)}
              onDelete={() => handleDeleteIncident(selectedIncident.id)}
            />
          </div>
        )}

        {/* Icon Editor - When incident is selected (and drawing mode is on) - position differently */}
        {selectedIncident && isDrawingMode && (
          <div className="absolute bottom-4 right-4 z-1000">
            <IconEditor 
              incident={selectedIncident}
              onUpdate={(updates) => handleUpdateIncident(selectedIncident.id, updates)}
              onDelete={() => handleDeleteIncident(selectedIncident.id)}
            />
          </div>
        )}
      </div>

      {/* Layer Selection */}
      <div className="p-4 bg-gray-50 rounded-lg border">
        <h3 className="text-lg font-semibold mb-3 text-gray-800">🗺️ Kaartweergave</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentLayer('street')}
            className={`px-4 py-2 rounded-md transition-colors ${
              currentLayer === 'street' 
                ? 'bg-blue-500 text-white shadow-md' 
                : 'bg-white border border-gray-300 hover:bg-gray-50 text-gray-700'
            }`}
          >
            📍 Stratenkaart
          </button>
          <button
            onClick={() => setCurrentLayer('satellite')}
            className={`px-4 py-2 rounded-md transition-colors ${
              currentLayer === 'satellite' 
                ? 'bg-blue-500 text-white shadow-md' 
                : 'bg-white border border-gray-300 hover:bg-gray-50 text-gray-700'
            }`}
          >
            🛰️ Satelliet
          </button>
          <button
            onClick={() => setCurrentLayer('hybrid')}
            className={`px-4 py-2 rounded-md transition-colors ${
              currentLayer === 'hybrid' 
                ? 'bg-blue-500 text-white shadow-md' 
                : 'bg-white border border-gray-300 hover:bg-gray-50 text-gray-700'
            }`}
          >
            🗺️ Hybride
          </button>
        </div>
      </div>

      {/* Welcome Message - When empty */}
      {incidenten.length === 0 && !isDrawingMode && (
        <div className="mt-6 text-center text-gray-500 p-8 bg-gray-50 rounded-lg border">
          <div className="text-6xl mb-4">🗺️</div>
          <h3 className="text-lg font-medium mb-2 text-gray-800">Welkom bij de Verkeerssituatie Tool</h3>
          <div className="space-y-2 text-gray-600">
            <p>🔧 Gebruik de toolbar om voertuigen, personen en objecten toe te voegen</p>
            <p>✏️ Klik op "Tekenen" om lijnen te tekenen op de kaart</p>
            <p>🔍 Gebruik de zoekbalk om naar een specifieke locatie te gaan</p>
          </div>
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
            💡 <strong>Tips:</strong> Rechtermuisknop voor contextmenu • Sleep iconen om te verplaatsen • Klik op iconen om te bewerken
          </div>
        </div>
      )}
    </div>
  )
}