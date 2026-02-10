import { NextResponse } from "next/server"
import { exec } from "child_process"
import { promisify } from "util"
import * as fs from "fs"
import * as path from "path"
import { v4 as uuidv4 } from "uuid"

const execAsync = promisify(exec)

// 全局投票状态存储
const voteSessions = new Map<string, any>()

// OCR 识别 Python 代码（嵌入 ocr_engine.py 逻辑）
const OCR_ENGINE_PYTHON_CODE = `
import cv2
import numpy as np
import json
import sys
import re
from typing import Optional, Tuple, List

try:
    import easyocr
    EASYOCR_AVAILABLE = True
except ImportError:
    EASYOCR_AVAILABLE = False
    print("EasyOCR未安装", file=sys.stderr)

class OCREngine:
    """OCR识别引擎 - 使用EasyOCR"""
    
    def __init__(self, use_gpu: bool = False):
        self.reader = None
        self.use_easyocr = EASYOCR_AVAILABLE
        
        if EASYOCR_AVAILABLE:
            try:
                # 初始化EasyOCR，只识别英文和数字
                self.reader = easyocr.Reader(['en'], gpu=use_gpu, verbose=False)
            except Exception as e:
                print(f"EasyOCR初始化失败: {e}", file=sys.stderr)
                self.use_easyocr = False
    
    def recognize(self, image: np.ndarray) -> Tuple[Optional[str], float]:
        """识别图像中的数字"""
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
            print(f"EasyOCR识别失败: {e}", file=sys.stderr)
            return None, 0.0
    
    def _extract_number(self, text: str) -> Optional[str]:
        """从文本中提取数字编号，支持格式: 001, 002, 003, 1, 2, 3等"""
        if not text:
            return None
        
        # 清理文本
        text = text.strip()
        
        # 匹配3位数字编号（如001, 002）
        match = re.search(r'\\b(\\d{3})\\b', text)
        if match:
            return match.group(1)
        
        # 匹配1-3位数字（如1, 12, 123）
        match = re.search(r'\\b(\\d{1,3})\\b', text)
        if match:
            # 补齐为3位
            return match.group(1).zfill(3)
        
        # 只保留数字
        digits = re.sub(r'\\D', '', text)
        if digits:
            return digits[:3].zfill(3)
        
        return None
    
    def recognize_number_code(self, image: np.ndarray) -> Tuple[Optional[str], float]:
        """识别数字编号（专用接口），会进行额外的预处理以提高准确率"""
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
            print(f"预处理失败，使用原图: {e}", file=sys.stderr)
            return self.recognize(image)

# 主程序
if __name__ == "__main__":
    image_path = sys.argv[1]
    use_gpu = sys.argv[2].lower() == "true" if len(sys.argv) > 2 else False
    
    # 读取图像
    img = cv2.imread(image_path)
    if img is None:
        print(json.dumps({"error": "无法读取图像"}))
        sys.exit(1)
    
    # 初始化 OCR 引擎
    ocr = OCREngine(use_gpu=use_gpu)
    
    # 执行数字编号识别
    number_code, confidence = ocr.recognize_number_code(img)
    
    # 返回结果
    output = {
        "number_code": number_code,
        "confidence": confidence
    }
    print(json.dumps(output))
`

