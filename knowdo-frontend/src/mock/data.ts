import type { User, CategoryNode, Tag, Knowledge, ModelConfig, RecommendedKnowledge, Notification, ReviewItem, DatasetAuthorization, RelatedResource } from '@/types';

// 用户信息
export const MOCK_USER: User = {
  name: '张明远',
  department: '风险管理部',
  position: '高级风险分析师',
  avatar: '张',
  role: 'admin',
  ssoId: 'zhangmingyuan',
};

// 用户角色映射
export const USER_ROLES: Record<string, { name: string; permissions: string[] }> = {
  admin: { name: '系统管理员', permissions: ['view', 'edit', 'review', 'delete', 'manage'] },
  reviewer: { name: '审核人', permissions: ['view', 'review'] },
  employee: { name: '普通员工', permissions: ['view', 'create'] },
};

// 分类树数据
export const CATEGORY_TREE: CategoryNode[] = [
  {
    id: 'cat-1', name: '公司业务', icon: '🏢',
    children: [
      { id: 'cat-1-1', name: '信贷业务', children: [
        { id: 'cat-1-1-1', name: '企业贷款' },
        { id: 'cat-1-1-2', name: '个人贷款' },
        { id: 'cat-1-1-3', name: '抵押贷款' },
      ]},
      { id: 'cat-1-2', name: '存款业务', children: [
        { id: 'cat-1-2-1', name: '定期存款' },
        { id: 'cat-1-2-2', name: '活期存款' },
      ]},
      { id: 'cat-1-3', name: '国际业务', children: [
        { id: 'cat-1-3-1', name: '外汇交易' },
        { id: 'cat-1-3-2', name: '跨境结算' },
      ]},
    ],
  },
  {
    id: 'cat-2', name: '风险管理', icon: '🛡️',
    children: [
      { id: 'cat-2-1', name: '信用风险', children: [
        { id: 'cat-2-1-1', name: '风险评估模型' },
        { id: 'cat-2-1-2', name: '信用评级标准' },
      ]},
      { id: 'cat-2-2', name: '操作风险', children: [
        { id: 'cat-2-2-1', name: '内控流程' },
        { id: 'cat-2-2-2', name: '事件管理' },
      ]},
      { id: 'cat-2-3', name: '市场风险', children: [
        { id: 'cat-2-3-1', name: '利率风险' },
      ]},
    ],
  },
  {
    id: 'cat-3', name: '运营管理', icon: '⚙️',
    children: [
      { id: 'cat-3-1', name: '流程制度', children: [
        { id: 'cat-3-1-1', name: '审批流程' },
        { id: 'cat-3-1-2', name: '操作规范' },
      ]},
      { id: 'cat-3-2', name: '质量管理', children: [
        { id: 'cat-3-2-1', name: '质检标准' },
      ]},
    ],
  },
  {
    id: 'cat-4', name: '人力资源', icon: '👥',
    children: [
      { id: 'cat-4-1', name: '培训发展', children: [
        { id: 'cat-4-1-1', name: '新员工入职' },
        { id: 'cat-4-1-2', name: '专业技能' },
      ]},
      { id: 'cat-4-2', name: '薪酬福利', children: [
        { id: 'cat-4-2-1', name: '薪酬制度' },
      ]},
    ],
  },
  {
    id: 'cat-5', name: '行政办公', icon: '📋',
    children: [
      { id: 'cat-5-1', name: '行政制度', children: [
        { id: 'cat-5-1-1', name: '考勤管理' },
        { id: 'cat-5-1-2', name: '资产管理' },
      ]},
      { id: 'cat-5-2', name: 'IT服务', children: [
        { id: 'cat-5-2-1', name: '系统使用' },
        { id: 'cat-5-2-2', name: '信息安全' },
      ]},
    ],
  },
  {
    id: 'cat-6', name: '个人业务', icon: '👤',
    children: [
      { id: 'cat-6-1', name: '零售银行', children: [
        { id: 'cat-6-1-1', name: '理财产品' },
        { id: 'cat-6-1-2', name: '信用卡' },
      ]},
    ],
  },
];

// 标签库
export const TAG_LIBRARY: Tag[] = [
  { id: 'tag-1', name: '制度文件', color: 'blue' },
  { id: 'tag-2', name: '操作手册', color: 'green' },
  { id: 'tag-3', name: '培训资料', color: 'purple' },
  { id: 'tag-4', name: '风险控制', color: 'orange' },
  { id: 'tag-5', name: '合规要求', color: 'red' },
  { id: 'tag-6', name: '案例分享', color: 'blue' },
  { id: 'tag-7', name: '技术方案', color: 'green' },
  { id: 'tag-8', name: '年度报告', color: 'purple' },
  { id: 'tag-9', name: '政策解读', color: 'orange' },
  { id: 'tag-10', name: '最佳实践', color: 'green' },
  { id: 'tag-11', name: 'FAQ', color: 'blue' },
  { id: 'tag-12', name: '业务流程', color: 'purple' },
];

