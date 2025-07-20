import { createSlice } from '@reduxjs/toolkit';

interface MMapState {
  MMapId?: string;
  MMapName?: string;
  nodes: { id: string; position: { x: number; y: number; }; data: { text: string; }; type: string; dragHandle: string; }[];
  edges: { id: string; source: string; target: string; }[];
}

const initialState: MMapState = {
  MMapId: undefined,
  MMapName: undefined,
  nodes: [
    // Example node structure
    { id: 'node1', position: { x: 0, y: 0 }, data: { text: 'Node 1' }, type: 'text', dragHandle: '.drag-handle__custom' },
    { id: 'node2', position: { x: 200, y: 200 }, data: { text: 'Node 2' }, type: 'text', dragHandle: '.drag-handle__custom' },
  ],
  edges: [],
}

export const MMapSlice = createSlice({
  name: 'MMap',
  initialState,
  reducers: {
    setMMapId: (state, action) => {
      state.MMapId = action.payload;
    },
    setMMapData: (state, action) => {
      const { nodes, edges } = action.payload;
      state.nodes = nodes;
      state.edges = edges;
    },
    insertNode: (state, action) => {
      state.nodes.push(action.payload);
    },
    removeNode: (state, action) => {
      state.nodes = state.nodes.filter(node => node.id !== action.payload);
    },
    changeNodePosition: (state, action) => {
      const { id, position } = action.payload;
      const node = state.nodes.find(node => node.id === id);
      if (node) {
        node.position = position;
      }
    },
    insertEdge: (state, action) => {
      state.edges.push(action.payload);
    },
    removeEdge: (state, action) => {
      state.edges = state.edges.filter(edge => edge.id !== action.payload);
    },
  },
});

export const { setMMapId, setMMapData, insertNode, removeNode, changeNodePosition, insertEdge, removeEdge, } = MMapSlice.actions;
export const MmapReducer = MMapSlice.reducer;
