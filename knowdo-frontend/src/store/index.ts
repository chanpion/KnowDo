import { create } from 'zustand';
import type { Knowledge, Notification, ModelConfig, CategoryNode, Tag, ReviewItem, Comment, KnowledgeVersion, FavoriteFolder, Dataset, DatasetDocument, DatasetFolder, DatasetAuthorization, UploadRule, RelatedResource, QAChunkPair } from '@/types';
import { MOCK_USER, KNOWLEDGE_LIST, NOTIFICATIONS, CATEGORY_TREE, MODEL_LIST, TAG_LIBRARY, REVIEW_QUEUE, DATASETS, DATASET_FOLDERS, DATASET_AUTHORIZATIONS, RELATED_RESOURCES } from '@/mock/data';

interface AppState {
  // 用户
  user: typeof MOCK_USER;
  // 知识列表
  knowledgeList: Knowledge[];
  // 通知
  notifications: Notification[];
  unreadCount: number;
  // 分类树
  categoryTree: CategoryNode[];
  // 标签库
  tagLibrary: Tag[];
  // 模型
  modelList: Record<string, ModelConfig[]>;
  // 审核队列
  reviewQueue: ReviewItem[];
  // 收藏夹
  favoriteFolders: FavoriteFolder[];
  // 软删除知识
  deletedKnowledgeList: Knowledge[];
  // 侧边栏折叠
  sidebarCollapsed: boolean;
  // 当前页面
  activePage: string;

  // 原有 Actions
  toggleLike: (id: string) => void;
  toggleFavorite: (id: string) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  toggleSidebar: () => void;
  setActivePage: (page: string) => void;
  updateKnowledge: (id: string, data: Partial<Knowledge>) => void;
  addKnowledge: (knowledge: Knowledge) => void;
  deleteKnowledge: (id: string) => void;

  // 分类管理
  addCategory: (parentId: string | null, name: string) => string | null;
  updateCategory: (id: string, name: string) => void;
  deleteCategory: (id: string) => boolean;
  updateCategoryTree: (tree: CategoryNode[]) => void;

  // 标签管理
  addTag: (name: string, color: Tag['color'], group?: string) => void;
  updateTag: (id: string, data: Partial<Tag>) => void;
  deleteTag: (id: string) => void;

  // 审核流程
  submitForReview: (id: string) => void;
  approveKnowledge: (id: string) => void;
  rejectKnowledge: (id: string, reason: string) => void;
  returnForEdit: (id: string, feedback: string) => void;

  // 评论
  addComment: (knowledgeId: string, comment: Omit<Comment, 'id' | 'time'>) => void;
  deleteComment: (knowledgeId: string, commentId: string) => void;

  // 归档
  archiveKnowledge: (id: string) => void;
  unarchiveKnowledge: (id: string) => void;

  // 回收站
  softDeleteKnowledge: (id: string) => void;
  restoreFromRecycle: (id: string) => void;
  permanentlyDeleteKnowledge: (id: string) => void;

  // 版本管理
  rollbackVersion: (knowledgeId: string, versionId: string) => void;

  // 收藏夹管理
  addFavoriteFolder: (name: string) => void;
  renameFavoriteFolder: (id: string, name: string) => void;
  deleteFavoriteFolder: (id: string) => void;
  moveToFolder: (knowledgeId: string, folderId: string) => void;

  // 模型管理
  addModel: (model: Omit<ModelConfig, 'id' | 'status' | 'lastTest' | 'testResult'>) => void;
  updateModel: (id: string, data: Partial<ModelConfig>) => void;

  // 通知
  addNotification: (notification: Omit<Notification, 'id'>) => void;

  // ============================================
  // 知识库（Dataset）相关 State 和 Actions
  // ============================================
  datasets: Dataset[];
  datasetFolders: DatasetFolder[];
  currentDatasetId: string | null;
  datasetAuthorizations: DatasetAuthorization[];
  relatedResources: RelatedResource[];

  // 知识库内文章管理
  getArticlesByDataset: (datasetId: string) => Knowledge[];

