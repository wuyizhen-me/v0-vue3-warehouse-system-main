<template>
  <div class="table-page">
    <div class="table-container">
      <div class="table-header">
        <h2 class="table-title">📋 {{ t('inventoryRecords') }}</h2>
        
        <!-- 筛选器 -->
        <div class="filters">
          <div class="search-box">
            <input 
              v-model="searchKeyword"
              type="text"
              :placeholder="t('searchPlaceholder')"
              class="filter-input"
            />
            <span class="search-icon">🔍</span>
          </div>
          
          <div class="filter-group">
            <button 
              v-for="status in statusOptions" 
              :key="status.value"
              :class="['filter-btn', { active: currentStatus === status.value }]"
              @click="currentStatus = status.value"
            >
              {{ t(status.label) }}
              <span class="filter-count">{{ getStatusCount(status.value) }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- 表格 -->
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th class="checkbox-col">
                <input type="checkbox" v-model="selectAll" @change="toggleSelectAll" />
              </th>
              <th @click="sortBy('batchNo')" class="sortable">
                {{ t('batchNo') }}
                <span v-if="sortField === 'batchNo'" class="sort-icon">{{ sortOrder === 'asc' ? '↑' : '↓' }}</span>
              </th>
              <th>{{ t('productName') }}</th>
              <th @click="sortBy('quantity')" class="sortable">
                {{ t('quantity') }}
                <span v-if="sortField === 'quantity'" class="sort-icon">{{ sortOrder === 'asc' ? '↑' : '↓' }}</span>
              </th>
              <th>{{ t('supplier') }}</th>
              <th @click="sortBy('createTime')" class="sortable">
                {{ t('createTime') }}
                <span v-if="sortField === 'createTime'" class="sort-icon">{{ sortOrder === 'asc' ? '↑' : '↓' }}</span>
              </th>
              <th>{{ t('status') }}</th>
              <th>{{ t('actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="record in paginatedRecords" 
              :key="record.id"
              :class="{ selected: selectedIds.includes(record.id) }"
            >
              <td>
                <input 
                  type="checkbox" 
                  :value="record.id" 
                  v-model="selectedIds"
                />
              </td>
              <td class="batch-no">{{ record.batchNo }}</td>
              <td>
                <div class="product-cell">
                  <span class="product-name">{{ record.productName }}</span>
                  <span class="product-sku">{{ record.sku }}</span>
                </div>
              </td>
              <td class="quantity">{{ record.quantity }} {{ record.unit }}</td>
              <td>{{ record.supplier }}</td>
              <td class="time">{{ record.createTime }}</td>
              <td>
                <span :class="['status-badge', record.status]">
                  {{ t(record.status) }}
                </span>
              </td>
              <td>
                <div class="actions">
                  <button class="action-btn view" @click="viewDetail(record)" :title="t('view')">👁️</button>
                  <button 
                    v-if="record.status === 'pending'" 
                    class="action-btn confirm" 
                    @click="confirmInbound(record)"
                    :title="t('confirm')"
                  >✅</button>
                  <button 
                    v-if="record.status === 'pending'" 
                    class="action-btn delete" 
                    @click="deleteRecord(record)"
                    :title="t('delete')"
                  >🗑️</button>
                </div>
              </td>
            </tr>
            <tr v-if="paginatedRecords.length === 0">
              <td colspan="8" class="empty-state">
                <span class="empty-icon">📭</span>
                <span>{{ t('noData') }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 分页 -->
      <div class="pagination">
        <div class="pagination-info">
          {{ t('showing') }} {{ startIndex + 1 }}-{{ endIndex }} {{ t('of') }} {{ filteredRecords.length }} {{ t('items') }}
        </div>
        <div class="pagination-controls">
          <button 
            class="page-btn" 
            :disabled="currentPage === 1"
            @click="currentPage--"
          >‹</button>
          <button 
            v-for="page in displayPages" 
            :key="page"
            :class="['page-btn', { active: page === currentPage }]"
            @click="typeof page === 'number' && (currentPage = page)"
            :disabled="typeof page !== 'number'"
          >
            {{ page }}
          </button>
          <button 
            class="page-btn" 
            :disabled="currentPage === totalPages"
            @click="currentPage++"
          >›</button>
        </div>
        <div class="page-size-selector">
          <select v-model="pageSize" class="page-size-select">
            <option :value="10">10 / {{ t('page') }}</option>
            <option :value="20">20 / {{ t('page') }}</option>
            <option :value="50">50 / {{ t('page') }}</option>
          </select>
        </div>
      </div>
    </div>

    <!-- 删除确认弹窗 -->
    <Teleport to="body">
      <div v-if="showDeleteConfirm" class="modal-overlay" @click="showDeleteConfirm = false">
        <div class="modal-content confirm-modal" @click.stop>
          <span class="modal-icon">⚠️</span>
          <h3>{{ t('confirmDelete') }}</h3>
          <p>{{ t('deleteMessage') }} <strong>{{ recordToDelete?.batchNo }}</strong>?</p>
          <div class="modal-actions">
            <button class="btn btn-secondary" @click="showDeleteConfirm = false">{{ t('cancel') }}</button>
            <button class="btn btn-danger" @click="confirmDelete">{{ t('delete') }}</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

// 国际化
const locale = ref('zh')
const messages = {
  zh: {
    inventoryRecords: '入库记录管理',
    searchPlaceholder: '搜索批次号、商品名称...',
    batchNo: '批次号',
    productName: '商品名称',
    quantity: '数量',
    supplier: '供应商',
    createTime: '创建时间',
    status: '状态',
    actions: '操作',
    all: '全部',
    pending: '待入库',
    completed: '已完成',
    cancelled: '已取消',
    view: '查看',
    confirm: '确认入库',
    delete: '删除',
    cancel: '取消',
    showing: '显示',
    of: '共',
    items: '条',
    page: '页',
    noData: '暂无数据',
    confirmDelete: '确认删除',
    deleteMessage: '确定要删除入库单'
  },
  en: {
    inventoryRecords: 'Inventory Records',
    searchPlaceholder: 'Search batch no, product...',
    batchNo: 'Batch No.',
    productName: 'Product',
    quantity: 'Qty',
    supplier: 'Supplier',
    createTime: 'Created',
    status: 'Status',
    actions: 'Actions',
    all: 'All',
    pending: 'Pending',
    completed: 'Completed',
    cancelled: 'Cancelled',
    view: 'View',
    confirm: 'Confirm',
    delete: 'Delete',
    cancel: 'Cancel',
    showing: 'Showing',
    of: 'of',
    items: 'items',
    page: 'per page',
    noData: 'No data',
    confirmDelete: 'Confirm Delete',
    deleteMessage: 'Are you sure you want to delete'
  }
}
const t = (key) => messages[locale.value][key] || key

// 状态选项
const statusOptions = [
  { value: 'all', label: 'all' },
  { value: 'pending', label: 'pending' },
  { value: 'completed', label: 'completed' },
  { value: 'cancelled', label: 'cancelled' }
]

// 模拟数据
const records = ref([
  { id: 1, batchNo: 'RK20250111001', productName: 'iPhone 15 Pro Max', sku: 'APL-IP15PM-256', quantity: 200, unit: '台', supplier: '苹果官方渠道', createTime: '2025-01-11 09:30', status: 'completed' },
  { id: 2, batchNo: 'RK20250111002', productName: 'MacBook Pro 14"', sku: 'APL-MBP14-M3', quantity: 50, unit: '台', supplier: '京东自营', createTime: '2025-01-11 10:15', status: 'completed' },
  { id: 3, batchNo: 'RK20250111003', productName: 'AirPods Pro 2', sku: 'APL-APP2-W', quantity: 500, unit: '副', supplier: '天猫旗舰店', createTime: '2025-01-11 11:00', status: 'pending' },
  { id: 4, batchNo: 'RK20250111004', productName: 'iPad Air 5', sku: 'APL-IPA5-64', quantity: 100, unit: '台', supplier: '苹果官方渠道', createTime: '2025-01-11 14:20', status: 'pending' },
  { id: 5, batchNo: 'RK20250110001', productName: 'Apple Watch S9', sku: 'APL-AWS9-45', quantity: 80, unit: '块', supplier: '京东自营', createTime: '2025-01-10 09:00', status: 'completed' },
  { id: 6, batchNo: 'RK20250110002', productName: 'iPhone 15', sku: 'APL-IP15-128', quantity: 300, unit: '台', supplier: '天猫旗舰店', createTime: '2025-01-10 11:30', status: 'cancelled' },
  { id: 7, batchNo: 'RK20250109001', productName: 'MacBook Air', sku: 'APL-MBA-M2', quantity: 120, unit: '台', supplier: '苹果官方渠道', createTime: '2025-01-09 15:00', status: 'completed' },
  { id: 8, batchNo: 'RK20250109002', productName: 'AirPods 3', sku: 'APL-AP3-W', quantity: 400, unit: '副', supplier: '京东自营', createTime: '2025-01-09 16:45', status: 'completed' }
])

// 筛选和搜索
const searchKeyword = ref('')
const currentStatus = ref('all')
const sortField = ref('createTime')
const sortOrder = ref('desc')

// 分页
const currentPage = ref(1)
const pageSize = ref(10)

// 选择
const selectedIds = ref([])
const selectAll = ref(false)

// 删除确认
const showDeleteConfirm = ref(false)
const recordToDelete = ref(null)

// 获取状态数量
const getStatusCount = (status) => {
  if (status === 'all') return records.value.length
  return records.value.filter(r => r.status === status).length
}

// 过滤后的记录
const filteredRecords = computed(() => {
  let result = [...records.value]
  
  // 状态筛选
  if (currentStatus.value !== 'all') {
    result = result.filter(r => r.status === currentStatus.value)
  }
  
  // 搜索筛选
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(r => 
      r.batchNo.toLowerCase().includes(keyword) ||
      r.productName.toLowerCase().includes(keyword) ||
      r.sku.toLowerCase().includes(keyword)
    )
  }
  
  // 排序
  result.sort((a, b) => {
    let aVal = a[sortField.value]
    let bVal = b[sortField.value]
    if (sortOrder.value === 'asc') {
      return aVal > bVal ? 1 : -1
    }
    return aVal < bVal ? 1 : -1
  })
  
  return result
})

// 分页计算
const totalPages = computed(() => Math.ceil(filteredRecords.value.length / pageSize.value))
const startIndex = computed(() => (currentPage.value - 1) * pageSize.value)
const endIndex = computed(() => Math.min(startIndex.value + pageSize.value, filteredRecords.value.length))
const paginatedRecords = computed(() => filteredRecords.value.slice(startIndex.value, endIndex.value))

// 显示的页码
const displayPages = computed(() => {
  const pages = []
  const total = totalPages.value
  const current = currentPage.value
  
  if (total <= 5) {
    for (let i = 1; i <= total; i++) pages.push(i)
  } else {
    if (current <= 3) {
      pages.push(1, 2, 3, 4, '...', total)
    } else if (current >= total - 2) {
      pages.push(1, '...', total - 3, total - 2, total - 1, total)
    } else {
      pages.push(1, '...', current - 1, current, current + 1, '...', total)
    }
  }
  
  return pages
})

// 排序
const sortBy = (field) => {
  if (sortField.value === field) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortField.value = field
    sortOrder.value = 'desc'
  }
}

// 全选/取消全选
const toggleSelectAll = () => {
  if (selectAll.value) {
    selectedIds.value = paginatedRecords.value.map(r => r.id)
  } else {
    selectedIds.value = []
  }
}

// 查看详情
const viewDetail = (record) => {
  alert(`查看详情: ${record.batchNo}`)
}

// 确认入库
const confirmInbound = (record) => {
  record.status = 'completed'
}

// 删除记录
const deleteRecord = (record) => {
  recordToDelete.value = record
  showDeleteConfirm.value = true
}

const confirmDelete = () => {
  const index = records.value.findIndex(r => r.id === recordToDelete.value.id)
  if (index > -1) {
    records.value.splice(index, 1)
  }
  showDeleteConfirm.value = false
  recordToDelete.value = null
}

// 监听筛选变化，重置页码
watch([searchKeyword, currentStatus, pageSize], () => {
  currentPage.value = 1
})
</script>

<style scoped>
.table-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f0f4f8 0%, #d9e2ec 100%);
  padding: 2rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.table-container {
  background: white;
  border-radius: 20px;
  padding: 1.5rem;
  box-shadow: 0 10px 40px rgba(0,0,0,0.1);
}

.table-header {
  margin-bottom: 1.5rem;
}

.table-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e3a5f;
  margin-bottom: 1rem;
}

.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
}

.search-box {
  position: relative;
  flex: 1;
  min-width: 250px;
}

.filter-input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  font-size: 0.875rem;
  background: #f8fafc;
}
.filter-input:focus {
  outline: none;
  border-color: #3b82f6;
  background: white;
}

