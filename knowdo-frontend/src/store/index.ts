export { useUIStore as useAppStore } from './ui-store';

// 旧版 Store（mock 数据驱动），页面迁移期间保留
// 迁移完成后将被完全移除
import { create } from 'zustand';
import type { Article, ArticleVersion, Notification, ModelConfig, CategoryNode, Tag, ReviewItem, Comment, FavoriteFolder, KnowledgeBase, KnowledgeDocument, KnowledgeFolder, KnowledgeAuthorization, UploadRule, RelatedResource, QAChunkPair } from '@/types';
import { MOCK_USER, ARTICLE_LIST, NOTIFICATIONS, CATEGORY_TREE, MODEL_LIST, TAG_LIBRARY, REVIEW_QUEUE, KNOWLEDGE_BASES, KNOWLEDGE_FOLDERS, KNOWLEDGE_AUTHORIZATIONS, RELATED_RESOURCES } from '@/mock/data';

interface AppState {
  // 用户
  user: typeof MOCK_USER;
  // 文章列表
  articles: Article[];
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
  // 软删除文章
  deletedArticles: Article[];
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
  updateArticle: (id: string, data: Partial<Article>) => void;
  addArticle: (article: Article) => void;
  deleteArticle: (id: string) => void;

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
  approveArticle: (id: string) => void;
  rejectArticle: (id: string, reason: string) => void;
  returnForEdit: (id: string, feedback: string) => void;

  // 评论
  addComment: (articleId: string, comment: Omit<Comment, 'id' | 'time'>) => void;
  deleteComment: (articleId: string, commentId: string) => void;

  // 归档
  archiveArticle: (id: string) => void;
  unarchiveArticle: (id: string) => void;

  // 回收站
  softDeleteArticle: (id: string) => void;
  restoreFromRecycle: (id: string) => void;
  permanentlyDeleteArticle: (id: string) => void;

  // 版本管理
  rollbackVersion: (articleId: string, versionId: string) => void;

  // 收藏夹管理
  addFavoriteFolder: (name: string) => void;
  renameFavoriteFolder: (id: string, name: string) => void;
  deleteFavoriteFolder: (id: string) => void;
  moveToFolder: (articleId: string, folderId: string) => void;

  // 模型管理
  addModel: (model: Omit<ModelConfig, 'id' | 'status' | 'lastTest' | 'testResult'>) => void;
  updateModel: (id: string, data: Partial<ModelConfig>) => void;

  // 通知
  addNotification: (notification: Omit<Notification, 'id'>) => void;

  // ============================================
  // 知识库（KnowledgeBase）相关 State 和 Actions
  // ============================================
  knowledgeBases: KnowledgeBase[];
  knowledgeFolders: KnowledgeFolder[];
  currentKnowledgeBaseId: string | null;
  knowledgeAuthorizations: KnowledgeAuthorization[];
  relatedResources: RelatedResource[];

  // 知识库内文章管理
  getArticlesByKnowledgeBase: (knowledgeBaseId: string) => Article[];

  // 知识库 CRUD
  addKnowledgeBase: (knowledgeBase: Omit<KnowledgeBase, 'id' | 'createdAt' | 'updatedAt' | 'status'> & { documents?: KnowledgeDocument[] }) => string;
  updateKnowledgeBase: (id: string, data: Partial<KnowledgeBase>) => void;
  deleteKnowledgeBase: (id: string) => void;

  // 知识库文档管理
  addKnowledgeDocuments: (knowledgeBaseId: string, documents: Omit<KnowledgeDocument, 'id' | 'createdAt' | 'status'>[]) => void;
  updateKnowledgeDocument: (knowledgeBaseId: string, docId: string, data: Partial<KnowledgeDocument>) => void;
  deleteKnowledgeDocument: (knowledgeBaseId: string, docId: string) => void;

  // 知识库操作
  reEmbedKnowledgeBase: (knowledgeBaseId: string) => void;
  syncWebKnowledgeBase: (knowledgeBaseId: string, mode: 'replace' | 'full') => void;
  transferKnowledgeBase: (knowledgeBaseId: string, targetFolderId: string) => void;
  exportKnowledgeBaseAsExcel: (knowledgeBaseId: string) => void;
  exportFullKnowledgeBase: (knowledgeBaseId: string) => void;
  setCurrentKnowledgeBase: (id: string | null) => void;

