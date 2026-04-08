import { useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import ReactFlow, {
  addEdge,
  useNodesState,
  useEdgesState,
  Background,
  MarkerType,
  type Connection,
  type Edge,
  type Node,
} from "reactflow";

import { nodeTypes } from "./NodeTypes";
import OutputPanel from "./OutputPanel"; 

import { runSimulation } from "../../core/engine";
import type { Ingredient, ActionNodeDefinition } from "../../core/types/types";
import { validateIngredientAgainstInputSpec } from "../../core/helper/inputValidation";
import { getIngredientComposition, hasContinuousLiquidPhase } from "../../core/helper/physicalState";

import { NodeFactory } from "../../core/factories/NodeFactory";
import { IngredientFactory } from "../../core/factories/IngredientFactory";
import { getActionByName } from "../../nodes";

// --- Initial Nodes ---
const initialNodes: Node[] = [NodeFactory.createOutputNode({ x: 560, y: 200 })];

function AppContent() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge[]>([]);
  const [finishResult, setFinishResult] = useState<Ingredient | null>(null);
  const [tick, setTick] = useState(0);
  const [isRunning, setIsRunning] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [invalidPulse, setInvalidPulse] = useState(false);
  const simulationRef = useRef<{ elapsed: number; results: Record<string, Ingredient> }>({
    elapsed: 0,
    results: {},
  });

  const simulationSignature = useMemo(
    () =>
      JSON.stringify({
        nodes: nodes.map((n) => ({
          id: n.id,
          type: n.type,
          data: {
            ingredient: n.data?.ingredient,
            params: n.data?.params,
            definitionId: n.data?.definition?.id,
          },
        })),
        edges: edges.map((e) => ({
          id: e.id,
          source: e.source,
          sourceHandle: e.sourceHandle,
          target: e.target,
          targetHandle: e.targetHandle,
        })),
      }),
    [nodes, edges]
  );

  
  // --- Delete Nodes / Edges ---
  const onNodesDelete = (deleted: Node[]) => {
    setNodes((nds) => nds.filter((n) => n.id === "output" || !deleted.some((d) => d.id === n.id)));
    setEdges((eds) => eds.filter((e) => !deleted.some((d) => d.id === e.source || d.id === e.target)));
  };
  const onEdgesDelete = (deleted: Edge[]) => {
    setEdges((eds) => eds.filter((e) => !deleted.some((d) => d.id === e.id)));
  };

  const handleActionParamsChange = (id: string, params: Record<string, number>) => {
    setNodes((nds) =>
      nds.map((n) =>
        n.id === id
          ? {
              ...n,
              data: {
                ...n.data,
                params,
              },
            }
          : n
      )
    );
  };

  // --- Keyboard Delete Handler ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const inInput =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target?.isContentEditable;

      if (inInput) return;

      if (e.key === "Delete" || e.key === "Backspace") {
        const selectedNodes = nodes.filter((n) => n.selected && n.id !== "output");
        const selectedEdges = edges.filter((e) => e.selected);
        if (selectedNodes.length) onNodesDelete(selectedNodes);
        if (selectedEdges.length) onEdgesDelete(selectedEdges);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nodes, edges]);

  const canConnect = (params: Connection) => {
    const resolved = resolveConnection(params);
    if (!resolved) return false;

    const sourceNode = nodes.find((n) => n.id === resolved.source);
    const targetNode = nodes.find((n) => n.id === resolved.target);
    if (!sourceNode || !targetNode || sourceNode.type === "output") return false;

    // Prevent self-connections
    if (resolved.source === resolved.target) return false;

    // Allow connections to output/preview nodes from any source except output
    if (targetNode.type === "output" || targetNode.type === "preview") {
      return (
        sourceNode.type === "ingredient" ||
        sourceNode.type === "action" ||
        sourceNode.type === "preview"
      );
    }

    // Allow connections to action nodes from ingredient/action nodes
    if (targetNode.type === "action") {
      const def: ActionNodeDefinition | undefined = targetNode.data.definition;
      if (!def) return false;

      const spec = def.inputSpec.find((s) => s.id === resolved.targetHandle);
      if (!spec) return false;

      // Prevent duplicate connections to same handle
      if (edges.some((e) => e.target === targetNode.id && e.targetHandle === resolved.targetHandle)) return false;

      // For ingredient sources, validate state/tags
      if (sourceNode.type === "ingredient") {
        const sourceIngredient: Ingredient | undefined = sourceNode.data.ingredient;
        if (!sourceIngredient) return false;

        if (def.id === "mix") {
          const composition = getIngredientComposition(sourceIngredient);
          const drySolidLike =
            !hasContinuousLiquidPhase(sourceIngredient) &&
            composition.undissolvedSolids > 0.55;
          if (drySolidLike && !sourceIngredient.tags.includes("powder")) {
            return false;
          }
        }

        if (!validateIngredientAgainstInputSpec(sourceIngredient, spec)) return false;
      }
      // For action/preview sources, allow connection (validation happens in engine)
    }

    return true;
  };

  const resolveConnection = (params: Connection): Connection | null => {
    if (!params.source || !params.target) return null;

    const targetNode = nodes.find((n) => n.id === params.target);
    if (targetNode?.type !== "action") return params;

    const def: ActionNodeDefinition | undefined = targetNode.data.definition;
    if (!def) return null;

    const isMixNode = def.id === "mix";
    if (!isMixNode) return params;

    const inputSpec = def.inputSpec ?? [];
    const usedHandles = new Set(
      edges
        .filter((e) => e.target === targetNode.id && e.targetHandle)
        .map((e) => e.targetHandle as string)
    );

    const newestEmptyHandle = inputSpec.find((spec) => !usedHandles.has(spec.id))?.id;
    if (!newestEmptyHandle) return null;

    return {
      ...params,
      targetHandle: newestEmptyHandle,
    };
  };

  // --- Connect Nodes ---
  const onConnect = (params: Connection) => {
    const resolved = resolveConnection(params);
    if (!resolved || !canConnect(resolved)) {
      setInvalidPulse(true);
      window.setTimeout(() => setInvalidPulse(false), 220);
      return;
    }
    setEdges((eds) => addEdge(resolved as Edge, eds));
  };

  // --- Fixed simulation tick (playback speed aware) ---
  useEffect(() => {
    if (!isRunning) return;

    const interval = window.setInterval(() => {
      setTick((t) => t + 1);
    }, Math.max(25, 100 / speed));

    return () => window.clearInterval(interval);
  }, [isRunning, speed]);

  // --- Run simulation and update Output/Preview/Action nodes ---
  useEffect(() => {
    const dt = isRunning ? 0.1 * speed : 0;
    const elapsed = simulationRef.current.elapsed + dt;

    const sim = runSimulation(nodes, edges, {
      deltaTime: dt,
      elapsedTime: elapsed,
      ambientTemperature: 25,
      previousResults: simulationRef.current.results,
    });

    simulationRef.current = {
      elapsed,
      results: sim,
    };

    setEdges((eds) => {
      let changed = false;
      const updated = eds.map((edge) => {
        const sourceKey = edge.sourceHandle
          ? `${edge.source}:${edge.sourceHandle}`
          : edge.source;
        const sourceIngredient = sim[sourceKey] || sim[edge.source];

        const color = sourceIngredient?.color ?? "#7dd3fc";
        const width = Math.max(
          2,
          Math.min(6, 1 + ((sourceIngredient?.amount ?? 20) / 100) * 2)
        );

        const nextStyle = {
          ...(edge.style ?? {}),
          stroke: color,
          strokeWidth: width,
          filter: `drop-shadow(0 0 6px ${color})`,
        };

        const nextAnimated = !!sourceIngredient && isRunning;

        if (
          edge.animated !== nextAnimated ||
          edge.style?.stroke !== nextStyle.stroke ||
          edge.style?.strokeWidth !== nextStyle.strokeWidth
        ) {
          changed = true;
          return { ...edge, animated: nextAnimated, style: nextStyle };
        }

        return edge;
      });

      return changed ? updated : eds;
    });

    const outputNode = nodes.find((n) => n.type === "output");
    const result = outputNode ? sim[outputNode.id] : null;
    setFinishResult(result || null);

    // Only update nodes if displayed simulation values changed
    setNodes((nds) => {
      let changed = false;
      const updated = nds.map((node) => {
        if (node.type === "output" || node.type === "preview") {
          const newData = { ...node.data, result: sim[node.id] || null };
          if (JSON.stringify(node.data.result) !== JSON.stringify(newData.result)) {
            changed = true;
            return { ...node, data: newData };
          }
        }

        if (node.type === "action" && node.data?.definition?.id === "heat") {
          const live = sim[node.id];
          const liveBurnerTemperature = live?._heatMemory?.burnerTemperature ?? 25;
          const newData = {
            ...node.data,
            liveTemperature: live?.temperature ?? 25,
            liveBurnerTemperature,
          };

          if (
            node.data.liveTemperature !== newData.liveTemperature ||
            node.data.liveBurnerTemperature !== newData.liveBurnerTemperature
          ) {
            changed = true;
            return { ...node, data: newData };
          }
        }

        if (node.type === "action" && node.data?.definition?.id === "mix") {
          const def = node.data.definition;
          const inputEdges = edges.filter((e) => e.target === node.id);
          const inputResults = def.inputSpec
            .map((spec: any) => {
              const edge = inputEdges.find((e) => e.targetHandle === spec.id);
              if (!edge) return undefined;
              const sourceKey = edge.sourceHandle ? `${edge.source}:${edge.sourceHandle}` : edge.source;
              return sim[sourceKey] || sim[edge.source];
            });

          const newData = {
            ...node.data,
            inputResults,
          };

          if (JSON.stringify(node.data.inputResults) !== JSON.stringify(newData.inputResults)) {
            changed = true;
            return { ...node, data: newData };
          }
        }

        return node;
      });
      return changed ? updated : nds;
    });
  }, [tick, simulationSignature, isRunning, speed]);

    const handleIngredientAmountChange = (id: string, amount: number) => {
    setNodes((nds) =>
      nds.map((n) =>
        n.id === id
          ? {
              ...n,
              data: {
                ...n.data,
                ingredient: {
                  ...n.data.ingredient,
                  amount,
                },
              },
            }
          : n
      )
    );
  };

  // --- Handle Drop from Sidebar ---
  const onDrop = (event: DragEvent) => {
    event.preventDefault();

    const type = event.dataTransfer.getData("type");
    const label = event.dataTransfer.getData("label");
    const emoji = event.dataTransfer.getData("emoji");
    if (!type || !label) return;

    let newNode: Node;

    switch (type) {
      case "ingredient":
        newNode = NodeFactory.createIngredientNode({
          label,
          emoji,
          ingredientBase: IngredientFactory.fromName(label),
          x: event.clientX - 200,
          y: event.clientY,
          onIngredientAmountChange: handleIngredientAmountChange, 
        });
        break;

      case "action":
        newNode = NodeFactory.createActionNode({
          label,
          emoji,
          action: getActionByName(label),
          x: event.clientX - 200,
          y: event.clientY,
          onParamsChange: handleActionParamsChange,
        });
        break;

      case "preview":
      default:
        newNode = NodeFactory.createPreviewNode({
          label,
          emoji,
          x: event.clientX - 200,
          y: event.clientY,
        });
        break;
    }

    setNodes((nds) => [...nds, newNode]);
  };

  const handleResetSimulation = () => {
    simulationRef.current = { elapsed: 0, results: {} };
    setTick((t) => t + 1);
  };

  return (
    <div style={wrapperStyle}>
      <div style={topRowStyle}>
        <div style={canvasShellStyle(invalidPulse)}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodesDelete={onNodesDelete}
            onEdgesDelete={onEdgesDelete}
            nodeTypes={nodeTypes}
            onDrop={onDrop}
            onDragOver={(e) => e.preventDefault()}
            fitView
            connectionLineStyle={{ stroke: invalidPulse ? "#f87171" : "#7dd3fc", strokeWidth: 3 }}
            defaultEdgeOptions={{
              type: "smoothstep",
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color: "#c9a96e",
              },
            }}
          >
            <Background gap={26} size={1} color="#2a2521" />
          </ReactFlow>
        </div>
        <OutputPanel result={finishResult} show={!!finishResult} />
      </div>

      <div style={controlsBarStyle}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button type="button" onClick={() => setIsRunning((v) => !v)} style={controlButtonStyle}>
            {isRunning ? "Pause" : "Play"}
          </button>
          <button type="button" onClick={handleResetSimulation} style={controlButtonStyle}>
            Reset
          </button>
          {[1, 2, 4].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setSpeed(value)}
              style={speedButtonStyle(speed === value)}
            >
              x{value}
            </button>
          ))}
        </div>

        <div style={{ fontSize: 12, color: "#d7bf93" }}>
          Timeline: {simulationRef.current.elapsed.toFixed(1)}s
        </div>
      </div>
    </div>
  );
}

