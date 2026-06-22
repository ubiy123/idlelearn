import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getCourses } from "@/lib/api";

export default async function HomePage() {
  const courses = await getCourses();

  return (
    <div className="container py-10">
      <section className="mx-auto flex max-w-3xl flex-col items-center space-y-6 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          IdleLearn 智学谷
        </h1>
        <p className="text-lg text-muted-foreground">
          免费、开源的 Web 学习平台，让成人在碎片时间里系统化学习。
        </p>
        <div className="flex gap-4">
          <Link href="/courses">
            <Button>开始学习</Button>
          </Link>
          <Link href="https://github.com/ubiy123/idlelearn" target="_blank">
            <Button variant="outline">参与贡献</Button>
          </Link>
        </div>
      </section>

      <section className="mt-16 grid gap-6 md:grid-cols-3">
        {courses.map((course) => (
          <Link key={course.slug} href={`/courses/${course.slug}`}>
            <Card className="h-full transition-shadow hover:shadow-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{course.title}</CardTitle>
                  <Badge variant="secondary">{course.domain}</Badge>
                </div>
                <CardDescription>{course.subtitle}</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <p>{course.stageCount} 个阶段 · 约 {course.estimatedHours} 小时</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </section>
    </div>
  );
}
