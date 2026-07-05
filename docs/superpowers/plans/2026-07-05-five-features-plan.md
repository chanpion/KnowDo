# 5项功能补齐实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**目标:** 实现 F-33 AI标签推荐、F-02 发布范围+有效期、Dataset路由注册、F-09 通知中心页面

**架构:** 在现有 KnowledgeCreate 页面扩展表单字段，新增 Notifications 页面，添加 Dataset 路由，保持 Zustand Store 单一数据源模式

**技术栈:** React 19 + TypeScript + Ant Design 6 + Zustand 5

---

### Task 1: 发布范围 — 添加"特定岗位可见"

**文件:**
- 修改: `knowdo-frontend/src/pages/KnowledgeCreate/index.tsx`

- [ ] **Step 1: 添加岗位选择状态和UI**

在 `ArticleCreatePanel` 组件中，在 `publishScope` 状态之后添加：

```typescript
const [targetPositions, setTargetPositions] = useState<string[]>([]);
```

在步骤1的发布范围 Select 下方（第490行之后），添加特定岗位选择器：

```typescript
{publishScope === '特定岗位可见' && (
  <div style={{ marginTop: 16 }}>
    <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>
      选择可见岗位
    </label>
    <Select
      mode="multiple"
      placeholder="请选择可见岗位"
      value={targetPositions}
      onChange={setTargetPositions}
      options={[
        { value: '风险管理', label: '风险管理' },
        { value: '信贷审批', label: '信贷审批' },
        { value: '合规审查', label: '合规审查' },
        { value: '内部审计', label: '内部审计' },
        { value: '财务分析', label: '财务分析' },
        { value: '信息技术', label: '信息技术' },
      ]}
      style={{ width: '100%' }}
      size="large"
    />
  </div>
)}
```

在 publishScope Select 的 options 数组中添加：

```typescript
{ value: '特定岗位可见', label: '👥 特定岗位可见' },
```

- [ ] **Step 2: 在 submit 逻辑中传递岗位数据**

在 `handleSubmit` 函数中，两个提交分支（新增和编辑）都加上：

```typescript
publishScope: publishScope === '特定岗位可见' ? `特定岗位可见(${targetPositions.join('、')})` : publishScope,
```

替换现有的 `publishScope` 字段。

- [ ] **Step 3: 在提交确认页展示岗位信息**

提交确认页（步骤3）已展示发布范围，`publishScope` 字符串会自然显示。

- [ ] **Step 4: Commit**

```bash
git add knowdo-frontend/src/pages/KnowledgeCreate/index.tsx
git commit -m "feat: 发布范围添加特定岗位可见选项"
```

---

### Task 2: 有效期设置

**文件:**
- 修改: `knowdo-frontend/src/pages/KnowledgeCreate/index.tsx`
- 修改: `knowdo-frontend/src/types/index.ts`

- [ ] **Step 1: 添加类型定义**

在 `types/index.ts` 的 `Knowledge` 接口中，在 `publishScope` 之后添加：

```typescript
validStart?: string;
validEnd?: string;
```

- [ ] **Step 2: 添加表单状态和UI**

在 `ArticleCreatePanel` 中，添加导入：

```typescript
import { DatePicker, Radio } from 'antd';
```

在 `publishScope` 状态之后添加：

```typescript
const [validPeriodType, setValidPeriodType] = useState<'forever' | 'limited'>('forever');
const [validStart, setValidStart] = useState<string>('');
const [validEnd, setValidEnd] = useState<string>('');
```

在步骤1的表单中，发布范围之后添加有效期字段（第490行之后，发布范围 Select 关闭 `</div>` 之后）：

```typescript
<div>
  <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>
    有效期 <span style={{ color: '#ef4444' }}>*</span>
  </label>
  <Radio.Group
    value={validPeriodType}
    onChange={(e) => setValidPeriodType(e.target.value)}
    style={{ marginBottom: 12, display: 'flex', gap: 24 }}
  >
    <Radio value="forever">永久有效</Radio>
    <Radio value="limited">限时有效</Radio>
  </Radio.Group>
  {validPeriodType === 'limited' && (
    <DatePicker.RangePicker
      placeholder={['开始日期', '结束日期']}
      onChange={(dates, dateStrings) => {
        if (dates && dateStrings[0] && dateStrings[1]) {
          setValidStart(dateStrings[0]);
          setValidEnd(dateStrings[1]);
        } else {
          setValidStart('');
          setValidEnd('');
        }
      }}
      style={{ width: '100%' }}
      size="large"
    />
  )}
</div>
```

- [ ] **Step 3: 更新 submit 逻辑**

