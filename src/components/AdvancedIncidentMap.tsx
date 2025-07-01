import React, { useState, useRef, useCallback, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, useMap, useMapEvents, Polyline } from 'react-leaflet'
import L from 'leaflet'
import html2canvas from 'html2canvas'
import 'leaflet/dist/leaflet.css'

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// Types
type IncidentType = 'auto' | 'persoon' | 'afzetting' | 'fiets' | 'motor' | 'vrachtwagen' | 'bus' | 'tram' | 'trein' | 'ambulance' | 'politie' | 'brandweer' | 'verkeersbord' | 'stoplicht' | 'verkeerslicht' | 'wegafsluiting' | 'omleiding' | 'file' | 'ongeval' | 'werkzaamheden' | 'haaitanden' | 'voorrang' | 'stopbord' | 'snelheidslimiet' | 'tekstblok' | 'scooter' | 'voetganger' | 'pion' | 'wegblokkade' | 'hek' | 'snelweg-bord' | 'fietsverbod' | 'parkeerverbod' | 'no-parking' | 'lantaarn' | 'geslotenverklaring' | 'pijl-rechts' | 'pijl-links' | 'pijl-tweekanten'

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
  text?: string
  flipped?: boolean
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

// Create SVG-based icon for vehicles and objects
const createSvgIcon = (emoji: string, rotation: number = 0, scale: number = 1, isSelected: boolean = false, flipped: boolean = false) => {
  const size = Math.round(32 * scale)
  const borderColor = isSelected ? '#3b82f6' : '#374151'
  const borderWidth = isSelected ? 3 : 1
  
  return L.divIcon({
    html: `
      <div style="
        background: white;
        border: ${borderWidth}px solid ${borderColor};
        border-radius: 50%;
        width: ${size}px;
        height: ${size}px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: ${Math.round(size * 0.6)}px;
        transform: rotate(${rotation}deg) scaleX(${flipped ? -1 : 1});
        transform-origin: center;
        cursor: pointer;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      ">
        ${emoji}
      </div>
    `,
    className: 'custom-incident-icon',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

// Create text icon for text blocks
const createTextIcon = (text: string = 'TEXT', rotation: number = 0, scale: number = 1, isSelected: boolean = false) => {
  const minWidth = 60
  const padding = 8
  const fontSize = Math.round(14 * scale)
  const borderColor = isSelected ? '#3b82f6' : '#374151'
  const borderWidth = isSelected ? 2 : 1
  
  return L.divIcon({
    html: `
      <div style="
        background: white;
        border: ${borderWidth}px solid ${borderColor};
        border-radius: 4px;
        padding: ${padding}px;
        min-width: ${minWidth}px;
        font-size: ${fontSize}px;
        font-weight: bold;
        text-align: center;
        transform: rotate(${rotation}deg);
        transform-origin: center;
        cursor: pointer;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        white-space: nowrap;
      ">
        ${text}
      </div>
    `,
    className: 'custom-text-icon',
    iconSize: [minWidth + padding * 2, 30],
    iconAnchor: [(minWidth + padding * 2) / 2, 15],
  })
}

// Create icon based on incident type
const createIconForIncident = (incident: Incident, isSelected: boolean = false) => {
  const iconMap: Record<IncidentType, string> = {
    'auto': '🚗', 'fiets': '🚴', 'motor': '🏍️', 'scooter': '🛵', 'vrachtwagen': '🚛',
    'bus': '🚌', 'tram': '🚊', 'trein': '🚂', 'ambulance': '🚑', 'politie': '🚓',
    'brandweer': '🚒', 'persoon': '👤', 'voetganger': '🚶', 'pion': '🔶',
    'verkeerslicht': '🚦', 'hek': '🚧', 'afzetting': '🚧', 'lantaarn': '💡',
    'file': '🐌', 'ongeval': '💥', 'verkeersbord': '🛑', 'stoplicht': '🚦',
    'wegafsluiting': '🚧', 'wegblokkade': '🚧', 'omleiding': '↗️',
    'werkzaamheden': '🚧', 'haaitanden': '🔺', 'voorrang': '⚠️',
    'stopbord': '🛑', 'snelheidslimiet': '⏱️', 'snelweg-bord': '🛣️',
    'fietsverbod': '🚫', 'parkeerverbod': '🚫', 'no-parking': '🚫',
    'geslotenverklaring': '🚫', 'pijl-rechts': '➡️', 'pijl-links': '⬅️',
    'pijl-tweekanten': '↔️', 'tekstblok': 'TEXT'
  }

  if (incident.type === 'tekstblok') {
    return createTextIcon(incident.text, incident.rotation, incident.scale, isSelected)
  }

  return createSvgIcon(
    iconMap[incident.type] || '❓',
    incident.rotation,
    incident.scale,
    isSelected,
    incident.flipped
  )
}

// Drawing handler component
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
  const [isDrawingLine, setIsDrawingLine] = useState(false)
  const [currentLine, setCurrentLine] = useState<[number, number][]>([])
  const map = useMap()

  useEffect(() => {
    if (!isDrawing) {
      setIsDrawingLine(false)
      setCurrentLine([])
      if (map) {
        map.dragging.enable()
        map.scrollWheelZoom.enable()
        map.doubleClickZoom.enable()
        map.getContainer().style.cursor = ''
      }
    } else {
      if (map) {
        map.dragging.disable()
        map.scrollWheelZoom.disable()
        map.doubleClickZoom.disable()
        map.getContainer().style.cursor = 'crosshair'
      }
    }
  }, [isDrawing, map])

  useMapEvents({
    mousedown(e) {
      if (!isDrawing) return
      setIsDrawingLine(true)
      setCurrentLine([[e.latlng.lat, e.latlng.lng]])
    },
    mousemove(e) {
      if (!isDrawing || !isDrawingLine) return
      setCurrentLine(prev => [...prev, [e.latlng.lat, e.latlng.lng]])
    },
    mouseup() {
      if (!isDrawing || !isDrawingLine || currentLine.length < 2) return
      
      const newLine: DrawnLine = {
        id: `line-${Date.now()}-${Math.random()}`,
        positions: currentLine,
        color: drawingColor,
        weight: lineWeight,
        timestamp: new Date().toISOString()
      }
      
      onAddLine(newLine)
      setIsDrawingLine(false)
      setCurrentLine([])
    }
  })

  return (
    <>
      {currentLine.length > 1 && (
        <Polyline
          positions={currentLine}
          color={drawingColor}
          weight={lineWeight}
          opacity={0.6}
        />
      )}
    </>
  )
}

// Color picker component
function ColorPicker({ 
  selectedColor, 
  onColorChange 
}: { 
  selectedColor: string
  onColorChange: (color: string) => void 
}) {
  const colors = [
    '#ef4444', '#3b82f6', '#10b981', '#f59e0b',
    '#8b5cf6', '#f97316', '#000000', '#6b7280',
    '#06b6d4', '#ec4899', '#84cc16', '#14532d'
  ]

  return (
    <div className="grid grid-cols-4 gap-2">
      {colors.map((color) => (
        <button
          key={color}
          onClick={() => onColorChange(color)}
          className={`w-8 h-8 rounded-full border-2 ${
            selectedColor === color ? 'border-gray-800' : 'border-gray-300'
          }`}
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  )
}

// Map click handler for tool placement
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
  useMapEvents({
    click(e) {
      if (isDrawingMode) return
      
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
      } else {
        onSelectIncident(null)
      }
    },
    contextmenu(e) {
      if (isDrawingMode) return
      L.DomEvent.preventDefault(e)
      onShowContextMenu([e.latlng.lat, e.latlng.lng], e.originalEvent.clientX, e.originalEvent.clientY)
    }
  })

  return null
}

// Floating toolbar component
function FloatingToolbar({ 
  onSelectTool,
  selectedTool,
  currentCategory,
  onSelectCategory,
  onToggleDrawingMode
}: { 
  onSelectTool: (type: IncidentType | null) => void
  selectedTool: IncidentType | null
  currentCategory: ToolbarCategory
  onSelectCategory: (category: ToolbarCategory) => void
  onToggleDrawingMode: () => void
}) {
  const [isExpanded, setIsExpanded] = useState(false)

  const categories = {
    'snel': ['auto', 'persoon', 'pion', 'pijl-rechts', 'tekstblok'],
    'voertuigen': ['auto', 'fiets', 'motor', 'scooter', 'vrachtwagen', 'bus', 'tram', 'trein'],
    'hulpdiensten': ['ambulance', 'politie', 'brandweer'],
    'mensen': ['persoon', 'voetganger'],
    'objecten': ['pion', 'verkeerslicht', 'hek', 'afzetting', 'lantaarn', 'file', 'ongeval'],
    'verkeer': ['verkeersbord', 'stoplicht', 'wegafsluiting', 'wegblokkade', 'omleiding'],
    'borden': ['haaitanden', 'voorrang', 'stopbord', 'snelheidslimiet', 'snelweg-bord', 'fietsverbod', 'parkeerverbod', 'no-parking', 'geslotenverklaring'],
    'situaties': ['werkzaamheden'],
    'pijlen': ['pijl-rechts', 'pijl-links', 'pijl-tweekanten'],
    'tekst': ['tekstblok'],
    'tekenen': []
  } as Record<ToolbarCategory, IncidentType[]>

  const getIconDisplay = (type: IncidentType) => {
    const iconMap: Record<IncidentType, string> = {
      'auto': '🚗', 'fiets': '🚴', 'motor': '🏍️', 'scooter': '🛵', 'vrachtwagen': '🚛',
      'bus': '🚌', 'tram': '🚊', 'trein': '🚂', 'ambulance': '🚑', 'politie': '🚓',
      'brandweer': '🚒', 'persoon': '👤', 'voetganger': '🚶', 'pion': '🔶',
      'verkeerslicht': '🚦', 'hek': '🚧', 'afzetting': '🚧', 'lantaarn': '💡',
      'file': '🐌', 'ongeval': '💥', 'verkeersbord': '🛑', 'stoplicht': '🚦',
      'wegafsluiting': '🚧', 'wegblokkade': '🚧', 'omleiding': '↗️',
      'werkzaamheden': '🚧', 'haaitanden': '🔺', 'voorrang': '⚠️',
      'stopbord': '🛑', 'snelheidslimiet': '⏱️', 'snelweg-bord': '🛣️',
      'fietsverbod': '🚫', 'parkeerverbod': '🚫', 'no-parking': '🚫',
      'geslotenverklaring': '🚫', 'pijl-rechts': '➡️', 'pijl-links': '⬅️',
      'pijl-tweekanten': '↔️', 'tekstblok': '📝'
    }
    return iconMap[type] || '❓'
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('.floating-toolbar')) {
        setIsExpanded(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="floating-toolbar fixed top-4 left-4 bg-white rounded-lg shadow-lg border z-1000">
      <div className="p-2">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-12 h-12 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center justify-center text-xl"
        >
          🛠️
        </button>
      </div>

      {isExpanded && (
        <div className="border-t">
          {/* Categories */}
          <div className="p-2 border-b">
            <div className="text-xs font-medium text-gray-600 mb-2">Categorieën</div>
            <div className="grid grid-cols-3 gap-1">
              {Object.keys(categories).map((cat) => (
                <button
                  key={cat}
                  onClick={() => onSelectCategory(cat as ToolbarCategory)}
                  className={`px-2 py-1 text-xs rounded ${
                    currentCategory === cat ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Tools */}
          {currentCategory === 'tekenen' ? (
            <div className="p-2">
              <button
                onClick={onToggleDrawingMode}
                className="w-full px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                ✏️ Tekenen
              </button>
            </div>
          ) : (
            <div className="p-2">
              <div className="text-xs font-medium text-gray-600 mb-2">Tools</div>
              <div className="grid grid-cols-4 gap-1">
                {categories[currentCategory]?.map((tool) => (
                  <button
                    key={tool}
                    onClick={() => onSelectTool(selectedTool === tool ? null : tool)}
                    className={`w-12 h-12 rounded flex items-center justify-center text-lg ${
                      selectedTool === tool 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                    title={tool}
                  >
                    {getIconDisplay(tool)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Icon editor component
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

  return (
    <div className="icon-editor-container absolute bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg border z-1000 min-w-80">
      <div className="flex justify-between items-center mb-4">
        <span className="font-semibold">⚙️ Bewerken</span>
        <button
          onClick={onDelete}
          className="text-red-500 hover:text-red-700"
        >
          🗑️
        </button>
      </div>
      
      <div className="space-y-4">
        {incident.type === 'tekstblok' && (
          <div>
            <label className="block text-sm font-medium mb-2">Tekst:</label>
            <input
              type="text"
              value={localText}
              onChange={(e) => handleTextChange(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              placeholder="Voer tekst in..."
            />
          </div>
        )}
        
        <div>
          <label className="block text-sm font-medium mb-2">Rotatie: {incident.rotation}°</label>
          <input
            type="range"
            min="0"
            max="359"
            value={incident.rotation}
            onChange={(e) => onUpdate({ rotation: Number(e.target.value) })}
            className="w-full"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Grootte: {Math.round(incident.scale * 100)}%</label>
          <input
            type="range"
            min="0.5"
            max="3"
            step="0.1"
            value={incident.scale}
            onChange={(e) => onUpdate({ scale: Number(e.target.value) })}
            className="w-full"
          />
        </div>
        
        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={incident.flipped || false}
              onChange={(e) => onUpdate({ flipped: e.target.checked })}
              className="mr-2"
            />
            Spiegelen
          </label>
        </div>
      </div>
    </div>
  )
}

// Context menu component
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

  const quickOptions: IncidentType[] = ['auto', 'persoon', 'pion', 'ambulance', 'politie', 'tekstblok']

  const getIconDisplay = (type: IncidentType) => {
    const iconMap: Record<IncidentType, string> = {
      'auto': '🚗', 'persoon': '👤', 'pion': '🔶', 'ambulance': '🚑', 
      'politie': '🚓', 'tekstblok': '📝'
    }
    return iconMap[type] || '❓'
  }

  return (
    <>
      <div className="fixed inset-0 z-999" onClick={onClose} />
      <div 
        className="fixed bg-white rounded-lg shadow-lg border p-2 z-1000"
        style={{ 
          left: screenPosition.x, 
          top: screenPosition.y,
          transform: 'translate(-50%, -10px)'
        }}
      >
        <div className="text-xs font-medium text-gray-600 mb-2">Snel toevoegen</div>
        <div className="grid grid-cols-3 gap-1">
          {quickOptions.map((type) => (
            <button
              key={type}
              onClick={() => onSelectType(type)}
              className="w-10 h-10 rounded flex items-center justify-center text-lg bg-gray-100 hover:bg-gray-200"
              title={type}
            >
              {getIconDisplay(type)}
            </button>
          ))}
        </div>
      </div>
    </>
  )
}

// Draggable marker component
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
        const position = marker.getLatLng()
        onUpdate({ position: [position.lat, position.lng] })
      }
    },
    click(e: L.LeafletMouseEvent) {
      L.DomEvent.stopPropagation(e)
      onSelect()
    },
    mousedown(e: L.LeafletMouseEvent) {
      L.DomEvent.stopPropagation(e)
    }
  }

  return (
    <Marker
      draggable={true}
      eventHandlers={eventHandlers}
      position={incident.position}
      ref={markerRef}
      icon={createIconForIncident(incident, isSelected)}
    />
  )
}

// Search control component
function SearchControl({ onLocationSelect }: { onLocationSelect: (lat: number, lon: number) => void }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)

  const searchLocation = async () => {
    if (!query.trim()) return

    setIsSearching(true)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=nl`
      )
      const data = await response.json()
      setResults(data)
      setShowResults(true)
    } catch (error) {
      console.error('Search error:', error)
    }
    setIsSearching(false)
  }

  const selectLocation = (result: SearchResult) => {
    onLocationSelect(parseFloat(result.lat), parseFloat(result.lon))
    setShowResults(false)
    setQuery('')
  }

  useEffect(() => {
    const handleClickOutside = () => setShowResults(false)
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  return (
    <div className="relative">
      <div className="flex">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && searchLocation()}
          placeholder="Zoek locatie..."
          className="px-3 py-2 border rounded-l-lg min-w-64"
        />
        <button
          onClick={searchLocation}
          disabled={isSearching}
          className="px-4 py-2 bg-blue-500 text-white rounded-r-lg hover:bg-blue-600 disabled:opacity-50"
        >
          {isSearching ? '🔄' : '🔍'}
        </button>
      </div>

      {showResults && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 bg-white border rounded-lg shadow-lg mt-1 z-1000">
          {results.map((result) => (
            <button
              key={result.place_id}
              onClick={() => selectLocation(result)}
              className="w-full px-3 py-2 text-left hover:bg-gray-100 border-b last:border-b-0"
            >
              <div className="font-medium truncate">{result.display_name}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// Map controller for location targeting
function MapController({ targetLocation }: { targetLocation: [number, number] | null }) {
  const map = useMap()

  useEffect(() => {
    if (targetLocation) {
      map.setView(targetLocation, 16)
    }
  }, [targetLocation, map])

  return null
}

// Main component
export default function AdvancedIncidentMap() {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [drawnLines, setDrawnLines] = useState<DrawnLine[]>([])
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null)
  const [selectedTool, setSelectedTool] = useState<IncidentType | null>(null)
  const [currentCategory, setCurrentCategory] = useState<ToolbarCategory>('snel')
  const [isDrawingMode, setIsDrawingMode] = useState(false)
  const [drawingColor, setDrawingColor] = useState('#ef4444')
  const [lineWeight, setLineWeight] = useState(3)
  const [currentLayer, setCurrentLayer] = useState<MapLayer>('street')
  const [targetLocation, setTargetLocation] = useState<[number, number] | null>(null)
  const [contextMenu, setContextMenu] = useState<{
    isVisible: boolean
    position: [number, number] | null
    screenPosition: { x: number, y: number } | null
  }>({ isVisible: false, position: null, screenPosition: null })

  // Event handlers
  const handleAddIncident = (incident: Incident) => {
    setIncidents(prev => [...prev, incident])
    setSelectedTool(null)
  }

  const handleUpdateIncident = (id: string, updates: Partial<Incident>) => {
    setIncidents(prev => prev.map(incident =>
      incident.id === id ? { ...incident, ...updates } : incident
    ))
  }

  const handleDeleteIncident = (id: string) => {
    setIncidents(prev => prev.filter(incident => incident.id !== id))
    setSelectedIncident(null)
  }

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
      setIncidents([])
      setDrawnLines([])
      setSelectedIncident(null)
      setSelectedTool(null)
    }
  }

  const handleTakeScreenshot = async () => {
    const mapElement = document.querySelector('.leaflet-container') as HTMLElement
    if (!mapElement) return

    try {
      const toolbar = document.querySelector('.floating-toolbar') as HTMLElement
      const editor = document.querySelector('.icon-editor-container') as HTMLElement
      
      if (toolbar) toolbar.style.display = 'none'
      if (editor) editor.style.display = 'none'

      await new Promise(resolve => setTimeout(resolve, 100))

      const canvas = await html2canvas(mapElement, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: false,
        foreignObjectRendering: false
      })

      const link = document.createElement('a')
      link.download = `verkeersschets-${new Date().toISOString().split('T')[0]}.png`
      link.href = canvas.toDataURL('image/png')
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
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

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
        <h1 className="text-3xl font-bold text-blue-900 mb-4">Verkeerssituatie Tool</h1>
        <p className="text-blue-800 mb-4">
          Maak eenvoudig en duidelijk verkeerssituatieschetsen ter ondersteuning van schadeafhandeling.
          Plaats voertuigen, personen en objecten op de kaart, teken lijnen en voeg tekst toe.
        </p>
        
        {/* Search */}
        <SearchControl onLocationSelect={handleLocationSelect} />
      </div>

      {/* Statistics */}
      {(incidents.length > 0 || drawnLines.length > 0) && (
        <div className="mb-4 p-4 bg-green-50 rounded-lg border">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-medium text-green-900">
                📊 Elementen: {incidents.length} | ✏️ Lijnen: {drawnLines.length}
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
                className="text-sm px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                📷 Screenshot
              </button>
              <button
                onClick={handleClearAll}
                className="text-sm px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
              >
                🗑️ Alles wissen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Map Container */}
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
          
          <MapController targetLocation={targetLocation} />
          
          <DrawingHandler 
            isDrawing={isDrawingMode}
            onAddLine={handleAddLine}
            drawingColor={drawingColor}
            lineWeight={lineWeight}
          />
          
          <MapClickHandler 
            onAddIncident={handleAddIncident}
            onShowContextMenu={handleShowContextMenu}
            onSelectIncident={handleSelectIncident}
            selectedIncident={selectedIncident}
            incidents={incidents}
            selectedTool={selectedTool}
            isDrawingMode={isDrawingMode}
          />
          
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
          
          {/* Incident Markers */}
          {incidents.map((incident) => (
            <DraggableMarker
              key={incident.id}
              incident={incident}
              isSelected={selectedIncident?.id === incident.id}
              onUpdate={(updates) => handleUpdateIncident(incident.id, updates)}
              onSelect={() => handleSelectIncident(incident)}
            />
          ))}
        </MapContainer>

        {/* Floating Toolbar */}
        <FloatingToolbar 
          onSelectTool={setSelectedTool}
          selectedTool={selectedTool}
          currentCategory={currentCategory}
          onSelectCategory={setCurrentCategory}
          onToggleDrawingMode={handleToggleDrawingMode}
        />

        {/* Drawing Panel */}
        {isDrawingMode && (
          <div className="absolute top-4 right-4 bg-white p-4 rounded-lg shadow-lg z-1000 min-w-64">
            <div className="flex justify-between items-center mb-4">
              <span className="font-semibold">✏️ Lijnen tekenen</span>
              <button
                onClick={handleToggleDrawingMode}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Kleur:</label>
                <ColorPicker 
                  selectedColor={drawingColor}
                  onColorChange={setDrawingColor}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Lijndikte:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={lineWeight}
                    onChange={(e) => setLineWeight(Number(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-sm font-medium">{lineWeight}px</span>
                </div>
              </div>
              
              <div className="text-sm text-gray-600">
                Sleep om lijnen te tekenen op de kaart
              </div>
              
              {drawnLines.length > 0 && (
                <button
                  onClick={handleClearLines}
                  className="w-full px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  🗑️ Wis alle lijnen
                </button>
              )}
            </div>
          </div>
        )}

        {/* Icon Editor */}
        {selectedIncident && (
          <IconEditor 
            incident={selectedIncident}
            onUpdate={(updates) => handleUpdateIncident(selectedIncident.id, updates)}
            onDelete={() => handleDeleteIncident(selectedIncident.id)}
          />
        )}

        {/* Context Menu */}
        <ContextMenu 
          isVisible={contextMenu.isVisible}
          position={contextMenu.position}
          screenPosition={contextMenu.screenPosition}
          onSelectType={handleContextMenuSelect}
          onClose={handleCloseContextMenu}
        />
      </div>

      {/* Layer Selection */}
      <div className="p-4 bg-gray-100 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">🗺️ Kaartweergave</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentLayer('street')}
            className={`px-4 py-2 rounded ${currentLayer === 'street' ? 'bg-blue-500 text-white' : 'bg-white border hover:bg-gray-50'}`}
          >
            📍 Stratenkaart
          </button>
          <button
            onClick={() => setCurrentLayer('satellite')}
            className={`px-4 py-2 rounded ${currentLayer === 'satellite' ? 'bg-blue-500 text-white' : 'bg-white border hover:bg-gray-50'}`}
          >
            🛰️ Satelliet
          </button>
          <button
            onClick={() => setCurrentLayer('hybrid')}
            className={`px-4 py-2 rounded ${currentLayer === 'hybrid' ? 'bg-blue-500 text-white' : 'bg-white border hover:bg-gray-50'}`}
          >
            🗺️ Hybride
          </button>
        </div>
      </div>

      {/* Welcome message when empty */}
      {incidents.length === 0 && drawnLines.length === 0 && !isDrawingMode && (
        <div className="mt-6 text-center text-gray-500 p-8">
          <div className="text-6xl mb-4">🗺️</div>
          <h3 className="text-lg font-medium mb-2">Welkom bij de Verkeerssituatie Tool</h3>
          <p className="mb-2">Gebruik de toolbar links om voertuigen, objecten en borden toe te voegen</p>
          <p className="mb-2">Klik op "Tekenen" om lijnen te tekenen op de kaart</p>
          <p className="text-sm">💡 Rechtermuisklik voor snelle opties • Sleep items om ze te verplaatsen</p>
        </div>
      )}
    </div>
  )
} 