# OCR & YOLO API 接口文档

## 接口概览

| 接口 | 路径 | 说明 |
|------|------|------|
| YOLO 检测 | `POST /api/yolo/detect` | 数字标签检测（白底黑字） |
| OCR 识别 | `POST /api/ocr/recognize` | 数字编号识别（3位数字） |

**注意**：两个接口都支持投票确认功能，通过 `use_vote` 参数控制。

---

## 技术架构

### 自包含 Python 代码
API 文件包含完整的 Python 识别逻辑：
- **YOLO API**: 嵌入 `NumberDetector` 类（轮廓检测算法）
- **OCR API**: 嵌入 `OCREngine` 类（EasyOCR 算法）

运行时动态生成 Python 脚本并执行，无需依赖外部 Python 文件。

---

## 1. YOLO 数字标签检测 API

检测图像中的白底黑字数字标签区域。

### POST /api/yolo/detect

**请求参数：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| image | File | **是** | 图像文件 |
| confidence | number | 否 | 置信度阈值，默认 0.5 |
| use_vote | boolean | 否 | 是否使用投票确认，默认 false |
| session_id | string | 否 | 投票会话ID（use_vote=true时有效） |
| window_size | number | 否 | 投票窗口大小，默认 5 |
| threshold | number | 否 | 投票确认阈值（0-1），默认 0.6 |

**请求示例（不使用投票）：**
```bash
curl -X POST http://localhost:3000/api/yolo/detect \
  -F "image=@photo.jpg" \
  -F "confidence=0.5"
```

**响应示例（不使用投票）：**
```json
{
  "success": true,
  "data": {
    "detections": [
      {
        "bbox": [100, 150, 200, 250],
        "confidence": 0.85,
        "class": "number_tag"
      }
    ],
    "image_info": {
      "width": 1920,
      "height": 1080
    },
    "processing_time_ms": 156,
    "parameters": {
      "confidence_threshold": 0.5,
      "use_vote": false
    }
  }
}
```

**请求示例（使用投票）：**
```bash
# 第1帧
curl -X POST http://localhost:3000/api/yolo/detect \
  -F "image=@frame1.jpg" \
  -F "use_vote=true" \
  -F "session_id=session-yolo-001" \
  -F "window_size=5" \
  -F "threshold=0.6"

# 第2-5帧（使用相同的 session_id）
curl -X POST http://localhost:3000/api/yolo/detect \
  -F "image=@frame2.jpg" \
  -F "use_vote=true" \
  -F "session_id=session-yolo-001"
```

**响应示例（使用投票）：**
```json
{
  "success": true,
  "data": {
    "detections": [...],
    "primary_detection": {
      "bbox": [100, 150, 200, 250],
      "confidence": 0.85,
      "class": "number_tag"
    },
    "image_info": {
      "width": 1920,
      "height": 1080
    },
    "processing_time_ms": 160,
    "parameters": {
      "confidence_threshold": 0.5,
      "use_vote": true,
      "session_id": "session-yolo-001",
      "window_size": 5,
      "threshold": 0.6
    }
  }
}
```

### GET /api/yolo/detect
获取 YOLO 服务状态。

**响应示例：**
```json
{
  "success": true,
  "data": {
    "service": "YOLO Number Tag Detection API",
    "status": "ready",
    "model": "Contour Detection",
    "purpose": "Detect white background black text number tags",
    "max_image_size": "10MB",
    "supported_formats": ["image/jpeg", "image/png", "image/webp"]
  }
}
```

---

## 2. OCR 数字编号识别 API

识别图像中的3位数字编号（如 001, 002, 123）。

### POST /api/ocr/recognize

**请求参数：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| image | File | **是** | 图像文件 |
| use_vote | boolean | 否 | 是否使用投票确认，默认 false |
| session_id | string | 否 | 投票会话ID（use_vote=true时有效） |
| window_size | number | 否 | 投票窗口大小，默认 5 |
| threshold | number | 否 | 投票确认阈值（0-1），默认 0.6 |
| use_gpu | boolean | 否 | 是否使用GPU，默认 false |

**请求示例（不使用投票）：**
```bash
curl -X POST http://localhost:3000/api/ocr/recognize \
  -F "image=@photo.jpg" \
  -F "use_gpu=false"
```

