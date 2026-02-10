"""
YOLOv8 数字标签检测器
"""
import cv2
import numpy as np
from pathlib import Path
from typing import Optional, List, Dict, Any
from loguru import logger

try:
    from ultralytics import YOLO
    YOLO_AVAILABLE = True
except ImportError:
    YOLO_AVAILABLE = False
    logger.warning("ultralytics未安装，将使用备用检测方案")


class NumberDetector:
    """数字标签检测器"""
    
    def __init__(self, model_path: str = "yolov8n.pt", confidence: float = 0.5):
        self.confidence = confidence
        self.model = None
        self.use_yolo = YOLO_AVAILABLE
        
        if YOLO_AVAILABLE:
            try:
                # PyTorch 2.6+ 安全加载处理
                import torch
                
                # 临时禁用weights_only限制（信任的模型源）
                original_load = torch.load
                def patched_load(*args, **kwargs):
                    kwargs['weights_only'] = False
                    return original_load(*args, **kwargs)
                torch.load = patched_load
                
                try:
                    # 尝试加载自定义模型，否则使用预训练模型
                    custom_model = Path(__file__).parent.parent / "models" / model_path
                    if custom_model.exists():
                        self.model = YOLO(str(custom_model))
                        logger.info(f"✅ 加载自定义YOLO模型: {custom_model}")
                    else:
                        # 使用预训练模型（会自动下载）
                        self.model = YOLO(model_path)
                        logger.info(f"✅ 加载预训练YOLO模型: {model_path}")
                finally:
                    # 恢复原始torch.load
                    torch.load = original_load
                    
            except Exception as e:
                logger.error(f"YOLO模型加载失败: {e}")
                self.use_yolo = False
    
    def detect(self, image: np.ndarray) -> List[Dict[str, Any]]:
        """
        检测图像中的数字标签
        
        Returns:
            List[Dict]: [{"bbox": [x1,y1,x2,y2], "confidence": 0.95, "class": "number_tag"}]
        """
        if image is None:
            return []
        
        # 直接使用轮廓检测（YOLO未训练数字标签）
        detections = self._detect_with_contour(image)
        
        # 如果轮廓检测失败且YOLO可用，尝试YOLO
        if not detections and self.use_yolo and self.model is not None:
            detections = self._detect_with_yolo(image)
        
        return detections
    
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
            logger.error(f"YOLO检测失败: {e}")
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
            logger.error(f"轮廓检测失败: {e}")
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
