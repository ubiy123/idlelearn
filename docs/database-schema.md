# IdleLearn 数据库设计文档

> **版本**：v1.0  
> **数据库**：PostgreSQL 15+  
> **存储引擎**：默认  
> **字符集**：UTF-8 (utf8mb4 等效)  
> **时区**：UTC 存储，应用层转换为东八区

---

## 1. 整体设计原则

1. **一切内容从 GitHub 同步**：课程、题库、项目等内容类数据在 GitHub 为主仓库，数据库为运行时缓存。
2. **用户进度与行为数据为核心**：重点保障学习进度、评测记录、AI 点评的一致性与可查询性。
3. **多态关联**：AI 点评、讨论、点赞等场景使用 `target_type` + `target_id` 模式，避免表数量爆炸。
4. **版本化**：课程内容、AI Prompt 、项目评分 rubric 均保留版本信息，便于回溯和 A/B 测试。

---

## 2. 实体关系概览

```
users
 ├── user_profiles
 ├── learning_streaks
 ├── user_badges
 ├── notifications
 ├── user_lesson_progress
 ├── user_assessments
 ├── user_answers
 ├── submissions
 ├── notes
 ├── community_posts
 ├── comments
 └── upvotes

courses
 ├── stages
 ├── lessons
 ├── projects
 └── assessments
     └── questions

ai_reviews
 └── submissions, user_answers

course_content_sync
learning_activities
```

---

## 3. 表结构详情

### 3.1 users（用户表）

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| id | UUID | PK, 默认 gen_random_uuid() | 用户唯一标识 |
| username | VARCHAR(50) | UNIQUE, NOT NULL | 用户名 |
| email | VARCHAR(255) | UNIQUE, NOT NULL | 邮箱 |
| password_hash | VARCHAR(255) | NOT NULL | 密码哈希 |
| avatar_url | VARCHAR(500) | 可空 | 头像 URL |
| role | VARCHAR(20) | NOT NULL, 默认 'student' | 角色：student/contributor/admin |
| status | VARCHAR(20) | NOT NULL, 默认 'active' | active/banned/deleted |
| daily_goal_minutes | INT | 默认 20 | 每日学习目标（分钟） |
| email_verified_at | TIMESTAMPTZ | 可空 | 邮箱验证时间 |
| last_login_at | TIMESTAMPTZ | 可空 | 最后登录 |
| created_at | TIMESTAMPTZ | NOT NULL, 默认 now() | 创建时间 |
| updated_at | TIMESTAMPTZ | NOT NULL, 默认 now() | 更新时间 |

**索引**：
- `idx_users_email` ON email
- `idx_users_username` ON username
- `idx_users_role_status` ON (role, status)

---

### 3.2 user_profiles（用户扩展资料）

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| id | UUID | PK | |
| user_id | UUID | FK → users(id), UNIQUE | |
| bio | TEXT | 可空 | 个人介绍 |
| location | VARCHAR(100) | 可空 | |
| website | VARCHAR(255) | 可空 | |
| github_username | VARCHAR(100) | 可空 | 开源贡献者 GitHub |
| learning_interests | JSONB | 默认 '[]' | 感兴趣领域 |
| assessment_result_summary | JSONB | 可空 | 入学测评总结 |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

---

### 3.3 courses（课程表）

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| id | UUID | PK | |
| slug | VARCHAR(100) | UNIQUE, NOT NULL | URL 标识，如 'investment' |
| title | VARCHAR(200) | NOT NULL | 课程名称 |
| subtitle | VARCHAR(500) | 可空 | 副标题 |
| description | TEXT | 可空 | 详细描述 |
| domain | VARCHAR(50) | NOT NULL | 领域：investment/finance/writing |
| github_repo | VARCHAR(255) | 可空 | 对应开源仓库 |
| content_version | VARCHAR(50) | 可空 | 当前同步的版本号 |
| status | VARCHAR(20) | NOT NULL, 默认 'draft' | draft/published/archived |
| order_index | INT | NOT NULL, 默认 0 | 展示排序 |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

**索引**：
- `idx_courses_slug` ON slug
- `idx_courses_status_domain` ON (status, domain)

---

### 3.4 stages（阶段表，如 L1/L2）

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| id | UUID | PK | |
| course_id | UUID | FK → courses(id) | 所属课程 |
| slug | VARCHAR(100) | NOT NULL | 如 'l1-investment-thinking' |
| code | VARCHAR(20) | NOT NULL | 如 'L1' |
| title | VARCHAR(200) | NOT NULL | 阶段名称 |
| description | TEXT | 可空 | |
| order_index | INT | NOT NULL | 在课程内的顺序 |
| estimated_hours | DECIMAL(4,1) | 默认 0 | 预估学习小时 |
| status | VARCHAR(20) | NOT NULL, 默认 'draft' | draft/published/archived |
| unlock_requirement | JSONB | 可空 | 解锁条件，如需完成上一阶段评测 |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

**索引**：
- `idx_stages_course_order` ON (course_id, order_index)
- `idx_stages_slug` ON slug

---

### 3.5 lessons（课时表）

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| id | UUID | PK | |
| stage_id | UUID | FK → stages(id) | 所属阶段 |
| slug | VARCHAR(100) | NOT NULL | URL 标识 |
| title | VARCHAR(200) | NOT NULL | 课时标题 |
| order_index | INT | NOT NULL | 在阶段内顺序 |
| content_markdown | TEXT | 可空 | Markdown 源文件 |
| content_html | TEXT | 可空 | 渲染后 HTML |
| video_url | VARCHAR(500) | 可空 | 视频地址 |
| audio_url | VARCHAR(500) | 可空 | 音频地址 |
| duration_minutes | INT | 默认 0 | 预估时长 |
| learning_objectives | JSONB | 默认 '[]' | 学习目标列表 |
| resources | JSONB | 默认 '[]' | 延伸阅读资料 |
| discussion_topic_id | UUID | 可空 | 关联社区话题 |
| status | VARCHAR(20) | NOT NULL, 默认 'draft' | draft/published/archived |
| git_source_path | VARCHAR(500) | 可空 | GitHub 源文件路径 |
| git_commit_sha | VARCHAR(40) | 可空 | 最后同步 commit |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

**索引**：
- `idx_lessons_stage_order` ON (stage_id, order_index)
- `idx_lessons_slug` ON slug
- `idx_lessons_status` ON status

---

### 3.6 assessments（评测表）

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| id | UUID | PK | |
| stage_id | UUID | FK → stages(id), UNIQUE | 每个阶段一个评测 |
| title | VARCHAR(200) | NOT NULL | 评测名称 |
| description | TEXT | 可空 | |
| type | VARCHAR(50) | NOT NULL, 默认 'entry' | entry（入学）/final（结业） |
| passing_score | INT | NOT NULL, 默认 70 | 通过分数 |
| total_score | INT | NOT NULL, 默认 100 | 满分 |
| time_limit_minutes | INT | 可空 | 时间限制，空表示不限时 |
| max_attempts | INT | 可空 | 最大尝试次数，空表示无限制 |
| cooldown_hours | INT | 默认 24 | 重考冷却时间 |
| status | VARCHAR(20) | NOT NULL, 默认 'draft' | draft/published/archived |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

---

### 3.7 questions（题目表）

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| id | UUID | PK | |
| assessment_id | UUID | FK → assessments(id) | 所属评测 |
| question_type | VARCHAR(50) | NOT NULL | single_choice/multiple_choice/true_false/case_analysis/open_ended/calculation |
| content | TEXT | NOT NULL | 题干 |
| options | JSONB | 可空 | 选项，如 `[{"id":"A","text":"..."},...]` |
| correct_answer | JSONB | 可空 | 正确答案 |
| explanation | TEXT | 可空 | 解析 |
| score | INT | NOT NULL, 默认 10 | 题目分值 |
| order_index | INT | NOT NULL | 排序 |
| difficulty | VARCHAR(20) | 默认 'medium' | easy/medium/hard |
| related_lesson_id | UUID | FK → lessons(id), 可空 | 关联课时，用于复习推荐 |
| ai_review_enabled | BOOLEAN | 默认 false | 是否启用 AI 点评 |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

**索引**：
- `idx_questions_assessment` ON (assessment_id, order_index)

---

### 3.8 user_assessments（用户评测尝试记录）

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| id | UUID | PK | |
| user_id | UUID | FK → users(id) | |
| assessment_id | UUID | FK → assessments(id) | |
| attempt_number | INT | NOT NULL | 第几次尝试 |
| status | VARCHAR(20) | NOT NULL | in_progress/submitted/passed/failed |
| score | INT | 可空 | 得分 |
| started_at | TIMESTAMPTZ | NOT NULL | 开始时间 |
| submitted_at | TIMESTAMPTZ | 可空 | 提交时间 |
| time_spent_seconds | INT | 可空 | 耗时 |
| answers_snapshot | JSONB | 可空 | 答题快照，用于回溯 |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

**索引**：
- `idx_user_assessments_user` ON (user_id, created_at DESC)
- `idx_user_assessments_assessment` ON (assessment_id, user_id)

---

### 3.9 user_answers（用户答题明细）

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| id | UUID | PK | |
| user_assessment_id | UUID | FK → user_assessments(id) | |
| question_id | UUID | FK → questions(id) | |
| answer_content | TEXT | 可空 | 用户答案 |
| is_correct | BOOLEAN | 可空 | 是否正确 |
| score | INT | 可空 | 该题得分 |
| ai_review_id | UUID | FK → ai_reviews(id), 可空 | 开放题的 AI 点评 |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

---

### 3.10 projects（实战项目表）

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| id | UUID | PK | |
| stage_id | UUID | FK → stages(id) | 所属阶段 |
| slug | VARCHAR(100) | NOT NULL | |
| title | VARCHAR(200) | NOT NULL | 项目名称 |
| description | TEXT | NOT NULL | 项目说明 |
| objectives | JSONB | NOT NULL, 默认 '[]' | 项目目标 |
| template_url | VARCHAR(500) | 可空 | 模板下载地址 |
| rubric | JSONB | NOT NULL | 评分标准，包含维度与权重 |
| passing_score | INT | NOT NULL, 默认 70 | 通过分数 |
| order_index | INT | NOT NULL | 排序 |
| status | VARCHAR(20) | NOT NULL, 默认 'draft' | draft/published/archived |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

---

### 3.11 submissions（项目提交表）

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| id | UUID | PK | |
| user_id | UUID | FK → users(id) | |
| project_id | UUID | FK → projects(id) | |
| version_number | INT | NOT NULL, 默认 1 | 提交版本号 |
| content | TEXT | 可空 | 正文（Markdown） |
| attachments | JSONB | 默认 '[]' | 附件列表，含 URL 和类型 |
| status | VARCHAR(20) | NOT NULL, 默认 'submitted' | submitted/reviewing/reviewed/passed/resubmit |
| score | INT | 可空 | 得分 |
| ai_review_id | UUID | FK → ai_reviews(id), 可空 | AI 点评 |
| is_public | BOOLEAN | 默认 false | 是否公开到社区 |
| submitted_at | TIMESTAMPTZ | NOT NULL | |
| reviewed_at | TIMESTAMPTZ | 可空 | |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

**索引**：
- `idx_submissions_user` ON (user_id, created_at DESC)
- `idx_submissions_project` ON (project_id, status)

---