// 知识列表数据
export const KNOWLEDGE_LIST: Knowledge[] = [
  {
    id: 'k-001', title: '2026年度企业信贷风险评估操作指引', type: 'doc', typeLabel: '文档',
    content: '## 一、概述\n\n本指引旨在规范企业信贷业务中的风险评估流程，确保信贷资产质量。\n\n## 二、评估流程\n\n### 2.1 贷前调查\n\n信贷人员应对借款企业进行全面调查，包括但不限于：\n- 企业基本情况及经营状况\n- 财务状况分析，包括近三年财务报表\n- 行业发展前景评估\n\n### 2.2 信用评级\n\n根据《企业信用评级管理办法》执行评级工作。\n\n## 三、风险控制措施\n\n建立完善的风险预警机制，定期对存量贷款进行风险排查。',
    summary: '本指引规范了企业信贷风险评估的全流程，包括贷前调查、信用评级、风险预警等关键环节，适用于各分支行信贷业务操作。',
    category: '公司业务 > 信贷业务 > 企业贷款', categoryId: 'cat-1-1-1',
    tags: ['制度文件', '风险控制', '合规要求'], author: '张明远', authorDept: '风险管理部',
    publishTime: '2026-06-20 14:30', updateTime: '2026-06-21 09:00', version: 'V1.0',
    status: 'published', viewCount: 1256, likeCount: 89, commentCount: 12, favoriteCount: 45,
    isLiked: false, isFavorited: false, publishScope: '全行可见', validPeriod: '2026-06-20 ~ 2027-06-20',
    attachments: [
      { name: '企业信贷风险评估指引_v1.0.docx', size: '2.3 MB' },
      { name: '附件_评估模板.xlsx', size: '856 KB' },
    ],
    comments: [
      { id: 'cmt-1', author: '李建国', authorDept: '信贷业务部', content: '非常实用的指引，建议在贷后管理部分补充一些实际案例。', time: '2026-06-21 10:30', isAuthor: false },
      { id: 'cmt-2', author: '张明远', authorDept: '风险管理部', content: '感谢建议！我们正在整理典型案例，下一版本会加入。', time: '2026-06-21 11:00', isAuthor: true, replyTo: 'cmt-1' },
    ],
    datasetId: 'ds-001',
  },
  {
    id: 'k-002', title: '定期存款利率调整政策解读（2026年Q3）', type: 'doc', typeLabel: '文档',
    content: '根据央行最新政策指导，2026年第三季度定期存款利率将做出如下调整...',
    summary: '本文解读了2026年Q3定期存款利率调整政策，包含各期限利率变化及对客户的影响分析。',
    category: '公司业务 > 存款业务 > 定期存款', categoryId: 'cat-1-2-1',
    tags: ['政策解读', '制度文件'], author: '王丽华', authorDept: '存款业务部',
    publishTime: '2026-06-19 09:00', updateTime: '2026-06-19 09:00', version: 'V1.0',
    status: 'published', viewCount: 2340, likeCount: 156, commentCount: 23, favoriteCount: 78,
    isLiked: true, isFavorited: false, publishScope: '全行可见', validPeriod: '2026-06-19 ~ 2026-09-30',
    attachments: [{ name: '存款利率调整通知.pdf', size: '1.1 MB' }],
    comments: [
      { id: 'cmt-3', author: '赵强', authorDept: '个人金融部', content: '请问贵宾客户的专属利率是否同步调整？', time: '2026-06-19 14:00', isAuthor: false },
      { id: 'cmt-4', author: '王丽华', authorDept: '存款业务部', content: '贵宾客户专属利率将另行通知，预计下周发布。', time: '2026-06-19 15:30', isAuthor: true, replyTo: 'cmt-3' },
    ],
    datasetId: 'ds-004',
  },
  {
    id: 'k-003', title: '新员工入职信息安全培训手册', type: 'doc', typeLabel: '文档',
    content: '欢迎加入我行！信息安全是每位员工的基本责任...',
    summary: '新员工入职必读的信息安全培训手册，涵盖密码管理、数据传输、设备使用等安全规范。',
    category: '行政办公 > IT服务 > 信息安全', categoryId: 'cat-5-2-2',
    tags: ['培训资料', '合规要求'], author: '陈志远', authorDept: '信息安全部',
    publishTime: '2026-06-18 16:00', updateTime: '2026-06-18 16:00', version: 'V3.2',
    status: 'published', viewCount: 5678, likeCount: 234, commentCount: 8, favoriteCount: 156,
    isLiked: false, isFavorited: true, publishScope: '全行可见', validPeriod: '永久有效',
    attachments: [
      { name: '信息安全培训手册_v3.2.pdf', size: '5.6 MB' },
      { name: '信息安全承诺书.docx', size: '320 KB' },
    ],
    comments: [],
    datasetId: 'ds-004',
  },
  {
    id: 'k-004', title: '外汇交易风险对冲策略案例分析', type: 'link', typeLabel: '链接',
    content: '本文通过三个典型案例分析外汇交易中的风险对冲策略...',
    summary: '通过三个典型案例深入剖析外汇交易风险对冲策略，包含远期合约、期权组合等工具的实际应用。',
    category: '公司业务 > 国际业务 > 外汇交易', categoryId: 'cat-1-3-1',
    tags: ['案例分享', '风险控制', '最佳实践'], author: '刘博文', authorDept: '国际业务部',
    publishTime: '2026-06-17 11:00', updateTime: '2026-06-17 11:00', version: 'V1.0',
    status: 'published', viewCount: 789, likeCount: 67, commentCount: 5, favoriteCount: 34,
    isLiked: false, isFavorited: false, publishScope: '部门可见', validPeriod: '永久有效',
    attachments: [], comments: [],
    datasetId: 'ds-003',
  },
  {
    id: 'k-005', title: '信贷审批流程图（2026修订版）', type: 'image', typeLabel: '图片',
    content: '',
    summary: '2026年最新修订的信贷审批完整流程图，包含各审批节点、时间要求和责任人。',
    category: '公司业务 > 信贷业务 > 企业贷款', categoryId: 'cat-1-1-1',
    tags: ['业务流程', '操作手册'], author: '孙晓峰', authorDept: '信贷管理部',
    publishTime: '2026-06-16 08:30', updateTime: '2026-06-16 08:30', version: 'V2.1',
    status: 'published', viewCount: 3456, likeCount: 198, commentCount: 15, favoriteCount: 89,
    isLiked: true, isFavorited: true, publishScope: '全行可见', validPeriod: '永久有效',
    attachments: [{ name: '信贷审批流程图_v2.1.png', size: '1.8 MB' }],
    comments: [],
    datasetId: 'ds-001',
  },
  {
    id: 'k-006', title: '信用评级模型参数调整说明与影响评估', type: 'doc', typeLabel: '文档',
    content: '',
    summary: '详细说明2026年信用评级模型参数调整的背景、内容及对企业客户评级结果的预期影响。',
    category: '风险管理 > 信用风险 > 风险评估模型', categoryId: 'cat-2-1-1',
    tags: ['风险控制', '技术方案'], author: '张明远', authorDept: '风险管理部',
    publishTime: '2026-06-15 10:00', updateTime: '2026-06-15 10:00', version: 'V1.0',
    status: 'published', viewCount: 1890, likeCount: 123, commentCount: 18, favoriteCount: 67,
    isLiked: false, isFavorited: false, publishScope: '全行可见', validPeriod: '2026-06-15 ~ 2026-12-31',
    attachments: [{ name: '评级模型参数说明_v1.0.docx', size: '3.2 MB' }],
    comments: [],
    datasetId: 'ds-002',
  },
  {
    id: 'k-007', title: '个人理财产品销售合规操作手册', type: 'doc', typeLabel: '文档',
    content: '',
    summary: '规范个人理财产品销售过程中的合规要求，包括客户风险测评、产品适配、双录要求等。',
    category: '个人业务 > 零售银行 > 理财产品', categoryId: 'cat-6-1-1',
    tags: ['合规要求', '操作手册', '制度文件'], author: '林小燕', authorDept: '个人金融部',
    publishTime: '2026-06-14 15:00', updateTime: '2026-06-14 15:00', version: 'V2.0',
    status: 'published', viewCount: 4321, likeCount: 276, commentCount: 31, favoriteCount: 134,
    isLiked: false, isFavorited: false, publishScope: '全行可见', validPeriod: '永久有效',
    attachments: [{ name: '理财产品合规手册_v2.0.pdf', size: '4.5 MB' }],
    comments: [],
    datasetId: 'ds-004',
  },
  {
    id: 'k-008', title: '2026年Q2内部审计常见问题汇总', type: 'qa', typeLabel: '问答',
    content: '',
    summary: '汇总2026年Q2内部审计中发现的常见问题及规范解答，覆盖财务、运营、合规等领域。',
    category: '风险管理 > 操作风险 > 内控流程', categoryId: 'cat-2-2-1',
    tags: ['FAQ', '合规要求', '案例分享'], author: '陈志远', authorDept: '内审部',
    publishTime: '2026-06-13 09:30', updateTime: '2026-06-13 09:30', version: 'V1.0',
    status: 'published', viewCount: 2890, likeCount: 178, commentCount: 9, favoriteCount: 56,
    isLiked: false, isFavorited: true, publishScope: '全行可见', validPeriod: '永久有效',
    attachments: [], comments: [],
    datasetId: 'ds-002',
  },
  {
    id: 'k-009', title: '新员工入职培训系列视频（全集）', type: 'video', typeLabel: '视频',
    content: '',
    summary: '涵盖企业文化、规章制度、岗位技能三大模块的新员工入职培训系列视频教程。',
    category: '人力资源 > 培训发展 > 新员工入职', categoryId: 'cat-4-1-1',
    tags: ['培训资料'], author: '人力资源部', authorDept: '人力资源部',
    publishTime: '2026-06-12 14:00', updateTime: '2026-06-12 14:00', version: 'V1.0',
    status: 'published', viewCount: 8976, likeCount: 567, commentCount: 45, favoriteCount: 234,
    isLiked: true, isFavorited: false, publishScope: '全行可见', validPeriod: '永久有效',
    attachments: [
      { name: '培训视频_第一集_企业文化.mp4', size: '256 MB' },
      { name: '培训视频_第二集_规章制度.mp4', size: '312 MB' },
      { name: '培训视频_第三集_岗位技能.mp4', size: '398 MB' },
    ],
    comments: [],
    datasetId: 'ds-002',
  },
  {
    id: 'k-010', title: '跨境结算业务流程优化方案', type: 'doc', typeLabel: '文档',
    content: '',
    summary: '针对跨境结算业务现状提出流程优化方案，预计可提升处理效率30%以上。',
    category: '公司业务 > 国际业务 > 跨境结算', categoryId: 'cat-1-3-2',
    tags: ['业务流程', '最佳实践'], author: '刘博文', authorDept: '国际业务部',
    publishTime: '2026-06-11 08:00', updateTime: '2026-06-11 08:00', version: 'V1.0',
    status: 'published', viewCount: 567, likeCount: 45, commentCount: 7, favoriteCount: 23,
    isLiked: false, isFavorited: false, publishScope: '部门可见', validPeriod: '永久有效',
    attachments: [{ name: '跨境结算优化方案_v1.0.docx', size: '1.5 MB' }],
    comments: [],
    datasetId: 'ds-003',
  },
];