在 `handleSubmit` 的两个提交分支中，替换 `validPeriod: '永久有效'` 为：

```typescript
validPeriod: validPeriodType === 'forever' ? '永久有效' : `${validStart} ~ ${validEnd}`,
validStart: validPeriodType === 'limited' ? validStart : undefined,
validEnd: validPeriodType === 'limited' ? validEnd : undefined,
```

- [ ] **Step 4: 在提交确认页展示有效期**

提交确认页（步骤3）已有展示项（publishScope），可以在其后添加有效期展示：

```typescript
<div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 13 }}>
  <span style={{ color: 'var(--text-muted)' }}>有效期</span>
  <span style={{ fontWeight: 500 }}>{validPeriodType === 'forever' ? '永久有效' : `${validStart} ~ ${validEnd}`}</span>
</div>
```

- [ ] **Step 5: 更新草稿数据**

在草稿自动保存 useEffect 中添加：

```typescript
if (draft.data.validPeriodType !== undefined) setValidPeriodType(draft.data.validPeriodType);
if (draft.data.validStart) setValidStart(draft.data.validStart);
if (draft.data.validEnd) setValidEnd(draft.data.validEnd);
```

在 `DraftItem` 的 data 存储中添加 `validPeriodType`, `validStart`, `validEnd`。

- [ ] **Step 6: Commit**

```bash
git add knowdo-frontend/src/pages/KnowledgeCreate/index.tsx knowdo-frontend/src/types/index.ts
git commit -m "feat: 知识创建添加有效期设置（永久有效 / 限时有效）"
```

---

### Task 3: AI 标签自动推荐

**文件:**
- 修改: `knowdo-frontend/src/pages/KnowledgeCreate/index.tsx`

- [ ] **Step 1: 添加 AI 推荐标签按钮和逻辑**

在 `ArticleCreatePanel` 中，在标签 Select 下方添加：

```typescript
const [aiTagsLoading, setAiTagsLoading] = useState(false);

const handleAiTagRecommend = () => {
  if (!title.trim() && !content.trim()) {
    message.warning('请先输入标题或正文内容');
    return;
  }
  setAiTagsLoading(true);
  // 模拟AI分析：基于标题和内容的关键词匹配
  setTimeout(() => {
    const combinedText = (title + ' ' + content).toLowerCase();
    const matchingTags = TAG_LIBRARY.filter(tag =>
      combinedText.includes(tag.name.replace(/[制度文件|操作手册|培训资料|风险控制|合规要求|案例分享|技术方案|年度报告|政策解读|最佳实践|FAQ|业务流程]/g, ''))
    ).map(t => t.name);
    
    const recommended = matchingTags.length >= 2
      ? matchingTags.slice(0, 3)
      : TAG_LIBRARY
          .filter(t => t.name.includes('制度') || t.name.includes('手册') || t.name.includes('业务'))
          .map(t => t.name)
          .slice(0, 3);
    
    setSelectedTags(prev => {
      const newTags = recommended.filter(t => !prev.includes(t));
      return [...prev, ...newTags];
    });
    setAiTagsLoading(false);
    message.success(`AI 推荐了 ${recommended.length} 个标签`);
  }, 1200);
};
```

在步骤1表单中，标签 Select 下方添加按钮：

```typescript
<Button
  type="dashed"
  icon={<span>🤖</span>}
  onClick={handleAiTagRecommend}
  loading={aiTagsLoading}
  size="small"
  style={{ marginTop: 8 }}
>
  AI 推荐标签
</Button>
```

- [ ] **Step 2: Commit**

```bash
git add knowdo-frontend/src/pages/KnowledgeCreate/index.tsx
git commit -m "feat: AI标签自动推荐功能"
```

---

### Task 4: Dataset 系列页面路由注册

**文件:**
- 修改: `knowdo-frontend/src/App.tsx`

- [ ] **Step 1: 确认现状**

当前路由：
- `/create` → KnowledgeCreate（非 `/article` 路径显示 DatasetCreatePanel，即知识库创建）
- `/detail/:id` → KnowledgeDetail（即知识库详情页）

需要添加的别名路由：`/dataset`（列表页）、`/dataset/create`、`/dataset/:id`

- [ ] **Step 2: 添加路由**

在 `App.tsx` 中添加导入和路由。由于 KnowledgeBrowse 已经承担了知识库列表的功能，`/dataset` 直接指向 KnowledgeBrowse：

```typescript
<Route path="/dataset" element={<KnowledgeBrowse />} />
<Route path="/dataset/create" element={<KnowledgeCreate />} />
<Route path="/dataset/:id" element={<KnowledgeDetail />} />
```

