import { MapPin } from 'lucide-react';

/**
 * Vista previa de ubicación con mapa OpenStreetMap embebido.
 * No requiere API key. Usa el endpoint público de OSM.
 *
 * Uso:
 *   <MapPreview latitude={-12.04} longitude={-77.03} height={220} />
 */
export default function MapPreview({ latitude, longitude, height = 220, zoom = 16, className = '' }) {
  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);

  if (isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-black/40 border border-dashed border-matrix-primary/30 rounded-lg ${className}`}
        style={{ height }}
      >
        <MapPin className="w-8 h-8 text-matrix-muted mb-2" />
        <p className="text-xs text-matrix-muted uppercase tracking-wider">Sin coordenadas registradas</p>
      </div>
    );
  }

  // Pequeño bbox alrededor del punto (más cerrado = más zoom)
  const delta = 0.005;
  const bbox = `${lng - delta},${lat - delta},${lng + delta},${lat + delta}`;
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`;
  const mapsUrl = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=${zoom}/${lat}/${lng}`;

  return (
    <div className={`rounded-lg overflow-hidden border border-matrix-primary/40 relative glow-green-sm ${className}`} style={{ height }}>
      <iframe
        title="Ubicación"
        src={src}
        width="100%"
        height={height}
        style={{ border: 0, filter: 'hue-rotate(95deg) saturate(0.6) brightness(0.8)' }}
        loading="lazy"
      />
      <a
        href={mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-2 right-2 bg-black/80 text-matrix-primary text-[10px] font-mono px-2 py-1 rounded border border-matrix-primary/40 hover:bg-matrix-primary hover:text-black transition"
      >
        Ver en OSM ↗
      </a>
      <div className="absolute top-2 left-2 bg-black/80 text-matrix-primary text-[10px] font-mono px-2 py-1 rounded border border-matrix-primary/40">
        📍 {lat.toFixed(5)}, {lng.toFixed(5)}
      </div>
    </div>
  );
}
