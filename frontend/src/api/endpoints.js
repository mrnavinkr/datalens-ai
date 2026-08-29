import client from './client'

// ---------- Auth ----------

export const registerUser = (payload) => client.post('/api/auth/register', payload)
export const loginUser = (payload) => client.post('/api/auth/login', payload)
export const fetchMe = () => client.get('/api/auth/me')

// ---------- Datasets ----------

export const uploadDataset = (file, onUploadProgress) => {
  const formData = new FormData()
  formData.append('file', file)
  return client.post('/api/datasets/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress,
  })
}

export const listDatasets = () => client.get('/api/datasets')
export const getDataset = (id) => client.get(`/api/datasets/${id}`)
export const renameDataset = (id, display_name) => client.put(`/api/datasets/${id}/rename`, { display_name })
export const deleteDataset = (id) => client.delete(`/api/datasets/${id}`)

// ---------- Analysis ----------

export const getOverview = (id) => client.get(`/api/analysis/${id}/overview`)
export const getHealth = (id) => client.get(`/api/analysis/${id}/health`)
export const getColumns = (id) => client.get(`/api/analysis/${id}/columns`)
export const getCorrelations = (id) => client.get(`/api/analysis/${id}/correlations`)
export const getOutliers = (id) => client.get(`/api/analysis/${id}/outliers`)

// ---------- Data Explorer ----------

export const getDatasetRows = (id, params) => client.get(`/api/datasets/${id}/rows`, { params })

// ---------- Visualization ----------

export const getAutoVisualizations = (id) => client.get(`/api/visualization/${id}`)
export const createStudioChart = (payload) => client.post('/api/visualization/create', payload)

// ---------- Chat ----------

export const sendChatMessage = (payload) => client.post('/api/chat', payload)
export const getChatHistory = (datasetId, sessionId) =>
  client.get(`/api/chat/${datasetId}`, { params: sessionId ? { session_id: sessionId } : {} })

// ---------- Reports ----------

export const generateReport = (datasetId, format) =>
  client.post('/api/reports/generate', { format }, { params: { dataset_id: datasetId } })
export const downloadReportUrl = (reportId) => `${client.defaults.baseURL}/api/reports/${reportId}/download`

// ---------- Admin ----------

export const getAdminStats = () => client.get('/api/admin/stats')
export const getAdminUsers = () => client.get('/api/admin/users')
export const toggleUserActive = (userId) => client.put(`/api/admin/users/${userId}/toggle-active`)
export const updateUserRole = (userId, role) => client.put(`/api/admin/users/${userId}/role`, { role })
export const getAdminDatasets = () => client.get('/api/admin/datasets')
export const adminDeleteDataset = (datasetId) => client.delete(`/api/admin/datasets/${datasetId}`)

// ---------- Profile ----------

export const updateProfile = (payload) => client.put('/api/auth/me', payload)

// ---------- Demo ----------

export const getDemoAnalysis = () => client.get('/api/demo/analysis')
