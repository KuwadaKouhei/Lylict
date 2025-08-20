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
import { getCurrentUser, waitForAuthState } from './auth';
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

// 認証チェック関数（改良版）
const requireAuth = async (waitForAuth = false): Promise<string> => {
  let user = getCurrentUser();
  
  // 認証状態を待機するオプション
  if (!user && waitForAuth) {
    console.log('認証状態を待機中...');
    user = await waitForAuthState();
  }
  
  console.log('requireAuth実行時の認証状態:', {
    user: user,
    uid: user?.uid,
    displayName: user?.displayName,
    email: user?.email,
    isAuthenticated: !!user,
    waitForAuth: waitForAuth
  });
  
  if (!user) {
    console.warn('認証が必要です。ユーザーがログインしていません。');
    throw new Error('AUTHENTICATION_REQUIRED');
  }
  
  console.log('認証済みユーザー:', user.uid);
  return user.uid;
};

// マインドマップを保存
export const saveMindMap = async (mindmap: Omit<MindMap, 'id' | 'createdAt' | 'updatedAt' | 'userId'>): Promise<string> => {
  try {
    const userId = await requireAuth();
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
    const userId = await requireAuth();
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
    // 認証状態を確実に待機
    const userId = await requireAuth(true);
    
    console.log('Firestore クエリ実行中:', {
      collection: COLLECTION_NAME,
      userId: userId,
      queryType: 'where userId == userId'
    });
    
    // インデックスエラーの回避策：orderByを削除して、クライアント側でソート
    const q = query(
      collection(db, COLLECTION_NAME), 
      where('userId', '==', userId)
    );
    
    console.log('クエリ送信前の状態確認完了');
    const querySnapshot = await getDocs(q);
    console.log('Firestoreクエリ結果:', {
      docsCount: querySnapshot.docs.length,
      isEmpty: querySnapshot.empty
    });
    
    const mindmaps = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      };
    }) as MindMap[];
    
    // クライアント側でupdatedAtの降順ソート
    const sortedMindmaps = mindmaps.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    console.log('最終結果:', {
      count: sortedMindmaps.length,
      mindmaps: sortedMindmaps.map(m => ({ id: m.id, title: m.title }))
    });
    
    return sortedMindmaps;
  } catch (error) {
    console.error('Error getting mindmaps:', error);
    throw error;
  }
};

// 特定のマインドマップを取得
export const getMindMap = async (id: string): Promise<MindMap | null> => {
  try {
    const userId = await requireAuth();
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
    const userId = await requireAuth();
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