import { memo } from 'react';
import { useReactFlow, type NodeProps, type Node } from '@xyflow/react';
import './customNode.css';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { Handle, Position, useConnection  } from '@xyflow/react';

function TextNode({ id, data }: NodeProps<Node<{ text: string }>>) {
  const { updateNodeData } = useReactFlow();
  const connection = useConnection();
  const isTarget = connection.inProgress && connection.fromNode.id !== id;
  const label = isTarget ? 'target' : 'source';

  return (
    // <div>
    //   {!connection.inProgress && (
    //     <Handle
    //       className="customHandle"
    //       position={Position.Right}
    //       type="source"
    //       style={{ background: '#4400FFFF' }}
    //     />
    //   )}
    //   {(!connection.inProgress || isTarget) && (
    //     <Handle className="customHandle" position={Position.Left} type="target" isConnectableStart={false} style={{ background: '#FF5100FF' }} />
    //   )}
    //   <div style={{ display: 'flex', alignItems: 'center' }}>
    //     <input
    //       onChange={(evt) => updateNodeData(id, { text: evt.target.value })}
    //       value={data.text}
    //       className="xy-theme__input"
    //       placeholder="Enter text"
    //     />
    //     <DragIndicatorIcon className="drag-handle__custom" />
    //   </div>
    // </div>

    <div className="customNode">
      <div
        className="customNodeBody"
      >
        {!connection.inProgress && (
          <Handle
            className="customHandle"
            position={Position.Right}
            type="source"
            style={{ background: '#4400FFFF' }}
          />
        )}
        {/* We want to disable the target handle, if the connection was started from this node */}
        {(!connection.inProgress || isTarget) && (
          <Handle className="customHandle" position={Position.Left} type="target" isConnectableStart={false} style={{ background: '#FF5100FF' }} />
        )}
        <div>test</div>
      </div>
    </div>
  );
}

export default memo(TextNode);