// 模型列表数据
export const MODEL_LIST: Record<string, ModelConfig[]> = {
  llm: [
    { id: 'm-llm-1', name: 'GPT-4 Turbo', provider: 'OpenAI', type: 'LLM', apiUrl: 'https://api.openai.com/v1', modelName: 'gpt-4-turbo', maxTokens: 128000, concurrency: 50, timeout: 30, retry: 3, status: 'online', lastTest: '2026-06-24 14:30', testResult: { success: true, latency: '320ms' } },
    { id: 'm-llm-2', name: 'DeepSeek-V3', provider: 'DeepSeek', type: 'LLM', apiUrl: 'https://api.deepseek.com/v1', modelName: 'deepseek-chat', maxTokens: 64000, concurrency: 30, timeout: 60, retry: 3, status: 'online', lastTest: '2026-06-24 10:15', testResult: { success: true, latency: '450ms' } },
    { id: 'm-llm-3', name: 'Qwen-Max', provider: '阿里云百炼', type: 'LLM', apiUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', modelName: 'qwen-max', maxTokens: 32000, concurrency: 20, timeout: 30, retry: 2, status: 'online', lastTest: '2026-06-23 16:00', testResult: { success: true, latency: '280ms' } },
    { id: 'm-llm-4', name: 'Claude 3.5 Sonnet', provider: 'Anthropic', type: 'LLM', apiUrl: 'https://api.anthropic.com/v1', modelName: 'claude-3-5-sonnet', maxTokens: 200000, concurrency: 25, timeout: 45, retry: 3, status: 'offline', lastTest: '2026-06-20 09:00', testResult: { success: false, latency: '-', error: '连接超时' } },
  ],
  embedding: [
    { id: 'm-emb-1', name: 'text-embedding-3-large', provider: 'OpenAI', type: 'Embedding', apiUrl: 'https://api.openai.com/v1', modelName: 'text-embedding-3-large', maxTokens: 8191, concurrency: 100, timeout: 20, retry: 3, status: 'online', lastTest: '2026-06-24 14:00', testResult: { success: true, latency: '180ms' } },
    { id: 'm-emb-2', name: 'bge-large-zh-v1.5', provider: 'BAAI', type: 'Embedding', apiUrl: 'http://localhost:8080/v1', modelName: 'bge-large-zh-v1.5', maxTokens: 512, concurrency: 200, timeout: 15, retry: 2, status: 'online', lastTest: '2026-06-24 13:45', testResult: { success: true, latency: '45ms' } },
    { id: 'm-emb-3', name: 'text2vec-large-chinese', provider: 'shibing624', type: 'Embedding', apiUrl: 'http://localhost:8081/v1', modelName: 'text2vec-large-chinese', maxTokens: 512, concurrency: 150, timeout: 20, retry: 3, status: 'online', lastTest: '2026-06-23 10:00', testResult: { success: true, latency: '65ms' } },
  ],
  reranker: [
    { id: 'm-rer-1', name: 'bge-reranker-v2-m3', provider: 'BAAI', type: 'Reranker', apiUrl: 'http://localhost:8090/v1', modelName: 'bge-reranker-v2-m3', maxTokens: 8192, concurrency: 100, timeout: 10, retry: 2, status: 'online', lastTest: '2026-06-24 12:00', testResult: { success: true, latency: '90ms' } },
    { id: 'm-rer-2', name: 'Cohere Rerank v3', provider: 'Cohere', type: 'Reranker', apiUrl: 'https://api.cohere.ai/v1', modelName: 'rerank-v3', maxTokens: 4096, concurrency: 50, timeout: 15, retry: 3, status: 'offline', lastTest: '2026-06-22 08:00', testResult: { success: false, latency: '-', error: 'API密钥已过期' } },
  ],
};

// 推荐知识
export const RECOMMENDED_KNOWLEDGE: RecommendedKnowledge[] = [
  { id: 'k-r1', title: '企业贷款审批权限管理办法（2026版）', type: 'doc', summary: '明确各级审批权限和审批流程的最新管理办法。', viewCount: 2340, category: '公司业务 > 信贷业务 > 企业贷款' },
  { id: 'k-r2', title: '个人信用评分模型应用指南', type: 'doc', summary: '个人信贷业务中信用评分模型的使用规范。', viewCount: 1876, category: '风险管理 > 信用风险' },
  { id: 'k-r3', title: '外汇管理政策汇编（2026年6月更新）', type: 'link', summary: '最新外汇管理相关政策文件汇编。', viewCount: 1523, category: '公司业务 > 国际业务' },
  { id: 'k-r4', title: '零售银行理财产品话术指南', type: 'doc', summary: '规范理财产品销售沟通话术，提升客户体验。', viewCount: 3210, category: '个人业务 > 零售银行' },
  { id: 'k-r5', title: '风险排查工作底稿模板', type: 'doc', summary: '标准化的风险排查工作底稿模板，适用于各类业务条线。', viewCount: 987, category: '风险管理 > 操作风险' },
];

// 通知数据
export const NOTIFICATIONS: Notification[] = [
  { id: 'n-1', type: 'publish', read: false, icon: '📢', title: '新知识发布', desc: '《2026年度企业信贷风险评估操作指引》已发布', time: '10分钟前' },
  { id: 'n-2', type: 'review', read: false, icon: '📋', title: '待审核提醒', desc: '您有2篇知识等待审核', time: '30分钟前' },
  { id: 'n-3', type: 'comment', read: false, icon: '💬', title: '新评论', desc: '李建国评论了您的《信用评级模型参数调整说明》', time: '1小时前' },
  { id: 'n-4', type: 'like', read: true, icon: '👍', title: '获得点赞', desc: '您的知识《企业信贷风险评估操作指引》获得10个赞', time: '2小时前' },
  { id: 'n-5', type: 'expire', read: true, icon: '⏰', title: '即将过期', desc: '《定期存款利率调整政策》将在7天后过期', time: '昨天' },
  { id: 'n-6', type: 'system', read: true, icon: '🔔', title: '系统通知', desc: '向量化模型 bge-large-zh 已切换完成，不影响正常使用', time: '昨天' },
];

// 审核队列
export const REVIEW_QUEUE: ReviewItem[] = [
  { id: 'rq-1', title: '不良资产处置流程优化方案', author: '赵强', authorDept: '资产保全部', submitTime: '2026-06-24 09:00', category: '风险管理 > 信用风险', status: 'pending', aiScore: 4.2, aiIssues: ['格式规范性: 标题层级建议调整', '内容完整性: 缺少风险控制措施章节'] },
  { id: 'rq-2', title: '2026年分行绩效考核实施细则', author: '人力资源部', authorDept: '人力资源部', submitTime: '2026-06-23 16:30', category: '人力资源 > 薪酬福利', status: 'pending', aiScore: 4.8, aiIssues: [] },
];

// 热门知识
export const getHotKnowledge = () => [...KNOWLEDGE_LIST].sort((a, b) => b.viewCount - a.viewCount).slice(0, 10);

// 最新知识
export const getLatestKnowledge = () => [...KNOWLEDGE_LIST].sort((a, b) => new Date(b.publishTime).getTime() - new Date(a.publishTime).getTime()).slice(0, 10);

// 工具函数
export function getKnowledgeById(id: string): Knowledge | null {
  return KNOWLEDGE_LIST.find(k => k.id === id) || null;
}

export function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  if (diff < 60 * 1000) return '刚刚';
  if (diff < 60 * 60 * 1000) return Math.floor(diff / (60 * 1000)) + '分钟前';
  if (diff < 24 * 60 * 60 * 1000) return Math.floor(diff / (60 * 60 * 1000)) + '小时前';
  if (diff < 7 * 24 * 60 * 60 * 1000) return Math.floor(diff / (24 * 60 * 60 * 1000)) + '天前';
  return dateStr.substring(0, 10);
}

