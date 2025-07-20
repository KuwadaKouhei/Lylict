
import { configureStore } from '@reduxjs/toolkit';
import mindmapReducer from './features/mindmap/mindmapSlice';

export const makeStore = () => {
  return configureStore({
    reducer: {
      mindmap: mindmapReducer,
    },
  });
};

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
