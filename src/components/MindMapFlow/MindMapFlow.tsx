import React from 'react';
import { useReactFlow } from '@xyflow/react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../lib/store';
import { addNode } from '../../lib/features/mindmap/mindmapSlice';
import { Node } from '@xyflow/react';
import FloatingAddButton from '../FloatingAddButton/FloatingAddButton';
import ZoomControls from '../ZoomControls/ZoomControls';

const MindMapFlow: React.FC = () => {
  const dispatch: AppDispatch = useDispatch();
  const { nodes } = useSelector((state: RootState) => state.mindmap);
  const { getViewport } = useReactFlow();

  // 既存ノードとの重複をチェックする関数
  const isPositionOccupied = (x: number, y: number, threshold: number = 180) => {
    return nodes.some(node => {
      const distance = Math.sqrt(Math.pow(node.position.x - x, 2) + Math.pow(node.position.y - y, 2));
      return distance < threshold;
    });
  };

  const handleAddNode = () => {
    // ReactFlowの実際の表示範囲内で既存ノードと重複しない位置を見つける
    const findAvailablePosition = () => {
      const viewport = getViewport();
      const nodeSpacing = 200; // スペーシングを少し増やす
      const maxAttempts = 100; // 試行回数を増やす
      
      // 現在の表示範囲を計算（ReactFlowの座標系）
      const containerWidth = window.innerWidth;
      const containerHeight = window.innerHeight - 60; // ヘッダー分を除く
      
      // ビューポート座標をワールド座標に変換
      const viewWidth = containerWidth / viewport.zoom;
      const viewHeight = containerHeight / viewport.zoom;
      const viewLeft = -viewport.x / viewport.zoom;
      const viewTop = -viewport.y / viewport.zoom;
      const viewRight = viewLeft + viewWidth;
      const viewBottom = viewTop + viewHeight;
      
      // ノードが存在しない場合は、ビューの中央に配置
      if (nodes.length === 0) {
        // ReactFlowエリアの実際の中央を計算
        const reactFlowCenterX = containerWidth / 2;
        const reactFlowCenterY = containerHeight / 2;
        
        // ワールド座標に変換（ReactFlowの座標系）
        const worldCenterX = (reactFlowCenterX - viewport.x) / viewport.zoom;
        const worldCenterY = (reactFlowCenterY - viewport.y) / viewport.zoom;
        
        // 右下へのズレを補正するためのオフセット調整
        // ノードサイズ（150px）とマージンを考慮
        const nodeWidth = 150;
        const nodeHeight = 80; // 推定ノード高さ
        const offsetX = -(nodeWidth / 2 + 20) / viewport.zoom; // ノード幅の半分＋20pxを左にオフセット
        const offsetY = -(nodeHeight / 2) / viewport.zoom; // ノード高さの半分を上にオフセット
        
        const adjustedX = worldCenterX + offsetX;
        const adjustedY = worldCenterY + offsetY;
        
        return { x: adjustedX, y: adjustedY };
      }
      
      // マージンを設定して画面端を避ける
      const margin = 150 / viewport.zoom; // マージンを増やす
      const minX = viewLeft + margin;
      const maxX = viewRight - margin;
      const minY = viewTop + margin;
      const maxY = viewBottom - margin;
      
      // 有効な範囲をチェック
      if (maxX <= minX || maxY <= minY) {
        // 範囲が狭すぎる場合は中央に配置
        return { x: viewLeft + viewWidth / 2, y: viewTop + viewHeight / 2 };
      }
      
      // グリッドベースの配置を試行（より組織的な配置）
      const gridSize = nodeSpacing;
      const gridCols = Math.floor((maxX - minX) / gridSize);
      const gridRows = Math.floor((maxY - minY) / gridSize);
      const totalGridCells = gridCols * gridRows;
      
      if (totalGridCells > 0) {
        // グリッド位置をランダムに試行
        const gridPositions = [];
        for (let row = 0; row < gridRows; row++) {
          for (let col = 0; col < gridCols; col++) {
            gridPositions.push({ row, col });
          }
        }
        
        // グリッド位置をシャッフル
        for (let i = gridPositions.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [gridPositions[i], gridPositions[j]] = [gridPositions[j], gridPositions[i]];
        }
        
        // シャッフルされたグリッド位置を試行
        for (const gridPos of gridPositions) {
          const baseX = minX + gridPos.col * gridSize;
          const baseY = minY + gridPos.row * gridSize;
          
          // グリッド内でランダムにずらす
          const offsetRange = gridSize * 0.3; // グリッドサイズの30%以内でずらす
          const x = baseX + (Math.random() - 0.5) * offsetRange;
          const y = baseY + (Math.random() - 0.5) * offsetRange;
          
          if (!isPositionOccupied(x, y, nodeSpacing)) {
            return { x, y };
          }
        }
      }
      
      // グリッド方式で失敗した場合、完全ランダム方式を試行
      for (let i = 0; i < maxAttempts; i++) {
        const x = minX + Math.random() * (maxX - minX);
        const y = minY + Math.random() * (maxY - minY);
        
        if (!isPositionOccupied(x, y, nodeSpacing)) {
          return { x, y };
        }
      }
      
      // すべての試行で重複した場合は、スパイラル配置を試行
      const centerX = viewLeft + viewWidth / 2;
      const centerY = viewTop + viewHeight / 2;
      
      for (let radius = nodeSpacing; radius < Math.min(viewWidth, viewHeight) / 2; radius += nodeSpacing / 2) {
        for (let angle = 0; angle < 360; angle += 30) {
          const radian = (angle * Math.PI) / 180;
          const x = centerX + Math.cos(radian) * radius;
          const y = centerY + Math.sin(radian) * radius;
          
          // 表示範囲内かチェック
          if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
            if (!isPositionOccupied(x, y, nodeSpacing)) {
              return { x, y };
            }
          }
        }
      }
      
      // 最終的には強制的に配置（スペーシングを無視）
      for (let i = 0; i < 20; i++) {
        const x = centerX + (Math.random() - 0.5) * (viewWidth * 0.8);
        const y = centerY + (Math.random() - 0.5) * (viewHeight * 0.8);
        
        if (!isPositionOccupied(x, y, nodeSpacing * 0.5)) { // スペーシングを半分に
          return { x, y };
        }
      }
      
      // 最後の手段：中央に配置
      return { x: centerX, y: centerY };
    };

    const position = findAvailablePosition();
    const newNode: Node = {
      id: (nodes.length + 1).toString(),
      type: 'customNode',
      data: { label: `Node ${nodes.length + 1}`, isNew: true },
      position,
    };
    
    dispatch(addNode(newNode));
  };

  return (
    <>
      <FloatingAddButton onClick={handleAddNode} />
      <ZoomControls />
    </>
  );
};

export default MindMapFlow;