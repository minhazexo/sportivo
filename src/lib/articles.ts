import type { Article } from './types'
import prisma from './prisma'

export const statusToString = {
  draft: 'Draft',
  published: 'Published',
  archived: 'Archived',
} as const;

export async function getArticles(status?: string): Promise<Article[]> {
  const articles = await prisma.article.findMany({
    where: status ? { status } : undefined,
    orderBy: { updatedAt: 'desc' },
    take: 50,
  })

  return articles.map(article => ({
    id: article.id,
    title: article.title,
    slug: article.slug,
    content: article.content,
    excerpt: article.excerpt,
    category: article.category,
    thumbnail: article.thumbnail,
    authorId: article.authorId,
    authorName: article.authorName,
    tags: article.tags,
    status: article.status as 'draft' | 'published' | 'archived',
    publishedAt: article.publishedAt,
    createdAt: article.createdAt,
    views: article.views,
    updatedAt: article.updatedAt,
    statusText: statusToString[article.status as keyof typeof statusToString],
  }))
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const article = await prisma.article.findUnique({
    where: { slug },
  })

  if (!article) {
    return null
  }

  return {
    id: article.id,
    title: article.title,
    slug: article.slug,
    content: article.content,
    excerpt: article.excerpt,
    category: article.category,
    thumbnail: article.thumbnail,
    authorId: article.authorId,
    authorName: article.authorName,
    tags: article.tags,
    status: article.status as 'draft' | 'published' | 'archived',
    publishedAt: article.publishedAt,
    createdAt: article.createdAt,
    views: article.views,
    updatedAt: article.updatedAt,
    statusText: statusToString[article.status as keyof typeof statusToString],
  }
}
