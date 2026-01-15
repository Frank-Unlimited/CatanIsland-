/**
 * 地图工具函数
 * 提供六边形坐标转换、距离计算等工具方法
 */

import { HEX_SIZE } from '../constants';
import { Vertex } from '../types';

export class MapUtils {
  /**
   * 计算两点之间的欧几里得距离
   */
  static distance(x1: number, y1: number, x2: number, y2: number): number {
    return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
  }

  /**
   * 将六边形坐标（q, r）转换为像素坐标（x, y）
   * 使用平顶六边形布局
   */
  static hexToPixel(q: number, r: number): { x: number; y: number } {
    const x = HEX_SIZE * (Math.sqrt(3) * q + (Math.sqrt(3) / 2) * r);
    const y = HEX_SIZE * ((3 / 2) * r);
    return { x, y };
  }

  /**
   * 检查顶点是否与六边形相邻
   * 判断标准：顶点到六边形中心的距离约等于HEX_SIZE
   */
  static isVertexAdjacentToHex(vertex: Vertex, hexCenter: { x: number; y: number }): boolean {
    return Math.abs(this.distance(vertex.x, vertex.y, hexCenter.x, hexCenter.y) - HEX_SIZE) < 5;
  }

  /**
   * 计算六边形的6个顶点坐标（平顶六边形）
   */
  static getHexVertices(centerX: number, centerY: number): Array<{ x: number; y: number }> {
    const vertices = [];
    for (let i = 0; i < 6; i++) {
      const angle = Math.PI / 180 * (60 * i - 30);
      vertices.push({
        x: centerX + HEX_SIZE * Math.cos(angle),
        y: centerY + HEX_SIZE * Math.sin(angle)
      });
    }
    return vertices;
  }
}
