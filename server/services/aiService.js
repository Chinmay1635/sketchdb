/**
 * AI Service for Schema Generation
 * 
 * Uses Google Gemini API (FREE tier available!)
 * - 15 requests per minute
 * - 1500 requests per day
 * 
 * Get your free API key at: https://makersuite.google.com/app/apikey
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// System prompt that defines how AI should generate schemas
const SYSTEM_PROMPT = `You are an expert database architect assistant for SketchDB, a visual database design tool. Your role is to help users design database schemas by generating table structures from natural language descriptions.

CRITICAL: You must ALWAYS respond with valid JSON in the exact format specified below. No explanations outside the JSON. Do not wrap in markdown code blocks.

OUTPUT FORMAT (strict JSON):
{
  "success": true,
  "message": "Brief explanation of what you created/modified",
  "schema": {
    "nodes": [
      {
        "id": "table_1",
        "type": "tableNode",
        "position": { "x": 100, "y": 100 },
        "data": {
          "label": "TableName",
          "attributes": [
            {
              "name": "id",
              "type": "PK",
              "dataType": "INT",
              "isNotNull": true,
              "isUnique": true,
              "isAutoIncrement": true
            },
            {
              "name": "column_name",
              "type": "normal",
              "dataType": "VARCHAR(255)",
              "isNotNull": false,
              "isUnique": false,
              "defaultValue": ""
            },
            {
              "name": "foreign_key_id",
              "type": "FK",
              "dataType": "INT",
              "refTable": "table_2",
              "refAttr": "id",
              "isNotNull": true
            }
          ],
          "color": "#3B82F6"
        }
      }
    ],
    "edges": [
      {
        "id": "edge_table1_fk_to_table2",
        "source": "table_1",
        "target": "table_2",
        "sourceHandle": "foreign_key_id-right",
        "targetHandle": "id-left",
        "type": "smoothstep",
        "animated": true
      }
    ]
  },
  "explanation": {
    "tables": [
      { "name": "TableName", "purpose": "Why this table exists" }
    ],
    "relationships": [
      { "from": "Table1", "to": "Table2", "type": "one-to-many", "reason": "Why this relationship" }
    ],
    "bestPractices": ["List of best practices applied"]
  }
}

RULES:
1. Generate unique IDs using format: table_1, table_2, etc.
2. Position tables in a grid layout (increment x by 350, y by 250 for each row)
3. Always include id as PK with INT, AUTO_INCREMENT
4. Add created_at and updated_at TIMESTAMP fields to all tables
5. Use appropriate data types: INT, VARCHAR(n), TEXT, BOOLEAN, DATE, DATETIME, TIMESTAMP, DECIMAL(p,s), FLOAT
6. For FK relationships, ensure refTable and refAttr match existing tables
7. Use colors: #3B82F6 (blue), #10B981 (green), #F59E0B (amber), #EF4444 (red), #8B5CF6 (purple), #EC4899 (pink)
8. Edge sourceHandle format: "attributeName-right" or "attributeName-left"
9. Edge targetHandle format: "attributeName-left" or "attributeName-right"

WHEN MODIFYING EXISTING SCHEMA:
- Preserve existing table IDs and positions unless explicitly changing them
- Only add/modify what the user requests
- Maintain existing relationships unless they conflict

If you cannot generate a valid schema, respond with:
{
  "success": false,
  "message": "Explanation of why you couldn't generate the schema",
  "schema": null,
  "explanation": null
}`;

// Color palette for tables
const TABLE_COLORS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#84CC16', // lime
];

/**
 * Generate schema from user prompt using Google Gemini
 */