// 投票函数 - 从多次OCR结果中选择最佳结果
function voteOCRResults(
  allResults: Array<{ number_code: string | null; confidence: number }>,
  threshold: number
): { number_code: string | null; confidence: number; vote_count: number; total_rounds: number; confirmed: boolean } {
  if (allResults.length === 0) {
    return { number_code: null, confidence: 0, vote_count: 0, total_rounds: 0, confirmed: false }
  }

  // 统计每个识别结果的出现次数
  const voteMap = new Map<string, { count: number; totalConfidence: number }>()

  for (const result of allResults) {
    if (result.number_code) {
      const existing = voteMap.get(result.number_code)
      if (existing) {
        existing.count++
        existing.totalConfidence += result.confidence
      } else {
        voteMap.set(result.number_code, { count: 1, totalConfidence: result.confidence })
      }
    }
  }

  if (voteMap.size === 0) {
    return { number_code: null, confidence: 0, vote_count: 0, total_rounds: allResults.length, confirmed: false }
  }

  // 选择票数最多的结果
  let bestCode: string | null = null
  let bestCount = 0
  let bestConfidence = 0

  for (const [code, data] of voteMap.entries()) {
    if (data.count > bestCount || (data.count === bestCount && data.totalConfidence > bestConfidence)) {
      bestCode = code
      bestCount = data.count
      bestConfidence = data.totalConfidence / data.count
    }
  }

  // 检查是否达到阈值
  const confirmed = bestCode !== null && bestCount / allResults.length >= threshold

  return {
    number_code: confirmed ? bestCode : null,
    confidence: parseFloat(bestConfidence.toFixed(4)),
    vote_count: bestCount,
    total_rounds: allResults.length,
    confirmed
  }
}

// POST - OCR 数字编号识别
export async function POST(request: Request) {
  const startTime = Date.now()

  try {
    const formData = await request.formData()
    const image = formData.get("image") as File
    const useVote = formData.get("use_vote") === "true"
    const voteRounds = parseInt(formData.get("vote_rounds") as string) || 5
    const voteThreshold = parseFloat(formData.get("vote_threshold") as string) || 0.6
    const useGpu = formData.get("use_gpu") === "true"

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
    const scriptPath = path.join(tempDir, `${tempId}_ocr_engine.py`)

    // 确保临时目录存在
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true })
    }

    // 保存上传的图像
    const bytes = await image.arrayBuffer()
    fs.writeFileSync(inputPath, Buffer.from(bytes))

    // 保存 Python 脚本
    fs.writeFileSync(scriptPath, OCR_ENGINE_PYTHON_CODE)

    const pythonPath = process.env.PYTHON_PATH || "python"
    const scriptName = path.basename(scriptPath)
    const inputName = path.basename(inputPath)

    // 如果不使用投票，单次识别
    if (!useVote) {
      const { stdout, stderr } = await execAsync(
        `${pythonPath} "${scriptName}" "${inputName}" ${useGpu}`,
        { cwd: tempDir }
      )

      if (stderr && !stderr.includes("WARNING")) {
        console.error("[OCR] Python error:", stderr)
      }

      const ocrResult = JSON.parse(stdout.trim())

      if ("error" in ocrResult) {
        throw new Error(ocrResult.error)
      }

      // 清理临时文件
      try {
        fs.unlinkSync(inputPath)
        fs.unlinkSync(scriptPath)
      } catch (e) {
        console.error("[OCR] Cleanup error:", e)
      }

      const processingTime = Date.now() - startTime

      return NextResponse.json({
        success: true,
        data: {
          number_code: ocrResult.number_code,
          confidence: ocrResult.confidence,
          confirmed: false,
          processing_time_ms: processingTime,
          parameters: {
            use_vote: false,
            use_gpu: useGpu
          }
        }
      })
    }

    // 使用投票 - 多次识别
    const allResults: Array<{ number_code: string | null; confidence: number }> = []

    for (let i = 0; i < voteRounds; i++) {
      const { stdout, stderr } = await execAsync(
        `${pythonPath} "${scriptName}" "${inputName}" ${useGpu}`,
        { cwd: tempDir }
      )

      if (stderr && !stderr.includes("WARNING")) {
        console.error(`[OCR] Round ${i + 1} Python error:`, stderr)
      }

      const ocrResult = JSON.parse(stdout.trim())

      if ("error" in ocrResult) {
        console.error(`[OCR] Round ${i + 1} error:`, ocrResult.error)
        continue
      }

      allResults.push({
        number_code: ocrResult.number_code,
        confidence: ocrResult.confidence
      })
    }

    // 清理临时文件
    try {
      fs.unlinkSync(inputPath)
      fs.unlinkSync(scriptPath)
    } catch (e) {
      console.error("[OCR] Cleanup error:", e)
    }

    // 投票选择最佳结果
    const voteResult = voteOCRResults(allResults, voteThreshold)

    const processingTime = Date.now() - startTime

    return NextResponse.json({
      success: true,
      data: {
        number_code: voteResult.number_code,
        confidence: voteResult.confidence,
        confirmed: voteResult.confirmed,
        vote_info: {
          total_rounds: voteRounds,
          threshold: voteThreshold,
          vote_count: voteResult.vote_count
        },
        processing_time_ms: processingTime,
        parameters: {
          use_vote: true,
          vote_rounds: voteRounds,
          vote_threshold: voteThreshold,
          use_gpu: useGpu
        }
      }
    })

  } catch (error) {
    console.error("[OCR] Recognition error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "OCR识别失败",
        details: error instanceof Error ? error.message : "未知错误"
      },
      { status: 500 }
    )
  }
}