### 3.12 ai_reviews（AI 点评表）

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| id | UUID | PK | |
| target_type | VARCHAR(50) | NOT NULL | submission/user_answer |
| target_id | UUID | NOT NULL | 对应目标 ID |
| provider | VARCHAR(50) | NOT NULL, 默认 'deepseek' | AI 提供商 |
| model | VARCHAR(100) | NOT NULL | 模型名称，如 'deepseek-v3' |
| prompt_version | VARCHAR(50) | NOT NULL | Prompt 版本 |
| total_score | INT | NOT NULL | 总分 |
| max_score | INT | NOT NULL | 满分 |
| dimension_scores | JSONB | NOT NULL | 各维度分数 |
| summary | TEXT | 可空 | 总体评语 |
| strengths | JSONB | 默认 '[]' | 优点 |
| weaknesses | JSONB | 默认 '[]' | 待改进 |
| key_issues | JSONB | 默认 '[]' | 关键问题 |
| next_steps | TEXT | 可空 | 下一步建议 |
| raw_request | JSONB | 可空 | 发给 AI 的原始请求 |
| raw_response | JSONB | 可空 | AI 原始返回 |
| processing_time_ms | INT | 可空 | 处理耗时 |
| status | VARCHAR(20) | NOT NULL, 默认 'success' | success/failed/pending |
| error_message | TEXT | 可空 | 失败时的错误信息 |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

**索引**：
- `idx_ai_reviews_target` ON (target_type, target_id)
- `idx_ai_reviews_user` 通过 target 联表查询

---

### 3.13 user_lesson_progress（用户课时进度表）

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| id | UUID | PK | |
| user_id | UUID | FK → users(id) | |
| lesson_id | UUID | FK → lessons(id) | |
| status | VARCHAR(20) | NOT NULL, 默认 'not_started' | not_started/in_progress/completed |
| progress_percent | INT | 默认 0 | 进度百分比 |
| last_position_seconds | INT | 默认 0 | 视频/音频上次位置 |
| started_at | TIMESTAMPTZ | 可空 | |
| completed_at | TIMESTAMPTZ | 可空 | |
| total_time_seconds | INT | 默认 0 | 累计学习时长 |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

**索引**：
- `idx_user_lesson_progress_user` ON (user_id, updated_at DESC)
- `idx_user_lesson_progress_lesson` ON (lesson_id, user_id)
- UNIQUE(user_id, lesson_id)

---

### 3.14 notes（笔记表）

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| id | UUID | PK | |
| user_id | UUID | FK → users(id) | |
| lesson_id | UUID | FK → lessons(id), 可空 | 关联课时 |
| title | VARCHAR(200) | 可空 | 笔记标题 |
| content | TEXT | NOT NULL | Markdown 内容 |
| tags | JSONB | 默认 '[]' | 标签 |
| highlights | JSONB | 默认 '[]' | 高亮段落 |
| is_public | BOOLEAN | 默认 false | 是否公开 |
| upvote_count | INT | 默认 0 | 点赞数 |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

**索引**：
- `idx_notes_user` ON (user_id, updated_at DESC)
- `idx_notes_lesson` ON (lesson_id, is_public)
- GIN `idx_notes_tags` ON tags

---

### 3.15 community_posts（社区帖子表）

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| id | UUID | PK | |
| user_id | UUID | FK → users(id) | |
| post_type | VARCHAR(50) | NOT NULL | discussion/question/project_showcase/note_share |
| lesson_id | UUID | FK → lessons(id), 可空 | 关联课时 |
| project_id | UUID | FK → projects(id), 可空 | 关联项目 |
| submission_id | UUID | FK → submissions(id), 可空 | 项目展示 |
| title | VARCHAR(300) | NOT NULL | 标题 |
| content | TEXT | NOT NULL | 正文 |
| tags | JSONB | 默认 '[]' | 标签 |
| view_count | INT | 默认 0 | 浏览数 |
| upvote_count | INT | 默认 0 | 点赞数 |
| comment_count | INT | 默认 0 | 评论数 |
| is_pinned | BOOLEAN | 默认 false | 置顶 |
| is_elite | BOOLEAN | 默认 false | 精华 |
| status | VARCHAR(20) | NOT NULL, 默认 'active' | active/hidden/deleted |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

