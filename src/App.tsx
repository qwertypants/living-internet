import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Line, OrbitControls, Stars } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import {
  Activity,
  ArrowDownToLine,
  AudioLines,
  ChevronDown,
  Command,
  FastForward,
  GitBranch,
  Pause,
  Play,
  RotateCcw,
  Settings2,
  TreePine,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Event, Tree, makeDemoEvents, parseLooseGit, replay } from "./domain";
export function Island({
  trees,
  selected,
  onPick,
  reduced,
  homeRequest = 0,
  simpleForest = false,
}: {
  trees: Tree[];
  selected: string | null;
  onPick: (t: Tree) => void;
  reduced: boolean;
  homeRequest?: number;
  simpleForest?: boolean;
}) {
  const land = useMemo(() => {
    const g = new THREE.CylinderGeometry(5.6, 6, 0.55, 128, 20);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i),
        z = p.getZ(i),
        a = Math.atan2(z, x),
        r = Math.hypot(x, z);
      const noise =
        Math.sin(a * 7 + 1.4) * 0.18 +
        Math.cos(a * 11) * 0.1 +
        Math.sin(r * 1.9 + a * 3) * 0.11;
      p.setY(i, p.getY(i) + noise);
    }
    g.computeVertexNormals();
    return g;
  }, []);
  const trails = useMemo(() => {
    const m = new Map<string, Tree[]>();
    trees.forEach((t) =>
      m.set(t.payload.branch, [...(m.get(t.payload.branch) || []), t]),
    );
    return [...m]
      .map(
        ([name, items], idx) =>
          ({
            name,
            color: ["#73edba", "#80bca3", "#b4dc7a", "#54c8b5"][idx % 4],
            points: items.map(
              (t) => [t.x, 0.045, t.z] as [number, number, number],
            ),
          }).points,
      )
      .filter((p) => p.length > 1);
  }, [trees]);
  return (
    <>
      <ambientLight intensity={0.62} color="#9bdec6" />
      <directionalLight position={[-5, 8, 4]} intensity={3} color="#d8ffe8" />
      <pointLight
        position={[0, 2, 0]}
        intensity={2.8}
        color="#37ffc0"
        distance={10}
      />
      <mesh geometry={land} position={[0, -0.25, 0]} receiveShadow>
        <meshStandardMaterial color="#112c27" roughness={0.85} flatShading />
      </mesh>
      <mesh position={[0, -0.05, 0]}>
        <cylinderGeometry args={[5.64, 6.04, 0.25, 128, 1, true]} />
        <meshBasicMaterial
          color="#30d6ad"
          wireframe
          transparent
          opacity={0.19}
        />
      </mesh>
      {trails.map((points, i) => (
        <Line
          key={i}
          points={points}
          color={["#73edba", "#80bca3", "#b4dc7a", "#54c8b5"][i % 4]}
          lineWidth={1.05}
          transparent
          opacity={0.26}
        />
      ))}
      <Forest trees={trees} selected={selected} onPick={onPick} simple={simpleForest} />
      <Stars
        radius={70}
        depth={35}
        count={1100}
        factor={2.4}
        saturation={0.25}
        fade
        speed={reduced ? 0 : 0.3}
      />
      <CameraFlight tree={trees.find(t => t.id === selected)} reduced={reduced} homeRequest={homeRequest} />
      <fog attach="fog" args={["#081411", 14, 31]} />
    </>
  );
}
function CameraFlight({ tree, reduced, homeRequest }: { tree?: Tree; reduced: boolean; homeRequest: number }) {
  const camera = useThree(s => s.camera);
  const aspect = useThree(s => s.size.width / s.size.height);
  const controls = useRef<import("three-stdlib").OrbitControls>(null);
  const flight = useRef<{ from: THREE.Vector3; target: THREE.Vector3; to: THREE.Vector3; look: THREE.Vector3; elapsed: number } | null>(null);
  const [manual, setManual] = useState(false);
  const [flying, setFlying] = useState(false);
  useEffect(() => {
    const c = controls.current;
    if (!c) return;
    setManual(false);
    c.autoRotate = false;
    const look = tree ? new THREE.Vector3(tree.x, tree.height * 0.6, tree.z) : new THREE.Vector3();
    const to = tree ? look.clone().add(new THREE.Vector3(3, 2.8, 4).multiplyScalar(Math.min(2, Math.max(1, 1 / aspect)))) : new THREE.Vector3(8, 8, 12);
    flight.current = { from: camera.position.clone(), target: c.target.clone(), to, look, elapsed: 0 };
    setFlying(!reduced);
    if (reduced) {
      camera.position.copy(to); c.target.copy(look); c.update(); flight.current = null;
    }
  }, [tree?.id, homeRequest, reduced, camera, aspect]);
  useFrame((_, delta) => {
    const f = flight.current, c = controls.current;
    if (!f || !c) return;
    f.elapsed += delta;
    const t = Math.min(1, f.elapsed / 0.9), eased = t * t * (3 - 2 * t);
    camera.position.lerpVectors(f.from, f.to, eased);
    c.target.lerpVectors(f.target, f.look, eased);
    c.update();
    if (t === 1) { flight.current = null; setFlying(false); }
  });
  return <OrbitControls ref={controls} makeDefault enablePan={false} minDistance={2} maxDistance={20}
    maxPolarAngle={Math.PI * 0.49} enableDamping={false} autoRotate={!reduced && !tree && !manual && !flying}
    autoRotateSpeed={0.18} onStart={() => { flight.current = null; setFlying(false); setManual(true); }} />;
}
function Forest({ trees, selected, onPick, simple }: { trees: Tree[]; selected: string | null; onPick: (tree: Tree) => void; simple: boolean }) {
  // Buckets and instance lookup are rebuilt together, never indexed into the input array.
  const buckets = useMemo(() => [0, 1, 2].map(species => trees.filter(t => {
    let hash = 0;
    for (const char of t.id) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
    return hash % 3 === species;
  })), [trees]);
  const focus = trees.find(t => t.id === selected);
  return <group name="forest">
    {buckets.map((items, species) => <BotanicalBatch key={species} items={items} species={species} simple={simple} onPick={onPick} />)}
    {focus && <group name="selection-marker" position={[focus.x, 0.08, focus.z]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} renderOrder={10}>
        <ringGeometry args={[0.32, 0.38, 4]} />
        <meshBasicMaterial color="white" depthTest={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, focus.height * 1.4 + 0.3, 0]}>
        <coneGeometry args={[0.12, 0.24, 4]} />
        <meshBasicMaterial color="white" depthTest={false} />
      </mesh>
    </group>}
  </group>;
}
function BotanicalBatch({ items, species, simple, onPick }: { items: Tree[]; species: number; simple: boolean; onPick: (tree: Tree) => void }) {
  const trunks = useRef<THREE.InstancedMesh>(null);
  const crowns = useRef<THREE.InstancedMesh>(null);
  useEffect(() => {
    const dummy = new THREE.Object3D();
    items.forEach((tree, index) => {
      dummy.position.set(tree.x, tree.height / 2, tree.z);
      dummy.scale.set(1, tree.height, 1); dummy.updateMatrix();
      trunks.current!.setMatrixAt(index, dummy.matrix);
      dummy.position.y = tree.height * 0.92;
      dummy.scale.set(tree.height * 0.32, tree.height * (species === 1 ? 0.65 : species === 2 ? 0.22 : 0.32), tree.height * 0.32);
      dummy.updateMatrix(); crowns.current!.setMatrixAt(index, dummy.matrix);
      crowns.current!.setColorAt(index, new THREE.Color(`hsl(${tree.hue},82%,63%)`));
    });
    for (const mesh of [trunks.current!, crowns.current!]) {
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      mesh.computeBoundingSphere();
    }
  }, [items, simple]);
  const pick = (event: import("@react-three/fiber").ThreeEvent<MouseEvent>) => {
    const tree = items[event.instanceId ?? -1];
    if (tree) { event.stopPropagation(); onPick(tree); }
  };
  return <group>
    <instancedMesh ref={trunks} args={[undefined, undefined, items.length]} onClick={pick} userData={{ eventIds: items.map(t => t.id) }}>
      <cylinderGeometry args={[0.035, 0.08, 1, 5]} /><meshStandardMaterial color="#9b7550" />
    </instancedMesh>
    <instancedMesh ref={crowns} args={[undefined, undefined, items.length]} onClick={pick} userData={{ eventIds: items.map(t => t.id), species }}>
      {species === 1 ? <coneGeometry args={[1, 2, simple ? 4 : 8]} /> : species === 2 ? <sphereGeometry args={[1, simple ? 4 : 8, 4]} /> : <icosahedronGeometry args={[1, simple ? 0 : 1]} />}
      <meshStandardMaterial emissive="#194838" emissiveIntensity={0.4} roughness={0.7} flatShading />
    </instancedMesh>
  </group>;
}
export default function App() {
  const allDemo = useMemo(() => makeDemoEvents(), []);
  const [events, setEvents] = useState<Event[]>(() => {
    try {
      const saved = localStorage.getItem("mycelium.events.v1");
      return saved ? (JSON.parse(saved) as Event[]) : allDemo;
    } catch {
      return allDemo;
    }
  });
  const [cursor, setCursor] = useState(events.length);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [selected, setSelected] = useState<string | null>(
    null,
  );
  const [homeRequest, setHomeRequest] = useState(0);
  const [simpleForest, setSimpleForest] = useState(false);
  const [error, setError] = useState("");
  const [muted, setMuted] = useState(true);
  const [systemReduced, setSystemReduced] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [motionOverride, setMotionOverride] = useState<boolean | null>(null);
  const reduced = motionOverride ?? systemReduced;
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setSystemReduced(query.matches);
    query.addEventListener("change", update);
    update();
    return () => query.removeEventListener("change", update);
  }, []);
  const trees = useMemo(() => replay(events, cursor), [events, cursor]);
  const selectedTree = trees.find((t) => t.id === selected);
  useEffect(() => {
    if (selected && !selectedTree) setSelected(null);
  }, [selected, selectedTree]);
  const source =
    events[0]?.source === "synthetic" ? "DEMO SIMULATION" : "LOCAL REPOSITORY";
  useEffect(() => {
    try {
      localStorage.setItem("mycelium.events.v1", JSON.stringify(events));
    } catch {
      /* Storage may be unavailable or full; the live session still works. */
    }
  }, [events]);
  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(
      () =>
        setCursor((c) => {
          if (c >= events.length) {
            setPlaying(false);
            return c;
          }
          return Math.min(events.length, c + speed);
        }),
      90,
    );
    return () => clearInterval(timer);
  }, [playing, speed, events.length]);
  async function importRepo(files: FileList | null) {
    if (!files) return;
    setError("");
    try {
      const imported = await parseLooseGit(files);
      setEvents(imported);
      setCursor(imported.length);
      setSelected(imported.at(-1)?.id || null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed");
    }
  }
  return (
    <main className={reduced ? "app reduced" : "app"}>
      <header className="topbar">
        <a className="brand" href="#">
          <span className="brandmark">
            <span />
            <span />
            <span />
          </span>
          <span>MYCELIUM</span>
        </a>
        <div className="top-center">
          <i /> WORLD ONLINE <span className="separator">/</span> {source}
        </div>
        <div className="top-actions">
          <button
            className="icon-button"
            title="Toggle reduced motion"
            aria-pressed={reduced}
            onClick={() => setMotionOverride(!reduced)}
          >
            <Settings2 size={17} />
          </button>
          <button
            className="icon-button"
            title="Toggle audio"
            onClick={() => setMuted(!muted)}
          >
            {muted ? <VolumeX size={17} /> : <Volume2 size={17} />}
          </button>
          <button className="profile">
            <span>W</span>
            <ChevronDown size={13} />
          </button>
        </div>
      </header>
      <section className={`stage${selectedTree ? " focused" : ""}`}>
        <Canvas
          shadows
          camera={{ position: [8, 8, 12], fov: 37 }}
          dpr={[1, 1.6]}
          gl={{ antialias: true, alpha: false }}
        >
          <color attach="background" args={["#081411"]} />
          <Island
            homeRequest={homeRequest}
            simpleForest={simpleForest}
            reduced={reduced}
            trees={trees}
            selected={selected}
            onPick={(t) => setSelected(t.id)}
          />
        </Canvas>
        <div className="scene-vignette" />
        <div className="scene-controls">
          <button onClick={() => { setSelected(null); setHomeRequest(n => n + 1); }}>Home</button>
          <label>Inspect commit <select aria-label="Inspect commit" value={selected || ""} onChange={e => setSelected(e.target.value || null)} onKeyDown={event => {
            const control = event.currentTarget;
            const next = event.key === "ArrowDown" ? Math.min(control.options.length - 1, control.selectedIndex + 1)
              : event.key === "ArrowUp" ? Math.max(0, control.selectedIndex - 1)
              : event.key === "Home" ? 0 : event.key === "End" ? control.options.length - 1 : null;
            if (next !== null) { event.preventDefault(); setSelected(control.options[next].value || null); }
          }}>
            <option value="">Overview</option>
            {trees.map(t => <option key={t.id} value={t.id}>{t.payload.sha.slice(0, 8)} — {t.payload.subject}</option>)}
          </select></label>
          <button aria-pressed={simpleForest} onClick={() => setSimpleForest(value => !value)}>Forest: {simpleForest ? "simple" : "detailed"}</button>
        </div>
        <div className="eyebrow">
          <span className="pulse" /> SYSTEMS GROWING{" "}
          <span className="dot">·</span> {cursor.toString().padStart(3, "0")} /{" "}
          {events.length} EVENTS
        </div>
        <div className="world-title">
          <div className="kicker">A LOCAL ECOSYSTEM</div>
          <h1>
            Rooted in <em>reality.</em>
          </h1>
          <p>Your work, made visible.</p>
        </div>
        <div className="world-stats">
          <div>
            <small>CANOPY</small>
            <b>
              {trees.length}
              <i> stems</i>
            </b>
          </div>
          <div>
            <small>BRANCHES</small>
            <b>
              {new Set(trees.map((t) => t.payload.branch)).size}
              <i> paths</i>
            </b>
          </div>
          <div>
            <small>LAST GROWTH</small>
            <b>
              {trees.at(-1)
                ? new Date(trees.at(-1)!.occurredAt).toLocaleDateString(
                    "en-US",
                    { month: "short", day: "numeric" },
                  )
                : "—"}
            </b>
          </div>
        </div>
        <div className="map-label">
          <span /> ECHO ISLAND <small>01</small>
        </div>
        {selectedTree && (
          <aside className="inspector">
            <div className="inspector-head">
              <div>
                <span className="tiny-label">PROVENANCE / COMMIT</span>
                <button className="close" onClick={() => setSelected(null)}>
                  ×
                </button>
              </div>
              <h2>{selectedTree.payload.subject}</h2>
              <div className="commitline">
                <span className="commit-icon">
                  <GitBranch size={14} />
                </span>
                <code>{selectedTree.payload.sha.slice(0, 8)}</code>
                <span className="branch-pill">
                  {selectedTree.payload.branch}
                </span>
              </div>
            </div>
            <div className="inspector-body">
              <div>
                <small>OBSERVED</small>
                <b>
                  {new Date(selectedTree.occurredAt).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </b>
              </div>
              <div>
                <small>SOURCE REPOSITORY</small>
                <b>
                  {selectedTree.source === "synthetic"
                    ? "mycelium-demo"
                    : "Imported local repository"}
                </b>
              </div>
              <div>
                <small>WORLD OBJECT</small>
                <b>
                  <TreePine size={14} /> Commit tree{" "}
                  <span className="decorative">· visual metaphor</span>
                </b>
              </div>
            </div>
            <div className="inspector-foot">
              <span className="source-led" />{" "}
              {selectedTree.source === "synthetic"
                ? "SYNTHETIC EVENT"
                : "GIT METADATA"}{" "}
              <button
                title="Copy commit ID"
                onClick={() =>
                  navigator.clipboard?.writeText(selectedTree.payload.sha)
                }
              >
                COPY ID ↗
              </button>
            </div>
          </aside>
        )}
        <div className="legend">
          <span>
            <i className="legend-tree" /> COMMIT
          </span>
          <span>
            <i className="legend-path" /> BRANCH PATH
          </span>
          <span>
            <i className="legend-glow" /> DECORATIVE GLOW
          </span>
        </div>
      </section>
      <section className="dock">
        <div className="dock-head">
          <div className="section-name">
            <Activity size={15} /> TIME STREAM{" "}
            <span className="event-count">{events.length} EVENTS</span>
          </div>
          <div className="dock-meta">
            <span>
              <span className="source-led" />
              {source}
            </span>
            <span className="dot">·</span>
            <span>{trees.length} visible</span>
          </div>
        </div>
        <div className="timeline">
          <div className="track">
            <div
              className="track-fill"
              style={{
                width: `${events.length ? (cursor / events.length) * 100 : 0}%`,
              }}
            />
            <div className="tick-markers">
              {Array.from({ length: 14 }, (_, i) => (
                <span key={i} style={{ left: `${(i / 13) * 100}%` }} />
              ))}
            </div>
            <input
              aria-label="Timeline"
              type="range"
              min="0"
              max={events.length}
              value={cursor}
              onChange={(e) => setCursor(Number(e.target.value))}
            />
          </div>
          <div className="date-labels">
            <span>
              {events[0]
                ? new Date(events[0].occurredAt).toLocaleDateString("en-US", {
                    month: "short",
                    year: "numeric",
                  })
                : "—"}
            </span>
            <span>
              {events[Math.max(0, cursor - 1)]
                ? new Date(
                    events[Math.max(0, cursor - 1)].occurredAt,
                  ).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "—"}
            </span>
          </div>
        </div>
        <div className="playback">
          <div className="transport">
            <button
              className="round small"
              title="Restart"
              onClick={() => {
                setCursor(0);
                setPlaying(false);
              }}
            >
              <RotateCcw size={15} />
            </button>
            <button
              className="round primary"
              title={playing ? "Pause" : "Play"}
              onClick={() => {
                if (cursor >= events.length) setCursor(0);
                setPlaying(!playing);
              }}
            >
              {playing ? (
                <Pause size={17} fill="currentColor" />
              ) : (
                <Play size={17} fill="currentColor" />
              )}
            </button>
            <button
              className="round small"
              title="Fast forward"
              onClick={() => setCursor(Math.min(events.length, cursor + 12))}
            >
              <FastForward size={15} />
            </button>
          </div>
          <span className="transport-label">
            {playing ? "REPLAYING HISTORY" : "PAUSED IN TIME"}
          </span>
          <div className="speed-control">
            <span>SPEED</span>
            <button
              className={speed === 1 ? "active" : ""}
              onClick={() => setSpeed(1)}
            >
              1×
            </button>
            <button
              className={speed === 3 ? "active" : ""}
              onClick={() => setSpeed(3)}
            >
              3×
            </button>
            <button
              className={speed === 8 ? "active" : ""}
              onClick={() => setSpeed(8)}
            >
              8×
            </button>
          </div>
          <label className="import-button">
            <ArrowDownToLine size={15} /> IMPORT REPO
            <input
              type="file"
              multiple // @ts-expect-error Chromium directory picker
              webkitdirectory=""
              onChange={(e) => void importRepo(e.target.files)}
            />
          </label>
        </div>
        {error && (
          <div role="alert" className="error">
            {error}
          </div>
        )}
      </section>
      <footer className="footer">
        <span>
          <span className="source-led" /> ALL DATA STAYS ON THIS DEVICE
        </span>
        <span className="footer-right">
          <AudioLines size={13} /> SOUND {muted ? "OFF" : "ON"}{" "}
          <span className="dot">·</span> <Command size={12} /> K{" "}
          <span className="dot">·</span> v0.1.0
        </span>
      </footer>
    </main>
  );
}