  // 知识库 CRUD
  addDataset: (dataset: Omit<Dataset, 'id' | 'createdAt' | 'updatedAt' | 'status'> & { documents?: DatasetDocument[] }) => string;
  updateDataset: (id: string, data: Partial<Dataset>) => void;
  deleteDataset: (id: string) => void;

  // 知识库文档管理
  addDatasetDocuments: (datasetId: string, documents: Omit<DatasetDocument, 'id' | 'createdAt' | 'status'>[]) => void;
  updateDatasetDocument: (datasetId: string, docId: string, data: Partial<DatasetDocument>) => void;
  deleteDatasetDocument: (datasetId: string, docId: string) => void;

  // 知识库操作
  reEmbedDataset: (datasetId: string) => void;
  syncWebDataset: (datasetId: string, mode: 'replace' | 'full') => void;
  transferDataset: (datasetId: string, targetFolderId: string) => void;
  exportDatasetAsExcel: (datasetId: string) => void;
  exportFullDataset: (datasetId: string) => void;
  setCurrentDataset: (id: string | null) => void;

  // 文件夹管理（三级嵌套）
  addFolder: (name: string, parentId: string | null) => void;
  renameFolder: (id: string, name: string) => void;
  deleteFolder: (id: string) => void;
  moveFolder: (id: string, targetParentId: string | null) => void;

  // 资源授权
  authorizeDataset: (dataset: DatasetAuthorization) => void;
  revokeAuthorization: (id: string) => void;

  // 导入知识库
  importDataset: (data: Omit<Dataset, 'id' | 'createdAt' | 'updatedAt'>) => void;

  // 上传规则
  updateUploadRule: (datasetId: string, rule: UploadRule) => void;

  // QA 分段
  generateQAChunks: (datasetId: string, docId: string, pairs: QAChunkPair[]) => void;
}

// 生成简易ID
const genId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

// 递归查找分类节点
function findCategoryNode(nodes: CategoryNode[], id: string): CategoryNode | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findCategoryNode(node.children, id);
      if (found) return found;
    }
  }
  return null;
}

// 递归移除分类节点
function removeCategoryNode(nodes: CategoryNode[], id: string): CategoryNode[] {
  return nodes
    .filter(node => node.id !== id)
    .map(node => ({
      ...node,
      children: node.children ? removeCategoryNode(node.children, id) : undefined,
    }));
}

// 递归追加子节点
function addChildToNode(nodes: CategoryNode[], parentId: string, child: CategoryNode): CategoryNode[] {
  return nodes.map(node => {
    if (node.id === parentId) {
      return {
        ...node,
        children: [...(node.children || []), child],
      };
    }
    if (node.children) {
      return {
        ...node,
        children: addChildToNode(node.children, parentId, child),
      };
    }
    return node;
  });
}

// 检查分类是否有子节点或关联知识
function categoryHasDependencies(nodes: CategoryNode[], id: string, knowledgeList: Knowledge[]): boolean {
  const node = findCategoryNode(nodes, id);
  if (node?.children && node.children.length > 0) return true;
  return knowledgeList.some(k => k.categoryId === id || k.categoryId.startsWith(id + '-'));
}

