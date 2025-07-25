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
  where
} from 'firebase/firestore';
import { db } from './firebase';
import { getCurrentUser } from './auth';
import { Node, Edge } from '@xyflow/react';

export interface MindMap {
  id?: string;
  title: string;
  nodes: Node[];
  edges: Edge[];
  createdAt: Date;
  updatedAt: Date;
  userId?: string;
}

const COLLECTION_NAME = 'mindmaps';

// 認証チェック関数
const requireAuth = (): string => {
  const user = getCurrentUser();
  if (!user) {
    throw new Error('AUTHENTICATION_REQUIRED');
  }
  return user.uid;
};

// マインドマップを保存
export const saveMindMap = async (mindmap: Omit<MindMap, 'id' | 'createdAt' | 'updatedAt' | 'userId'>): Promise<string> => {
  try {
    const userId = requireAuth();
    const now = new Date();
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...mindmap,
      userId,
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
export const updateMindMap = async (id: string, mindmap: Omit<MindMap, 'id' | 'createdAt' | 'updatedAt' | 'userId'>): Promise<void> => {
  try {
    const userId = requireAuth();
    const docRef = doc(db, COLLECTION_NAME, id);
    
    // 更新前に所有者チェック
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      throw new Error('マインドマップが見つかりません');
    }
    
    const data = docSnap.data();
    if (data.userId !== userId) {
      throw new Error('このマインドマップを編集する権限がありません');
    }
    
    await updateDoc(docRef, {
      ...mindmap,
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error('Error updating mindmap:', error);
    throw error;
  }
};

// ユーザーのマインドマップを取得
export const getAllMindMaps = async (): Promise<MindMap[]> => {
  try {
    const userId = requireAuth();
    const q = query(
      collection(db, COLLECTION_NAME), 
      where('userId', '==', userId),
      orderBy('updatedAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      };
    }) as MindMap[];
  } catch (error) {
    console.error('Error getting mindmaps:', error);
    throw error;
  }
};

// 特定のマインドマップを取得
export const getMindMap = async (id: string): Promise<MindMap | null> => {
  try {
    const userId = requireAuth();
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      
      // 所有者チェック
      if (data.userId !== userId) {
        throw new Error('このマインドマップにアクセスする権限がありません');
      }
      
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
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
    const userId = requireAuth();
    const docRef = doc(db, COLLECTION_NAME, id);
    
    // 削除前に所有者チェック
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      throw new Error('マインドマップが見つかりません');
    }
    
    const data = docSnap.data();
    if (data.userId !== userId) {
      throw new Error('このマインドマップを削除する権限がありません');
    }
    
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting mindmap:', error);
    throw error;
  }
};