export default AppContent;

// --- Styles ---
const wrapperStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  width: "100%",
  height: "100%",
  background: "#1b1714",
};

const topRowStyle: React.CSSProperties = {
  display: "flex",
  flex: 1,
  width: "100%",
  minHeight: 0,
};

const canvasShellStyle = (invalid: boolean): React.CSSProperties => ({
  flex: 1,
  height: "100%",
  background:
    "radial-gradient(circle at 20% 20%, rgba(201,169,110,0.08), transparent 45%), radial-gradient(circle at 80% 70%, rgba(125,211,252,0.08), transparent 45%), #1e1b18",
  boxShadow: invalid
    ? "inset 0 0 0 2px rgba(248,113,113,0.8), inset 0 0 40px rgba(248,113,113,0.35)"
    : "inset 0 0 0 1px #3a3127",
  transition: "box-shadow 130ms ease",
});

const controlsBarStyle: React.CSSProperties = {
  height: 58,
  borderTop: "1px solid #3a3127",
  background: "linear-gradient(180deg, #201a15 0%, #17120f 100%)",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "0 14px",
};

const controlButtonStyle: React.CSSProperties = {
  border: "1px solid #7d6240",
  borderRadius: 8,
  background: "linear-gradient(180deg, #3a2e23 0%, #2a2119 100%)",
  color: "#f5e6c8",
  fontSize: 12,
  padding: "6px 12px",
  cursor: "pointer",
};

const speedButtonStyle = (active: boolean): React.CSSProperties => ({
  border: `1px solid ${active ? "#c9a96e" : "#7d6240"}`,
  borderRadius: 8,
  background: active
    ? "linear-gradient(180deg, #715938 0%, #4f3f2a 100%)"
    : "linear-gradient(180deg, #3a2e23 0%, #2a2119 100%)",
  color: "#f5e6c8",
  fontSize: 12,
  padding: "6px 10px",
  cursor: "pointer",
});