export const useAppStore = create<AppState>((set, get) => ({
  user: MOCK_USER,
  knowledgeList: KNOWLEDGE_LIST,
  notifications: NOTIFICATIONS,
  unreadCount: NOTIFICATIONS.filter(n => !n.read).length,
  categoryTree: CATEGORY_TREE,
  tagLibrary: TAG_LIBRARY,
  modelList: MODEL_LIST,
  reviewQueue: REVIEW_QUEUE,
  favoriteFolders: [
    { id: 'fav-default', name: '默认收藏夹', knowledgeIds: [] },
  ],
  deletedKnowledgeList: [],
  sidebarCollapsed: false,
  activePage: 'home',

  // ============ 原有 Actions ============
  toggleLike: (id) => set((state) => ({
    knowledgeList: state.knowledgeList.map(k => {
      if (k.id === id) {
        return {
          ...k,
          isLiked: !k.isLiked,
          likeCount: k.likeCount + (k.isLiked ? -1 : 1),
        };
      }
      return k;
    }),
  })),

  toggleFavorite: (id) => set((state) => {
    const knowledge = state.knowledgeList.find(k => k.id === id);
    if (!knowledge) return state;
    const willBeFavorited = !knowledge.isFavorited;
    return {
      knowledgeList: state.knowledgeList.map(k => {
        if (k.id === id) {
          return {
            ...k,
            isFavorited: willBeFavorited,
            favoriteCount: k.favoriteCount + (willBeFavorited ? 1 : -1),
          };
        }
        return k;
      }),
      favoriteFolders: state.favoriteFolders.map(f => {
        if (f.id === 'fav-default') {
          if (willBeFavorited && !f.knowledgeIds.includes(id)) {
            return { ...f, knowledgeIds: [...f.knowledgeIds, id] };
          }
          if (!willBeFavorited) {
            return { ...f, knowledgeIds: f.knowledgeIds.filter(kid => kid !== id) };
          }
        }
        if (!willBeFavorited) {
          return { ...f, knowledgeIds: f.knowledgeIds.filter(kid => kid !== id) };
        }
        return f;
      }),
    };
  }),

  markNotificationRead: (id) => set((state) => {
    const newNotifications = state.notifications.map(n =>
      n.id === id ? { ...n, read: true } : n
    );
    return {
      notifications: newNotifications,
      unreadCount: newNotifications.filter(n => !n.read).length,
    };
  }),

  markAllNotificationsRead: () => set((state) => ({
    notifications: state.notifications.map(n => ({ ...n, read: true })),
    unreadCount: 0,
  })),

  toggleSidebar: () => set((state) => ({
    sidebarCollapsed: !state.sidebarCollapsed,
  })),

  setActivePage: (page) => set({ activePage: page }),

  updateKnowledge: (id, data) => set((state) => ({
    knowledgeList: state.knowledgeList.map(k =>
      k.id === id ? { ...k, ...data } : k
    ),
  })),

  addKnowledge: (knowledge) => set((state) => ({
    knowledgeList: [knowledge, ...state.knowledgeList],
  })),

  deleteKnowledge: (id) => set((state) => ({
    knowledgeList: state.knowledgeList.filter(k => k.id !== id),
  })),

  // ============ 分类管理 ============
  addCategory: (parentId, name) => {
    const newId = genId('cat');
    const newNode: CategoryNode = { id: newId, name };
    set((state) => {
      if (!parentId) {
        return { categoryTree: [...state.categoryTree, newNode] };
      }
      return { categoryTree: addChildToNode(state.categoryTree, parentId, newNode) };
    });
    return newId;
  },

  updateCategory: (id, name) => set((state) => {
    function updateName(nodes: CategoryNode[]): CategoryNode[] {
      return nodes.map(node => ({
        ...node,
        name: node.id === id ? name : node.name,
        children: node.children ? updateName(node.children) : undefined,
      }));
    }
    return { categoryTree: updateName(state.categoryTree) };
  }),

  deleteCategory: (id) => {
    let canDelete = true;
    set((state) => {
      canDelete = !categoryHasDependencies(state.categoryTree, id, state.knowledgeList);
      if (!canDelete) return state;
      return { categoryTree: removeCategoryNode(state.categoryTree, id) };
    });
    return canDelete;
  },

  updateCategoryTree: (tree) => set({ categoryTree: tree }),

  // ============ 标签管理 ============
  addTag: (name, color, group) => set((state) => ({
    tagLibrary: [...state.tagLibrary, {
      id: genId('tag'),
      name,
      color,
      group,
      usageCount: 0,
    }],
  })),

  updateTag: (id, data) => set((state) => ({
    tagLibrary: state.tagLibrary.map(t => t.id === id ? { ...t, ...data } : t),
  })),

  deleteTag: (id) => set((state) => ({
    tagLibrary: state.tagLibrary.filter(t => t.id !== id),
  })),

  // ============ 审核流程 ============
  submitForReview: (id) => set((state) => {
    const knowledge = state.knowledgeList.find(k => k.id === id);
    if (!knowledge) return state;
    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const reviewItem: ReviewItem = {
      id: genId('rq'),
      title: knowledge.title,
      author: knowledge.author,
      authorDept: knowledge.authorDept,
      submitTime: now,
      category: knowledge.category,
      status: 'pending',
      aiScore: 4.0,
      aiIssues: [],
    };
    return {
      knowledgeList: state.knowledgeList.map(k =>
        k.id === id ? { ...k, status: 'pending_review' as const } : k
      ),
      reviewQueue: [reviewItem, ...state.reviewQueue],
    };
  }),

  approveKnowledge: (id) => set((state) => {
    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
    return {
      knowledgeList: state.knowledgeList.map(k => {
        if (k.id === id) {
          const versions = k.versions || [];
          const newVersion: KnowledgeVersion = {
            id: genId('ver'),
            versionNumber: k.version,
            content: k.content,
            contentSnapshot: k.content.substring(0, 200),
            modifiedBy: k.author,
            modifiedAt: now,
            changeNotes: '审核通过，正式发布',
          };
          return {
            ...k,
            status: 'published' as const,
            publishTime: now,
            versions: [newVersion, ...versions],
          };
        }
        return k;
      }),
      reviewQueue: state.reviewQueue.filter(r => r.id !== id && r.title !== state.knowledgeList.find(k => k.id === id)?.title),
      notifications: [{
        id: genId('n'),
        type: 'publish' as const,
        read: false,
        icon: '📢',
        title: '知识发布通知',
        desc: `《${state.knowledgeList.find(k => k.id === id)?.title}》已通过审核并发布`,
        time: '刚刚',
      }, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    };
  }),

  rejectKnowledge: (id, reason) => set((state) => {
    const knowledge = state.knowledgeList.find(k => k.id === id);
    return {
      knowledgeList: state.knowledgeList.map(k =>
        k.id === id ? { ...k, status: 'rejected' as const } : k
      ),
      reviewQueue: state.reviewQueue.filter(r =>
        !(knowledge && r.title === knowledge.title)
      ),
      notifications: [{
        id: genId('n'),
        type: 'review' as const,
        read: false,
        icon: '❌',
        title: '审核驳回',
        desc: `《${knowledge?.title}》已被驳回，原因：${reason}`,
        time: '刚刚',
      }, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    };
  }),

  returnForEdit: (id, feedback) => set((state) => {
    const knowledge = state.knowledgeList.find(k => k.id === id);
    return {
      knowledgeList: state.knowledgeList.map(k =>
        k.id === id ? { ...k, status: 'draft' as const } : k
      ),
      reviewQueue: state.reviewQueue.filter(r =>
        !(knowledge && r.title === knowledge.title)
      ),
      notifications: [{
        id: genId('n'),
        type: 'review' as const,
        read: false,
        icon: '📝',
        title: '退回修改',
        desc: `《${knowledge?.title}》已退回修改：${feedback}`,
        time: '刚刚',
      }, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    };
  }),

  // ============ 评论 ============
  addComment: (knowledgeId, comment) => set((state) => ({
    knowledgeList: state.knowledgeList.map(k => {
      if (k.id === knowledgeId) {
        const newComment: Comment = {
          ...comment,
          id: genId('cmt'),
          time: '刚刚',
        };
        return {
          ...k,
          comments: [...k.comments, newComment],
          commentCount: k.commentCount + 1,
        };
      }
      return k;
    }),
  })),

  deleteComment: (knowledgeId, commentId) => set((state) => ({
    knowledgeList: state.knowledgeList.map(k => {
      if (k.id === knowledgeId) {
        return {
          ...k,
          comments: k.comments.filter(c => c.id !== commentId),
          commentCount: Math.max(0, k.commentCount - 1),
        };
      }
      return k;
    }),
  })),

  // ============ 归档 ============
  archiveKnowledge: (id) => set((state) => ({
    knowledgeList: state.knowledgeList.map(k =>
      k.id === id ? { ...k, status: 'archived' as const } : k
    ),
  })),

  unarchiveKnowledge: (id) => set((state) => ({
    knowledgeList: state.knowledgeList.map(k =>
      k.id === id ? { ...k, status: 'published' as const } : k
    ),
  })),

  // ============ 回收站 ============
  softDeleteKnowledge: (id) => set((state) => {
    const item = state.knowledgeList.find(k => k.id === id);
    if (!item) return state;
    const deletedItem = {
      ...item,
      deletedAt: new Date().toISOString(),
    };
    return {
      knowledgeList: state.knowledgeList.filter(k => k.id !== id),
      deletedKnowledgeList: [deletedItem, ...state.deletedKnowledgeList],
    };
  }),

  restoreFromRecycle: (id) => set((state) => {
    const item = state.deletedKnowledgeList.find(k => k.id === id);
    if (!item) return state;
    const { deletedAt, ...restored } = item;
    return {
      knowledgeList: [restored as Knowledge, ...state.knowledgeList],
      deletedKnowledgeList: state.deletedKnowledgeList.filter(k => k.id !== id),
    };
  }),

  permanentlyDeleteKnowledge: (id) => set((state) => ({
    deletedKnowledgeList: state.deletedKnowledgeList.filter(k => k.id !== id),
  })),

  // ============ 版本管理 ============
  rollbackVersion: (knowledgeId, versionId) => set((state) => ({
    knowledgeList: state.knowledgeList.map(k => {
      if (k.id !== knowledgeId) return k;
      const targetVersion = (k.versions || []).find(v => v.id === versionId);
      if (!targetVersion) return k;
      const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
      const currentVersions = k.versions || [];
      const newVersionNum = `V${(currentVersions.length + 1).toFixed(1)}`;
      const rollbackVersion: KnowledgeVersion = {
        id: genId('ver'),
        versionNumber: newVersionNum,
        content: targetVersion.content,
        contentSnapshot: targetVersion.content.substring(0, 200),
        modifiedBy: MOCK_USER.name,
        modifiedAt: now,
        changeNotes: `回滚至 ${targetVersion.versionNumber}`,
      };
      return {
        ...k,
        content: targetVersion.content,
        version: newVersionNum,
        versions: [rollbackVersion, ...currentVersions],
      };
    }),
  })),

  // ============ 收藏夹管理 ============
  addFavoriteFolder: (name) => set((state) => ({
    favoriteFolders: [...state.favoriteFolders, {
      id: genId('fav'),
      name,
      knowledgeIds: [],
    }],
  })),

  renameFavoriteFolder: (id, name) => set((state) => ({
    favoriteFolders: state.favoriteFolders.map(f =>
      f.id === id ? { ...f, name } : f
    ),
  })),

  deleteFavoriteFolder: (id) => set((state) => ({
    favoriteFolders: state.favoriteFolders.filter(f => f.id !== id || f.id === 'fav-default'),
  })),

  moveToFolder: (knowledgeId, folderId) => set((state) => ({
    favoriteFolders: state.favoriteFolders.map(f => {
      if (f.id === folderId) {
        return {
          ...f,
          knowledgeIds: f.knowledgeIds.includes(knowledgeId)
            ? f.knowledgeIds
            : [...f.knowledgeIds, knowledgeId],
        };
      }
      // 从其他收藏夹中移除
      return {
        ...f,
        knowledgeIds: f.knowledgeIds.filter(id => id !== knowledgeId),
      };
    }),
  })),

  // ============ 模型管理 ============
  addModel: (model) => set((state) => {
    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const newModel: ModelConfig = {
      ...model,
      id: genId('model'),
      status: 'offline',
      lastTest: now,
      testResult: { success: false, latency: '-', error: '未测试' },
    };
    const typeKey = model.type.toLowerCase();
    return {
      modelList: {
        ...state.modelList,
        [typeKey]: [...(state.modelList[typeKey] || []), newModel],
      },
    };
  }),

  updateModel: (id, data) => set((state) => {
    const newModelList: Record<string, ModelConfig[]> = {};
    for (const key of Object.keys(state.modelList)) {
      newModelList[key] = state.modelList[key].map(m =>
        m.id === id ? { ...m, ...data } : m
      );
    }
    return { modelList: newModelList };
  }),

  // ============ 通知 ============
  addNotification: (notification) => set((state) => ({
    notifications: [{ ...notification, id: genId('n') }, ...state.notifications],
    unreadCount: state.unreadCount + 1,
  })),

  // ============================================
  // 知识库（Dataset）相关实现
  // ============================================
  datasets: DATASETS,
  datasetFolders: DATASET_FOLDERS,
  currentDatasetId: null,
  datasetAuthorizations: DATASET_AUTHORIZATIONS,
  relatedResources: RELATED_RESOURCES,

  // 获取知识库下的文章列表
  getArticlesByDataset: (datasetId: string): Knowledge[] => {
    return get().knowledgeList.filter((k: Knowledge) => k.datasetId === datasetId);
  },

  // 新增知识库
  addDataset: (dataset) => {
    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const newId = genId('ds');
    const newDataset: Dataset = {
      ...dataset,
      id: newId,
      documents: dataset.documents || [],
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    };
    set((state) => ({ datasets: [newDataset, ...state.datasets] }));
    return newId;
  },

  // 更新知识库
  updateDataset: (id, data) => set((state) => ({
    datasets: state.datasets.map(ds =>
      ds.id === id ? { ...ds, ...data, updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16) } : ds
    ),
  })),

  // 删除知识库
  deleteDataset: (id) => set((state) => ({
    datasets: state.datasets.filter(ds => ds.id !== id),
  })),

  // 添加文档到知识库（支持多文件）
  addDatasetDocuments: (datasetId, documents) => set((state) => ({
    datasets: state.datasets.map(ds => {
      if (ds.id !== datasetId) return ds;
      const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
      const newDocs: DatasetDocument[] = documents.map((doc, idx) => ({
        ...doc,
        id: genId('doc'),
        datasetId,
        status: 'pending' as const,
        createdAt: now,
        chunks: [],
      }));
      return {
        ...ds,
        documents: [...ds.documents, ...newDocs],
        status: 'processing' as const,
        updatedAt: now,
      };
    }),
  })),

  // 更新文档
  updateDatasetDocument: (datasetId, docId, data) => set((state) => ({
    datasets: state.datasets.map(ds => {
      if (ds.id !== datasetId) return ds;
      return {
        ...ds,
        documents: ds.documents.map(doc =>
          doc.id === docId ? { ...doc, ...data } : doc
        ),
      };
    }),
  })),

  // 删除文档
  deleteDatasetDocument: (datasetId, docId) => set((state) => ({
    datasets: state.datasets.map(ds => {
      if (ds.id !== datasetId) return ds;
      return {
        ...ds,
        documents: ds.documents.filter(doc => doc.id !== docId),
        updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      };
    }),
  })),

  // 重新向量化
  reEmbedDataset: (datasetId) => set((state) => ({
    datasets: state.datasets.map(ds => {
      if (ds.id !== datasetId) return ds;
      return {
        ...ds,
        status: 'processing' as const,
        updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      };
    }),
  })),

  // 同步 Web 知识库
  syncWebDataset: (datasetId, mode) => set((state) => ({
    datasets: state.datasets.map(ds => {
      if (ds.id !== datasetId) return ds;
      return {
        ...ds,
        status: 'processing' as const,
        updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      };
    }),
  })),

  // 转移知识库
  transferDataset: (datasetId, targetFolderId) => set((state) => ({
    datasets: state.datasets.map(ds =>
      ds.id === datasetId ? { ...ds, folderId: targetFolderId, updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16) } : ds
    ),
  })),

  // 导出为 Excel（模拟）
  exportDatasetAsExcel: (datasetId) => {
    const ds = DATASETS.find(d => d.id === datasetId);
    if (ds) {
      alert(`正在导出知识库「${ds.name}」的分段内容为 Excel...（模拟下载）`);
    }
  },

  // 导出知识库（模拟）
  exportFullDataset: (datasetId) => {
    const ds = DATASETS.find(d => d.id === datasetId);
    if (ds) {
      alert(`正在导出知识库「${ds.name}」的完整数据包...（模拟下载）`);
    }
  },

  // 设置当前知识库
  setCurrentDataset: (id) => set({ currentDatasetId: id }),

  // ============ 文件夹管理（三级嵌套） ============
  addFolder: (name, parentId) => set((state) => {
    const newFolder: DatasetFolder = { id: genId('ds-folder'), name, parentId, children: [], datasetCount: 0 };
    if (!parentId) {
      return { datasetFolders: [...state.datasetFolders, newFolder] };
    }
    function addChild(folders: DatasetFolder[]): DatasetFolder[] {
      return folders.map(f => {
        if (f.id === parentId) {
          return { ...f, children: [...(f.children || []), newFolder] };
        }
        if (f.children) return { ...f, children: addChild(f.children) };
        return f;
      });
    }
    return { datasetFolders: addChild(state.datasetFolders) };
  }),

  renameFolder: (id, name) => set((state) => {
    function rename(folders: DatasetFolder[]): DatasetFolder[] {
      return folders.map(f => {
        if (f.id === id) return { ...f, name };
        if (f.children) return { ...f, children: rename(f.children) };
        return f;
      });
    }
    return { datasetFolders: rename(state.datasetFolders) };
  }),

  deleteFolder: (id) => set((state) => {
    function remove(folders: DatasetFolder[]): DatasetFolder[] {
      return folders.filter(f => f.id !== id).map(f => {
        if (f.children) return { ...f, children: remove(f.children) };
        return f;
      });
    }
    return { datasetFolders: remove(state.datasetFolders) };
  }),

  moveFolder: (id, targetParentId) => set((state) => {
    let moved: DatasetFolder | null = null;
    function extract(folders: DatasetFolder[]): DatasetFolder[] {
      const result: DatasetFolder[] = [];
      for (const f of folders) {
        if (f.id === id) {
          moved = { ...f, parentId: targetParentId };
        } else {
          result.push(f.children ? { ...f, children: extract(f.children) } : f);
        }
      }
      return result;
    }
    function insert(folders: DatasetFolder[]): DatasetFolder[] {
      if (!moved) return folders;
      return folders.map(f => {
        if (f.id === targetParentId) {
          return { ...f, children: [...(f.children || []), moved!] };
        }
        if (f.children) return { ...f, children: insert(f.children) };
        return f;
      });
    }
    const afterExtract = extract(state.datasetFolders);
    if (!moved) return { datasetFolders: afterExtract };
    if (targetParentId === null) {
      return { datasetFolders: [...afterExtract, moved] };
    }
    return { datasetFolders: insert(afterExtract) };
  }),

  // ============ 资源授权 ============
  authorizeDataset: (authorization) => set((state) => ({
    datasetAuthorizations: [...state.datasetAuthorizations, { ...authorization, id: genId('auth'), authorizedAt: new Date().toISOString().replace('T', ' ').substring(0, 16) }],
  })),

  revokeAuthorization: (id) => set((state) => ({
    datasetAuthorizations: state.datasetAuthorizations.filter(a => a.id !== id),
  })),

  // ============ 导入知识库 ============
  importDataset: (data) => set((state) => {
    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
    return {
      datasets: [{ ...data, id: genId('ds'), createdAt: now, updatedAt: now, status: 'pending' as const }, ...state.datasets],
    };
  }),

  // ============ 上传规则 ============
  updateUploadRule: (datasetId, rule) => set((state) => ({
    datasets: state.datasets.map(ds =>
      ds.id === datasetId ? { ...ds, uploadRule: rule, updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16) } : ds
    ),
  })),

  // ============ QA 分段生成 ============
  generateQAChunks: (datasetId, docId, pairs) => set((state) => ({
    datasets: state.datasets.map(ds => {
      if (ds.id !== datasetId) return ds;
      return {
        ...ds,
        documents: ds.documents.map(doc => {
          if (doc.id !== docId) return doc;
          const newChunks = pairs.map((pair, idx) => ({
            id: genId('chk'),
            index: (doc.chunks.length || 0) + idx + 1,
            content: `Q: ${pair.question}\nA: ${pair.answer}`,
            length: pair.question.length + pair.answer.length,
            question: pair.question,
            answer: pair.answer,
          }));
          return { ...doc, chunks: [...doc.chunks, ...newChunks], status: 'completed' as const };
        }),
        status: 'completed' as const,
        updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      };
    }),
  })),
}));
