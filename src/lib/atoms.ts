import type { FormNodeData, NodeData } from "@/app/_components/custom-nodes";
import { atom } from "jotai";
import type { Edge, Node } from "reactflow";

export const atomIsLoading = atom<boolean>(false);
export const atomNodes = atom<Node<NodeData | FormNodeData>[]>([]);
export const atomEdges = atom<Edge[]>([]);
export const atomContextNodeID = atom<string | null>(null);
