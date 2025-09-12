import { Edge, Node } from "reactflow";

export const initialEdges: Edge[] = [];

export const initialNodes: Node[] = [
  {
    id: "1",
    position: { x: 100, y: 100 },
    data: { amount: 10 },
    type: "PaymentProviderSelect",
  },
  {
    id: "2",
    data: {},
    position: { x: 300, y: 20 },
    type: "PaymentProviderSelect",
  },
  {
    id: "3",
    data: { },
    position: { x: 300, y: 200 },
    type: "PaymentProviderSelect",
  },
  {
    id: "4",
    data: { },
    position: { x: 550, y: -50 },
    type: "PaymentProviderSelect",
  },
  {
    id: "5",
    data: { },
    position: { x: 550, y: 125 },
    type: "paymentProviderSelect",
  },
  {
    id: "6",
    data: {  },
    position: { x: 550, y: 325 },
    type: "paymentProviderSelect",
  },
  {
    id: "7",
    data: {},
    position: { x: 275, y: -100 },
    type: "paymentProviderSelect",
  },
];
