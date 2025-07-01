import React, { useState, useRef, useCallback, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents, Polyline } from 'react-leaflet'
import L from 'leaflet'
import html2canvas from 'html2canvas'
import 'leaflet/dist/leaflet.css'
import { useAppStore } from '@/store/useAppStore'
import { ApiAuthService } from '@/lib/api-auth'

import { IncidentType, ToolbarCategory, MapLayer, Incident, DrawnLine, SearchResult } from './types'
import { createIconForIncident } from './iconUtils'
import FloatingToolbar from './FloatingToolbar'

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// Search Control Component
const SearchControl = ({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)

  const performSearch = useCallback(async (query: string) => {
    if (query.length < 3) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&countrycodes=nl&q=${encodeURIComponent(query)}`
      )
      const data = await response.json()
      setSearchResults(data.slice(0, 5))
    } catch (error) {
      console.error('Search error:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }, [])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(searchQuery)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery, performSearch])

  const selectLocation = (result: SearchResult) => {
    const lat = parseFloat(result.lat)
    const lng = parseFloat(result.lon)
    onLocationSelect(lat, lng)
    setSearchQuery('')
    setSearchResults([])
  }

  return (
    <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg border border-gray-200 p-3 min-w-80 z-[1000]">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">🔍</span>
        <span className="font-medium text-gray-700">Locatie zoeken</span>
      </div>
      
      <div className="relative">
        <input
          type="text"
          placeholder="Zoek straat, plaats of postcode..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        {isSearching && <div className="absolute right-2 top-2">🔍</div>}
      </div>
      
      {searchResults.length > 0 && (
        <div className="mt-2 border border-gray-200 rounded max-h-48 overflow-y-auto bg-white">
          {searchResults.map((result) => (
            <button
              key={result.place_id}
              onClick={() => selectLocation(result)}
              className="w-full text-left p-2 hover:bg-gray-100 border-b border-gray-100 last:border-b-0 text-sm"
            >
              <div className="font-medium">📍 {result.display_name.split(',')[0]}</div>
              <div className="text-gray-600 text-xs truncate">{result.display_name}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// Map event handler for clicks and drawing
const MapEventHandler = ({ 
  selectedTool, 
  onAddIncident, 
  onMapClick,
  isDrawingMode,
  onAddLine
}: {
  selectedTool: IncidentType | null
  onAddIncident: (incident: Incident) => void
  onMapClick: (lat: number, lng: number) => void
  isDrawingMode: boolean
  onAddLine: (line: DrawnLine) => void
}) => {
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentLine, setCurrentLine] = useState<[number, number][]>([])

  useMapEvents({
    click: (e) => {
      if (isDrawingMode) {
        if (!isDrawing) {
          setIsDrawing(true)
          setCurrentLine([[e.latlng.lat, e.latlng.lng]])
        } else {
          const newLine: [number, number][] = [...currentLine, [e.latlng.lat, e.latlng.lng]]
          setCurrentLine(newLine)
        }
      } else if (selectedTool) {
        const newIncident: Incident = {
          id: `${selectedTool}-${Date.now()}-${Math.random()}`,
          type: selectedTool,
          position: [e.latlng.lat, e.latlng.lng],
          timestamp: new Date().toISOString(),
          rotation: 0,
          scale: 1,
          flipped: false,
          text: selectedTool === 'tekstblok' ? 'TEKST' : undefined
        }
        onAddIncident(newIncident)
      } else {
        onMapClick(e.latlng.lat, e.latlng.lng)
      }
    },
    dblclick: () => {
      if (isDrawingMode && isDrawing && currentLine.length > 1) {
        const newLine: DrawnLine = {
          id: `line-${Date.now()}-${Math.random()}`,
          positions: currentLine,
          color: '#FF0000',
          weight: 3,
          timestamp: new Date().toISOString()
        }
        onAddLine(newLine)
        setIsDrawing(false)
        setCurrentLine([])
      }
    }
  })

  return null
}

// Icon Editor Component
const IconEditor = ({ 
  incident, 
  onUpdate, 
  onDelete, 
  onClose,
  position = 'right' 
}: {
  incident: Incident
  onUpdate: (updates: Partial<Incident>) => void
  onDelete: () => void
  onClose: () => void
  position?: 'right' | 'bottom'
}) => {
  const positionClass = position === 'right' 
    ? 'absolute top-4 right-4' 
    : 'absolute bottom-4 right-4'

  return (
    <div className={`${positionClass} bg-white rounded-lg shadow-lg border border-gray-200 p-4 min-w-64 z-[1000]`}>
      <div className="flex justify-between items-center mb-3">
        <span className="font-semibold text-gray-900">✏️ Bewerk icoon</span>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 font-bold text-lg"
        >
          ✕
        </button>
      </div>
      
      <div className="space-y-3">
        {/* Rotation */}
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">Rotatie: {incident.rotation}°</label>
          <input
            type="range"
            min="0"
            max="360"
            step="15"
            value={incident.rotation}
            onChange={(e) => onUpdate({ rotation: parseInt(e.target.value) })}
            className="w-full"
          />
        </div>

        {/* Scale */}
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">Grootte: {Math.round(incident.scale * 100)}%</label>
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={incident.scale}
            onChange={(e) => onUpdate({ scale: parseFloat(e.target.value) })}
            className="w-full"
          />
        </div>

        {/* Flip */}
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">Gespiegeld</label>
          <button
            onClick={() => onUpdate({ flipped: !incident.flipped })}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              incident.flipped
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {incident.flipped ? 'Aan' : 'Uit'}
          </button>
        </div>

        {/* Text editing for text blocks */}
        {incident.type === 'tekstblok' && (
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Tekst</label>
            <input
              type="text"
              value={incident.text || 'TEKST'}
              onChange={(e) => onUpdate({ text: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2 pt-2 border-t border-gray-200">
          <button
            onClick={onDelete}
            className="flex-1 bg-red-500 text-white px-3 py-2 rounded hover:bg-red-600 transition-colors text-sm font-medium"
          >
            🗑️ Verwijder
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-500 text-white px-3 py-2 rounded hover:bg-gray-600 transition-colors text-sm font-medium"
          >
            ✅ Klaar
          </button>
        </div>
      </div>
    </div>
  )
}

// Main component
const AdvancedIncidentMap: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [drawnLines, setDrawnLines] = useState<DrawnLine[]>([])
  const [selectedTool, setSelectedTool] = useState<IncidentType | null>(null)
  const [toolbarCategory, setToolbarCategory] = useState<ToolbarCategory>('snel')
  const [currentLayer, setCurrentLayer] = useState<MapLayer>('satellite')
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null)
  const [isDrawingMode, setIsDrawingMode] = useState(false)
  const [mapCenter, setMapCenter] = useState<[number, number]>([52.09, 5.12]) // Utrecht centrum
  const mapRef = useRef<L.Map | null>(null)
  
  // Save/Load states
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [showLoadModal, setShowLoadModal] = useState(false)
  const [savedSketches, setSavedSketches] = useState<any[]>([])
  const [saveTitle, setSaveTitle] = useState('')
  const [saveDescription, setSaveDescription] = useState('')
  const [currentSketchId, setCurrentSketchId] = useState<string | null>(null)
  
  const { user, token } = useAppStore()

  const handleAddIncident = useCallback((incident: Incident) => {
    setIncidents(prev => [...prev, incident])
  }, [])

  const handleUpdateIncident = useCallback((id: string, updates: Partial<Incident>) => {
    setIncidents(prev => prev.map(incident => 
      incident.id === id ? { ...incident, ...updates } : incident
    ))
    if (selectedIncident?.id === id) {
      setSelectedIncident(prev => prev ? { ...prev, ...updates } : null)
    }
  }, [selectedIncident])

  const handleDeleteIncident = useCallback((id: string) => {
    setIncidents(prev => prev.filter(incident => incident.id !== id))
    setSelectedIncident(null)
  }, [])

  const handleAddLine = useCallback((line: DrawnLine) => {
    setDrawnLines(prev => [...prev, line])
  }, [])

  const handleLocationSelect = useCallback((lat: number, lng: number) => {
    setMapCenter([lat, lng])
    if (mapRef.current) {
      mapRef.current.setView([lat, lng], 16)
    }
  }, [])

  const handleMapClick = useCallback((_lat: number, _lng: number) => {
    setSelectedIncident(null)
  }, [])

  const handleIncidentClick = useCallback((incident: Incident) => {
    setSelectedIncident(selectedIncident?.id === incident.id ? null : incident)
  }, [selectedIncident])

  const handleToggleDrawingMode = useCallback(() => {
    setIsDrawingMode(prev => !prev)
    setSelectedTool(null)
  }, [])

  const getLayerUrl = () => {
    switch (currentLayer) {
      case 'satellite':
        // ESRI World Imagery - zoom tot niveau 23-24
        return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
      case 'hybrid':
        // Stamen Terrain high-resolution - zoom tot ~20
        return 'https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}{r}.png'
      default:
        // CartoDB Positron - hogere zoom dan OSM
        return 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
    }
  }

  const getLayerAttribution = () => {
    switch (currentLayer) {
      case 'satellite':
        return '&copy; <a href="https://www.esri.com/">Esri</a>, Maxar, Earthstar Geographics'
      case 'hybrid':
        return '&copy; <a href="http://stamen.com">Stamen Design</a> &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
      default:
        return '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
    }
  }

  const takeScreenshot = async () => {
    const mapElement = document.querySelector('.leaflet-container') as HTMLElement
    if (!mapElement) return

    try {
      const canvas = await html2canvas(mapElement, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        useCORS: true
      })

      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `verkeerssituatie-${new Date().toISOString().split('T')[0]}.png`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(url)
        }
      }, 'image/png')

    } catch (error) {
      console.error('Screenshot error:', error)
      alert('Er ging iets mis bij het maken van de foto. Probeer opnieuw.')
    }
  }

  // Save sketch function
  const handleSaveSketch = async () => {
    if (!user || !token) {
      alert('Je moet ingelogd zijn om schetsen op te slaan.')
      return
    }

    if (!saveTitle.trim()) {
      alert('Voer een titel in voor je schets.')
      return
    }

    try {
      const sketchData = {
        title: saveTitle.trim(),
        description: saveDescription.trim() || undefined,
        location: undefined, // Could be enhanced to detect location
        incidents,
        drawnLines,
        metadata: {
          mapCenter,
          currentLayer,
          totalIncidents: incidents.length,
          totalLines: drawnLines.length,
          createdWith: 'CarIntel Verkeersschets Tool'
        },
        isPublic: false
      }

      if (currentSketchId) {
        // Update existing sketch
        await ApiAuthService.updateSketch(currentSketchId, sketchData)
        alert('Verkeersschets succesvol bijgewerkt!')
      } else {
        // Save new sketch
        const result = await ApiAuthService.saveSketch(sketchData)
        setCurrentSketchId(result.sketch.id)
        alert('Verkeersschets succesvol opgeslagen!')
      }

      setShowSaveModal(false)
      setSaveTitle('')
      setSaveDescription('')
      await loadSavedSketches() // Refresh the list
    } catch (error: any) {
      console.error('Save error:', error)
      alert(`Fout bij opslaan: ${error.message}`)
    }
  }

  // Load saved sketches
  const loadSavedSketches = async () => {
    if (!user) return

    try {
      const result = await ApiAuthService.getSketches()
      setSavedSketches(result.sketches)
    } catch (error: any) {
      console.error('Load sketches error:', error)
      // Only show alert if it's not an authentication error
      if (!error.message?.includes('token') && !error.message?.includes('autorisatie')) {
        alert(`Fout bij laden schetsen: ${error.message}`)
      }
      // Clear saved sketches on error
      setSavedSketches([])
    }
  }

  // Load specific sketch
  const handleLoadSketch = async (sketchId: string) => {
    try {
      const result = await ApiAuthService.getSketch(sketchId)
      const sketch = result.sketch

      setIncidents(sketch.incidents || [])
      setDrawnLines(sketch.drawn_lines || [])
      setCurrentSketchId(sketch.id)
      setSaveTitle(sketch.title)
      setSaveDescription(sketch.description || '')
      
      if (sketch.metadata?.mapCenter) {
        setMapCenter(sketch.metadata.mapCenter)
        if (mapRef.current) {
          mapRef.current.setView(sketch.metadata.mapCenter, 15)
        }
      }

      if (sketch.metadata?.currentLayer) {
        setCurrentLayer(sketch.metadata.currentLayer)
      }

      setShowLoadModal(false)
      alert(`Verkeersschets "${sketch.title}" geladen!`)
    } catch (error: any) {
      console.error('Load sketch error:', error)
      alert(`Fout bij laden schets: ${error.message}`)
    }
  }

  // Delete sketch
  const handleDeleteSketch = async (sketchId: string) => {
    if (!confirm('Weet je zeker dat je deze schets wilt verwijderen?')) {
      return
    }

    try {
      await ApiAuthService.deleteSketch(sketchId)
      await loadSavedSketches()
      alert('Verkeersschets verwijderd!')
    } catch (error: any) {
      console.error('Delete sketch error:', error)
      alert(`Fout bij verwijderen: ${error.message}`)
    }
  }

  // Clear current sketch
  const handleNewSketch = () => {
    if (incidents.length > 0 || drawnLines.length > 0) {
      if (!confirm('Weet je zeker dat je een nieuwe schets wilt beginnen? Alle huidige wijzigingen gaan verloren.')) {
        return
      }
    }

    setIncidents([])
    setDrawnLines([])
    setCurrentSketchId(null)
    setSaveTitle('')
    setSaveDescription('')
    setSelectedIncident(null)
  }

  // Load sketches on component mount - Force redeploy for zoom fix
  React.useEffect(() => {
    if (user && token) {
      loadSavedSketches()
    }
  }, [user, token])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50">
      {/* Header */}
      <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200">
        <h1 className="text-2xl font-bold text-blue-900 mb-4">Verkeerssituaties eenvoudig en duidelijk in beeld brengen</h1>
        <div className="grid md:grid-cols-2 gap-6 text-blue-800">
          <div>
            <h3 className="font-semibold mb-2">🚗 Plaats voertuigen & objecten</h3>
            <p className="text-sm">Gebruik de toolbar om auto's, personen, verkeersborden en andere objecten toe te voegen</p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">✏️ Teken lijnen & pijlen</h3>
            <p className="text-sm">Schakel over naar tekenmodus om verkeerstromen en routes aan te geven</p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="p-4 bg-white border-b border-gray-200">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          {/* Layer Selection */}
          <div className="flex gap-2">
            <h3 className="text-lg font-semibold text-gray-700 mr-2">🗺️ Kaartweergave:</h3>
            {(['street', 'satellite', 'hybrid'] as MapLayer[]).map((layer) => (
              <button
                key={layer}
                onClick={() => setCurrentLayer(layer)}
                className={`px-4 py-2 rounded ${
                  currentLayer === layer 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-white border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {layer === 'street' ? '📍 Stratenkaart' : 
                 layer === 'satellite' ? '🛰️ Satelliet' : 
                 '🔀 Hybride'}
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 flex-wrap">
            {user && (
              <>
                <button
                  onClick={handleNewSketch}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
                >
                  📄 Nieuw
                </button>
                <button
                  onClick={() => setShowSaveModal(true)}
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
                >
                  💾 {currentSketchId ? 'Bijwerken' : 'Opslaan'}
                </button>
                <button
                  onClick={() => {setShowLoadModal(true); loadSavedSketches()}}
                  className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 transition-colors"
                >
                  📂 Laden
                </button>
              </>
            )}

            <button
              onClick={takeScreenshot}
              className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 transition-colors"
            >
              📷 Screenshot
            </button>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="p-4 bg-green-50 border-b border-green-200">
        <div className="flex flex-wrap gap-6 text-green-800">
          <div>
            <span className="font-semibold">🚗 Incidenten:</span> {incidents.length}
          </div>
          <div>
            <span className="font-semibold">✏️ Lijnen:</span> {drawnLines.length}
          </div>
          <div>
            <span className="font-semibold">⏰ Laatste update:</span> {
              incidents.length > 0 
                ? new Date(Math.max(...incidents.map(i => new Date(i.timestamp).getTime()))).toLocaleTimeString('nl-NL')
                : 'Geen'
            }
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="relative h-[600px]">
        <MapContainer
          center={mapCenter}
          zoom={15}
          maxZoom={24}
          zoomSnap={0.25}
          zoomDelta={0.25}
          wheelPxPerZoomLevel={40}
          style={{ height: '100%', width: '100%' }}
          ref={mapRef}
        >
          <TileLayer
            url={getLayerUrl()}
            attribution={getLayerAttribution()}
          />
          
          {/* Extra high-resolution overlay for extreme zoom */}
          {currentLayer === 'satellite' && (
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
              attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
              opacity={0.2}
              maxZoom={24}
            />
          )}
          
          {/* Hybrid overlay for labels */}
          {currentLayer === 'hybrid' && (
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              opacity={0.3}
            />
          )}

          {/* Incident markers */}
          {incidents.map((incident) => (
            <Marker
              key={incident.id}
              position={incident.position}
              icon={createIconForIncident(incident, selectedIncident?.id === incident.id)}
              eventHandlers={{
                click: () => handleIncidentClick(incident)
              }}
            />
          ))}

          {/* Drawn lines */}
          {drawnLines.map((line) => (
            <Polyline
              key={line.id}
              positions={line.positions}
              color={line.color}
              weight={line.weight}
            />
          ))}

          {/* Map event handler */}
          <MapEventHandler
            selectedTool={selectedTool}
            onAddIncident={handleAddIncident}
            onMapClick={handleMapClick}
            isDrawingMode={isDrawingMode}
            onAddLine={handleAddLine}
          />
        </MapContainer>

        {/* Search Control */}
        <SearchControl onLocationSelect={handleLocationSelect} />

        {/* Floating Toolbar */}
        <FloatingToolbar
          selectedTool={selectedTool}
          onSelectTool={setSelectedTool}
          currentCategory={toolbarCategory}
          onSelectCategory={setToolbarCategory}
          onToggleDrawingMode={handleToggleDrawingMode}
          isDrawingMode={isDrawingMode}
        />

        {/* Icon Editor */}
        {selectedIncident && (
          <IconEditor
            incident={selectedIncident}
            onUpdate={(updates) => handleUpdateIncident(selectedIncident.id, updates)}
            onDelete={() => handleDeleteIncident(selectedIncident.id)}
            onClose={() => setSelectedIncident(null)}
            position={isDrawingMode ? 'bottom' : 'right'}
          />
        )}
      </div>

      {/* Welcome message when empty */}
      {incidents.length === 0 && drawnLines.length === 0 && !isDrawingMode && (
        <div className="p-8 text-center text-gray-500">
          <div className="text-6xl mb-4">🗺️</div>
          <h3 className="text-lg font-medium mb-2">Welkom bij de Verkeerssituatie Tool</h3>
          <p className="mb-2">Gebruik de toolbar links om iconen te plaatsen of lijnen te tekenen</p>
          <p className="text-sm">💡 Klik op geplaatste iconen om ze te bewerken</p>
          {!user && (
            <p className="text-sm text-blue-600 mt-4">
              📷 Screenshots maken kan direct. <a href="/login" className="underline">Log in</a> om schetsen op te slaan en te laden.
            </p>
          )}
        </div>
      )}

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[2000]">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold mb-4">
              {currentSketchId ? 'Schets bijwerken' : 'Schets opslaan'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Titel *</label>
                <input
                  type="text"
                  value={saveTitle}
                  onChange={(e) => setSaveTitle(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Bijv. Ongeval kruispunt A12"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Beschrijving</label>
                <textarea
                  value={saveDescription}
                  onChange={(e) => setSaveDescription(e.target.value)}
                  rows={3}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Optionele beschrijving van de verkeerssituatie"
                />
              </div>
              <div className="text-sm text-gray-600">
                <p>📊 {incidents.length} incidenten, {drawnLines.length} lijnen</p>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowSaveModal(false)}
                className="flex-1 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
              >
                Annuleren
              </button>
              <button
                onClick={handleSaveSketch}
                className="flex-1 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
              >
                {currentSketchId ? 'Bijwerken' : 'Opslaan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Load Modal */}
      {showLoadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[2000]">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Opgeslagen schetsen</h2>
            
            {savedSketches.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">📝</div>
                <p>Nog geen opgeslagen schetsen</p>
                <p className="text-sm">Maak je eerste verkeersschets en sla deze op!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {savedSketches.map((sketch) => (
                  <div key={sketch.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{sketch.title}</h3>
                        {sketch.description && (
                          <p className="text-sm text-gray-600 mt-1">{sketch.description}</p>
                        )}
                        <div className="text-xs text-gray-500 mt-2">
                          <span>📅 {new Date(sketch.created_at).toLocaleDateString('nl-NL')}</span>
                          {sketch.updated_at !== sketch.created_at && (
                            <span className="ml-2">✏️ {new Date(sketch.updated_at).toLocaleDateString('nl-NL')}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleLoadSketch(sketch.id)}
                          className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 transition-colors"
                        >
                          Laden
                        </button>
                        <button
                          onClick={() => handleDeleteSketch(sketch.id)}
                          className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition-colors"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowLoadModal(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
              >
                Sluiten
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdvancedIncidentMap 