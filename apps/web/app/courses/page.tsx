import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCourses } from "@/lib/api";

export default async function CoursesPage() {
  const courses = await getCourses();

  return (
    <div className="container py-10">
      <h1 className="mb-8 text-3xl font-bold">课程中心</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => (
          <Card key={course.slug} className="flex flex-col">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{course.title}</CardTitle>
                <Badge variant="secondary">{course.domain}</Badge>
              </div>
              <CardDescription>{course.subtitle}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 text-sm text-muted-foreground">
              <p>{course.stageCount} 个阶段 · 约 {course.estimatedHours} 小时</p>
            </CardContent>
            <div className="p-6 pt-0">
              <Link href={`/courses/${course.slug}`}>
                <Button variant="outline" className="w-full">查看详情</Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
