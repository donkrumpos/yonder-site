/**
 * ProjectMap — Leaflet map of all Yonder project locations.
 *
 * Renders only on the client (`client:only="react"`) because Leaflet needs
 * the DOM. Tile layer is CartoDB Dark Matter — no API key, dark theme that
 * matches the Yonder palette, attribution required (handled by Leaflet).
 */

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export interface MapProject {
  slug: string;
  title: string;
  lat: number;
  lng: number;
  year?: number;
  featuredImage?: string;
}

interface Props {
  projects: MapProject[];
  currentSlug?: string;
  height?: string;
  initialZoom?: number;
}

const ALGOMA_FALLBACK: [number, number] = [44.6088, -87.4382];

const dotIcon = (current: boolean) =>
  L.divIcon({
    className: 'yonder-map-pin',
    html: `<span style="
      display:block;
      width:${current ? 18 : 12}px;
      height:${current ? 18 : 12}px;
      background:#b8945f;
      border:2px solid #0a0907;
      border-radius:50%;
      box-shadow:${current ? '0 0 0 3px rgba(184,148,95,0.45)' : '0 0 4px rgba(0,0,0,0.6)'};
    "></span>`,
    iconSize: [current ? 22 : 16, current ? 22 : 16],
    iconAnchor: [current ? 11 : 8, current ? 11 : 8],
    popupAnchor: [0, current ? -12 : -8],
  });

export default function ProjectMap({
  projects,
  currentSlug,
  height = '400px',
  initialZoom,
}: Props) {
  const current = projects.find((p) => p.slug === currentSlug);
  const center: [number, number] = current
    ? [current.lat, current.lng]
    : ALGOMA_FALLBACK;
  const zoom = initialZoom ?? (current ? 14 : 10);

  return (
    <div style={{ height, width: '100%' }} className="border border-yonder-ink-700">
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%', background: '#0a0907' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        {projects.map((p) => (
          <Marker
            key={p.slug}
            position={[p.lat, p.lng]}
            icon={dotIcon(p.slug === currentSlug)}
          >
            <Popup className="yonder-map-popup">
              <div style={{ minWidth: 180 }}>
                <div style={{ fontWeight: 600, marginBottom: 2 }}>{p.title}</div>
                {p.year != null && (
                  <div style={{ color: '#8a8378', fontSize: 12, marginBottom: 6 }}>
                    {p.year}
                  </div>
                )}
                {p.slug !== currentSlug && (
                  <a
                    href={`/projects/${p.slug}`}
                    style={{
                      color: '#b8945f',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      fontSize: 11,
                      textDecoration: 'none',
                    }}
                  >
                    View →
                  </a>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