**响应示例（不使用投票）：**
```json
{
  "success": true,
  "data": {
    "number_code": "001",
    "confidence": 0.95,
    "confirmed": false,
    "session_id": "550e8400-e29b-41d4-a716-446655440000",
    "processing_time_ms": 234,
    "parameters": {
      "use_vote": false,
      "use_gpu": false
    }
  }
}
```

**请求示例（使用投票）：**
```bash
# 第1帧
curl -X POST http://localhost:3000/api/ocr/recognize \
  -F "image=@frame1.jpg" \
  -F "use_vote=true" \
  -F "session_id=session-ocr-001" \
  -F "window_size=5" \
  -F "threshold=0.6"

# 第2-5帧（使用相同的 session_id）
curl -X POST http://localhost:3000/api/ocr/recognize \
  -F "image=@frame2.jpg" \
  -F "use_vote=true" \
  -F "session_id=session-ocr-001"
```

**响应示例（投票中，未确认）：**
```json
{
  "success": true,
  "data": {
    "number_code": null,
    "current_recognition": "001",
    "confidence": 0.92,
    "confirmed": false,
    "votes": 2,
    "total_frames": 3,
    "session_id": "session-ocr-001",
    "processing_time_ms": 198,
    "parameters": {
      "use_vote": true,
      "window_size": 5,
      "threshold": 0.6,
      "use_gpu": false
    }
  }
}
```

**响应示例（投票确认成功）：**
```json
{
  "success": true,
  "data": {
    "number_code": "001",
    "current_recognition": "001",
    "confidence": 0.94,
    "confirmed": true,
    "votes": 4,
    "total_frames": 5,
    "session_id": "session-ocr-001",
    "processing_time_ms": 203,
    "parameters": {
      "use_vote": true,
      "window_size": 5,
      "threshold": 0.6,
      "use_gpu": false
    }
  }
}
```

### GET /api/ocr/recognize?session_id=xxx
获取指定会话的投票状态。

**响应示例：**
```json
{
  "success": true,
  "data": {
    "session_id": "session-ocr-001",
    "total_frames": 5,
    "window_size": 5,
    "threshold": 0.6,
    "confirmed": true,
    "number_code": "001",
    "votes": 4,
    "results": [
      {"code": "001", "confidence": 0.92, "timestamp": 1704067200000},
      {"code": "001", "confidence": 0.93, "timestamp": 1704067200100},
      {"code": "002", "confidence": 0.85, "timestamp": 1704067200200},
      {"code": "001", "confidence": 0.94, "timestamp": 1704067200300},
      {"code": "001", "confidence": 0.95, "timestamp": 1704067200400}
    ]
  }
}
```

### DELETE /api/ocr/recognize?session_id=xxx
清除指定的投票会话。

**响应示例：**
```json
{
  "success": true,
  "message": "投票会话已清除",
  "data": {
    "session_id": "session-ocr-001"
  }
}
```

### GET /api/ocr/recognize
获取 OCR 服务状态。

**响应示例：**
```json
{
  "success": true,
  "data": {
    "service": "OCR Number Code Recognition API",
    "status": "ready",
    "engine": "EasyOCR",
    "purpose": "Recognize 3-digit number codes from images",
    "supported_formats": ["image/jpeg", "image/png", "image/webp", "image/bmp"],
    "max_image_size": "10MB"
  }
}
```

---

## 前端调用示例

### YOLO 检测（不使用投票）
```typescript
const detectNumberTag = async (imageFile: File) => {
  const formData = new FormData();
  formData.append('image', imageFile);
  formData.append('confidence', '0.5');

  const response = await fetch('/api/yolo/detect', {
    method: 'POST',
    body: formData
  });

  const result = await response.json();
  if (result.success) {
    console.log('检测到的标签区域:', result.data.detections);
  }
};
```

### OCR 识别（不使用投票）
```typescript
const recognizeNumberCode = async (imageFile: File) => {
  const formData = new FormData();
  formData.append('image', imageFile);
  formData.append('use_gpu', 'false');

  const response = await fetch('/api/ocr/recognize', {
    method: 'POST',
    body: formData
  });

  const result = await response.json();
  if (result.success) {
    console.log('识别的数字编号:', result.data.number_code);
  }
};
```

