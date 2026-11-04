import { Canvas, useFrame } from "@react-three/fiber";
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
function Island({
  trees,
  selected,
  onPick,
  reduced,
}: {
  trees: Tree[];
  selected: string | null;
  onPick: (t: Tree) => void;
  reduced: boolean;
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
      {trees.map((t) => (
        <TreeObject
          key={t.id}
          tree={t}
          reduced={reduced}
          selected={selected === t.id}
          onPick={onPick}
        />
      ))}
      <Stars
        radius={70}
        depth={35}
        count={1100}
        factor={2.4}
        saturation={0.25}
        fade
        speed={reduced ? 0 : 0.3}
      />
      <OrbitControls
        enablePan={false}
        minDistance={7}
        maxDistance={16}
        maxPolarAngle={Math.PI * 0.49}
        enableDamping={!reduced}
        autoRotate={!reduced}
        autoRotateSpeed={0.18}
      />
      <fog attach="fog" args={["#081411", 14, 31]} />
    </>
  );
}
function TreeObject({
  tree,
  selected,
  onPick,
  reduced,
}: {
  tree: Tree;
  selected: boolean;
  onPick: (t: Tree) => void;
  reduced: boolean;
}) {
  const group = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!reduced && group.current)
      group.current.position.y =
        -0.12 + Math.sin(clock.elapsedTime * 1.2 + tree.x) * 0.025;
  });
  const color = new THREE.Color(`hsl(${tree.hue},82%,63%)`);
  return (
    <group
      ref={group}
      position={[tree.x, 0, tree.z]}
      onClick={(e) => {
        e.stopPropagation();
        onPick(tree);
      }}
    >
      <mesh position={[0, tree.height / 2, 0]} castShadow>
        <cylinderGeometry args={[0.035, 0.08, tree.height, 7]} />
        <meshStandardMaterial color="#9b7550" />
      </mesh>
      <mesh position={[0, tree.height * 0.92, 0]}>
        <sphereGeometry args={[tree.height * 0.29, 9, 8]} />
        <meshStandardMaterial
          color={selected ? "#e9ffe6" : color}
          emissive={color}
          emissiveIntensity={selected ? 2.6 : 0.8}
          roughness={0.5}
        />
      </mesh>
      <mesh position={[0, tree.height * 0.92, 0]}>
        <sphereGeometry args={[tree.height * 0.38, 8, 7]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={selected ? 0.19 : 0.055}
        />
      </mesh>
    </group>
  );
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
    events.at(-1)?.id || null,
  );
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
      <section className="stage">
        <Canvas
          shadows
          camera={{ position: [8, 8, 12], fov: 37 }}
          dpr={[1, 1.6]}
          gl={{ antialias: true, alpha: false }}
        >
          <color attach="background" args={["#081411"]} />
          <Island
            reduced={reduced}
            trees={trees}
            selected={selected}
            onPick={(t) => setSelected(t.id)}
          />
        </Canvas>
        <div className="scene-vignette" />
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
