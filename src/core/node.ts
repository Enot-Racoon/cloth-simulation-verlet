import { UpdateFn, DrawFn } from "../types";

export interface Node {
  id: string;
  type: string;

  x: number;
  y: number;

  update: UpdateFn;
  draw: DrawFn;

  parent: Node | null;
  children: Node[];
}

export const createNode = (
  x: number = 0,
  y: number = 0,
  update: UpdateFn = () => {},
  draw: DrawFn = () => {},
  children: Node[] = [],
  parent: Node | null = null,
  type: string = "node"
): Node => ({
  id: crypto.randomUUID(),
  type,
  x,
  y,
  update,
  draw,
  parent,
  children,
});

const addChild = (parent: Node, child: Node) => {
  if (child.parent) {
    removeChild(child.parent, child);
  }

  child.parent = parent;
  parent.children.push(child);
};

const removeChild = (parent: Node, child: Node) => {
  parent.children = parent.children.filter((c) => c !== child);
  child.parent = null;
};