export function formatCount(num: number): string {
  if (num >= 10000) return (num / 10000).toFixed(1) + '万';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
  return num.toString();
}

// ============================================
// 知识库（Dataset）模拟数据
// ============================================

// 向量模型列表
export const VECTOR_MODELS = [
  { id: 'vm-1', name: 'text-embedding-3-large', provider: 'OpenAI', dimension: 3072, status: 'online' as const },
  { id: 'vm-2', name: 'bge-large-zh-v1.5', provider: 'BAAI', dimension: 1024, status: 'online' as const },
  { id: 'vm-3', name: 'text2vec-large-chinese', provider: 'shibing624', dimension: 1024, status: 'online' as const },
  { id: 'vm-4', name: 'm3e-large', provider: 'Moka', dimension: 1024, status: 'offline' as const },
];

// 知识库文件夹树（三级嵌套）
export const DATASET_FOLDERS = [
  {
    id: 'ds-folder-1', name: '产品知识库', parentId: null, datasetCount: 2, children: [
      { id: 'ds-folder-1-1', name: '信贷产品', parentId: 'ds-folder-1', datasetCount: 1, children: [
        { id: 'ds-folder-1-1-1', name: '企业信贷', parentId: 'ds-folder-1-1', datasetCount: 1 },
      ]},
      { id: 'ds-folder-1-2', name: '存款产品', parentId: 'ds-folder-1', datasetCount: 0 },
    ],
  },
  {
    id: 'ds-folder-2', name: '操作手册', parentId: null, datasetCount: 0, children: [
      { id: 'ds-folder-2-1', name: '系统操作', parentId: 'ds-folder-2', datasetCount: 0 },
    ],
  },
  {
    id: 'ds-folder-3', name: '合规文档', parentId: null, datasetCount: 2, children: [
      { id: 'ds-folder-3-1', name: '反洗钱', parentId: 'ds-folder-3', datasetCount: 0, children: [
        { id: 'ds-folder-3-1-1', name: '客户尽职调查', parentId: 'ds-folder-3-1', datasetCount: 0 },
      ]},
      { id: 'ds-folder-3-2', name: '数据安全', parentId: 'ds-folder-3', datasetCount: 0 },
    ],
  },
  {
    id: 'ds-folder-4', name: '飞书文档', parentId: null, datasetCount: 1,
  },
];

