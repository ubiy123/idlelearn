/**
 * 客户端 API 调用封装
 * 后续对接 FastAPI 后端
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1";

export async function apiFetch(path: string, options?: RequestInit) {
  const url = `${API_BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export async function getCourses() {
  // TODO: 替换为真实 API
  return [
    {
      slug: "investment",
      title: "系统化投资学",
      subtitle: "从价值投资思维到行业分析与财务建模",
      domain: "investment",
      stageCount: 7,
      estimatedHours: 120,
    },
    {
      slug: "finance",
      title: "个人理财基础",
      subtitle: "资产配置、风险管理与财务规划",
      domain: "finance",
      stageCount: 4,
      estimatedHours: 40,
    },
    {
      slug: "writing",
      title: "小说写作实战",
      subtitle: "从构思、大纲到章节创作与文风打磨",
      domain: "writing",
      stageCount: 5,
      estimatedHours: 80,
    },
  ];
}
