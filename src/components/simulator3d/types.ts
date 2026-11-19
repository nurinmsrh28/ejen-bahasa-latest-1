import type * as THREE from 'three';
import type { LocationId } from '../../game/types';

export interface WorldBoxCollider {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  maxY?: number;
  blockCamera?: boolean;
}

export interface ZoneTriggerConfig {
  id: LocationId;
  name: string;
  shortName: string;
  center: [number, number, number];
  spawnPoint: [number, number, number];
  spawnYaw: number;
  markerPos: [number, number, number];
  radius: number;
}

export interface ClueBeaconNode {
  clueId: string;
  locationId: LocationId;
  worldPos: THREE.Vector3;
  hitMesh: THREE.Mesh;
  beaconGroup: THREE.Group;
  beaconMesh: THREE.Mesh;
  beaconRing: THREE.Mesh;
  scanRing: THREE.Mesh;
  baseY: number;
  phaseOffset: number;
}

export interface NpcWalker {
  group: THREE.Group;
  leftLeg: THREE.Object3D;
  rightLeg: THREE.Object3D;
  leftArm: THREE.Object3D;
  rightArm: THREE.Object3D;
  waypoints: [number, number][];
  waypointIdx: number;
  speed: number;
  phaseOffset: number;
}

export interface SwayingBanner {
  cloth: THREE.Mesh;
  baseRotY: number;
  phase: number;
}

export interface SkyBird {
  group: THREE.Group;
  leftWing: THREE.Object3D;
  rightWing: THREE.Object3D;
  centerX: number;
  centerZ: number;
  altitude: number;
  radius: number;
  speed: number;
  phase: number;
}

export interface SimulatorTelemetry {
  playerX: number;
  playerZ: number;
  playerYaw: number;
  isMoving: boolean;
  isRunning: boolean;
  isGrounded: boolean;
  nearbyZoneId: LocationId | null;
  nearbyClueId: string | null;
  nearbyClueLocationId: LocationId | null;
  currentAreaName: string;
}
