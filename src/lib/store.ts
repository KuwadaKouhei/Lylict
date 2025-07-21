
import { configureStore } from '@reduxjs/toolkit';
import mindmapReducer from './features/mindmap/mindmapSlice';

export const makeStore = () => {
  return configureStore({
    reducer: {
      mindmap: mindmapReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: ['mindmap/fetchAllMindMaps/fulfilled'],
          ignoredPaths: ['mindmap.allMindMaps'],
        },
      }),
  });
};

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
