"use client";
import { atomContextNodeID, atomEdges, atomNodes } from "@/lib/atoms";
import { api } from "@/trpc/react";
import { RouterOutputs } from "@/trpc/shared";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useCallback, useRef } from "react";
import ReactFlow, {
  Background,
  Controls,
  Edge,
  OnConnect,
  OnConnectEnd,
  OnConnectStart,
  OnNodesDelete,
  Node as ReactFlowNode,
  ReactFlowProvider,
  addEdge,
  useReactFlow,
} from "reactflow";
import "reactflow/dist/base.css";
import "../../../tailwind.config";
import {
  FormNode,
  FormNodeData,
  NodeData,
  SkeletonNode,
  StandardNode,
} from "./custom-nodes";

const nodeTypes = {
  custom: StandardNode,
  form: FormNode,
  skeleton: SkeletonNode,
};

let id = 100;
const getId = () => `${id++}`;

const convertDBNodeToReactFlowNode = (
  nodes?: RouterOutputs["node"]["get"],
): { initialNodes: ReactFlowNode<NodeData>[]; initialEdges: Edge[] } => {
  if (!nodes) {
    return { initialNodes: [], initialEdges: [] };
  }

  const mapCounter = new Map<number, number>();
  const xPos = 500;
  const yPos = 400;

  const reactFlowNodes: ReactFlowNode<NodeData>[] = nodes.map((node) => {
    mapCounter.set(node.height, (mapCounter.get(node.height) ?? 0) + 1);

    const reactFlowNode: ReactFlowNode<NodeData> = {
      id: node.id,
      type: "custom",
      data: {
        name: node.name,
        managingDepartment: node.managingDepartment ?? undefined,
        preferredProgrammingLanguage:
          node.preferredProgrammingLanguage ?? undefined,
        height: node.height,
      },
      position: {
        x: xPos * (mapCounter.get(node.height) ?? 0),
        y: yPos * node.height,
      },
    };

    return reactFlowNode;
  });

  const edges: Edge[] = nodes.flatMap((node) => {
    const parentId = node.parentId;
    if (!parentId) {
      return [];
    }

    const edge: Edge = {
      id: `${node.id}-${parentId}`,
      source: parentId,
      target: node.id,
      type: "smoothstep",
      animated: true,
    };

    return [edge];
  });

  return { initialNodes: reactFlowNodes, initialEdges: edges };
};

