import { configureStore } from '@reduxjs/toolkit';
import { MmapReducer } from './features/mmapSlice';

export const store = configureStore({
  reducer: {
    mmap: MmapReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;