### 使用投票确认（视频流场景）
```typescript
class VoteSession {
  private sessionId: string;
  private apiEndpoint: string;
  private confirmed: boolean = false;

  constructor(apiEndpoint: string) {
    this.sessionId = crypto.randomUUID();
    this.apiEndpoint = apiEndpoint; // '/api/yolo/detect' 或 '/api/ocr/recognize'
  }

  async processFrame(imageFile: File): Promise<boolean> {
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('use_vote', 'true');
    formData.append('session_id', this.sessionId);
    formData.append('window_size', '5');
    formData.append('threshold', '0.6');

    const response = await fetch(this.apiEndpoint, {
      method: 'POST',
      body: formData
    });

    const result = await response.json();
    if (result.success) {
      this.confirmed = result.data.confirmed;

      if (this.confirmed) {
        console.log('投票确认成功:', result.data.number_code || result.data.primary_detection);
        return true;
      } else {
        console.log('投票中:', result.data.votes + '/' + result.data.total_frames);
        return false;
      }
    }
    return false;
  }

  async getStatus() {
    const response = await fetch(`${this.apiEndpoint}?session_id=${this.sessionId}`);
    return await response.json();
  }

  async clear() {
    await fetch(`${this.apiEndpoint}?session_id=${this.sessionId}`, {
      method: 'DELETE'
    });
  }
}

// 使用示例 - OCR 投票
const ocrSession = new VoteSession('/api/ocr/recognize');

for (const frame of videoFrames) {
  const confirmed = await ocrSession.processFrame(frame);
  if (confirmed) break;
}

await ocrSession.clear();

// 使用示例 - YOLO 投票
const yoloSession = new VoteSession('/api/yolo/detect');

for (const frame of videoFrames) {
  const confirmed = await yoloSession.processFrame(frame);
  if (confirmed) break;
}

await yoloSession.clear();
```

---

## 技术说明

### Python 依赖
确保服务器上安装了以下 Python 包：
```bash
pip install opencv-python easyocr numpy
```

**注意**：API 文件已包含完整的 Python 识别代码，无需额外的 Python 文件。

### 环境变量
| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| PYTHON_PATH | Python 解释器路径 | python |

### 算法说明

#### YOLO 检测（嵌入代码）
- **算法**：轮廓检测（Contour Detection）
- **检测目标**：白底黑字数字标签
- **过滤条件**：
  - 面积：1000 ~ 图像面积×0.5
  - 尺寸：宽≥50, 高≥30
  - 宽高比：1.5 ~ 4.5
  - 深色像素比例：10% ~ 60%
- **后处理**：检测框合并、按面积排序、最多返回3个

#### OCR 识别（嵌入代码）
- **引擎**：EasyOCR（英文模式）
- **识别目标**：3位数字编号
- **预处理**：
  - 图像放大（小图放大至100px）
  - 对比度增强（CLAHE）
- **数字提取**：
  - 优先匹配3位数字（001, 002）
  - 补齐1-2位数字为3位
  - 清理非数字字符

#### 投票确认算法
- **窗口大小**：参与投票的最近 N 帧结果
- **阈值**：某个识别结果在窗口中出现的比例达到阈值时才确认
- **示例**：窗口大小 5，阈值 0.6，表示最近 5 帧中至少有 3 帧识别为相同结果时才确认

### 执行流程

```
1. 接收图像上传
   ↓
2. 将嵌入的 Python 代码保存为临时脚本文件
   ↓
3. 执行 Python 脚本：python script.py image_path params
   ↓
4. 解析 Python 输出（JSON 格式）
   ↓
5. 清理临时文件（图像 + 脚本）
   ↓
6. 返回识别结果
```

### 使用建议
1. **单张图像识别**：不使用投票，直接调用获取结果
2. **视频流识别**：使用投票，提高识别准确率
3. **YOLO + OCR 组合**：先用 YOLO 检测标签区域，再裁剪后使用 OCR 识别编号

### 文件位置

| 文件 | 路径 |
|------|------|
| YOLO API | `app/api/yolo/detect/route.ts` |
| OCR API | `app/api/ocr/recognize/route.ts` |
