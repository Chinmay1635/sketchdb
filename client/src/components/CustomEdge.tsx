import React from 'react';
import {
  EdgeProps,
  getSmoothStepPath,
  Position,
  BaseEdge,
  EdgeLabelRenderer,
} from '@xyflow/react';
import { Cardinality } from '../types';

// Custom edge data type
interface CustomEdgeData extends Record<string, unknown> {
  cardinality?: Cardinality;
  relationshipName?: string;
  onDelete?: string;
  onUpdate?: string;
  isOptional?: boolean;
}

// Cardinality symbols for crow's foot notation
const CardinalityMarker: React.FC<{ 
  type: 'one' | 'many' | 'zero-or-one' | 'zero-or-many';
  position: 'source' | 'target';
  x: number;
  y: number;
  angle: number;
}> = ({ type, position, x, y, angle }) => {
  const size = 12;
  const transform = `translate(${x}, ${y}) rotate(${angle})`;
  
  switch (type) {
    case 'one':
      // Single line (|)
      return (
        <g transform={transform}>
          <line x1={0} y1={-size/2} x2={0} y2={size/2} stroke="#0074D9" strokeWidth={2} />
        </g>
      );
    case 'many':
      // Crow's foot (three lines spreading out)
      return (
        <g transform={transform}>
          <line x1={0} y1={0} x2={-size} y2={-size/2} stroke="#0074D9" strokeWidth={2} />
          <line x1={0} y1={0} x2={-size} y2={0} stroke="#0074D9" strokeWidth={2} />
          <line x1={0} y1={0} x2={-size} y2={size/2} stroke="#0074D9" strokeWidth={2} />
        </g>
      );
    case 'zero-or-one':
      // Circle + line (o|)
      return (
        <g transform={transform}>
          <circle cx={-size} cy={0} r={4} fill="none" stroke="#0074D9" strokeWidth={2} />
          <line x1={0} y1={-size/2} x2={0} y2={size/2} stroke="#0074D9" strokeWidth={2} />
        </g>
      );
    case 'zero-or-many':
      // Circle + crow's foot
      return (
        <g transform={transform}>
          <circle cx={-size-8} cy={0} r={4} fill="none" stroke="#0074D9" strokeWidth={2} />
          <line x1={0} y1={0} x2={-size} y2={-size/2} stroke="#0074D9" strokeWidth={2} />
          <line x1={0} y1={0} x2={-size} y2={0} stroke="#0074D9" strokeWidth={2} />
          <line x1={0} y1={0} x2={-size} y2={size/2} stroke="#0074D9" strokeWidth={2} />
        </g>
      );
    default:
      return null;
  }
};

const CustomEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data = {},
  markerEnd,
  markerStart,
  label,
  labelStyle,
  labelShowBg,
  labelBgStyle,
  labelBgPadding,
  labelBgBorderRadius,
}) => {
  // Cast data to our custom type
  const edgeData = data as CustomEdgeData;
  
  // Get cardinality from data
  const cardinality = edgeData?.cardinality || 'one-to-many';
  const relationshipName = edgeData?.relationshipName;
  const isOptional = edgeData?.isOptional;
  
  // Determine source and target marker types based on cardinality
  const getMarkerTypes = (): { sourceType: 'one' | 'many' | 'zero-or-one' | 'zero-or-many'; targetType: 'one' | 'many' | 'zero-or-one' | 'zero-or-many' } => {
    switch (cardinality) {
      case 'one-to-one':
        return { 
          sourceType: isOptional ? 'zero-or-one' : 'one', 
          targetType: isOptional ? 'zero-or-one' : 'one' 
        };
      case 'one-to-many':
        return { 
          sourceType: 'one', 
          targetType: isOptional ? 'zero-or-many' : 'many' 
        };
      case 'many-to-many':
        return { 
          sourceType: isOptional ? 'zero-or-many' : 'many', 
          targetType: isOptional ? 'zero-or-many' : 'many' 
        };
      default:
        return { sourceType: 'one', targetType: 'many' };
    }
  };
  
  const { sourceType, targetType } = getMarkerTypes();

  // Determine the best source and target positions based on node positions
  const getOptimalPositions = () => {
    const horizontalDistance = Math.abs(targetX - sourceX);
    const verticalDistance = Math.abs(targetY - sourceY);
    
    let optimalSourcePosition: Position;
    let optimalTargetPosition: Position;
    
    if (targetX > sourceX) {
      optimalSourcePosition = Position.Right;
      optimalTargetPosition = Position.Left;
    } else {
      optimalSourcePosition = Position.Left;
      optimalTargetPosition = Position.Right;
    }
    
    if (horizontalDistance < 100 && verticalDistance > horizontalDistance) {
      if (targetY > sourceY) {
        optimalSourcePosition = Position.Bottom;
        optimalTargetPosition = Position.Top;
      } else {
        optimalSourcePosition = Position.Top;
        optimalTargetPosition = Position.Bottom;
      }
    }
    
    return {
      sourcePos: sourcePosition || optimalSourcePosition,
      targetPos: targetPosition || optimalTargetPosition,
    };
  };

  const { sourcePos, targetPos } = getOptimalPositions();

  // Calculate the path
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition: sourcePos,
    targetX,
    targetY,
    targetPosition: targetPos,
    borderRadius: 8,
    offset: 20,
  });

  // Calculate angles for cardinality markers
  const sourceAngle = sourcePos === Position.Right ? 0 : 
                      sourcePos === Position.Left ? 180 : 
                      sourcePos === Position.Bottom ? 90 : -90;
  const targetAngle = targetPos === Position.Right ? 180 : 
                      targetPos === Position.Left ? 0 : 
                      targetPos === Position.Bottom ? -90 : 90;

  // Generate cardinality label
  const cardinalityLabel = cardinality === 'one-to-one' ? '1:1' : 
                           cardinality === 'one-to-many' ? '1:N' : 'M:N';

  // Combined label
  const displayLabel = relationshipName 
    ? `${relationshipName} (${cardinalityLabel})` 
    : label || cardinalityLabel;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: cardinality === 'many-to-many' ? '#FF6B6B' : '#0074D9',
          strokeWidth: 2,
          strokeDasharray: isOptional ? '5,5' : 'none',
          ...(typeof style === 'object' && style !== null ? style : {}),
        }}
      />
      
      {/* Cardinality markers as SVG overlay */}
      <svg style={{ overflow: 'visible', position: 'absolute', pointerEvents: 'none' }}>
        <CardinalityMarker 
          type={sourceType} 
          position="source"
          x={sourceX + (sourcePos === Position.Right ? 15 : sourcePos === Position.Left ? -15 : 0)}
          y={sourceY + (sourcePos === Position.Bottom ? 15 : sourcePos === Position.Top ? -15 : 0)}
          angle={sourceAngle}
        />
        <CardinalityMarker 
          type={targetType} 
          position="target"
          x={targetX + (targetPos === Position.Right ? 15 : targetPos === Position.Left ? -15 : 0)}
          y={targetY + (targetPos === Position.Bottom ? 15 : targetPos === Position.Top ? -15 : 0)}
          angle={targetAngle}
        />
      </svg>
      
      {/* Edge label */}
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            fontSize: 10,
            fontWeight: 'bold',
            color: cardinality === 'many-to-many' ? '#FF6B6B' : '#0074D9',
            background: '#1e293b',
            padding: '2px 6px',
            borderRadius: 4,
            border: `1px solid ${cardinality === 'many-to-many' ? '#FF6B6B' : '#0074D9'}`,
            whiteSpace: 'nowrap',
            ...(typeof labelStyle === 'object' && labelStyle !== null ? labelStyle : {}),
          }}
          className="nodrag nopan"
        >
          {displayLabel}
          {isOptional && <span className="ml-1 text-slate-400">(optional)</span>}
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

export default CustomEdge;