// 知识库列表
export const DATASETS = [
  {
    id: 'ds-001',
    name: '企业信贷政策知识库',
    description: '包含企业信贷相关的政策文件、操作指引和案例分析',
    type: 'general' as const,
    vectorModel: 'bge-large-zh-v1.5',
    status: 'completed' as const,
    documents: [
      {
        id: 'doc-001',
        datasetId: 'ds-001',
        name: '企业信贷风险评估指引.docx',
        size: '2.3 MB',
        type: 'docx' as const,
        status: 'completed' as const,
        createdAt: '2026-06-20 14:30',
        chunks: [
          { id: 'chk-001', index: 1, content: '## 一、概述\n\n本指引旨在规范企业信贷业务中的风险评估流程，确保信贷资产质量。所有信贷人员必须严格遵守本指引的相关规定。', length: 52, question: '企业信贷风险评估指引的概述是什么？' },
          { id: 'chk-002', index: 2, content: '## 二、评估流程\n\n### 2.1 贷前调查\n\n信贷人员应对借款企业进行全面调查，包括但不限于：企业基本情况及经营状况、财务状况分析（近三年财务报表）、行业发展前景评估。', length: 68, question: '贷前调查包括哪些内容？' },
          { id: 'chk-003', index: 3, content: '### 2.2 信用评级\n\n根据《企业信用评级管理办法》执行评级工作。评级因素包括：企业规模、盈利能力、偿债能力、经营稳定性、行业地位等。评级结果分为 AAA、AA、A、BBB、BB、B、CCC、CC、C 九个等级。', length: 85 },
        ],
      },
      {
        id: 'doc-002',
        datasetId: 'ds-001',
        name: '信贷审批流程图.pdf',
        size: '1.8 MB',
        type: 'pdf' as const,
        status: 'completed' as const,
        createdAt: '2026-06-21 09:00',
        chunks: [
          { id: 'chk-004', index: 1, content: '信贷审批流程分为以下节点：1. 客户经理受理；2. 信贷专员初审；3. 风险专员评估；4. 审批官审批；5. 合同签订。每个节点的最长处理时间为 2 个工作日。', length: 72 },
          { id: 'chk-005', index: 2, content: '审批权限划分：支行行长审批额度上限为 500 万元；分行副行长审批额度上限为 2000 万元；分行行长审批额度上限为 5000 万元；超过 5000 万元需报总行审批。', length: 78 },
        ],
      },
    ],
    folderId: 'ds-folder-1',
    createdAt: '2026-06-20 14:00',
    updatedAt: '2026-06-21 09:00',
    chunkStrategy: { mode: 'smart' as const, maxCharsPerChunk: 4096, autoClean: true, autoAddTitleAsQuestion: true },
    documentCount: 2,
    charCount: 285,
    icon: '🏦',
    permission: 'private' as const,
    indexMode: 'high_quality' as const,
    embeddingModel: 'text-embedding-v1',
    searchMode: 'hybrid' as const,
    topK: 5,
    scoreThreshold: 0.5,
    enableRerank: true,
    rerankModel: 'bge-reranker-v2-m3',
  },
  {
    id: 'ds-002',
    name: '风险管理知识库',
    description: '风险管理相关政策、模型和案例分析',
    type: 'general' as const,
    vectorModel: 'text-embedding-3-large',
    status: 'completed' as const,
    documents: [
      {
        id: 'doc-003',
        datasetId: 'ds-002',
        name: '信用风险管理手册.md',
        size: '856 KB',
        type: 'md' as const,
        status: 'completed' as const,
        createdAt: '2026-06-18 10:00',
        chunks: [
          { id: 'chk-006', index: 1, content: '信用风险是指借款人或交易对手未能履行合同义务，导致银行遭受损失的风险。信用风险管理是商业银行风险管理的核心内容。', length: 58 },
          { id: 'chk-007', index: 2, content: '信用风险识别方法：1. 财务分析法 - 通过财务报表分析企业的偿债能力和盈利能力；2. 信用风险评级模型 - 使用统计模型评估违约概率；3. 专家判断法 - 依靠经验丰富的信贷专家进行评估。', length: 92 },
        ],
      },
    ],
    folderId: 'ds-folder-3',
    createdAt: '2026-06-18 09:00',
    updatedAt: '2026-06-18 10:00',
    documentCount: 1,
    charCount: 150,
    icon: '⚠️',
    permission: 'team' as const,
    indexMode: 'high_quality' as const,
    embeddingModel: 'text-embedding-v1',
    searchMode: 'vector' as const,
    topK: 3,
    scoreThreshold: 0.6,
    enableRerank: false,
  },
  {
    id: 'ds-003',
    name: '官网产品信息',
    description: '自动爬取官网产品页面，用于智能客服问答',
    type: 'web' as const,
    vectorModel: 'bge-large-zh-v1.5',
    webUrl: 'https://www.example-bank.com/products',
    webSelector: '.product-item',
    status: 'completed' as const,
    documents: [
      {
        id: 'doc-004',
        datasetId: 'ds-003',
        name: '企业贷款产品页面',
        size: '156 KB',
        type: 'html' as const,
        status: 'completed' as const,
        createdAt: '2026-06-15 08:00',
        chunks: [
          { id: 'chk-008', index: 1, content: '企业贷款产品包括：流动资金贷款、固定资产贷款、并购贷款、供应链金融等。流动资金贷款期限最长不超过 3 年，固定资产贷款期限最长不超过 10 年。', length: 65 },
          { id: 'chk-009', index: 2, content: '企业贷款申请条件：1. 依法注册登记的企业法人；2. 有固定的生产经营场所；3. 财务状况良好，有偿还能力；4. 信用状况良好，无重大不良记录；5. 提供符合条件的担保措施。', length: 82 },
        ],
      },
    ],
    folderId: 'ds-folder-1',
    createdAt: '2026-06-15 08:00',
    updatedAt: '2026-06-15 08:00',
    documentCount: 1,
    charCount: 147,
    icon: '🌐',
    permission: 'public' as const,
    indexMode: 'economy' as const,
    embeddingModel: 'text-embedding-v1',
    searchMode: 'fulltext' as const,
    topK: 10,
    scoreThreshold: 0.3,
    enableRerank: false,
  },
  {
    id: 'ds-004',
    name: '合规制度文档库',
    description: '各类合规制度文件，支持合规审查问答',
    type: 'general' as const,
    vectorModel: 'text2vec-large-chinese',
    status: 'processing' as const,
    documents: [
      {
        id: 'doc-005',
        datasetId: 'ds-004',
        name: '反洗钱操作指引.pdf',
        size: '3.2 MB',
        type: 'pdf' as const,
        status: 'completed' as const,
        createdAt: '2026-06-22 11:00',
        chunks: [
          { id: 'chk-010', index: 1, content: '反洗钱工作原则：1. 了解你的客户（KYC）原则；2. 风险为本原则；3. 保密原则；4. 及时报告原则。所有金融机构必须建立健全反洗钱内部控制制度。', length: 78 },
        ],
      },
      {
        id: 'doc-006',
        datasetId: 'ds-004',
        name: '合规检查清单.xlsx',
        size: '450 KB',
        type: 'xlsx' as const,
        status: 'processing' as const,
        createdAt: '2026-06-23 14:00',
        chunks: [],
      },
    ],
    folderId: 'ds-folder-3',
    createdAt: '2026-06-22 11:00',
    updatedAt: '2026-06-23 14:00',
    documentCount: 2,
    charCount: 78,
    icon: '📋',
    permission: 'team' as const,
    indexMode: 'high_quality' as const,
    embeddingModel: 'text-embedding-v1',
    searchMode: 'hybrid' as const,
    topK: 5,
    scoreThreshold: 0.5,
    enableRerank: true,
    rerankModel: 'bge-reranker-v2-m3',
  },
  {
    id: 'ds-005',
    name: '飞书-客户服务手册',
    description: '对接飞书云文档，导入客户服务相关流程文档',
    type: 'feishu' as const,
    vectorModel: 'bge-large-zh-v1.5',
    feishuAppId: 'cli_a6f8e9d0c1b2',
    feishuFolderToken: 'fldcnAbCdEfGhIjKlMnOp',
    status: 'completed' as const,
    documents: [
      {
        id: 'doc-007',
        datasetId: 'ds-005',
        name: '客户投诉处理流程',
        size: '125 KB',
        type: 'docx' as const,
        status: 'completed' as const,
        createdAt: '2026-06-24 10:00',
        chunks: [
          { id: 'chk-011', index: 1, content: '客户投诉处理流程：1. 受理投诉 - 客服人员接收并记录投诉信息；2. 初步核实 - 核实投诉内容是否属实；3. 分类转办 - 根据投诉类型转交相关部门；4. 处理反馈 - 相关部门处理并将结果反馈给客户。', length: 95, question: '客户投诉处理有哪几个步骤？' },
        ],
      },
    ],
    folderId: 'ds-folder-4',
    createdAt: '2026-06-24 09:00',
    updatedAt: '2026-06-24 10:00',
    uploadRule: { maxFilesPerUpload: 50, maxFileSizeMB: 100 },
    documentCount: 1,
    charCount: 95,
    icon: '📘',
    permission: 'private' as const,
    indexMode: 'high_quality' as const,
    embeddingModel: 'text-embedding-v1',
    searchMode: 'hybrid' as const,
    topK: 5,
    scoreThreshold: 0.5,
    enableRerank: true,
    rerankModel: 'bge-reranker-v2-m3',
  },
];

