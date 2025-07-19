import { memo } from 'react';
import { useReactFlow, type NodeProps, type Node } from '@xyflow/react';

function TextNode({ id, data }: NodeProps<Node<{ text: string }>>) {
  const { updateNodeData } = useReactFlow();

  return (
    <div>
      <input
        onChange={(evt) => updateNodeData(id, { text: evt.target.value })}
        value={data.text}
        className="xy-theme__input"
        placeholder="Enter text"
      />
    </div>
  );
}

export default memo(TextNode);