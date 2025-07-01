// Types for the traffic situation component
export type IncidentType = 
  | 'auto' | 'fiets' | 'motor' | 'scooter' | 'vrachtwagen' | 'bus' | 'tram' | 'trein'
  | 'ambulance' | 'politie' | 'brandweer' 
  | 'persoon' | 'voetganger'
  | 'pion' | 'verkeerslicht' | 'hek' | 'afzetting' | 'lantaarn' | 'file' | 'ongeval'
  | 'verkeersbord' | 'stoplicht' | 'wegafsluiting' | 'wegblokkade' | 'omleiding'
  | 'haaitanden' | 'voorrang' | 'stopbord' | 'snelheidslimiet' | 'snelweg-bord'
  | 'fietsverbod' | 'parkeerverbod' | 'no-parking' | 'geslotenverklaring'
  | 'werkzaamheden' | 'pijl-rechts' | 'pijl-links' | 'pijl-tweekanten' | 'pijl-basis'
  | 'tekstblok'

export type ToolbarCategory = 
  | 'snel' | 'voertuigen' | 'hulpdiensten' | 'mensen' | 'objecten' 
  | 'verkeer' | 'borden' | 'situaties' | 'pijlen' | 'tekst' | 'tekenen'

export type MapLayer = 'street' | 'satellite' | 'hybrid'

export interface Incident {
  id: string
  type: IncidentType
  position: [number, number]
  timestamp: string
  rotation: number
  scale: number
  flipped: boolean
  text?: string
}

export interface DrawnLine {
  id: string
  positions: [number, number][]
  color: string
  weight: number
  timestamp: string
}

export interface SearchResult {
  place_id: string
  display_name: string
  lat: string
  lon: string
} 