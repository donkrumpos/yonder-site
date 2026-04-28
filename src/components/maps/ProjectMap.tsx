/**
 * ProjectMap — Leaflet map of all Yonder project locations.
 *
 * Renders only on the client (`client:only="react"`) — Leaflet needs DOM.
 *
 * Features:
 *   - Logo pins (yonder-circle-glyph) instead of generic markers
 *   - Marker clustering with low radius — handles the case where multiple
 *     murals share the same coordinates (e.g. several at 321 Steele St)
 *   - Cmd/Ctrl + scroll required to zoom (via leaflet-gesture-handling),
 *     so embedded maps don't trap the page scroll
 *   - Popups with thumbnail, title, year, and a Google Maps directions link
 *   - The current project's pin is larger and ringed
 *
 * Tile layer: CartoDB Dark Matter — no API key, dark theme matches palette.
 */

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-gesture-handling';
import 'leaflet-gesture-handling/dist/leaflet-gesture-handling.css';

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
const LOGO_URL = '/images/yonder-circle-glyph-150x150.png';

const yonderPin = (current: boolean) => {
  const size = current ? 36 : 26;
  const ring = current
    ? 'box-shadow:0 0 0 3px rgba(184,148,95,0.65),0 0 8px rgba(0,0,0,0.6);'
    : 'box-shadow:0 0 4px rgba(0,0,0,0.7);';
  return L.divIcon({
    className: 'yonder-pin',
    html: `<img src="${LOGO_URL}" alt="Yonder" style="
      width:${size}px;
      height:${size}px;
      display:block;
      border-radius:50%;
      ${ring}
    " />`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
};

const createClusterIcon = (cluster: { getChildCount: () => number }) => {
  const count = cluster.getChildCount();
  return L.divIcon({
    className: 'yonder-cluster',
    html: `<div style="
      width:38px;
      height:38px;
      background:#b8945f;
      color:#0a0907;
      border-radius:50%;
      display:flex;
      align-items:center;
      justify-content:center;
      font-weight:700;
      font-size:14px;
      font-family:system-ui,sans-serif;
      border:2px solid #0a0907;
      box-shadow:0 0 0 2px #b8945f,0 0 8px rgba(0,0,0,0.5);
    ">${count}</div>`,
    iconSize: [38, 38],
  });
};

function PopupBody({
  project,
  isCurrent,
}: {
  project: MapProject;
  isCurrent: boolean;
}) {
  const inner = (
    <>
      {project.featuredImage && (
        <img
          src={project.featuredImage}
          alt=""
          style={{
            width: '100%',
            height: 100,
            objectFit: 'cover',
            display: 'block',
            marginBottom: 8,
          }}
          loading="lazy"
        />
      )}
      <div style={{ fontWeight: 600, marginBottom: 2 }}>{project.title}</div>
      {project.year != null && (
        <div style={{ color: '#8a8378', fontSize: 12 }}>{project.year}</div>
      )}
    </>
  );

  return (
    <>
      {isCurrent ? (
        <div style={{ marginBottom: 8 }}>{inner}</div>
      ) : (
        <a
          href={`/projects/${project.slug}`}
          style={{
            display: 'block',
            color: '#e8e2d4',
            textDecoration: 'none',
            marginBottom: 8,
          }}
        >
          {inner}
        </a>
      )}
      <div
        style={{
          fontSize: 11,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${project.lat},${project.lng}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#b8945f', textDecoration: 'none' }}
        >
          Directions ↗
        </a>
      </div>
    </>
  );
}

export default function ProjectMap({
  projects,
  currentSlug,
  height = '400px',
  initialZoom,
}: Props) {
  const current = projects.find((p) => p.slug === currentSlug);
  const center: [number, number] = current ? [current.lat, current.lng] : ALGOMA_FALLBACK;
  const zoom = initialZoom ?? (current ? 14 : 10);

  return (
    <div style={{ height, width: '100%' }} className="border border-yonder-ink-700">
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={false}
        // @ts-expect-error — gestureHandling is added by leaflet-gesture-handling
        gestureHandling={true}
        style={{ height: '100%', width: '100%', background: '#0a0907' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <MarkerClusterGroup
          chunkedLoading
          maxClusterRadius={25}
          spiderfyOnMaxZoom={true}
          showCoverageOnHover={false}
          zoomToBoundsOnClick={true}
          iconCreateFunction={createClusterIcon}
        >
          {projects.map((p) => (
            <Marker
              key={p.slug}
              position={[p.lat, p.lng]}
              icon={yonderPin(p.slug === currentSlug)}
            >
              <Popup className="yonder-map-popup" maxWidth={240}>
                <div style={{ minWidth: 200 }}>
                  <PopupBody
                    project={p}
                    isCurrent={p.slug === currentSlug}
                  />
                </div>
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  );
}