async function generateSchema(userPrompt, existingSchema = null, chatHistory = []) {
  try {
    // Check if API key is configured
    if (!process.env.GEMINI_API_KEY) {
      return {
        success: false,
        message: 'AI service not configured. Please set GEMINI_API_KEY in environment variables. Get a free key at: https://makersuite.google.com/app/apikey',
        schema: null,
        explanation: null,
        tokenUsage: { prompt: 0, completion: 0, total: 0 }
      };
    }

    // Get the Gemini model
    const model = genAI.getGenerativeModel({ 
      model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 4000,
        responseMimeType: 'application/json'
      }
    });

    // Build the prompt with context
    let fullPrompt = SYSTEM_PROMPT + '\n\n';

    // Add context about existing schema if present
    if (existingSchema && (existingSchema.nodes?.length > 0 || existingSchema.edges?.length > 0)) {
      fullPrompt += `CURRENT SCHEMA (modify this based on user request):\n${JSON.stringify(existingSchema, null, 2)}\n\n`;
    }

    // Add recent chat history for context (last 6 messages)
    const recentHistory = chatHistory.slice(-6);
    if (recentHistory.length > 0) {
      fullPrompt += 'RECENT CONVERSATION:\n';
      for (const msg of recentHistory) {
        if (msg.role === 'user' || msg.role === 'assistant') {
          fullPrompt += `${msg.role.toUpperCase()}: ${msg.content}\n`;
        }
      }
      fullPrompt += '\n';
    }

    // Add current user request
    fullPrompt += `USER REQUEST: ${userPrompt}\n\nRespond with valid JSON only:`;

    // Call Gemini API
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    let responseText = response.text();

    // Estimate token usage (Gemini doesn't provide exact counts in free tier)
    const tokenUsage = {
      prompt: Math.ceil(fullPrompt.length / 4),
      completion: Math.ceil(responseText.length / 4),
      total: Math.ceil((fullPrompt.length + responseText.length) / 4)
    };

    // Clean up response - remove markdown code blocks if present
    responseText = responseText.trim();
    if (responseText.startsWith('```json')) {
      responseText = responseText.slice(7);
    } else if (responseText.startsWith('```')) {
      responseText = responseText.slice(3);
    }
    if (responseText.endsWith('```')) {
      responseText = responseText.slice(0, -3);
    }
    responseText = responseText.trim();

    // Parse response
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      console.error('Raw response:', responseText);
      return {
        success: false,
        message: 'AI generated an invalid response. Please try again.',
        schema: null,
        explanation: null,
        tokenUsage
      };
    }

    // Validate the response structure
    if (!parsedResponse.success && parsedResponse.message) {
      return {
        success: false,
        message: parsedResponse.message,
        schema: null,
        explanation: null,
        tokenUsage
      };
    }

    // Validate schema structure
    const validationResult = validateSchema(parsedResponse.schema);
    if (!validationResult.valid) {
      return {
        success: false,
        message: `Schema validation failed: ${validationResult.error}`,
        schema: null,
        explanation: null,
        tokenUsage
      };
    }

    // Enhance schema with proper positioning if needed
    const enhancedSchema = enhanceSchema(parsedResponse.schema);

    return {
      success: true,
      message: parsedResponse.message || 'Schema generated successfully',
      schema: enhancedSchema,
      explanation: parsedResponse.explanation || null,
      tokenUsage
    };

  } catch (error) {
    console.error('AI Service Error:', error);
    
    // Handle specific Gemini errors
    if (error.message?.includes('API_KEY_INVALID') || error.message?.includes('API key not valid')) {
      return {
        success: false,
        message: 'Invalid Gemini API key. Get a free key at: https://makersuite.google.com/app/apikey',
        schema: null,
        explanation: null,
        tokenUsage: { prompt: 0, completion: 0, total: 0 }
      };
    }
    
    if (error.message?.includes('quota') || error.message?.includes('429') || error.message?.includes('RESOURCE_EXHAUSTED')) {
      return {
        success: false,
        message: 'API rate limit reached. Please wait a moment and try again. (Free tier: 15 requests/minute)',
        schema: null,
        explanation: null,
        tokenUsage: { prompt: 0, completion: 0, total: 0 }
      };
    }

    if (error.message?.includes('SAFETY')) {
      return {
        success: false,
        message: 'Request was blocked by safety filters. Please rephrase your request.',
        schema: null,
        explanation: null,
        tokenUsage: { prompt: 0, completion: 0, total: 0 }
      };
    }

    return {
      success: false,
      message: error.message || 'Failed to generate schema. Please try again.',
      schema: null,
      explanation: null,
      tokenUsage: { prompt: 0, completion: 0, total: 0 }
    };
  }
}

