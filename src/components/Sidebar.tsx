import React from 'react';
import { Node } from '@xyflow/react';
import { TableAttribute, AttributeType, DataType, DATA_TYPES } from '../types';

interface SidebarProps {
  selectedTable: Node | undefined;
  attributes: TableAttribute[];
  isEditingTableName: boolean;
  editTableName: string;
  attrName: string;
  attrType: AttributeType;
  attrDataType: DataType;
  refTable: string;
  refAttr: string;
  onStartEditTableName: () => void;
  onSaveTableName: () => void;
  onCancelEditTableName: () => void;
  onEditTableNameChange: (value: string) => void;
  onDeleteTable: () => void;
  onAttrNameChange: (value: string) => void;
  onAttrDataTypeChange: (value: DataType) => void;
  onAttrTypeChange: (value: AttributeType) => void;
  onRefTableChange: (value: string) => void;
  onRefAttrChange: (value: string) => void;
  onAddAttribute: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  selectedTable,
  attributes,
  isEditingTableName,
  editTableName,
  attrName,
  attrType,
  attrDataType,
  refTable,
  refAttr,
  onStartEditTableName,
  onSaveTableName,
  onCancelEditTableName,
  onEditTableNameChange,
  onDeleteTable,
  onAttrNameChange,
  onAttrDataTypeChange,
  onAttrTypeChange,
  onRefTableChange,
  onRefAttrChange,
  onAddAttribute,
}) => {
  return (
    <div style={{ width: 300, background: '#f4f4f4', padding: 16 }}>
      <h3>Attributes</h3>
      {selectedTable ? (
        <>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: 16 
          }}>
            {isEditingTableName ? (
              <div style={{ display: 'flex', flex: 1, marginRight: 8 }}>
                <input
                  value={editTableName}
                  onChange={(e) => onEditTableNameChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') onSaveTableName();
                    if (e.key === 'Escape') onCancelEditTableName();
                  }}
                  style={{ flex: 1, marginRight: 4, padding: '2px 4px' }}
                  autoFocus
                />
                <button 
                  onClick={onSaveTableName} 
                  style={{ 
                    background: '#4CAF50', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: 4, 
                    padding: '2px 8px', 
                    marginRight: 2 
                  }}
                >
                  ✓
                </button>
                <button 
                  onClick={onCancelEditTableName} 
                  style={{ 
                    background: '#f44336', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: 4, 
                    padding: '2px 8px' 
                  }}
                >
                  ✕
                </button>
              </div>
            ) : (
              <h4 
                style={{ margin: 0, cursor: 'pointer', flex: 1 }} 
                onClick={onStartEditTableName}
                title="Click to edit table name"
              >
                {typeof selectedTable.data.label === 'string' 
                  ? selectedTable.data.label 
                  : `Table ${selectedTable.id}`
                }
              </h4>
            )}
            <button 
              onClick={onDeleteTable}
              style={{ 
                background: '#ff4444', 
                color: 'white', 
                border: 'none', 
                borderRadius: 4, 
                padding: '4px 8px', 
                cursor: 'pointer' 
              }}
              title="Delete Table"
            >
              Delete
            </button>
          </div>
          
          <ul>
            {attributes.map((attr, idx) => (
              <li key={idx}>
                <strong>{attr.name}</strong> - {attr.dataType || 'VARCHAR(255)'} ({attr.type}
                {attr.type === 'FK' ? ` → ${attr.refTable}.${attr.refAttr}` : ''})
              </li>
            ))}
          </ul>
          
          <input
            placeholder="Attribute name"
            value={attrName}
            onChange={e => onAttrNameChange(e.target.value)}
            style={{ width: '100%', marginBottom: 8 }}
          />
          
          <select 
            value={attrDataType} 
            onChange={e => onAttrDataTypeChange(e.target.value as DataType)} 
            style={{ width: '100%', marginBottom: 8 }}
          >
            {DATA_TYPES.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          
          <select 
            value={attrType} 
            onChange={e => onAttrTypeChange(e.target.value as AttributeType)} 
            style={{ width: '100%', marginBottom: 8 }}
          >
            <option value="normal">Normal</option>
            <option value="PK">Primary Key</option>
            <option value="FK">Foreign Key</option>
          </select>
          
          {attrType === 'FK' && (
            <>
              <input
                placeholder="Reference Table"
                value={refTable}
                onChange={e => onRefTableChange(e.target.value)}
                style={{ width: '100%', marginBottom: 8 }}
              />
              <input
                placeholder="Reference Attribute"
                value={refAttr}
                onChange={e => onRefAttrChange(e.target.value)}
                style={{ width: '100%', marginBottom: 8 }}
              />
            </>
          )}
          
          <button 
            onClick={onAddAttribute} 
            style={{ width: '100%', background: 'green', color: 'white' }}
          >
            Add Attribute
          </button>
        </>
      ) : (
        <div>Select a table node to edit attributes.</div>
      )}
    </div>
  );
};