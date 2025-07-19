import { createSlice } from '@reduxjs/toolkit';

interface MMapState {
  MMapId?: string;
  MMapName?: string;
  nodes: { id: string; position: { x: number; y: number; }; data: { label: string; } }[];
  edges: { id: string; source: string; target: string; }[];
}

const initialState: MMapState = {
  MMapId: undefined,
  MMapName: undefined,
  nodes: [],
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
      const { MMapId, nodes, edges } = action.payload;
      state.MMapId = MMapId;
      state.nodes = nodes;
      state.edges = edges;
    },
    addNode: (state, action) => {
      state.nodes.push(action.payload);
    },
    removeNode: (state, action) => {
      state.nodes = state.nodes.filter(node => node.id !== action.payload);
    },
    addEdge: (state, action) => {
      state.edges.push(action.payload);
    },
    removeEdge: (state, action) => {
      state.edges = state.edges.filter(edge => edge.id !== action.payload);
    },
  },
});

export const { setMMapId, setMMapData, addNode, removeNode, addEdge, removeEdge } = MMapSlice.actions
export const counterReducer = MMapSlice.reducer