const AddNodeOnEdgeDrop = () => {
  const utils = api.useUtils();

  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const connectingNodeId = useRef<string | null>(null);
  const connectingHandleType = useRef<string | null>(null);

  const [nodes, setNodes] = useAtom(atomNodes);
  const [edges, setEdges] = useAtom(atomEdges);

  const deleteMutation = api.node.delete.useMutation();
  const moveMutation = api.node.move.useMutation();
  const detachMutation = api.node.detach.useMutation();

  // const [nodes, setNodes, onNodesChange] = useNodesState<NodeData>(
  //   props.initialNodes,
  // );
  // const [edges, setEdges, onEdgesChange] = useEdgesState(props.initalEdges);

  const { project } = useReactFlow();

  // useEffect(() => {
  //   setNodes(props.initialNodes);
  //   setEdges(props.initalEdges);
  // }, [props.initalEdges, props.initialNodes]);

  const onNodesDelete = useCallback<OnNodesDelete>((nodes) => {
    for (const node of nodes) {
      if (node.type === "form") {
        setNodes((nds) => nds.filter((n) => n.id !== node.id));
      } else {
        deleteMutation
          .mutateAsync({ id: node.id })
          .then(() => {
            void utils.invalidate();
          })
          .catch((err) => {
            if (err instanceof Error)
              if (err.message === "No Node found") return;
          });
      }
    }
  }, []);

  const onEdgeClick = useCallback<
    (event: React.MouseEvent<Element, MouseEvent>, node: Edge) => void
  >((event, edge) => {
    console.log("Deleting");

    const target = nodes.find((n) => n.id === edge.target)?.id;

    if (!target) {
      return;
    }

    detachMutation
      .mutateAsync({ id: target })
      .then(() => {
        setEdges((eds) => eds.filter((e) => e.id !== edge.id));
        void utils.node.get.invalidate();
      })
      .catch((err) => {
        if (err instanceof Error) if (err.message === "No Edge found") return;
      });
  }, []);

  const onConnect = useCallback<OnConnect>((params) => {
    if (params.source === params.target) {
      return;
    }

    if (!params.source || !params.target) {
      return;
    }

    // Delete existing edge from source
    setEdges((eds) => eds.filter((e) => e.target !== params.target));

    const newEdge: Edge = {
      id: getId(),
      source: params.source,
      target: params.target,
      type: "smoothstep",
      animated: true,
    };

    setEdges((eds) => addEdge(newEdge, eds));

    void moveMutation
      .mutateAsync({
        id: params.target,
        newParentId: params.source,
      })
      .then(() => {
        void utils.node.get.invalidate();
      });
  }, []);

  const onConnectStart = useCallback<OnConnectStart>((_, params) => {
    connectingHandleType.current = params.handleType;
    if (params.nodeId) connectingNodeId.current = params.nodeId;
  }, []);

  const onConnectEnd = useCallback<OnConnectEnd>(
    (event) => {
      if (!event.target) {
        return;
      }

      // Just to make TS happy
      if (!(event.target instanceof HTMLElement)) {
        return;
      }

      const targetIsPane = event.target.classList.contains("react-flow__pane");

      if (
        targetIsPane &&
        reactFlowWrapper.current &&
        event instanceof MouseEvent &&
        connectingNodeId.current &&
        connectingHandleType.current === "source"
      ) {
        const nodeID = connectingNodeId.current;
        // we need to remove the wrapper bounds, in order to get the correct position
        const { top, left } = reactFlowWrapper.current.getBoundingClientRect();
        const id = getId();
        const newNode: ReactFlowNode<FormNodeData> = {
          id,
          type: "form",
          position: project({
            x: event.clientX - left,
            y: event.clientY - top,
          }),
          data: { parentId: nodeID },
          //   origin: [0.5, 0.0],
        };

        setNodes((nds) => nds.concat(newNode));
        setEdges((eds) =>
          eds.concat({
            id,
            source: nodeID,
            target: id,
            type: "smoothstep",
            animated: true,
          }),
        );
      }
    },
    [project],
  );

  return (
    <div className="wrapper h-full w-full" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        // onNodesChange={onNodesChange}
        // onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onConnectStart={onConnectStart}
        onConnectEnd={onConnectEnd}
        onNodesDelete={onNodesDelete}
        onEdgeClick={onEdgeClick}
        fitView
        nodeTypes={nodeTypes}
        fitViewOptions={{ padding: 2 }}
        className="bg-background"
        proOptions={{ hideAttribution: true }}
      >
        <Background />
        <div className="overflow-hidden rounded">
          <Controls className="rounded !bg-background" />
        </div>
      </ReactFlow>
    </div>
  );
};

export const Flow = () => {
  const contextNodeID = useAtomValue(atomContextNodeID);
  const { data } = api.node.get.useQuery({ id: contextNodeID }, {});
  const setNodes = useSetAtom(atomNodes);
  const setEdges = useSetAtom(atomEdges);

  if (!data) {
    const initialNodes = [
      {
        id: "1",
        type: "skeleton",
        data: {},
        position: { x: 0, y: 0 },
      },
      {
        id: "2",
        type: "skeleton",
        data: {},
        position: { x: 400, y: 0 },
      },
      {
        id: "3",
        type: "skeleton",
        data: {},
        position: { x: 800, y: 0 },
      },
    ];

    return (
      <ReactFlowProvider>
        <div className="wrapper h-full w-full">
          <ReactFlow
            nodes={initialNodes}
            fitView
            nodeTypes={nodeTypes}
            fitViewOptions={{ padding: 2 }}
            className="bg-background"
            proOptions={{ hideAttribution: true }}
          >
            <Background />
            <div className="overflow-hidden rounded">
              <Controls className="rounded !bg-background" />
            </div>
          </ReactFlow>
        </div>
      </ReactFlowProvider>
    );
  }

  const { initialNodes, initialEdges } = convertDBNodeToReactFlowNode(data);

  setNodes(initialNodes);
  setEdges(initialEdges);

  if (initialNodes.length === 0) {
    const formNode: ReactFlowNode<FormNodeData> = {
      data: { parentId: null },
      id: getId(),
      position: { x: 500, y: 0 },
      type: "form",
    };
    setNodes([formNode]);
  }

  return (
    <ReactFlowProvider>
      <AddNodeOnEdgeDrop />
    </ReactFlowProvider>
  );
};
