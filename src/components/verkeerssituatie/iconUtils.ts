import L from 'leaflet'
import { IncidentType, Incident } from './types'

// Icon mapping for all available SVG icons
export const iconMap: Record<string, string> = {
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
  
  // VERKEERSBORDEN
  'haaitanden': '/icons/Sign - Bord haaientanden.svg',
  'voorrang': '/icons/Sign - bord voorrang.svg',
  'stopbord': '/icons/Sign - stop.svg',
  'snelheidslimiet': '/icons/Snelheid - 50.svg',
  'snelweg-bord': '/icons/Sign - snelweg.svg',
  'fietsverbod': '/icons/Sign - verboden te fietsen.svg',
  'parkeerverbod': '/icons/Sign - parkeerverbod.svg',
  'no-parking': '/icons/Sign - no parking.svg',
  'geslotenverklaring': '/icons/Sign - geslotenverklaring.svg',
  
  // PIJLEN
  'pijl-rechts': '/icons/Pijlen - rechts.svg',
  'pijl-links': '/icons/Pijlen - links.svg', 
  'pijl-tweekanten': '/icons/Pijlen - tweekanten.svg',
  'pijl-basis': '/icons/Pijlen - pijl 1.svg'
}

// Create SVG icon for incidents
export const createSvgIcon = (
  svgContent: string, 
  rotation: number = 0, 
  scale: number = 1, 
  isSelected: boolean = false,
  isFlipped: boolean = false,
  showBorder: boolean = false
) => {
  const size = Math.round(28 * scale)
  const selectedBorder = isSelected ? 'border: 3px solid #3b82f6; border-radius: 50%;' : ''
  const userBorder = showBorder ? 'border: 2px solid #000000; border-radius: 8px; background: rgba(255,255,255,0.9); padding: 2px;' : ''
  const borderStyle = selectedBorder || userBorder
  const flipTransform = isFlipped ? 'scaleX(-1)' : ''
  const combinedTransform = `rotate(${rotation}deg) ${flipTransform}`
  
  return L.divIcon({
    html: `
      <div style="
        width: ${size}px; 
        height: ${size}px; 
        display: flex; 
        align-items: center; 
        justify-content: center;
        ${borderStyle}
        transform: ${combinedTransform};
        transform-origin: center;
      ">
        ${svgContent}
      </div>
    `,
    className: 'custom-incident-icon',
    iconSize: [size, size],
    iconAnchor: [size/2, size/2]
  })
}

// Create text icon for text blocks
export const createTextIcon = (
  text: string = 'TEXT', 
  rotation: number = 0, 
  scale: number = 1, 
  isSelected: boolean = false,
  showBorder: boolean = false
) => {
  const fontSize = Math.round(14 * scale)
  const selectedBorder = isSelected ? 'border: 2px solid #3b82f6;' : ''
  const userBorder = showBorder ? 'border: 3px solid #000000; box-shadow: 0 0 0 1px white;' : 'border: 1px solid #333;'
  const borderStyle = selectedBorder || userBorder
  
  return L.divIcon({
    html: `
      <div style="
        background: white;
        padding: 4px 8px;
        ${borderStyle}
        border-radius: 4px;
        font-size: ${fontSize}px;
        font-weight: bold;
        color: #333;
        white-space: nowrap;
        transform: rotate(${rotation}deg);
        transform-origin: center;
      ">
        ${text}
      </div>
    `,
    className: 'custom-text-icon',
    iconSize: [text.length * fontSize * 0.6, fontSize + 8],
    iconAnchor: [(text.length * fontSize * 0.6)/2, (fontSize + 8)/2]
  })
}

// Create icon for incident based on type
export const createIconForIncident = (incident: Incident, isSelected: boolean = false) => {
  if (incident.type === 'tekstblok') {
    return createTextIcon(incident.text, incident.rotation, incident.scale, isSelected, incident.showBorder)
  }

  // Check if we have an SVG icon for this type
  if (iconMap[incident.type]) {
    const svgContent = `<img src="${iconMap[incident.type]}" style="width: 100%; height: 100%; object-fit: contain;" alt="${incident.type}" />`
    return createSvgIcon(svgContent, incident.rotation, incident.scale, isSelected, incident.flipped, incident.showBorder)
  }

  // Fallback to emoji icons
  const emojiMap: Record<IncidentType, string> = {
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
    'pijl-tweekanten': '↔️', 'pijl-basis': '➡️', 'tekstblok': '📝'
  }

  return createSvgIcon(
    `<span style="font-size: 18px; display: block; text-align: center;">${emojiMap[incident.type] || '❓'}</span>`,
    incident.rotation,
    incident.scale,
    isSelected,
    incident.flipped,
    incident.showBorder
  )
} 