/**
 * Validate schema structure
 */
function validateSchema(schema) {
  if (!schema) {
    return { valid: false, error: 'Schema is null or undefined' };
  }

  if (!Array.isArray(schema.nodes)) {
    return { valid: false, error: 'Schema nodes must be an array' };
  }

  if (!Array.isArray(schema.edges)) {
    return { valid: false, error: 'Schema edges must be an array' };
  }

  // Validate each node
  for (const node of schema.nodes) {
    if (!node.id || typeof node.id !== 'string') {
      return { valid: false, error: 'Each node must have a valid id' };
    }
    if (!node.data || !node.data.label) {
      return { valid: false, error: `Node ${node.id} must have a label` };
    }
    if (!Array.isArray(node.data.attributes)) {
      return { valid: false, error: `Node ${node.id} must have attributes array` };
    }
    
    // Validate attributes
    for (const attr of node.data.attributes) {
      if (!attr.name || typeof attr.name !== 'string') {
        return { valid: false, error: `Invalid attribute in node ${node.id}` };
      }
      if (!['PK', 'FK', 'normal'].includes(attr.type)) {
        return { valid: false, error: `Invalid attribute type "${attr.type}" in node ${node.id}` };
      }
    }
  }

  // Validate edges reference existing nodes
  const nodeIds = new Set(schema.nodes.map(n => n.id));
  for (const edge of schema.edges) {
    if (!nodeIds.has(edge.source)) {
      return { valid: false, error: `Edge references non-existent source: ${edge.source}` };
    }
    if (!nodeIds.has(edge.target)) {
      return { valid: false, error: `Edge references non-existent target: ${edge.target}` };
    }
  }

  return { valid: true };
}

/**
 * Enhance schema with proper positioning and styling
 */
function enhanceSchema(schema) {
  if (!schema || !schema.nodes) return schema;

  const enhancedNodes = schema.nodes.map((node, index) => {
    // Calculate grid position if not set
    const col = index % 3;
    const row = Math.floor(index / 3);
    
    return {
      ...node,
      type: node.type || 'tableNode',
      position: node.position || {
        x: 100 + col * 350,
        y: 100 + row * 300
      },
      data: {
        ...node.data,
        color: node.data.color || TABLE_COLORS[index % TABLE_COLORS.length],
        attributes: (node.data.attributes || []).map(attr => ({
          name: attr.name,
          type: attr.type || 'normal',
          dataType: attr.dataType || 'VARCHAR(255)',
          refTable: attr.refTable || '',
          refAttr: attr.refAttr || '',
          isNotNull: attr.isNotNull || false,
          isUnique: attr.isUnique || false,
          defaultValue: attr.defaultValue || '',
          isAutoIncrement: attr.isAutoIncrement || false
        }))
      }
    };
  });

  const enhancedEdges = (schema.edges || []).map(edge => ({
    ...edge,
    type: edge.type || 'smoothstep',
    animated: edge.animated !== false
  }));

  return {
    nodes: enhancedNodes,
    edges: enhancedEdges
  };
}

/**
 * Generate a quick suggestion based on table context
 */
async function getSuggestion(tableName, existingAttributes) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return { suggestions: [] };
    }

    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.5,
        maxOutputTokens: 500,
        responseMimeType: 'application/json'
      }
    });

    const prompt = `Given a table named "${tableName}" with attributes: ${JSON.stringify(existingAttributes)}, suggest 2-3 additional useful columns. Respond with JSON only: { "suggestions": [{ "name": "column_name", "dataType": "TYPE", "reason": "why" }] }`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let responseText = response.text().trim();
    
    // Clean up markdown
    if (responseText.startsWith('```json')) responseText = responseText.slice(7);
    if (responseText.startsWith('```')) responseText = responseText.slice(3);
    if (responseText.endsWith('```')) responseText = responseText.slice(0, -3);
    
    return JSON.parse(responseText.trim());
  } catch (error) {
    console.error('Suggestion error:', error);
    return { suggestions: [] };
  }
}

module.exports = {
  generateSchema,
  validateSchema,
  getSuggestion
};