.search-box .search-icon {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
}

.filter-group {
  display: flex;
  gap: 0.5rem;
}

.filter-btn {
  padding: 0.5rem 1rem;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.filter-btn:hover { border-color: #3b82f6; }
.filter-btn.active {
  background: #3b82f6;
  border-color: #3b82f6;
  color: white;
}

.filter-count {
  background: rgba(0,0,0,0.1);
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
  font-size: 0.75rem;
}
.filter-btn.active .filter-count { background: rgba(255,255,255,0.2); }

.table-wrapper { overflow-x: auto; }

.data-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 900px;
}

.data-table th, .data-table td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #f1f5f9;
}

.data-table th {
  background: #f8fafc;
  font-weight: 600;
  color: #475569;
  font-size: 0.875rem;
  white-space: nowrap;
}

.sortable { cursor: pointer; user-select: none; }
.sortable:hover { background: #eef2ff; }
.sort-icon { margin-left: 0.25rem; color: #3b82f6; }

.checkbox-col { width: 40px; }

.data-table tbody tr { transition: background 0.2s; }
.data-table tbody tr:hover { background: #f8fafc; }
.data-table tbody tr.selected { background: #eff6ff; }

.batch-no {
  font-family: 'SF Mono', monospace;
  color: #3b82f6;
  font-weight: 500;
}

.product-cell { display: flex; flex-direction: column; }
.product-name { font-weight: 500; color: #1e293b; }
.product-sku { font-size: 0.75rem; color: #94a3b8; font-family: monospace; }

.quantity { font-weight: 600; color: #1e293b; }
.time { color: #64748b; font-size: 0.875rem; }

.status-badge {
  padding: 0.375rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
}
.status-badge.completed { background: #dcfce7; color: #16a34a; }
.status-badge.pending { background: #fef3c7; color: #d97706; }
.status-badge.cancelled { background: #fee2e2; color: #dc2626; }

.actions { display: flex; gap: 0.5rem; }

.action-btn {
  width: 32px; height: 32px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}
.action-btn.view { background: #e0f2fe; }
.action-btn.view:hover { background: #bae6fd; }
.action-btn.confirm { background: #dcfce7; }
.action-btn.confirm:hover { background: #bbf7d0; }
.action-btn.delete { background: #fee2e2; }
.action-btn.delete:hover { background: #fecaca; }

.empty-state {
  text-align: center;
  padding: 3rem !important;
  color: #94a3b8;
}
.empty-icon { font-size: 2rem; display: block; margin-bottom: 0.5rem; }

.pagination {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 2px solid #f1f5f9;
  gap: 1rem;
}

.pagination-info { color: #64748b; font-size: 0.875rem; }

.pagination-controls { display: flex; gap: 0.25rem; }

.page-btn {
  min-width: 36px; height: 36px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
}
.page-btn:hover:not(:disabled) { border-color: #3b82f6; }
.page-btn.active {
  background: #3b82f6;
  border-color: #3b82f6;
  color: white;
}
.page-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.page-size-select {
  padding: 0.5rem;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  background: white;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 20px;
  padding: 2rem;
  text-align: center;
  max-width: 400px;
  width: 90%;
}

.modal-icon { font-size: 3rem; display: block; margin-bottom: 1rem; }
.modal-content h3 { margin-bottom: 0.5rem; color: #1e293b; }
.modal-content p { color: #64748b; margin-bottom: 1.5rem; }

.modal-actions { display: flex; gap: 1rem; }

.btn {
  flex: 1;
  padding: 0.75rem 1rem;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-secondary {
  background: #f1f5f9;
  border: 2px solid #e2e8f0;
  color: #475569;
}
.btn-danger {
  background: #dc2626;
  border: none;
  color: white;
}
.btn-danger:hover { background: #b91c1c; }

@media (max-width: 768px) {
  .table-page { padding: 1rem; }
  .filters { flex-direction: column; align-items: stretch; }
  .search-box { min-width: unset; }
  .filter-group { overflow-x: auto; }
}
</style>
