import { NextResponse } from "next/server"
import { exec } from "child_process"
import { promisify } from "util"
import * as fs from "fs"
import * as path from "path"
import { v4 as uuidv4 } from "uuid"

const execAsync = promisify(exec)

// YOLO 检测 Python 代码（嵌入完整的 detector.py 逻辑）
const YOLO_DETECTOR_PYTHON_CODE = `
import cv2
import numpy as np
import json
import sys
from pathlib import Path
from typing import List, Dict, Any, Optional

# 尝试导入YOLO
try:
    from ultralytics import YOLO
    YOLO_AVAILABLE = True
except ImportError:
    YOLO_AVAILABLE = False
    print("ultralytics未安装，将只使用轮廓检测", file=sys.stderr)

class NumberDetector:
    """数字标签检测器 - 支持YOLO和轮廓检测"""
    
    def __init__(self, model_path: str = "yolov8n.pt", confidence: float = 0.5):
        self.confidence = confidence
        self.model = None
        self.use_yolo = YOLO_AVAILABLE
        
        if YOLO_AVAILABLE:
            try:
                # PyTorch 2.6+ 安全加载处理
                import torch
                
                # 临时禁用weights_only限制
                original_load = torch.load
                def patched_load(*args, **kwargs):
                    kwargs['weights_only'] = False
                    return original_load(*args, **kwargs)
                torch.load = patched_load
                
                # 重定向stdout以抑制下载进度输出
                import os
                original_stdout = sys.stdout
                sys.stdout = open(os.devnull, 'w')
                
                try:
                    # 尝试加载自定义模型，否则使用预训练模型
                    custom_model = Path("models") / model_path
                    if custom_model.exists():
                        self.model = YOLO(str(custom_model))
                        print(f"✅ 加载自定义YOLO模型: {custom_model}", file=sys.stderr)
                    else:
                        # 使用预训练模型（会自动下载）
                        self.model = YOLO(model_path)
                        print(f"✅ 加载预训练YOLO模型: {model_path}", file=sys.stderr)
                finally:
                    # 恢复原始torch.load和stdout
                    torch.load = original_load
                    sys.stdout.close()
                    sys.stdout = original_stdout
                    
            except Exception as e:
                print(f"YOLO模型加载失败: {e}", file=sys.stderr)
                self.use_yolo = False
    
    def detect(self, image: np.ndarray) -> List[Dict[str, Any]]:
        """
        检测图像中的数字标签
        
        Returns:
            List[Dict]: [{"bbox": [x1,y1,x2,y2], "confidence": 0.95, "class": "number_tag"}]
        """
        if image is None:
            return []
        
        # 优先使用YOLO检测
        if self.use_yolo and self.model is not None:
            detections = self._detect_with_yolo(image)
            if detections:
                return detections
        
        # 如果YOLO检测失败，使用轮廓检测作为备用
        return self._detect_with_contour(image)
    
    def _detect_with_yolo(self, image: np.ndarray) -> List[Dict[str, Any]]:
        """使用YOLO进行检测"""
        try:
            results = self.model(image, conf=self.confidence, verbose=False)
            detections = []
            
            for result in results:
                boxes = result.boxes
                if boxes is not None:
                    for box in boxes:
                        x1, y1, x2, y2 = box.xyxy[0].tolist()
                        conf = float(box.conf[0])
                        cls = int(box.cls[0])
                        
                        detections.append({
                            "bbox": [x1, y1, x2, y2],
                            "confidence": conf,
                            "class": result.names.get(cls, "unknown")
                        })
            
            return detections
        except Exception as e:
            print(f"YOLO检测失败: {e}", file=sys.stderr)
            return self._detect_with_contour(image)
    
    def _detect_with_contour(self, image: np.ndarray) -> List[Dict[str, Any]]:
        """
        精准检测白底黑字数字标签
        """
        try:
            h, w = image.shape[:2]
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            
            all_detections = []
            
            # 只使用白色区域检测（更精准）
            # 检测亮度高的白色区域
            _, white_mask = cv2.threshold(gray, 200, 255, cv2.THRESH_BINARY)
            
            # 形态学闭运算填充小洞
            kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))
            white_mask = cv2.morphologyEx(white_mask, cv2.MORPH_CLOSE, kernel, iterations=2)
            
            # 查找轮廓
            contours, _ = cv2.findContours(white_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            for contour in contours:
                area = cv2.contourArea(contour)
                
                # 严格的面积限制（只检测中等大小的标签）
                min_area = 1000  # 提高最小面积
                max_area = h * w * 0.5  # 降低最大面积
                
                if area < min_area or area > max_area:
                    continue
                
                x, y, bw, bh = cv2.boundingRect(contour)
                
                # 严格的尺寸要求
                if bw < 50 or bh < 30:  # 提高最小尺寸要求
                    continue
                
                # 严格的宽高比（标签通常是横向矩形）
                aspect_ratio = bw / bh if bh > 0 else 0
                if not (1.5 < aspect_ratio < 4.5):  # 更严格的宽高比
                    continue
                
                # 检查区域内是否有足够的黑色像素（文字）
                roi = gray[y:y+bh, x:x+bw]
                dark_pixels = np.sum(roi < 120)
                total_pixels = roi.size
                dark_ratio = dark_pixels / total_pixels if total_pixels > 0 else 0
                
                # 必须有10%-60%的深色像素（文字区域）
                if not (0.1 < dark_ratio < 0.6):
                    continue
                
                all_detections.append({
                    "bbox": [x, y, x + bw, y + bh],
                    "confidence": 0.85,
                    "class": "number_tag"
                })
            
            # 去重和合并
            final_detections = self._merge_detections(all_detections, h, w)
            
            # 最多返回3个最大的候选
            return final_detections[:3]
            
        except Exception as e:
            print(f"轮廓检测失败: {e}", file=sys.stderr)
            return []
    
    def _merge_detections(self, detections: List[Dict], h: int, w: int) -> List[Dict[str, Any]]:
        """合并重叠的检测框"""
        if not detections:
            return []
        
        merged = []
        for det in detections:
            x1, y1, x2, y2 = det["bbox"]
            area = (x2 - x1) * (y2 - y1)
            
            # 检查是否与已有检测重叠
            is_merged = False
            for existing in merged:
                ex1, ey1, ex2, ey2 = existing["bbox"]
                overlap_x = max(0, min(x2, ex2) - max(x1, ex1))
                overlap_y = max(0, min(y2, ey2) - max(y1, ey1))
                overlap_area = overlap_x * overlap_y
                
                if overlap_area > area * 0.5:
                    # 合并：选择置信度更高的
                    if det["confidence"] > existing["confidence"]:
                        existing["bbox"] = det["bbox"]
                        existing["confidence"] = det["confidence"]
                    is_merged = True
                    break
            
            if not is_merged:
                merged.append(det)
        
        # 按面积排序
        merged.sort(key=lambda d: (d["bbox"][2] - d["bbox"][0]) * (d["bbox"][3] - d["bbox"][1]), reverse=True)
        return merged
    
    def detect_and_crop(self, image: np.ndarray) -> List[Dict[str, Any]]:
        """检测并裁剪出数字区域"""
        detections = self.detect(image)
        
        results = []
        for det in detections:
            bbox = det["bbox"]
            x1, y1, x2, y2 = map(int, bbox)
            
            # 添加padding
            padding = 5
            h, w = image.shape[:2]
            x1 = max(0, x1 - padding)
            y1 = max(0, y1 - padding)
            x2 = min(w, x2 + padding)
            y2 = min(h, y2 + padding)
            
            roi = image[y1:y2, x1:x2]
            
            results.append({
                **det,
                "bbox": [x1, y1, x2, y2],
                "roi": roi
            })
        
        return results

# 主程序
if __name__ == "__main__":
    image_path = sys.argv[1]
    confidence = float(sys.argv[2]) if len(sys.argv) > 2 else 0.5
    
    # 读取图像
    img = cv2.imread(image_path)
    if img is None:
        print(json.dumps({"error": "无法读取图像"}))
        sys.exit(1)
    
    # 初始化检测器
    detector = NumberDetector(confidence=confidence)
    
    # 执行检测
    detections = detector.detect(img)
    
    # 记录使用的检测方式
    detection_method = "unknown"
    if detector.use_yolo and detector.model is not None:
        # 检查是否实际使用了YOLO（有检测结果）
        if detections:
            detection_method = "yolo"
        else:
            detection_method = "yolo_no_result"
    else:
        detection_method = "contour"
    
    # 返回结果
    result = {
        "detections": detections,
        "image_width": img.shape[1],
        "image_height": img.shape[0],
        "detection_method": detection_method
    }
    print(json.dumps(result))
`