**索引**：
- `idx_community_posts_user` ON (user_id, created_at DESC)
- `idx_community_posts_lesson` ON (lesson_id, created_at DESC)
- `idx_community_posts_type` ON (post_type, status, created_at DESC)
- GIN `idx_community_posts_tags` ON tags

---

### 3.16 comments（评论表）

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| id | UUID | PK | |
| post_id | UUID | FK → community_posts(id) | |
| user_id | UUID | FK → users(id) | |
| parent_id | UUID | FK → comments(id), 可空 | 父评论 ID，支持嵌套 |
| content | TEXT | NOT NULL | |
| upvote_count | INT | 默认 0 | |
| status | VARCHAR(20) | NOT NULL, 默认 'active' | active/hidden/deleted |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

**索引**：
- `idx_comments_post` ON (post_id, created_at DESC)
- `idx_comments_parent` ON (parent_id, created_at DESC)

---

### 3.17 upvotes（点赞表）

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| id | UUID | PK | |
| user_id | UUID | FK → users(id) | |
| target_type | VARCHAR(50) | NOT NULL | post/comment/note |
| target_id | UUID | NOT NULL | |
| created_at | TIMESTAMPTZ | NOT NULL | |

**约束**：UNIQUE(user_id, target_type, target_id)

**索引**：
- `idx_upvotes_target` ON (target_type, target_id)

---

### 3.18 badges（徽章表）

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| id | UUID | PK | |
| slug | VARCHAR(100) | UNIQUE, NOT NULL | |
| name | VARCHAR(100) | NOT NULL | 徽章名称 |
| description | TEXT | 可空 | 描述 |
| icon_url | VARCHAR(500) | 可空 | 图标 |
| criteria | JSONB | NOT NULL | 获得条件 |
| created_at | TIMESTAMPTZ | NOT NULL | |

---

### 3.19 user_badges（用户徽章表）

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| id | UUID | PK | |
| user_id | UUID | FK → users(id) | |
| badge_id | UUID | FK → badges(id) | |
| awarded_at | TIMESTAMPTZ | NOT NULL | |

**约束**：UNIQUE(user_id, badge_id)

---

### 3.20 learning_streaks（学习连续表）

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| id | UUID | PK | |
| user_id | UUID | FK → users(id), UNIQUE | |
| current_streak | INT | 默认 0 | 当前连续天数 |
| longest_streak | INT | 默认 0 | 最长连续天数 |
| last_learning_date | DATE | 可空 | 最后学习日期 |
| updated_at | TIMESTAMPTZ | NOT NULL | |

---

### 3.21 learning_activities（学习行为日志表）

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| id | UUID | PK | |
| user_id | UUID | FK → users(id) | |
| activity_type | VARCHAR(50) | NOT NULL | lesson_started/lesson_completed/assessment_completed/project_submitted/post_created |
| reference_type | VARCHAR(50) | 可空 | lesson/assessment/project/post |
| reference_id | UUID | 可空 | |
| duration_seconds | INT | 可空 | 耗时 |
| metadata | JSONB | 默认 '{}' | 附加信息 |
| created_at | TIMESTAMPTZ | NOT NULL | |

**索引**：
- `idx_learning_activities_user` ON (user_id, created_at DESC)
- `idx_learning_activities_type` ON (activity_type, created_at DESC)

---

