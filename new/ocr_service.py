"""
OCR 识别服务 - FastAPI 后端
整合 detector, preprocessor, ocr_engine, vote_confirmer 模块
"""
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import numpy as np
import cv2
import io
import uvicorn

# 导入自定义模块
from detector import NumberDetector
from preprocessor import ImagePreprocessor
from ocr_engine import OCREngine
from vote_confirmer import VoteConfirmer

app = FastAPI(title="OCR 数字识别服务", version="1.0.0")

# 启用 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 初始化组件
detector = NumberDetector(confidence=0.5)
preprocessor = ImagePreprocessor()
ocr_engine = OCREngine(use_gpu=False)
vote_confirmer = VoteConfirmer(window_size=5, threshold=0.6)


class OCRResult(BaseModel):
    code: Optional[str]
    confidence: float
    bbox: Optional[List[int]]
    message: str


class OCRBatchResult(BaseModel):
    results: List[OCRResult]
    total: int
    successful: int


@app.get("/")
def root():
    return {
        "status": "ready",
        "service": "OCR 数字识别服务",
        "features": {
            "detector": True,
            "preprocessor": True,
            "ocr_engine": True,
            "vote_confirmer": True
        }
    }


@app.post("/recognize", response_model=OCRResult)
async def recognize_image(
    image: UploadFile = File(...),
    use_preprocess: bool = True,
    use_vote: bool = False
):
    """
    识别图像中的数字编号
    
    - use_preprocess: 是否使用图像预处理
    - use_vote: 是否使用多帧投票（用于视频流）
    """
    try:
        # 读取图像
        contents = await image.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            raise HTTPException(status_code=400, detail="无法读取图像文件")
        
        # 1. 检测数字标签区域
        detections = detector.detect_and_crop(img)
        
        if not detections:
            return OCRResult(
                code=None,
                confidence=0.0,
                bbox=None,
                message="未检测到数字标签"
            )
        
        # 取第一个检测结果（通常是最大的）
        det = detections[0]
        roi = det["roi"]
        bbox = det["bbox"]
        
        # 2. 预处理（可选）
        if use_preprocess:
            roi = preprocessor.preprocess_for_ocr(roi)
        
        # 3. OCR 识别
        code, confidence = ocr_engine.recognize_number_code(roi)
        
        # 4. 多帧投票（可选，用于视频流）
        if use_vote:
            vote_result = vote_confirmer.add_result(code, confidence)
            if vote_result:
                return OCRResult(
                    code=vote_result["code"],
                    confidence=vote_result["confidence"],
                    bbox=bbox,
                    message=f"投票确认成功 ({vote_result['votes']}/5)"
                )
            else:
                return OCRResult(
                    code=None,
                    confidence=confidence,
                    bbox=bbox,
                    message="投票中，请继续提供图像"
                )
        
        if code:
            return OCRResult(
                code=code,
                confidence=confidence,
                bbox=bbox,
                message="识别成功"
            )
        else:
            return OCRResult(
                code=None,
                confidence=confidence,
                bbox=bbox,
                message="未能识别数字"
            )
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"识别失败: {str(e)}")


@app.post("/recognize/batch", response_model=OCRBatchResult)
async def recognize_batch(images: List[UploadFile] = File(...)):
    """批量识别多张图像"""
    results = []
    successful = 0
    
    for image in images:
        try:
            contents = await image.read()
            nparr = np.frombuffer(contents, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            if img is None:
                results.append(OCRResult(
                    code=None,
                    confidence=0.0,
                    bbox=None,
                    message="无法读取图像"
                ))
                continue
            
            # 检测并识别
            detections = detector.detect_and_crop(img)
            if not detections:
                results.append(OCRResult(
                    code=None,
                    confidence=0.0,
                    bbox=None,
                    message="未检测到数字标签"
                ))
                continue
            
            det = detections[0]
            roi = preprocessor.preprocess_for_ocr(det["roi"])
            code, confidence = ocr_engine.recognize_number_code(roi)
            
            if code:
                successful += 1
                results.append(OCRResult(
                    code=code,
                    confidence=confidence,
                    bbox=det["bbox"],
                    message="识别成功"
                ))
            else:
                results.append(OCRResult(
                    code=None,
                    confidence=confidence,
                    bbox=det["bbox"],
                    message="未能识别数字"
                ))
                
        except Exception as e:
            results.append(OCRResult(
                code=None,
                confidence=0.0,
                bbox=None,
                message=f"处理失败: {str(e)}"
            ))
    
    return OCRBatchResult(
        results=results,
        total=len(images),
        successful=successful
    )


@app.post("/detect")
async def detect_only(image: UploadFile = File(...)):
    """仅检测数字标签区域，不进行 OCR"""
    try:
        contents = await image.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            raise HTTPException(status_code=400, detail="无法读取图像文件")
        
        detections = detector.detect(img)
        
        return {
            "detections": detections,
            "count": len(detections)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"检测失败: {str(e)}")


@app.get("/vote/status")
def get_vote_status():
    """获取投票确认器当前状态"""
    return vote_confirmer.get_current_stats()


@app.post("/vote/reset")
def reset_vote():
    """重置投票确认器"""
    vote_confirmer.reset()
    return {"message": "投票确认器已重置"}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
