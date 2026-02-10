
import cv2
import numpy as np
import json
import sys
from pathlib import Path
from typing import List, Dict, Any

class NumberDetector:
    """数字标签检测器 - 使用轮廓检测"""
    
    def __init__(self, confidence: float = 0.5):
        self.confidence = confidence
    
    def detect(self, image: np.ndarray) -> List[Dict[str, Any]]:
        """检测图像中的数字标签"""
        if image is None:
            return []
        
        # 使用轮廓检测
        detections = self._detect_with_contour(image)
        return detections
    
    def _detect_with_contour(self, image: np.ndarray) -> List[Dict[str, Any]]:
        """精准检测白底黑字数字标签"""
        try:
            h, w = image.shape[:2]
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            
            all_detections = []
            
            # 只使用白色区域检测
            _, white_mask = cv2.threshold(gray, 200, 255, cv2.THRESH_BINARY)
            
            # 形态学闭运算填充小洞
            kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))
            white_mask = cv2.morphologyEx(white_mask, cv2.MORPH_CLOSE, kernel, iterations=2)
            
            # 查找轮廓
            contours, _ = cv2.findContours(white_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            for contour in contours:
                area = cv2.contourArea(contour)
                
                # 严格的面积限制
                min_area = 1000
                max_area = h * w * 0.5
                
                if area < min_area or area > max_area:
                    continue
                
                x, y, bw, bh = cv2.boundingRect(contour)
                
                # 严格的尺寸要求
                if bw < 50 or bh < 30:
                    continue
                
                # 严格的宽高比
                aspect_ratio = bw / bh if bh > 0 else 0
                if not (1.5 < aspect_ratio < 4.5):
                    continue
                
                # 检查区域内是否有足够的黑色像素
                roi = gray[y:y+bh, x:x+bw]
                dark_pixels = np.sum(roi < 120)
                total_pixels = roi.size
                dark_ratio = dark_pixels / total_pixels if total_pixels > 0 else 0
                
                # 必须有10%-60%的深色像素
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

# 主程序
if __name__ == "__main__":
    import sys
    
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
    
    # 返回结果
    result = {
        "detections": detections,
        "image_width": img.shape[1],
        "image_height": img.shape[0]
    }
    print(json.dumps(result))
