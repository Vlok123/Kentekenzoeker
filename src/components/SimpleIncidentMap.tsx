'use client'

import React, { useState } from 'react'
import { MapContainer, TileLayer, Polyline } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

interface DrawnLine {
  id: string
  positions: [number, number][]
  color: string
  weight: number
  timestamp: string
}

export default function SimpleIncidentMap() {
  const [drawnLines, setDrawnLines] = useState<DrawnLine[]>([])
  const [isDrawingMode, setIsDrawingMode] = useState(false)
  const [drawingColor, setDrawingColor] = useState('#FF0000')
  const [lineWeight, setLineWeight] = useState(3)

  const handleToggleDrawingMode = () => {
    setIsDrawingMode(prev => !prev)
  }

  const handleClearLines = () => {
    setDrawnLines([])
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 p-6 bg-blue-50 rounded-lg border">
        <h1 className="text-2xl font-bold text-blue-900 mb-4">Verkeerssituatie Tool</h1>
        <p className="text-blue-800">
          Maak eenvoudig en duidelijk verkeerssituatieschetsen.
        </p>
      </div>

      {/* Controls */}
      <div className="mb-4 p-4 bg-green-50 rounded-lg border">
        <div className="flex justify-between items-center">
          <div>
            <h4 className="font-medium text-green-900">
              ✏️ Lijnen: {drawnLines.length}
            </h4>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleToggleDrawingMode}
              className={`text-sm px-3 py-1 rounded ${
                isDrawingMode ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
              }`}
            >
              {isDrawingMode ? '⏹️ Stop tekenen' : '✏️ Tekenen'}
            </button>
            <button
              onClick={handleClearLines}
              className="text-sm px-3 py-1 bg-red-500 text-white rounded"
            >
              🗑️ Wis lijnen
            </button>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="relative border rounded-lg overflow-hidden mb-4">
        <MapContainer
          center={[52.09, 5.12]} 
          zoom={15}
          maxZoom={22}
          style={{ height: '600px', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
            maxZoom={22}
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
        </MapContainer>
      </div>

      {/* Welcome Message */}
      {drawnLines.length === 0 && !isDrawingMode && (
        <div className="mt-6 text-center text-gray-500 p-8">
          <div className="text-6xl mb-4">🗺️</div>
          <h3 className="text-lg font-medium mb-2">Welkom bij de Verkeerssituatie Tool</h3>
          <p className="mb-2">Klik op "Tekenen" om lijnen te tekenen op de kaart</p>
        </div>
      )}
    </div>
  )
} 