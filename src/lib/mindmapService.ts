import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import { Node, Edge } from '@xyflow/react';

export interface MindMap {
  id?: string;
  title: string;
  nodes: Node[];
  edges: Edge[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

const COLLECTION_NAME = 'mindmaps';

// マインドマップを保存
export const saveMindMap = async (mindmap: Omit<MindMap, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const now = Timestamp.now();
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...mindmap,
      createdAt: now,
      updatedAt: now,
    });
    return docRef.id;
  } catch (error) {
    console.error('Error saving mindmap:', error);
    throw error;
  }
};

// マインドマップを更新
export const updateMindMap = async (id: string, mindmap: Omit<MindMap, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      ...mindmap,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error updating mindmap:', error);
    throw error;
  }
};

// すべてのマインドマップを取得
export const getAllMindMaps = async (): Promise<MindMap[]> => {
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy('updatedAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as MindMap[];
  } catch (error) {
    console.error('Error getting mindmaps:', error);
    throw error;
  }
};

// 特定のマインドマップを取得
export const getMindMap = async (id: string): Promise<MindMap | null> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as MindMap;
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error getting mindmap:', error);
    throw error;
  }
};

// マインドマップを削除
export const deleteMindMap = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting mindmap:', error);
    throw error;
  }
};