// 执行投票确认
function performVoteConfirmation(results: any[], threshold: number) {
  if (results.length === 0) {
    return { confirmed: false, code: null, votes: 0 }
  }

  // 统计每个编码的出现次数
  const voteCount = new Map<string, { count: number; totalConfidence: number }>()

  for (const result of results) {
    const code = result.code
    if (!code) continue

    const current = voteCount.get(code) || { count: 0, totalConfidence: 0 }
    current.count++
    current.totalConfidence += result.confidence
    voteCount.set(code, current)
  }

  // 找出得票最多的编码
  let maxVotes = 0
  let bestCode: string | null = null
  let bestConfidence = 0

  for (const [code, data] of voteCount.entries()) {
    if (data.count > maxVotes) {
      maxVotes = data.count
      bestCode = code
      bestConfidence = data.totalConfidence / data.count
    }
  }

  // 检查是否达到阈值
  const confirmed = bestCode !== null && (maxVotes / results.length) >= threshold

  return {
    confirmed,
    code: bestCode,
    votes: maxVotes,
    confidence: bestConfidence
  }
}

// GET - 获取 OCR 服务状态或投票状态
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const sessionId = searchParams.get("session_id")

  // 如果有 session_id，返回投票状态
  if (sessionId) {
    const session = voteSessions.get(sessionId)
    if (!session) {
      return NextResponse.json(
        { success: false, error: "会话不存在" },
        { status: 404 }
      )
    }

    const voteResult = performVoteConfirmation(session.results, session.threshold)

    return NextResponse.json({
      success: true,
      data: {
        session_id: sessionId,
        total_frames: session.results.length,
        window_size: session.window_size,
        threshold: session.threshold,
        confirmed: voteResult.confirmed,
        number_code: voteResult.code,
        votes: voteResult.votes,
        results: session.results
      }
    })
  }

  // 返回服务状态
  return NextResponse.json({
    success: true,
    data: {
      service: "OCR Number Code Recognition API",
      status: "ready",
      engine: "EasyOCR",
      purpose: "Recognize 3-digit number codes from images",
      supported_formats: ["image/jpeg", "image/png", "image/webp", "image/bmp"],
      max_image_size: "10MB"
    }
  })
}

// DELETE - 清除投票会话
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get("session_id")

    if (sessionId) {
      voteSessions.delete(sessionId)
      return NextResponse.json({
        success: true,
        message: "投票会话已清除",
        data: { session_id: sessionId }
      })
    } else {
      // 清除所有过期的会话（超过1小时）
      const now = Date.now()
      let clearedCount = 0
      for (const [id, session] of voteSessions.entries()) {
        if (now - session.created_at > 3600000) {
          voteSessions.delete(id)
          clearedCount++
        }
      }
      return NextResponse.json({
        success: true,
        message: `已清除 ${clearedCount} 个过期会话`
      })
    }
  } catch (error) {
    console.error("[OCR] Clear session error:", error)
    return NextResponse.json(
      { success: false, error: "清除会话失败" },
      { status: 500 }
    )
  }
}
