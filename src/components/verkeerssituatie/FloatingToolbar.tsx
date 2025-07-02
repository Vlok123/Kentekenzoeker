import React, { useState, useRef, useEffect } from 'react'
import { IncidentType, ToolbarCategory } from './types'
import { iconMap } from './iconUtils'

interface FloatingToolbarProps {
  selectedTool: IncidentType | null
  onSelectTool: (type: IncidentType | null) => void
  currentCategory: ToolbarCategory
  onSelectCategory: (category: ToolbarCategory) => void
  onToggleDrawingMode: () => void
  isDrawingMode: boolean
}

const FloatingToolbar: React.FC<FloatingToolbarProps> = ({ 
  selectedTool, 
  onSelectTool,
  currentCategory,
  onSelectCategory,
  onToggleDrawingMode,
  isDrawingMode
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

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
      tools: ['pion', 'verkeerslicht', 'hek', 'afzetting', 'lantaarn', 'file', 'ongeval'] 
    },
    verkeer: { 
      icon: '🚥', 
      tools: ['verkeersbord', 'stoplicht', 'wegafsluiting', 'wegblokkade', 'omleiding'] 
    },
    borden: { 
      icon: '🛑', 
      tools: ['haaitanden', 'voorrang', 'stopbord', 'snelheidslimiet', 'snelweg-bord', 'fietsverbod', 'parkeerverbod', 'no-parking', 'geslotenverklaring'] 
    },
    situaties: { 
      icon: '💥', 
      tools: ['werkzaamheden'] 
    },
    pijlen: { 
      icon: '➡️', 
      tools: ['pijl-basis', 'pijl-rechts', 'pijl-links', 'pijl-tweekanten'] 
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

  const getToolDisplayName = (tool: IncidentType) => {
    const names: Record<IncidentType, string> = {
      'auto': 'Auto',
      'fiets': 'Fiets',
      'motor': 'Motor',
      'scooter': 'Scooter',
      'vrachtwagen': 'Vrachtwagen',
      'bus': 'Bus',
      'tram': 'Tram',
      'trein': 'Trein',
      'ambulance': 'Ambulance',
      'politie': 'Politie',
      'brandweer': 'Brandweer',
      'persoon': 'Persoon',
      'voetganger': 'Voetganger',
      'pion': 'Pion',
      'verkeerslicht': 'Verkeerslicht',
      'hek': 'Hek',
      'afzetting': 'Afzetting',
      'lantaarn': 'Lantaarn',
      'file': 'File',
      'ongeval': 'Ongeval',
      'verkeersbord': 'Verkeersbord',
      'stoplicht': 'Stoplicht',
      'wegafsluiting': 'Wegafsluiting',
      'wegblokkade': 'Wegblokkade',
      'omleiding': 'Omleiding',
      'werkzaamheden': 'Werkzaamheden',
      'haaitanden': 'Haaientanden',
      'voorrang': 'Voorrang',
      'stopbord': 'Stop',
      'snelheidslimiet': 'Snelheid',
      'snelweg-bord': 'Snelweg',
      'fietsverbod': 'Fietsverbod',
      'parkeerverbod': 'Parkeerverbod',
      'no-parking': 'No Parking',
      'geslotenverklaring': 'Gesloten',
      'pijl-rechts': 'Pijl →',
      'pijl-links': 'Pijl ←',
      'pijl-tweekanten': 'Pijl ↔',
      'pijl-basis': 'Pijl',
      'tekstblok': 'Tekst'
    }
    return names[tool] || tool
  }

  const getCategoryDisplayName = (category: ToolbarCategory) => {
    const names: Record<ToolbarCategory, string> = {
      snel: 'Snel',
      voertuigen: 'Voertuigen',
      hulpdiensten: 'Hulpdiensten',
      mensen: 'Mensen',
      objecten: 'Objecten',
      verkeer: 'Verkeer',
      borden: 'Borden',
      situaties: 'Situaties',
      pijlen: 'Pijlen',
      tekst: 'Tekst',
      tekenen: 'Tekenen'
    }
    return names[category]
  }

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

  const renderToolIcon = (tool: IncidentType) => {
    if (iconMap[tool]) {
      return <img 
        src={iconMap[tool]} 
        alt={tool}
        className="w-5 h-5 sm:w-6 sm:h-6 object-contain"
      />
    }
    
    // Fallback to text/emoji
    const fallbacks: Record<IncidentType, string> = {
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
      'pijl-tweekanten': '↔️', 'pijl-basis': '➡️', 'tekstblok': 'T'
    }

    return <span className="text-base sm:text-lg">{fallbacks[tool] || '❓'}</span>
  }

  return (
    <div className="floating-toolbar">
      <div className="absolute top-24 right-4 bg-white rounded-lg shadow-lg border border-gray-200 p-4 w-72 max-w-[calc(100vw-2rem)] z-[1000]">
        {/* Category Dropdown */}
        <div className="category-dropdown-container mb-3" ref={dropdownRef}>
          <button
            className="w-full flex justify-between items-center p-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <span className="flex items-center gap-2">
              <span className="text-lg">{categories[currentCategory].icon}</span>
              <span className="font-medium text-gray-700">{getCategoryDisplayName(currentCategory)}</span>
            </span>
            <span className={`text-gray-500 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}>▼</span>
          </button>
          
          {dropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-[1100] max-h-60 overflow-y-auto">
              {Object.entries(categories).map(([key, category]) => (
                <button
                  key={key}
                  className={`w-full flex items-center gap-3 p-3 hover:bg-gray-50 text-left border-b border-gray-100 last:border-b-0 ${
                    currentCategory === key ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                  }`}
                  onClick={() => {
                    onSelectCategory(key as ToolbarCategory)
                    setDropdownOpen(false)
                  }}
                >
                  <span className="text-lg w-6 text-center">{category.icon}</span>
                  <span className="font-medium">{getCategoryDisplayName(key as ToolbarCategory)}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Selected tool info */}
        {selectedTool && (
          <div className="mb-3 p-2 bg-blue-50 rounded border border-blue-200">
            <div className="flex items-center gap-2">
              {renderToolIcon(selectedTool)}
              <span className="text-sm font-medium text-blue-800">
                {getToolDisplayName(selectedTool)} geselecteerd
              </span>
            </div>
            <button
              onClick={() => onSelectTool(null)}
              className="mt-1 text-xs text-blue-600 hover:text-blue-800"
            >
              Klik hier om te deselecteren
            </button>
          </div>
        )}

        {/* Tool Grid */}
        {currentCategory === 'tekenen' ? (
          <div className="text-center">
            <button
              onClick={onToggleDrawingMode}
              className={`w-full p-3 rounded-lg border-2 transition-all ${
                isDrawingMode 
                  ? 'bg-red-500 text-white border-red-600 hover:bg-red-600' 
                  : 'bg-green-500 text-white border-green-600 hover:bg-green-600'
              }`}
            >
              <div className="text-lg mb-1">
                {isDrawingMode ? '⏹️' : '✏️'}
              </div>
              <div className="text-sm font-medium">
                {isDrawingMode ? 'Stop tekenen' : 'Start tekenen'}
              </div>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {categories[currentCategory].tools.map((tool) => (
              <button
                key={tool}
                onClick={() => onSelectTool(selectedTool === tool ? null : tool)}
                className={`p-2 rounded-lg border-2 transition-all flex flex-col items-center gap-1 min-h-16 ${
                  selectedTool === tool
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 text-gray-700'
                }`}
              >
                <div className="flex items-center justify-center h-6">
                  {renderToolIcon(tool)}
                </div>
                <span className="text-[10px] sm:text-xs font-medium text-center leading-tight">
                  {getToolDisplayName(tool)}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Instructions */}
        <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-600">
          {selectedTool ? (
            <p className="italic">Klik op de kaart om een {getToolDisplayName(selectedTool).toLowerCase()} te plaatsen</p>
          ) : isDrawingMode ? (
            <p className="italic">Klik en sleep om lijnen te tekenen</p>
          ) : (
            <p className="italic">Selecteer een tool om te beginnen</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default FloatingToolbar 