// 投票函数 - 从多次检测结果中选择最佳结果
function voteDetections(
  allDetections: Array<{ bbox: number[]; confidence: number; class: string }[]>,
  threshold: number
): { bbox: number[]; confidence: number; class: string; vote_count: number; total_rounds: number } | null {
  if (allDetections.length === 0) return null

  // 收集所有检测框并聚类
  const clusters: Array<{
    bbox: number[]
    detections: Array<{ bbox: number[]; confidence: number; class: string }>
  }> = []

  for (const roundDetections of allDetections) {
    for (const det of roundDetections) {
      let matched = false
      for (const cluster of clusters) {
        // 计算IoU
        const iou = calculateIoU(det.bbox, cluster.bbox)
        if (iou > 0.5) {
          cluster.detections.push(det)
          // 更新聚类中心
          const n = cluster.detections.length
          cluster.bbox = [
            (cluster.bbox[0] * (n - 1) + det.bbox[0]) / n,
            (cluster.bbox[1] * (n - 1) + det.bbox[1]) / n,
            (cluster.bbox[2] * (n - 1) + det.bbox[2]) / n,
            (cluster.bbox[3] * (n - 1) + det.bbox[3]) / n
          ]
          matched = true
          break
        }
      }
      if (!matched) {
        clusters.push({ bbox: [...det.bbox], detections: [det] })
      }
    }
  }

  if (clusters.length === 0) return null

  // 选择投票数最多的聚类
  clusters.sort((a, b) => b.detections.length - a.detections.length)
  const bestCluster = clusters[0]

  // 检查是否达到阈值
  if (bestCluster.detections.length / allDetections.length < threshold) {
    return null
  }

  // 计算平均置信度
  const avgConfidence = bestCluster.detections.reduce((sum, d) => sum + d.confidence, 0) / bestCluster.detections.length

  return {
    bbox: bestCluster.bbox.map(Math.round),
    confidence: parseFloat(avgConfidence.toFixed(4)),
    class: bestCluster.detections[0].class,
    vote_count: bestCluster.detections.length,
    total_rounds: allDetections.length
  }
}

