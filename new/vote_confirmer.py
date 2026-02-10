"""
多帧投票确认器 - 消除误识别
"""
import time
from collections import deque
from typing import Optional, Dict, Any
from dataclasses import dataclass
from loguru import logger


@dataclass
class RecognitionResult:
    """识别结果"""
    code: str
    confidence: float
    timestamp: float


class VoteConfirmer:
    """
    多帧投票确认器
    通过连续多帧的识别结果投票，确保结果的稳定性和准确性
    """
    
    def __init__(
        self,
        window_size: int = 5,
        threshold: float = 0.6,
        debounce_time: float = 1.0
    ):
        """
        Args:
            window_size: 滑动窗口大小（帧数）
            threshold: 确认阈值（投票比例）
            debounce_time: 防抖时间（秒），相同结果在此时间内不重复确认
        """
        self.window_size = window_size
        self.threshold = threshold
        self.debounce_time = debounce_time
        
        self.results_window: deque = deque(maxlen=window_size)
        self.last_confirmed_code: Optional[str] = None
        self.last_confirmed_time: float = 0
        
        logger.info(
            f"✅ 投票确认器初始化 (窗口: {window_size}, 阈值: {threshold:.0%}, 防抖: {debounce_time}s)"
        )
    
    def add_result(self, code: Optional[str], confidence: float) -> Optional[Dict[str, Any]]:
        """
        添加一帧识别结果
        
        Args:
            code: 识别到的编号（如 "001"），None表示未识别到
            confidence: 置信度
            
        Returns:
            如果确认了结果，返回 {"code": "001", "confidence": 0.95, "votes": 4}
            否则返回 None
        """
        current_time = time.time()
        
        # 添加到滑动窗口
        if code:
            self.results_window.append(RecognitionResult(
                code=code,
                confidence=confidence,
                timestamp=current_time
            ))
        else:
            # 未识别到，添加空结果
            self.results_window.append(None)
        
        # 窗口未满，不进行确认
        if len(self.results_window) < self.window_size:
            return None
        
        # 统计投票
        vote_count = self._count_votes()
        
        if not vote_count:
            return None
        
        # 找出得票最多的编号
        max_code = max(vote_count.keys(), key=lambda k: vote_count[k]["count"])
        max_votes = vote_count[max_code]["count"]
        max_conf = vote_count[max_code]["avg_confidence"]
        
        # 计算投票比例
        vote_ratio = max_votes / self.window_size
        
        # 检查是否达到阈值
        if vote_ratio < self.threshold:
            return None
        
        # 防抖检查：相同编号在防抖时间内不重复确认
        if (
            max_code == self.last_confirmed_code
            and (current_time - self.last_confirmed_time) < self.debounce_time
        ):
            return None
        
        # 确认结果
        self.last_confirmed_code = max_code
        self.last_confirmed_time = current_time
        
        logger.info(f"✅ 确认识别结果: {max_code} (投票: {max_votes}/{self.window_size}, 置信度: {max_conf:.1%})")
        
        return {
            "code": max_code,
            "confidence": max_conf,
            "votes": max_votes,
            "vote_ratio": vote_ratio
        }
    
    def _count_votes(self) -> Dict[str, Dict[str, Any]]:
        """统计投票"""
        vote_count = {}
        
        for result in self.results_window:
            if result is None:
                continue
            
            code = result.code
            conf = result.confidence
            
            if code not in vote_count:
                vote_count[code] = {
                    "count": 0,
                    "total_confidence": 0,
                    "avg_confidence": 0
                }
            
            vote_count[code]["count"] += 1
            vote_count[code]["total_confidence"] += conf
            vote_count[code]["avg_confidence"] = (
                vote_count[code]["total_confidence"] / vote_count[code]["count"]
            )
        
        return vote_count
    
    def reset(self):
        """重置确认器"""
        self.results_window.clear()
        self.last_confirmed_code = None
        self.last_confirmed_time = 0
        logger.info("投票确认器已重置")
    
    def get_current_stats(self) -> Dict[str, Any]:
        """获取当前统计信息"""
        vote_count = self._count_votes()
        
        return {
            "window_size": self.window_size,
            "current_count": len(self.results_window),
            "votes": vote_count,
            "last_confirmed": self.last_confirmed_code,
            "last_confirmed_time": self.last_confirmed_time
        }