// 资源授权数据
export const DATASET_AUTHORIZATIONS: DatasetAuthorization[] = [
  {
    id: 'auth-001',
    datasetId: 'ds-001',
    targetType: 'user',
    targetId: 'user-li',
    targetName: '李建国',
    permission: 'use',
    authorizedAt: '2026-06-21 10:00',
  },
  {
    id: 'auth-002',
    datasetId: 'ds-001',
    targetType: 'department',
    targetId: 'dept-credit',
    targetName: '信贷业务部',
    permission: 'view',
    authorizedAt: '2026-06-21 14:00',
  },
  {
    id: 'auth-003',
    datasetId: 'ds-002',
    targetType: 'user',
    targetId: 'user-liu',
    targetName: '刘博文',
    permission: 'maintain',
    authorizedAt: '2026-06-19 09:00',
  },
];

// 关联资源数据
export const RELATED_RESOURCES: RelatedResource[] = [
  { id: 'rel-001', type: 'agent', name: '信贷智能助手', relationType: 'references' },
  { id: 'rel-002', type: 'agent', name: '合规问答机器人', relationType: 'references' },
  { id: 'rel-003', type: 'model', name: 'bge-large-zh-v1.5', relationType: 'depends_on' },
  { id: 'rel-004', type: 'model', name: 'text-embedding-3-large', relationType: 'depends_on' },
];