// 计算IoU
function calculateIoU(bbox1: number[], bbox2: number[]): number {
  const x1 = Math.max(bbox1[0], bbox2[0])
  const y1 = Math.max(bbox1[1], bbox2[1])
  const x2 = Math.min(bbox1[2], bbox2[2])
  const y2 = Math.min(bbox1[3], bbox2[3])

  const intersection = Math.max(0, x2 - x1) * Math.max(0, y2 - y1)
  const area1 = (bbox1[2] - bbox1[0]) * (bbox1[3] - bbox1[1])
  const area2 = (bbox2[2] - bbox2[0]) * (bbox2[3] - bbox2[1])
  const union = area1 + area2 - intersection

  return union > 0 ? intersection / union : 0
}

// POST - YOLO 数字标签检测
export async function POST(request: Request) {
  const startTime = Date.now()

  try {
    const formData = await request.formData()
    const image = formData.get("image") as File
    const confidence = parseFloat(formData.get("confidence") as string) || 0.5
    const useVote = formData.get("use_vote") === "true"
    const voteRounds = parseInt(formData.get("vote_rounds") as string) || 5
    const voteThreshold = parseFloat(formData.get("vote_threshold") as string) || 0.6

    if (!image) {
      return NextResponse.json(
        { success: false, error: "请上传图像文件" },
        { status: 400 }
      )
    }

    if (!image.type.startsWith("image/")) {
      return NextResponse.json(
        { success: false, error: "请上传有效的图像文件" },
        { status: 400 }
      )
    }

    // 生成临时文件名
    const tempId = uuidv4()
    const tempDir = path.join(process.cwd(), "temp")
    const inputPath = path.join(tempDir, `${tempId}_input.jpg`)
    const scriptPath = path.join(tempDir, `${tempId}_yolo_detector.py`)

    // 确保临时目录存在
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true })
    }

    // 保存上传的图像
    const bytes = await image.arrayBuffer()
    fs.writeFileSync(inputPath, Buffer.from(bytes))

    // 保存 Python 脚本
    fs.writeFileSync(scriptPath, YOLO_DETECTOR_PYTHON_CODE)

    const pythonPath = process.env.PYTHON_PATH || "python"
    const scriptName = path.basename(scriptPath)
    const inputName = path.basename(inputPath)

    // 如果不使用投票，单次检测
    if (!useVote) {
      const { stdout, stderr } = await execAsync(
        `${pythonPath} "${scriptName}" "${inputName}" ${confidence}`,
        { cwd: tempDir }
      )

      if (stderr && !stderr.includes("WARNING") && !stderr.includes("✅")) {
        console.error("[YOLO] Python error:", stderr)
      } else if (stderr && stderr.includes("✅")) {
        console.log("[YOLO]", stderr.trim())
      }

      const result = JSON.parse(stdout.trim())

      if ("error" in result) {
        throw new Error(result.error as string)
      }

      // 清理临时文件
      try {
        fs.unlinkSync(inputPath)
        fs.unlinkSync(scriptPath)
      } catch (e) {
        console.error("[YOLO] Cleanup error:", e)
      }

      const processingTime = Date.now() - startTime

      return NextResponse.json({
        success: true,
        data: {
          detections: result.detections,
          image_info: {
            width: result.image_width,
            height: result.image_height
          },
          processing_time_ms: processingTime,
          parameters: {
            confidence_threshold: confidence,
            use_vote: false
          }
        }
      })
    }

    // 使用投票 - 多次检测
    const allDetections: Array<{ bbox: number[]; confidence: number; class: string }[]> = []
    let detectionMethod = "unknown"

    for (let i = 0; i < voteRounds; i++) {
      const { stdout, stderr } = await execAsync(
        `${pythonPath} "${scriptName}" "${inputName}" ${confidence}`,
        { cwd: tempDir }
      )

      if (stderr && !stderr.includes("WARNING") && !stderr.includes("✅")) {
        console.error(`[YOLO] Round ${i + 1} Python error:`, stderr)
      } else if (stderr && stderr.includes("✅") && i === 0) {
        // 只在第一轮显示模型加载信息
        console.log("[YOLO]", stderr.trim())
      }

      const result = JSON.parse(stdout.trim())

      if ("error" in result) {
        console.error(`[YOLO] Round ${i + 1} error:`, result.error)
        continue
      }

      if (i === 0) {
        detectionMethod = result.detection_method || "unknown"
      }

      allDetections.push(result.detections || [])
    }

    // 清理临时文件
    try {
      fs.unlinkSync(inputPath)
      fs.unlinkSync(scriptPath)
    } catch (e) {
      console.error("[YOLO] Cleanup error:", e)
    }

    // 投票选择最佳结果
    const votedResult = voteDetections(allDetections, voteThreshold)

    const processingTime = Date.now() - startTime

    return NextResponse.json({
      success: true,
      data: {
        detections: votedResult ? [votedResult] : [],
        vote_info: {
          total_rounds: voteRounds,
          threshold: voteThreshold,
          vote_count: votedResult?.vote_count || 0,
          detection_method: detectionMethod
        },
        image_info: {
          width: allDetections[0]?.[0]?.bbox ? undefined : undefined
        },
        processing_time_ms: processingTime,
        parameters: {
          confidence_threshold: confidence,
          use_vote: true,
          vote_rounds: voteRounds,
          vote_threshold: voteThreshold
        }
      }
    })

  } catch (error) {
    console.error("[YOLO] Detection error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "目标检测失败",
        details: error instanceof Error ? error.message : "未知错误"
      },
      { status: 500 }
    )
  }
}

// GET - 获取 YOLO 服务状态
export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      service: "YOLO Number Tag Detection API",
      status: "ready",
      model: "Contour Detection",
      purpose: "Detect white background black text number tags",
      max_image_size: "10MB",
      supported_formats: ["image/jpeg", "image/png", "image/webp"]
    }
  })
}
