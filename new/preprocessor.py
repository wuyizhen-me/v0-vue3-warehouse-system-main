"""
图像预处理模块 - 提升识别准确率
"""
import cv2
import numpy as np
from loguru import logger


class ImagePreprocessor:
    """图像预处理器"""
    
    @staticmethod
    def decode_frame(jpeg_bytes: bytes) -> np.ndarray:
        """解码JPEG图像"""
        try:
            nparr = np.frombuffer(jpeg_bytes, np.uint8)
            frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            return frame
        except Exception as e:
            logger.error(f"图像解码失败: {e}")
            return None
    
    @staticmethod
    def enhance_image(image: np.ndarray) -> np.ndarray:
        """图像增强处理"""
        if image is None:
            return None
        
        try:
            # 1. 转换到LAB颜色空间进行自适应直方图均衡化
            lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
            l, a, b = cv2.split(lab)
            
            # CLAHE自适应直方图均衡化
            clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
            l = clahe.apply(l)
            
            lab = cv2.merge([l, a, b])
            enhanced = cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)
            
            # 2. 轻微锐化
            kernel = np.array([
                [0, -1, 0],
                [-1, 5, -1],
                [0, -1, 0]
            ])
            enhanced = cv2.filter2D(enhanced, -1, kernel)
            
            return enhanced
        except Exception as e:
            logger.warning(f"图像增强失败: {e}")
            return image
    
    @staticmethod
    def denoise(image: np.ndarray) -> np.ndarray:
        """降噪处理"""
        if image is None:
            return None
        try:
            return cv2.fastNlMeansDenoisingColored(image, None, 6, 6, 7, 21)
        except Exception as e:
            logger.warning(f"降噪处理失败: {e}")
            return image
    
    @staticmethod
    def extract_roi(image: np.ndarray, bbox: list, padding: int = 10) -> np.ndarray:
        """提取ROI区域"""
        if image is None or bbox is None:
            return None
        
        try:
            x1, y1, x2, y2 = map(int, bbox)
            h, w = image.shape[:2]
            
            # 添加padding
            x1 = max(0, x1 - padding)
            y1 = max(0, y1 - padding)
            x2 = min(w, x2 + padding)
            y2 = min(h, y2 + padding)
            
            roi = image[y1:y2, x1:x2]
            return roi
        except Exception as e:
            logger.error(f"ROI提取失败: {e}")
            return None
    
    @staticmethod
    def preprocess_for_ocr(roi: np.ndarray) -> np.ndarray:
        """OCR专用预处理"""
        if roi is None:
            return None
        
        try:
            # 放大图像便于OCR识别
            scale = 2.0
            roi = cv2.resize(roi, None, fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC)
            
            # 转灰度
            gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
            
            # 二值化
            _, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
            
            # 转回BGR供PaddleOCR使用
            result = cv2.cvtColor(binary, cv2.COLOR_GRAY2BGR)
            
            return result
        except Exception as e:
            logger.warning(f"OCR预处理失败: {e}")
            return roi
    
    @staticmethod
    def encode_frame(image: np.ndarray, quality: int = 85) -> bytes:
        """编码图像为JPEG"""
        if image is None:
            return None
        try:
            encode_param = [int(cv2.IMWRITE_JPEG_QUALITY), quality]
            _, buffer = cv2.imencode('.jpg', image, encode_param)
            return buffer.tobytes()
        except Exception as e:
            logger.error(f"图像编码失败: {e}")
            return None
    
    @staticmethod
    def draw_detection(image: np.ndarray, bbox: list, label: str, confidence: float) -> np.ndarray:
        """在图像上绘制检测结果"""
        if image is None:
            return None
        
        try:
            result = image.copy()
            x1, y1, x2, y2 = map(int, bbox)
            
            # 绘制边框
            color = (0, 255, 0)  # 绿色
            cv2.rectangle(result, (x1, y1), (x2, y2), color, 2)
            
            # 绘制标签背景
            text = f"{label} {confidence:.1%}"
            font = cv2.FONT_HERSHEY_SIMPLEX
            font_scale = 0.7
            thickness = 2
            
            (text_w, text_h), _ = cv2.getTextSize(text, font, font_scale, thickness)
            cv2.rectangle(result, (x1, y1 - text_h - 10), (x1 + text_w + 10, y1), color, -1)
            
            # 绘制文字
            cv2.putText(result, text, (x1 + 5, y1 - 5), font, font_scale, (0, 0, 0), thickness)
            
            return result
        except Exception as e:
            logger.warning(f"绘制检测结果失败: {e}")
            return image