这三行添加在现有 `<Route path="/browse" ...>` 附近。

- [ ] **Step 3: Commit**

```bash
git add knowdo-frontend/src/App.tsx
git commit -m "feat: 添加 Dataset 系列路由（/dataset, /dataset/create, /dataset/:id）"
```

---

### Task 5: 通知中心页面

**文件:**
- 创建: `knowdo-frontend/src/pages/Notifications/index.tsx`
- 修改: `knowdo-frontend/src/App.tsx`
- 修改: `knowdo-frontend/src/components/layout/AppLayout.tsx`

- [ ] **Step 1: 创建 Notifications 页面**

创建 `knowdo-frontend/src/pages/Notifications/index.tsx`：

```typescript
import { useNavigate } from 'react-router-dom';
import { Typography, Button, Space, Tag, Empty } from 'antd';
import { CheckOutlined } from '@ant-design/icons';
import { useAppStore } from '@/store';

const { Title, Text } = Typography;

const typeConfig: Record<string, { color: string; label: string }> = {
  publish: { color: 'blue', label: '发布通知' },
  review: { color: 'orange', label: '审核提醒' },
  comment: { color: 'purple', label: '评论' },
  like: { color: 'red', label: '点赞' },
  expire: { color: 'gold', label: '过期提醒' },
  system: { color: 'default', label: '系统通知' },
};

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { notifications, unreadCount, markNotificationRead, markAllNotificationsRead } = useAppStore();

  const handleClick = (n: (typeof notifications)[0]) => {
    markNotificationRead(n.id);
    // 根据类型跳转
    if (n.type === 'publish' || n.type === 'like' || n.type === 'comment') {
      const match = n.desc.match(/《(.+?)》/);
      if (match) {
        const knowledge = useAppStore.getState().knowledgeList.find(k => k.title.includes(match[1]));
        if (knowledge) navigate(`/article/${knowledge.id}`);
      }
    } else if (n.type === 'review') {
      navigate('/review');
    }
  };

  return (
    <div className="page-container">
      <div className="breadcrumb">
        <a href="/">首页</a>
        <span className="separator">›</span>
        <span>通知中心</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>🔔 通知中心</Title>
        {unreadCount > 0 && (
          <Button icon={<CheckOutlined />} onClick={markAllNotificationsRead} type="primary" ghost size="small">
            全部已读（{unreadCount}）
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <Empty description="暂无通知" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {notifications.map(n => (
            <div
              key={n.id}
              onClick={() => handleClick(n)}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 16,
                padding: '16px 20px',
                borderBottom: '1px solid #f0f0f0',
                cursor: 'pointer',
                background: n.read ? '#fff' : '#f0f5ff',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => { if (n.read) e.currentTarget.style.background = '#fafafa'; }}
              onMouseLeave={(e) => { if (n.read) e.currentTarget.style.background = '#fff'; }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: 8,
                background: n.read ? '#f5f5f5' : '#eff6ff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, flexShrink: 0,
              }}>
                {n.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <Text strong style={{ fontSize: 14 }}>{n.title}</Text>
                  {!n.read && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#1a56db', flexShrink: 0 }} />}
                  <Tag style={{ marginLeft: 4, fontSize: 11 }}>{typeConfig[n.type]?.label || n.type}</Tag>
                </div>
                <Text type="secondary" style={{ fontSize: 13, display: 'block', marginBottom: 4 }}>{n.desc}</Text>
                <Text type="secondary" style={{ fontSize: 12 }}>{n.time}</Text>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: 注册路由**

在 `App.tsx` 中添加导入和路由：

```typescript
import NotificationsPage from '@/pages/Notifications';
```

在 Routes 中添加：

```typescript
<Route path="/notifications" element={<NotificationsPage />} />
```

- [ ] **Step 3: 更新 AppLayout 通知链接**

将 `AppLayout.tsx` 第92行的 `"查看全部通知"` 链接改为跳转到 `/notifications` 路由：

```typescript
<a
  href="#"
  style={{ fontSize: 12, color: '#1a56db' }}
  onClick={(e) => { e.preventDefault(); navigate('/notifications'); }}
>
  查看全部通知
</a>
```

需要在 AppLayout 中已导入 `useNavigate`（已有）。

- [ ] **Step 4: Commit**

```bash
git add knowdo-frontend/src/pages/Notifications/index.tsx knowdo-frontend/src/App.tsx knowdo-frontend/src/components/layout/AppLayout.tsx
git commit -m "feat: 通知中心页面"
```

---

## 实现顺序

按依赖关系，建议依次执行：Task 1 → Task 2 → Task 3 → Task 4 → Task 5
