// ============================================
// 知行 KnowDo - 核心类型定义
// ============================================

// 用户
export interface User {
  name: string;
  department: string;
  position: string;
  avatar: string;
  role: 'admin' | 'reviewer' | 'employee';
  ssoId: string;
}

// 用户角色
export interface UserRole {
  name: string;
  permissions: string[];
}

// 分类节点
export interface CategoryNode {
  id: string;
  name: string;
  icon?: string;
  children?: CategoryNode[];
}

// 标签
export interface Tag {
  id: string;
  name: string;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red';
  group?: string;
  usageCount?: number;
}

// 知识版本
export interface KnowledgeVersion {
  id: string;
  versionNumber: string;
  content: string;
  contentSnapshot: string;
  modifiedBy: string;
  modifiedAt: string;
  changeNotes: string;
}

// 草稿项
export interface DraftItem {
  id: string;
  title: string;
  type: KnowledgeType;
  data: Partial<KnowledgeCreateForm> & { content?: string };
  updatedAt: string;
}

// 收藏夹
export interface FavoriteFolder {
  id: string;
  name: string;
  knowledgeIds: string[];
}

// 知识类型
export type KnowledgeType = 'doc' | 'link' | 'image' | 'video' | 'audio' | 'qa';

// 知识状态
export type KnowledgeStatus = 'draft' | 'pending_review' | 'published' | 'rejected' | 'archived';

// 附件
export interface Attachment {
  name: string;
  size: string;
}

// 评论
export interface Comment {
  id: string;
  author: string;
  authorDept: string;
  content: string;
  time: string;
  isAuthor: boolean;
  replyTo?: string;
}

// 知识条目
export interface Knowledge {
  id: string;
  title: string;
  type: KnowledgeType;
  typeLabel: string;
  content: string;
  summary: string;
  category: string;
  categoryId: string;
  tags: string[];
  author: string;
  authorDept: string;
  publishTime: string;
  updateTime: string;
  version: string;
  status: KnowledgeStatus;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  favoriteCount: number;
  isLiked: boolean;
  isFavorited: boolean;
  publishScope: string;
  validPeriod: string;
  attachments: Attachment[];
  comments: Comment[];
  versions?: KnowledgeVersion[];
  deletedAt?: string;
  folderId?: string;
}

// 模型状态
export type ModelStatus = 'online' | 'offline' | 'testing';

// 模型类型
export type ModelType = 'LLM' | 'Embedding' | 'Reranker';

// 模型测试结果
export interface ModelTestResult {
  success: boolean;
  latency: string;
  error?: string;
}

// 模型配置
export interface ModelConfig {
  id: string;
  name: string;
  provider: string;
  type: ModelType;
  apiUrl: string;
  modelName: string;
  maxTokens: number;
  concurrency: number;
  timeout: number;
  retry: number;
  status: ModelStatus;
  lastTest: string;
  testResult: ModelTestResult;
}

// 推荐知识
export interface RecommendedKnowledge {
  id: string;
  title: string;
  type: string;
  summary: string;
  viewCount: number;
  category: string;
}

// 通知
export interface Notification {
  id: string;
  type: 'publish' | 'review' | 'comment' | 'like' | 'expire' | 'system';
  read: boolean;
  icon: string;
  title: string;
  desc: string;
  time: string;
}

// 审核队列
export interface ReviewItem {
  id: string;
  title: string;
  author: string;
  authorDept: string;
  submitTime: string;
  category: string;
  status: string;
  aiScore: number;
  aiIssues: string[];
}

// 页面面包屑
export interface BreadcrumbItem {
  label: string;
  link?: string;
}

// Toast 类型
export type ToastType = 'success' | 'error' | 'warning' | 'info';

// 知识创建表单
export interface KnowledgeCreateForm {
  type: KnowledgeType;
  title: string;
  categoryId: string;
  tags: string[];
  content: string;
  summary: string;
  publishScope: string;
  validPeriod: string;
  attachments: File[];
}

// ============================================
// 知识库（Dataset）相关类型
// ============================================

// 知识库类型（仅通用型和 Web 站点）
export type DatasetType = 'general' | 'web';

// 知识库状态
export type DatasetStatus = 'pending' | 'processing' | 'completed' | 'failed';

// 文档分段策略模式
export type ChunkMode = 'smart' | 'advanced';

// 文档分段策略
export interface ChunkStrategy {
  mode: ChunkMode;
  maxCharsPerChunk?: number;
  separators?: string[];
  chunkSize?: number;
  overlap?: number;
  autoClean?: boolean;
  autoAddTitleAsQuestion?: boolean;
}

// 知识库文档支持的文件类型（不含 ZIP）
export type DatasetDocumentType = 'md' | 'txt' | 'pdf' | 'docx' | 'html' | 'xls' | 'xlsx' | 'csv';

// 知识库文档
export interface DatasetDocument {
  id: string;
  datasetId: string;
  name: string;
  size: string;
  type: DatasetDocumentType;
  status: DatasetStatus;
  chunks: DocumentChunk[];
  createdAt: string;
  error?: string;
}

// 文档分段
export interface DocumentChunk {
  id: string;
  index: number;
  content: string;
  length: number;
  question?: string;
}

// 知识库（一个知识库包含多个文档）
export interface Dataset {
  id: string;
  name: string;
  description: string;
  type: DatasetType;
  vectorModel: string;
  webUrl?: string;
  webSelector?: string;
  status: DatasetStatus;
  documents: DatasetDocument[];
  folderId: string;
  createdAt: string;
  updatedAt: string;
  chunkStrategy?: ChunkStrategy;
  documentCount?: number;
  charCount?: number;
}

// 向量模型
export interface VectorModel {
  id: string;
  name: string;
  provider: string;
  dimension: number;
  status: 'online' | 'offline';
}

// 知识库文件夹
export interface DatasetFolder {
  id: string;
  name: string;
  parentId: string | null;
  children?: DatasetFolder[];
}
