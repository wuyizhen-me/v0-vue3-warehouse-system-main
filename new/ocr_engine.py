"""
EasyOCR 数字识别引擎 - 稳定版
"""
import re
import cv2
import numpy as np
from typing import Optional, Tuple
from loguru import logger

try:
    import easyocr
    EASYOCR_AVAILABLE = True
except ImportError:
    EASYOCR_AVAILABLE = False
    logger.warning("EasyOCR未安装")


class OCREngine:
    """OCR识别引擎 - 使用EasyOCR"""
    
    def __init__(self, use_gpu: bool = False):
        self.reader = None
        self.use_easyocr = EASYOCR_AVAILABLE
        
        if EASYOCR_AVAILABLE:
            try:
                # 初始化EasyOCR，只识别英文和数字
                self.reader = easyocr.Reader(['en'], gpu=use_gpu, verbose=False)
                logger.info(f"✅ EasyOCR初始化成功")
            except Exception as e:
                logger.error(f"EasyOCR初始化失败: {e}")
                self.use_easyocr = False
    
    def recognize(self, image: np.ndarray) -> Tuple[Optional[str], float]:
        """
        识别图像中的数字
        
        Args:
            image: BGR格式图像
            
        Returns:
            Tuple[str, float]: (识别结果, 置信度) 或 (None, 0.0)
        """
        if image is None or image.size == 0:
            return None, 0.0
        
        if self.use_easyocr and self.reader is not None:
            return self._recognize_with_easyocr(image)
        else:
            return None, 0.0
    
    def _recognize_with_easyocr(self, image: np.ndarray) -> Tuple[Optional[str], float]:
        """使用EasyOCR识别"""
        try:
            # EasyOCR识别
            results = self.reader.readtext(image)
            
            texts = []
            confidences = []
            
            # 解析结果 - 格式: [(box, text, conf), ...]
            for (bbox, text, conf) in results:
                texts.append(text)
                confidences.append(conf)
            
            if not texts:
                return None, 0.0
            
            # 合并所有文本
            full_text = ' '.join(texts)
            avg_conf = sum(confidences) / len(confidences) if confidences else 0.0
            
            # 提取数字编号
            number = self._extract_number(full_text)
            
            if number:
                return number, avg_conf
            
            return None, 0.0
            
        except Exception as e:
            logger.error(f"EasyOCR识别失败: {e}")
            return None, 0.0
    
    def _extract_number(self, text: str) -> Optional[str]:
        """
        从文本中提取数字编号
        支持格式: 001, 002, 003, 1, 2, 3等
        """
        if not text:
            return None
        
        # 清理文本
        text = text.strip()
        
        # 匹配3位数字编号（如001, 002）
        match = re.search(r'\b(\d{3})\b', text)
        if match:
            return match.group(1)
        
        # 匹配1-3位数字（如1, 12, 123）
        match = re.search(r'\b(\d{1,3})\b', text)
        if match:
            # 补齐为3位
            return match.group(1).zfill(3)
        
        # 只保留数字
        digits = re.sub(r'\D', '', text)
        if digits:
            return digits[:3].zfill(3)
        
        return None
    
    def recognize_number_code(self, image: np.ndarray) -> Tuple[Optional[str], float]:
        """
        识别数字编号（专用接口）
        会进行额外的预处理以提高准确率
        """
        if image is None:
            return None, 0.0
        
        # 预处理：放大、增强对比度
        try:
            # 放大2倍
            h, w = image.shape[:2]
            if h < 50 or w < 50:
                scale = max(100 / h, 100 / w)
                image = cv2.resize(image, None, fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC)
            
            # 增强对比度
            lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
            l, a, b = cv2.split(lab)
            clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
            l = clahe.apply(l)
            lab = cv2.merge([l, a, b])
            enhanced = cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)
            
            return self.recognize(enhanced)
            
        except Exception as e:
            logger.warning(f"预处理失败，使用原图: {e}")
            return self.recognize(image)