  // 文件夹管理（三级嵌套）
  addFolder: (name: string, parentId: string | null) => void;
  renameFolder: (id: string, name: string) => void;
  deleteFolder: (id: string) => void;
  moveFolder: (id: string, targetParentId: string | null) => void;

  // 资源授权
  authorizeKnowledgeBase: (authorization: KnowledgeAuthorization) => void;
  revokeAuthorization: (id: string) => void;

  // 导入知识库
  importKnowledgeBase: (data: Omit<KnowledgeBase, 'id' | 'createdAt' | 'updatedAt'>) => void;

  // 上传规则
  updateUploadRule: (knowledgeBaseId: string, rule: UploadRule) => void;

  // QA 分段
  generateQAChunks: (knowledgeBaseId: string, docId: string, pairs: QAChunkPair[]) => void;
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

// 检查分类是否有子节点或关联文章
function categoryHasDependencies(nodes: CategoryNode[], id: string, articles: Article[]): boolean {
  const node = findCategoryNode(nodes, id);
  if (node?.children && node.children.length > 0) return true;
  return articles.some(k => k.categoryId === id || k.categoryId.startsWith(id + '-'));
}

export const useAppStoreLegacy = create<AppState>((set, get) => ({
  user: MOCK_USER,
  articles: ARTICLE_LIST,
  notifications: NOTIFICATIONS,
  unreadCount: NOTIFICATIONS.filter(n => !n.read).length,
  categoryTree: CATEGORY_TREE,
  tagLibrary: TAG_LIBRARY,
  modelList: MODEL_LIST,
  reviewQueue: REVIEW_QUEUE,
  favoriteFolders: [
    { id: 'fav-default', name: '默认收藏夹', articleIds: [] },
  ],
  deletedArticles: [],
  sidebarCollapsed: false,
  activePage: 'home',

  // ============ 原有 Actions ============
  toggleLike: (id) => set((state) => ({
    articles: state.articles.map(k => {
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
    const article = state.articles.find(k => k.id === id);
    if (!article) return state;
    const willBeFavorited = !article.isFavorited;
    return {
      articles: state.articles.map(k => {
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
          if (willBeFavorited && !f.articleIds.includes(id)) {
            return { ...f, articleIds: [...f.articleIds, id] };
          }
          if (!willBeFavorited) {
            return { ...f, articleIds: f.articleIds.filter(aid => aid !== id) };
          }
        }
        if (!willBeFavorited) {
          return { ...f, articleIds: f.articleIds.filter(aid => aid !== id) };
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

  updateArticle: (id, data) => set((state) => ({
    articles: state.articles.map(k =>
      k.id === id ? { ...k, ...data } : k
    ),
  })),

  addArticle: (article) => set((state) => ({
    articles: [article, ...state.articles],
  })),

  deleteArticle: (id) => set((state) => ({
    articles: state.articles.filter(k => k.id !== id),
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
      canDelete = !categoryHasDependencies(state.categoryTree, id, state.articles);
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
    const article = state.articles.find(k => k.id === id);
    if (!article) return state;
    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const reviewItem: ReviewItem = {
      id: genId('rq'),
      title: article.title,
      author: article.author,
      authorDept: article.authorDept,
      submitTime: now,
      category: article.category,
      status: 'pending',
      aiScore: 4.0,
      aiIssues: [],
    };
    return {
      articles: state.articles.map(k =>
        k.id === id ? { ...k, status: 'pending_review' as const } : k
      ),
      reviewQueue: [reviewItem, ...state.reviewQueue],
    };
  }),

  approveArticle: (id) => set((state) => {
    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
    return {
      articles: state.articles.map(k => {
        if (k.id === id) {
          const versions = k.versions || [];
          const newVersion: ArticleVersion = {
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
      reviewQueue: state.reviewQueue.filter(r => r.id !== id && r.title !== state.articles.find(k => k.id === id)?.title),
      notifications: [{
        id: genId('n'),
        type: 'publish' as const,
        read: false,
        icon: '📢',
        title: '文章发布通知',
        desc: `《${state.articles.find(k => k.id === id)?.title}》已通过审核并发布`,
        time: '刚刚',
      }, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    };
  }),

  rejectArticle: (id, reason) => set((state) => {
    const article = state.articles.find(k => k.id === id);
    return {
      articles: state.articles.map(k =>
        k.id === id ? { ...k, status: 'rejected' as const } : k
      ),
      reviewQueue: state.reviewQueue.filter(r =>
        !(article && r.title === article.title)
      ),
      notifications: [{
        id: genId('n'),
        type: 'review' as const,
        read: false,
        icon: '❌',
        title: '审核驳回',
        desc: `《${article?.title}》已被驳回，原因：${reason}`,
        time: '刚刚',
      }, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    };
  }),

  returnForEdit: (id, feedback) => set((state) => {
    const article = state.articles.find(k => k.id === id);
    return {
      articles: state.articles.map(k =>
        k.id === id ? { ...k, status: 'draft' as const } : k
      ),
      reviewQueue: state.reviewQueue.filter(r =>
        !(article && r.title === article.title)
      ),
      notifications: [{
        id: genId('n'),
        type: 'review' as const,
        read: false,
        icon: '📝',
        title: '退回修改',
        desc: `《${article?.title}》已退回修改：${feedback}`,
        time: '刚刚',
      }, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    };
  }),

  // ============ 评论 ============
  addComment: (articleId, comment) => set((state) => ({
    articles: state.articles.map(k => {
      if (k.id === articleId) {
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

  deleteComment: (articleId, commentId) => set((state) => ({
    articles: state.articles.map(k => {
      if (k.id === articleId) {
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
  archiveArticle: (id) => set((state) => ({
    articles: state.articles.map(k =>
      k.id === id ? { ...k, status: 'archived' as const } : k
    ),
  })),

  unarchiveArticle: (id) => set((state) => ({
    articles: state.articles.map(k =>
      k.id === id ? { ...k, status: 'published' as const } : k
    ),
  })),

  // ============ 回收站 ============
  softDeleteArticle: (id) => set((state) => {
    const item = state.articles.find(k => k.id === id);
    if (!item) return state;
    const deletedItem = {
      ...item,
      deletedAt: new Date().toISOString(),
    };
    return {
      articles: state.articles.filter(k => k.id !== id),
      deletedArticles: [deletedItem, ...state.deletedArticles],
    };
  }),

  restoreFromRecycle: (id) => set((state) => {
    const item = state.deletedArticles.find(k => k.id === id);
    if (!item) return state;
    const { deletedAt, ...restored } = item;
    return {
      articles: [restored as Article, ...state.articles],
      deletedArticles: state.deletedArticles.filter(k => k.id !== id),
    };
  }),

  permanentlyDeleteArticle: (id) => set((state) => ({
    deletedArticles: state.deletedArticles.filter(k => k.id !== id),
  })),

  // ============ 版本管理 ============
  rollbackVersion: (articleId, versionId) => set((state) => ({
    articles: state.articles.map(k => {
      if (k.id !== articleId) return k;
      const targetVersion = (k.versions || []).find(v => v.id === versionId);
      if (!targetVersion) return k;
      const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
      const currentVersions = k.versions || [];
      const newVersionNum = `V${(currentVersions.length + 1).toFixed(1)}`;
      const rollbackVersionEntry: ArticleVersion = {
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
        versions: [rollbackVersionEntry, ...currentVersions],
      };
    }),
  })),

  // ============ 收藏夹管理 ============
  addFavoriteFolder: (name) => set((state) => ({
    favoriteFolders: [...state.favoriteFolders, {
      id: genId('fav'),
      name,
      articleIds: [],
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

  moveToFolder: (articleId, folderId) => set((state) => ({
    favoriteFolders: state.favoriteFolders.map(f => {
      if (f.id === folderId) {
        return {
          ...f,
          articleIds: f.articleIds.includes(articleId)
            ? f.articleIds
            : [...f.articleIds, articleId],
        };
      }
      return {
        ...f,
        articleIds: f.articleIds.filter(id => id !== articleId),
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
  // 知识库（KnowledgeBase）相关实现
  // ============================================
  knowledgeBases: KNOWLEDGE_BASES,
  knowledgeFolders: KNOWLEDGE_FOLDERS,
  currentKnowledgeBaseId: null,
  knowledgeAuthorizations: KNOWLEDGE_AUTHORIZATIONS,
  relatedResources: RELATED_RESOURCES,

  // 获取知识库下的文章列表
  getArticlesByKnowledgeBase: (knowledgeBaseId: string): Article[] => {
    return get().articles.filter((k: Article) => k.knowledgeBaseId === knowledgeBaseId);
  },

  // 新增知识库
  addKnowledgeBase: (knowledgeBase) => {
    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const newId = genId('ds');
    const newKnowledgeBase: KnowledgeBase = {
      ...knowledgeBase,
      id: newId,
      documents: knowledgeBase.documents || [],
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    };
    set((state) => ({ knowledgeBases: [newKnowledgeBase, ...state.knowledgeBases] }));
    return newId;
  },

  // 更新知识库
  updateKnowledgeBase: (id, data) => set((state) => ({
    knowledgeBases: state.knowledgeBases.map(kb =>
      kb.id === id ? { ...kb, ...data, updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16) } : kb
    ),
  })),

  // 删除知识库
  deleteKnowledgeBase: (id) => set((state) => ({
    knowledgeBases: state.knowledgeBases.filter(kb => kb.id !== id),
  })),

  // 添加文档到知识库（支持多文件）
  addKnowledgeDocuments: (knowledgeBaseId, documents) => set((state) => ({
    knowledgeBases: state.knowledgeBases.map(kb => {
      if (kb.id !== knowledgeBaseId) return kb;
      const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
      const newDocs: KnowledgeDocument[] = documents.map((doc) => ({
        ...doc,
        id: genId('doc'),
        knowledgeBaseId,
        status: 'pending' as const,
        createdAt: now,
        chunks: [],
      }));
      return {
        ...kb,
        documents: [...kb.documents, ...newDocs],
        status: 'processing' as const,
        updatedAt: now,
      };
    }),
  })),

  // 更新文档
  updateKnowledgeDocument: (knowledgeBaseId, docId, data) => set((state) => ({
    knowledgeBases: state.knowledgeBases.map(kb => {
      if (kb.id !== knowledgeBaseId) return kb;
      return {
        ...kb,
        documents: kb.documents.map(doc =>
          doc.id === docId ? { ...doc, ...data } : doc
        ),
      };
    }),
  })),

  // 删除文档
  deleteKnowledgeDocument: (knowledgeBaseId, docId) => set((state) => ({
    knowledgeBases: state.knowledgeBases.map(kb => {
      if (kb.id !== knowledgeBaseId) return kb;
      return {
        ...kb,
        documents: kb.documents.filter(doc => doc.id !== docId),
        updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      };
    }),
  })),

  // 重新向量化
  reEmbedKnowledgeBase: (knowledgeBaseId) => set((state) => ({
    knowledgeBases: state.knowledgeBases.map(kb => {
      if (kb.id !== knowledgeBaseId) return kb;
      return {
        ...kb,
        status: 'processing' as const,
        updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      };
    }),
  })),

  // 同步 Web 知识库
  syncWebKnowledgeBase: (knowledgeBaseId, _mode) => set((state) => ({
    knowledgeBases: state.knowledgeBases.map(kb => {
      if (kb.id !== knowledgeBaseId) return kb;
      return {
        ...kb,
        status: 'processing' as const,
        updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      };
    }),
  })),

  // 转移知识库
  transferKnowledgeBase: (knowledgeBaseId, targetFolderId) => set((state) => ({
    knowledgeBases: state.knowledgeBases.map(kb =>
      kb.id === knowledgeBaseId ? { ...kb, folderId: targetFolderId, updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16) } : kb
    ),
  })),

  // 导出为 Excel（模拟）
  exportKnowledgeBaseAsExcel: (knowledgeBaseId) => {
    const kb = get().knowledgeBases.find(d => d.id === knowledgeBaseId);
    if (kb) {
      alert(`正在导出知识库「${kb.name}」的分段内容为 Excel...（模拟下载）`);
    }
  },

  // 导出知识库（模拟）
  exportFullKnowledgeBase: (knowledgeBaseId) => {
    const kb = get().knowledgeBases.find(d => d.id === knowledgeBaseId);
    if (kb) {
      alert(`正在导出知识库「${kb.name}」的完整数据包...（模拟下载）`);
    }
  },

  // 设置当前知识库
  setCurrentKnowledgeBase: (id) => set({ currentKnowledgeBaseId: id }),

  // ============ 文件夹管理（三级嵌套） ============
  addFolder: (name, parentId) => set((state) => {
    const newFolder: KnowledgeFolder = { id: genId('ds-folder'), name, parentId, children: [], knowledgeBaseCount: 0 };
    if (!parentId) {
      return { knowledgeFolders: [...state.knowledgeFolders, newFolder] };
    }
    function addChild(folders: KnowledgeFolder[]): KnowledgeFolder[] {
      return folders.map(f => {
        if (f.id === parentId) {
          return { ...f, children: [...(f.children || []), newFolder] };
        }
        if (f.children) return { ...f, children: addChild(f.children) };
        return f;
      });
    }
    return { knowledgeFolders: addChild(state.knowledgeFolders) };
  }),

  renameFolder: (id, name) => set((state) => {
    function rename(folders: KnowledgeFolder[]): KnowledgeFolder[] {
      return folders.map(f => {
        if (f.id === id) return { ...f, name };
        if (f.children) return { ...f, children: rename(f.children) };
        return f;
      });
    }
    return { knowledgeFolders: rename(state.knowledgeFolders) };
  }),

  deleteFolder: (id) => set((state) => {
    function remove(folders: KnowledgeFolder[]): KnowledgeFolder[] {
      return folders.filter(f => f.id !== id).map(f => {
        if (f.children) return { ...f, children: remove(f.children) };
        return f;
      });
    }
    return { knowledgeFolders: remove(state.knowledgeFolders) };
  }),

  moveFolder: (id, targetParentId) => set((state) => {
    let moved: KnowledgeFolder | null = null;
    function extract(folders: KnowledgeFolder[]): KnowledgeFolder[] {
      const result: KnowledgeFolder[] = [];
      for (const f of folders) {
        if (f.id === id) {
          moved = { ...f, parentId: targetParentId };
        } else {
          result.push(f.children ? { ...f, children: extract(f.children) } : f);
        }
      }
      return result;
    }
    function insert(folders: KnowledgeFolder[]): KnowledgeFolder[] {
      if (!moved) return folders;
      return folders.map(f => {
        if (f.id === targetParentId) {
          return { ...f, children: [...(f.children || []), moved!] };
        }
        if (f.children) return { ...f, children: insert(f.children) };
        return f;
      });
    }
    const afterExtract = extract(state.knowledgeFolders);
    if (!moved) return { knowledgeFolders: afterExtract };
    if (targetParentId === null) {
      return { knowledgeFolders: [...afterExtract, moved] };
    }
    return { knowledgeFolders: insert(afterExtract) };
  }),

  // ============ 资源授权 ============
  authorizeKnowledgeBase: (authorization) => set((state) => ({
    knowledgeAuthorizations: [...state.knowledgeAuthorizations, { ...authorization, id: genId('auth'), authorizedAt: new Date().toISOString().replace('T', ' ').substring(0, 16) }],
  })),

  revokeAuthorization: (id) => set((state) => ({
    knowledgeAuthorizations: state.knowledgeAuthorizations.filter(a => a.id !== id),
  })),

  // ============ 导入知识库 ============
  importKnowledgeBase: (data) => set((state) => {
    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
    return {
      knowledgeBases: [{ ...data, id: genId('ds'), createdAt: now, updatedAt: now, status: 'pending' as const }, ...state.knowledgeBases],
    };
  }),

  // ============ 上传规则 ============
  updateUploadRule: (knowledgeBaseId, rule) => set((state) => ({
    knowledgeBases: state.knowledgeBases.map(kb =>
      kb.id === knowledgeBaseId ? { ...kb, uploadRule: rule, updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16) } : kb
    ),
  })),

  // ============ QA 分段生成 ============
  generateQAChunks: (knowledgeBaseId, docId, pairs) => set((state) => ({
    knowledgeBases: state.knowledgeBases.map(kb => {
      if (kb.id !== knowledgeBaseId) return kb;
      return {
        ...kb,
        documents: kb.documents.map(doc => {
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
