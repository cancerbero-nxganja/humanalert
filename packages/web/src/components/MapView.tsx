import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, LayerGroup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type { LatLngExpression } from 'leaflet';
import { getMapPins, getAnimalAlerts } from '@/lib/api';

interface MapPin {
  id: string;
  title: string;
  latitude: number;
  longitude: number;
  pin_type: string;
}

interface AnimalAlert {
  id: string;
  species: string;
  name?: string;
  last_seen_lat: number;
  last_seen_lon: number;
  status: string;
}

const DEFAULT_CENTER: LatLngExpression = [0, 0];
const DEFAULT_ZOOM = 2;

export default function MapView() {
  const [pins, setPins] = useState<MapPin[]>([]);
  const [animalAlerts, setAnimalAlerts] = useState<AnimalAlert[]>([]);

  useEffect(() => {
    // Fix Leaflet default icon path in Next.js
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const L = require('leaflet');
    delete (L.Icon.Default.prototype as Record<string, unknown>)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });

    getMapPins().then((data) => setPins(data as MapPin[])).catch(() => {});
    getAnimalAlerts({ status: 'LOST' }).then((data) => setAnimalAlerts(data as AnimalAlert[])).catch(() => {});
  }, []);

  return (
    <MapContainer
      center={DEFAULT_CENTER}
      zoom={DEFAULT_ZOOM}
      style={{ height: '100%', width: '100%' }}
      aria-label="Solidarity map showing alerts and map pins"
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        maxZoom={19}
      />

      <LayerGroup>
        {pins.map((pin) => (
          <Marker key={pin.id} position={[pin.latitude, pin.longitude]}>
            <Popup>
              <strong>{pin.title}</strong>
              <br />
              <small>{pin.pin_type}</small>
            </Popup>
          </Marker>
        ))}
      </LayerGroup>

      <LayerGroup>
        {animalAlerts.map((alert) => (
          <Marker key={alert.id} position={[alert.last_seen_lat, alert.last_seen_lon]}>
            <Popup>
              <strong>🐾 {alert.name ?? alert.species}</strong>
              <br />
              <small>{alert.status}</small>
            </Popup>
          </Marker>
        ))}
      </LayerGroup>
    </MapContainer>
  );
}