### 3.22 course_content_sync（课程内容同步记录表）

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| id | UUID | PK | |
| course_id | UUID | FK → courses(id) | |
| repo_name | VARCHAR(255) | NOT NULL | GitHub 仓库名 |
| commit_sha | VARCHAR(40) | NOT NULL | 同步的 commit SHA |
| file_path | VARCHAR(500) | NOT NULL | 文件路径 |
| entity_type | VARCHAR(50) | NOT NULL | stage/lesson/project/question |
| entity_id | UUID | 可空 | 对应实体 ID |
| content_hash | VARCHAR(64) | NOT NULL | 内容 SHA256 哈希 |
| synced_at | TIMESTAMPTZ | NOT NULL | |
| status | VARCHAR(20) | NOT NULL | success/failed/skipped |

**索引**：
- `idx_course_content_sync_course` ON (course_id, synced_at DESC)
- `idx_course_content_sync_entity` ON (entity_type, entity_id)

---

### 3.23 notifications（通知表）

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| id | UUID | PK | |
| user_id | UUID | FK → users(id) | |
| type | VARCHAR(50) | NOT NULL | assessment_unlocked/ai_review_complete/comment_reply/milestone |
| title | VARCHAR(200) | NOT NULL | |
| content | TEXT | 可空 | |
| reference_type | VARCHAR(50) | 可空 | |
| reference_id | UUID | 可空 | |
| is_read | BOOLEAN | 默认 false | |
| read_at | TIMESTAMPTZ | 可空 | |
| created_at | TIMESTAMPTZ | NOT NULL | |

**索引**：
- `idx_notifications_user` ON (user_id, is_read, created_at DESC)

---

## 4. 关键业务查询示例

### 4.1 获取用户当前学习状态

```sql
SELECT 
    l.id, l.title, l.order_index,
    ulp.status, ulp.progress_percent, ulp.completed_at
FROM lessons l
JOIN stages s ON l.stage_id = s.id
JOIN courses c ON s.course_id = c.id
LEFT JOIN user_lesson_progress ulp 
    ON ulp.lesson_id = l.id AND ulp.user_id = :user_id
WHERE c.slug = 'investment'
ORDER BY s.order_index, l.order_index;
```

### 4.2 判断阶段是否已解锁

```sql
SELECT 
    s.id, s.title,
    EXISTS (
        SELECT 1 FROM user_assessments ua
        JOIN assessments a ON ua.assessment_id = a.id
        WHERE ua.user_id = :user_id
          AND a.stage_id = s.id
          AND ua.status = 'passed'
    ) AS is_unlocked
FROM stages s
WHERE s.course_id = :course_id
ORDER BY s.order_index;
```

### 4.3 查询 DeepSeek AI 点评

```sql
SELECT * FROM ai_reviews
WHERE target_type = 'submission' AND target_id = :submission_id
ORDER BY created_at DESC
LIMIT 1;
```

### 4.4 社区热帖排序

```sql
SELECT 
    cp.*,
    u.username,
    (cp.upvote_count * 2 + cp.comment_count * 3 + cp.view_count * 0.1) AS quality_score
FROM community_posts cp
JOIN users u ON cp.user_id = u.id
WHERE cp.status = 'active'
ORDER BY quality_score DESC, cp.created_at DESC
LIMIT 20;
```

---

## 5. 扩展考虑

1. **分区表**：当 `learning_activities` 数据量过大时，可按月分区表或使用 TimescaleDB。
2. **缓存层**：用户进度、课程结构等热点数据使用 Redis 缓存。
3. **搜索引擎**：课程内容、笔记、帖子全文索引同步至 Meilisearch/Elasticsearch。
4. **审计日志**：敏感操作（登录、作业提交、评测）需额外审计表。

---

## 6. DDL 参考（PostgreSQL）

```sql
-- 用户表
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(500),
    role VARCHAR(20) NOT NULL DEFAULT 'student',
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    daily_goal_minutes INT NOT NULL DEFAULT 20,
    email_verified_at TIMESTAMPTZ,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role_status ON users(role, status);

-- 更新时间自动更新（示例：users 表）
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

> 其余表的 DDL 可根据上述字段定义类推。
